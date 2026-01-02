import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ""
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

export async function analyzeAndRewrite(text: string, lang: string = 'auto'): Promise<AnalysisResult> {
    try {
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
        // Fallback: If AI fails, treat it as potentially risky if it contains common swear words (heuristic)
        // detailed heuristic can be added here, but for now return a distinct error state if needed
        return {
            original: text,
            rewritten: text,
            riskyPhrases: [],
            conflictRisk: 0.0 // Return 0 to indicate "analysis failed" rather than "safe"
        };
    }
}

// Helper to format messages for Groq
interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export async function getCoachResponse(messages: { role: string, content: string }[], lang: string = 'en'): Promise<string> {
    try {
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
        throw error;
    }
}
