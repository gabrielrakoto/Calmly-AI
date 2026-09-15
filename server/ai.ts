import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const groq = new Groq({
    apiKey: GROQ_API_KEY
});

const MODEL = "llama-3.3-70b-versatile";

interface RiskyPhrase {
    text: string;
    suggestion: string;
}

interface AnalysisResult {
    original: string;
    rewritten: string;
    riskyPhrases: RiskyPhrase[];
    conflictRisk: number;
}

function createFallbackAnalysis(text: string): AnalysisResult {
    const patterns: Array<{ regex: RegExp; suggestion: string; risk: number }> = [
        { regex: /\b(always|never)\b/gi, suggestion: "describe this specific situation", risk: 0.2 },
        { regex: /\b(stupid|idiot|shut up|hate)\b/gi, suggestion: "use calmer wording", risk: 0.45 },
        { regex: /\b(fuck|shit|damn)\b/gi, suggestion: "remove profanity", risk: 0.55 },
        { regex: /!{2,}/g, suggestion: "reduce emphasis", risk: 0.1 },
    ];

    const riskyPhrases: RiskyPhrase[] = [];
    let conflictRisk = 0.05;

    for (const pattern of patterns) {
        const matches = text.match(pattern.regex) || [];
        for (const match of matches) {
            riskyPhrases.push({
                text: match,
                suggestion: pattern.suggestion,
            });
            conflictRisk += pattern.risk;
        }
    }

    const preserveCase = (match: string, replacement: string) =>
        match[0] === match[0].toUpperCase()
            ? replacement[0].toUpperCase() + replacement.slice(1)
            : replacement;

    const rewritten = text
        .replace(/\byou always\b/gi, (match) => preserveCase(match, "you often"))
        .replace(/\byou never\b/gi, (match) => preserveCase(match, "you rarely"))
        .replace(/\bshut up\b/gi, (match) => preserveCase(match, "can we pause for a second"))
        .replace(/!{2,}/g, "!")
        .trim();

    return {
        original: text,
        rewritten: rewritten || text,
        riskyPhrases,
        conflictRisk: Math.min(Number(conflictRisk.toFixed(2)), 1),
    };
}

function createFallbackCoachResponse(messages: { role: string, content: string }[], lang: string): string {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content || "";

    if (lang === "fr") {
        return `Essaie de nommer le fait concret, puis ton ressenti, puis une demande simple. Par exemple: "Quand il se passe cela, je me sens tendu(e), et j'aimerais qu'on en parle calmement."`;
    }

    if (lang === "es") {
        return `Intenta describir el hecho concreto, luego cómo te sientes y termina con una petición clara. Por ejemplo: "Cuando pasa esto, me siento tenso(a) y me gustaría hablarlo con calma."`;
    }

    return `Try naming the specific situation, then your feeling, then one clear request. For example: "When this happens, I feel tense, and I'd like us to talk about it calmly." ${lastUserMessage ? "Keep it focused on the latest message rather than the whole relationship." : ""}`.trim();
}

export async function analyzeAndRewrite(text: string, lang: string = 'auto'): Promise<AnalysisResult> {
    try {
        if (!GROQ_API_KEY) {
            return createFallbackAnalysis(text);
        }

        console.log(`[AI Analysis] Processing text: "${text.substring(0, 50)}..."`);
        const prompt = `
        You are an expert communication coach and conflict mediator.
        
        TASK: Analyze the following text for conflict risk, vulgarity, and aggression.
        
        INPUT TEXT: "${text}"
        
        INSTRUCTIONS:
        1. **Detect Language**: Identify the language (English, French, Spanish, etc.).
        2. **Analyze Risk**: 
           - 0.0 - 0.3: Polite, neutral, or positive.
           - 0.4 - 0.6: Passive-aggressive, tense, or slightly rude.
           - 0.7 - 0.9: Aggressive, blaming, or angry.
           - 1.0: VULGAR, PROFANE, THREATENING, or EXTREMELY TOXIC. (Mark insults and swear words as HIGH risk).
        3. **Rewrite**: Provide a calm, non-violent, and polite version of the text in the SAME language.
        4. **Identify Risky Phrases**: Extract specific words/phrases that contribute to the risk and suggest better alternatives.
        
        OUTPUT FORMAT (JSON ONLY):
        {
            "detectedLanguage": "string",
            "original": "${text}",
            "rewritten": "string",
            "riskyPhrases": [{"text": "offensive phrase", "suggestion": "polite alternative"}],
            "conflictRisk": number
        }
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful API that outputs strict JSON. You are sensitive to toxicity and will flag vulgarity with high risk scores."
                },
                { role: "user", content: prompt }
            ],
            model: MODEL,
            response_format: { type: "json_object" },
            temperature: 0.2, // Lower temperature for more consistent, strict analysis
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No content received from AI");
        }

        const result = JSON.parse(content);
        console.log("[AI Analysis] Success:", result.conflictRisk);

        return {
            original: text,
            rewritten: result.rewritten || text,
            riskyPhrases: result.riskyPhrases || [],
            conflictRisk: result.conflictRisk ?? 0.5 // Default to 0.5 if missing, to be safe
        };

    } catch (error) {
        console.error("[AI Analysis] CRITICAL FAILURE:", error);
        return createFallbackAnalysis(text);
    }
}

// Helper to format messages for Groq
interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export async function getCoachResponse(messages: { role: string, content: string }[], lang: string = 'en'): Promise<string> {
    try {
        if (!GROQ_API_KEY) {
            return createFallbackCoachResponse(messages, lang);
        }

        const systemPrompt = `
        You are "Calmly", a warm, empathetic, and highly emotional intelligence communication coach.
        
        Characteristics:
        - You are NOT a robot; you don't use canned responses.
        - You give specific, actionable advice.
        - You are brief but deep. (Max 3-4 sentences).
        - You adapt to the user's language (${lang}).
        
        User's language: ${lang === 'fr' ? 'French' : lang === 'es' ? 'Spanish' : 'English'}.
        Respond in: ${lang === 'fr' ? 'French' : lang === 'es' ? 'Spanish' : 'English'}.
        `;

        // Convert frontend message format to Groq format
        // Frontend uses: { type: 'user' | 'coach', message: string }
        // We need to map 'coach' -> 'assistant'
        const groqMessages: ChatMessage[] = [
            { role: "system", content: systemPrompt },
            ...messages.map(m => ({
                role: (m.role === 'coach' ? 'assistant' : m.role) as "user" | "assistant",
                content: m.content
            }))
        ];

        const completion = await groq.chat.completions.create({
            messages: groqMessages,
            model: MODEL,
            temperature: 0.8,
            max_tokens: 1024,
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) throw new Error("No response from AI");

        return response;

    } catch (error) {
        console.error("[AI Coach] CRITICAL FAILURE:", error);
        return createFallbackCoachResponse(messages, lang);
    }
}
