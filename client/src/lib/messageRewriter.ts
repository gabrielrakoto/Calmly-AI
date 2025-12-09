// messageRewriter.ts - Groq API Integration for CalmlyAI

interface RiskyPhrase {
  text: string;
  startIndex: number;
  endIndex: number;
  suggestion: string;
}

interface AnalysisResult {
  original: string;
  rewritten: string;
  riskyPhrases: RiskyPhrase[];
  conflictRisk?: number;
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Language-specific prompts for message analysis
const getAnalysisPrompt = (message: string, language: string) => {
  const prompts: Record<string, string> = {
    en: `You are a communication expert analyzing message tone and conflict risk. Analyze this message comprehensively.

Message: "${message}"

IMPORTANT: Respond ONLY with valid JSON, no other text:
{
  "riskyPhrases": [{"text": "phrase", "suggestion": "better way to say it"}],
  "rewritten": "calm, respectful version of the message",
  "conflictRisk": 0.85
}

conflictRisk scale: 0.0 (safe/calm) to 1.0 (extremely aggressive/threatening).
Consider: insults, threats, ALL CAPS, aggressive tone, blame language, etc.
Be strict with scoring - insults and threats = high risk.`,

    fr: `Vous êtes un expert en communication analysant le ton des messages et le risque de conflit. Analysez ce message de manière globale.

Message: "${message}"

IMPORTANT: Répondez UNIQUEMENT avec du JSON valide, sans autre texte:
{
  "riskyPhrases": [{"text": "phrase", "suggestion": "meilleure façon de le dire"}],
  "rewritten": "version calme et respectueuse du message",
  "conflictRisk": 0.85
}

Échelle conflictRisk: 0.0 (sûr/calme) à 1.0 (extrêmement agressif/menaçant).
Considérez: insultes, menaces, MAJUSCULES, ton agressif, langage de culpabilité, etc.
Soyez strict - insultes et menaces = risque élevé.`,

    es: `Eres un experto en comunicación analizando el tono del mensaje y el riesgo de conflicto. Analiza este mensaje de manera integral.

Mensaje: "${message}"

IMPORTANTE: Responde SOLO con JSON válido, sin otro texto:
{
  "riskyPhrases": [{"text": "phrase", "suggestion": "mejor manera de decirlo"}],
  "rewritten": "versión tranquila y respetuosa del mensaje",
  "conflictRisk": 0.85
}

Escala conflictRisk: 0.0 (seguro/tranquilo) a 1.0 (extremadamente agresivo/amenazante).
Considera: insultos, amenazas, MAYÚSCULAS, tono agresivo, lenguaje culpable, etc.
Sé estricto - insultos y amenazas = riesgo alto.`,
  };

  return prompts[language] || prompts.en;
};

// Language-specific prompts for calm rewriting
const getRewritePrompt = (message: string, language: string) => {
  const prompts: Record<string, string> = {
    en: `You are a communication expert. Rewrite this message to be calm, respectful, and emotionally balanced while keeping the same meaning.

Original message: "${message}"

IMPORTANT: Respond ONLY with the rewritten message, nothing else. No quotes, no explanations.`,

    fr: `Vous êtes un expert en communication. Réécrivez ce message pour qu'il soit calme, respectueux et équilibré émotionnellement en conservant le même sens.

Message original: "${message}"

IMPORTANT: Répondez UNIQUEMENT avec le message réécrit, rien d'autre. Pas de guillemets, pas d'explications.`,

    es: `Eres un experto en comunicación. Reescribe este mensaje para que sea tranquilo, respetuoso y emocionalmente equilibrado manteniendo el mismo significado.

Mensaje original: "${message}"

IMPORTANTE: Responde SOLO con el mensaje reescrito, nada más. Sin comillas, sin explicaciones.`,
  };

  return prompts[language] || prompts.en;
};

// Call Groq API
async function callGroqAPI(prompt: string, model: string = "llama-3.3-70b-versatile"): Promise<string> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error("Groq API error:", response.status, response.statusText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling Groq API:", error);
    throw error;
  }
}

// Analyze message for risky phrases
export async function analyzeMessage(message: string, language: string = "en"): Promise<AnalysisResult> {
  try {
    const prompt = getAnalysisPrompt(message, language);
    const response = await callGroqAPI(prompt);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid JSON response from API");
    }

    const result = JSON.parse(jsonMatch[0]);

    // Map risky phrases with proper indices
    const riskyPhrases: RiskyPhrase[] = (result.riskyPhrases || []).map((phrase: any) => {
      const startIndex = message.indexOf(phrase.text);
      return {
        text: phrase.text,
        startIndex: startIndex >= 0 ? startIndex : 0,
        endIndex: startIndex >= 0 ? startIndex + phrase.text.length : 0,
        suggestion: phrase.suggestion,
      };
    });

    return {
      original: message,
      rewritten: result.rewritten,
      riskyPhrases: riskyPhrases,
      conflictRisk: result.conflictRisk || 0.5,
    };
  } catch (error) {
    console.error("Error analyzing message:", error);
    // Fallback
    return {
      original: message,
      rewritten: message,
      riskyPhrases: [],
      conflictRisk: 0.3,
    };
  }
}

// Rewrite message to be calmer
export async function rewriteMessage(message: string, language: string = "en"): Promise<string> {
  try {
    const prompt = getRewritePrompt(message, language);
    const response = await callGroqAPI(prompt);
    return response;
  } catch (error) {
    console.error("Error rewriting message:", error);
    // Fallback
    return message;
  }
}