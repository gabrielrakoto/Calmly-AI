
// messageRewriter.ts - Backend AI Integration for CalmlyAI

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

// Analyze message using backend API (which simulates or proxies AI)
export async function analyzeMessage(message: string, language: string = "auto"): Promise<AnalysisResult> {
  try {
    const response = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, language }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Map risky phrases with proper indices if the server didn't provide them
    // My server `ai.ts` provides text/suggestion. I need to calc indices here or in server.
    // Server `ai.ts` returned `riskyPhrases: [{text, suggestion}]`.
    // We need to add indices.

    const riskyPhrases: RiskyPhrase[] = (data.riskyPhrases || []).map((phrase: any) => {
      const startIndex = message.toLowerCase().indexOf(phrase.text.toLowerCase());
      return {
        text: phrase.text,
        startIndex: startIndex >= 0 ? startIndex : 0,
        endIndex: startIndex >= 0 ? startIndex + phrase.text.length : 0,
        suggestion: phrase.suggestion,
      };
    });

    return {
      original: message,
      rewritten: data.rewritten || message,
      riskyPhrases: riskyPhrases,
      conflictRisk: data.conflictRisk || 0.1,
    };
  } catch (error) {
    console.error("Error analyzing message:", error);
    // Fallback
    return {
      original: message,
      rewritten: message,
      riskyPhrases: [],
      conflictRisk: 0.1,
    };
  }
}

// Rewrite message (reusing the analysis endpoint for consistency)
export async function rewriteMessage(message: string, language: string = "en"): Promise<string> {
  try {
    const result = await analyzeMessage(message, language);
    return result.rewritten;
  } catch (error) {
    console.error("Error rewriting message:", error);
    return message;
  }
}