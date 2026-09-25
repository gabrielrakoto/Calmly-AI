// Background Service Worker - Calmly AI v0.3.2
// Universal LLM support: works with any OpenAI-compatible provider

// ── Supported Providers (presets) ───────────────────────────────
const PROVIDERS = {
    groq: {
        name: "Groq (Free)",
        url: "https://api.groq.com/openai/v1/chat/completions",
        // Using Llama 3 models as default for speed/quality
        models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
        defaultModel: "llama-3.3-70b-versatile",
        keyPrefix: "gsk_",
        signupUrl: "https://console.groq.com/keys"
    },
    openai: {
        name: "OpenAI",
        url: "https://api.openai.com/v1/chat/completions",
        models: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
        defaultModel: "gpt-4o-mini",
        keyPrefix: "sk-",
        signupUrl: "https://platform.openai.com/api-keys"
    },
    mistral: {
        name: "Mistral AI",
        url: "https://api.mistral.ai/v1/chat/completions",
        models: ["mistral-large-latest", "mistral-small-latest", "open-mistral-7b"],
        defaultModel: "mistral-small-latest",
        keyPrefix: "",
        signupUrl: "https://console.mistral.ai/api-keys"
    },
    openrouter: {
        name: "OpenRouter (Multi-model)",
        url: "https://openrouter.ai/api/v1/chat/completions",
        models: ["google/gemini-2.0-flash-001", "meta-llama/llama-3.3-70b-instruct", "mistralai/mistral-small-25-02"],
        defaultModel: "google/gemini-2.0-flash-001",
        keyPrefix: "sk-or-",
        signupUrl: "https://openrouter.ai/keys"
    },
    together: {
        name: "Together AI",
        url: "https://api.together.xyz/v1/chat/completions",
        models: ["meta-llama/Llama-3.3-70B-Instruct-Turbo", "mistralai/Mixtral-8x7B-Instruct-v0.1"],
        defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        keyPrefix: "",
        signupUrl: "https://api.together.xyz/settings/api-keys"
    },
    custom: {
        name: "Custom (any URL)",
        url: "",
        models: [],
        defaultModel: "",
        keyPrefix: "",
        signupUrl: ""
    }
};

// ── Auto-setup on install/update ────────────────────────────────
chrome.runtime.onInstalled.addListener((details) => {
    console.log("Calmly AI: Extension installed/updated:", details.reason);
    chrome.storage.sync.get(['provider', 'enabled'], (result) => {
        const defaults = {};
        if (!result.provider) defaults.provider = 'groq';
        if (result.enabled === undefined) defaults.enabled = true;

        // Ensure model is set if provider is present but model is missing
        if (result.provider && !result.model && PROVIDERS[result.provider]) {
            defaults.model = PROVIDERS[result.provider].defaultModel;
        }

        if (Object.keys(defaults).length > 0) {
            chrome.storage.sync.set(defaults, () => {
                console.log("Calmly AI: Default settings configured");
            });
        }
    });
    chrome.storage.local.get(['stats'], (result) => {
        if (!result.stats) {
            chrome.storage.local.set({ stats: { analyzed: 0, rewrites: 0, totalRisk: 0 } });
        }
    });
});

// ── Stats Tracking ──────────────────────────────────────────────
function incrementStat(key, amount = 1) {
    chrome.storage.local.get(['stats'], (result) => {
        const stats = result.stats || { analyzed: 0, rewrites: 0, totalRisk: 0 };
        stats[key] = (stats[key] || 0) + amount;
        chrome.storage.local.set({ stats });
    });
}

// ── Settings Loader ─────────────────────────────────────────────
async function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['provider', 'apiKey', 'model', 'customUrl'], (result) => {
            const providerId = result.provider || 'groq';
            const provider = PROVIDERS[providerId] || PROVIDERS.groq;
            resolve({
                providerId,
                apiKey: result.apiKey || '',
                model: result.model || provider.defaultModel,
                apiUrl: providerId === 'custom' ? (result.customUrl || '') : provider.url
            });
        });
    });
}

// ── Message Handler ─────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyze" || request.action === "quickAnalyze") {
        analyzeText(request.data.message, request.data.language || 'auto')
            .then(data => {
                incrementStat('analyzed');
                incrementStat('totalRisk', data.conflictRisk);
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                console.error("Calmly AI Background: Error", error);
                sendResponse({ success: false, error: error.toString() });
            });
        return true;
    }

    if (request.action === "incrementRewrites") {
        incrementStat('rewrites');
        sendResponse({ success: true });
        return false;
    }

    if (request.action === "getStats") {
        chrome.storage.local.get(['stats'], (result) => {
            sendResponse({ stats: result.stats || { analyzed: 0, rewrites: 0, totalRisk: 0 } });
        });
        return true;
    }

    if (request.action === "resetStats") {
        chrome.storage.local.set({ stats: { analyzed: 0, rewrites: 0, totalRisk: 0 } }, () => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (request.action === "getProviders") {
        sendResponse({ providers: PROVIDERS });
        return false;
    }
});

// ── Keyboard Shortcut Handler ───────────────────────────────────
chrome.commands.onCommand.addListener((command) => {
    if (command === "analyze-text") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "triggerAnalysis" });
            }
        });
    }
});

// ── AI Analysis (Universal) ─────────────────────────────────────
async function analyzeText(text, lang = 'auto') {
    const settings = await getSettings();

    if (!settings.apiKey) {
        throw new Error("NO_API_KEY: Please set your API key in the Calmly AI extension popup.");
    }
    if (!settings.apiUrl) {
        throw new Error("NO_API_URL: Please configure your LLM provider in settings.");
    }

    const systemPrompt = "You are a helpful API that outputs strict JSON. You are sensitive to toxicity, but you MUST score neutral, polite, or friendly messages as very low risk (0.0 - 0.1).";

    const userPrompt = `You are an expert communication coach and conflict mediator.

TASK: Analyze the following text for conflict risk, vulgarity, and aggression.

INPUT TEXT: "${text}"

INSTRUCTIONS:
1. **Detect Language**: Identify the language of the input text. All analysis and rewriting MUST be in this detected language.
2. **Analyze Risk**: 
   - 0.0 - 0.2: Polite, neutral, positive, or standard greetings.
   - 0.3 - 0.6: Passive-aggressive, tense, assertive but rude, or ambiguous.
   - 0.7 - 0.9: Aggressive, blaming, or angry.
   - 1.0: VULGAR, PROFANE, THREATENING, or EXTREMELY TOXIC.
   CRITICAL: Detect insults, sarcasm, and aggression in ANY language.
3. **Rewrite**: Provide a calm, non-violent, and polite version in the SAME language.
4. **Identify Risky Phrases**: Extract words/phrases that contribute to risk with alternatives.

OUTPUT FORMAT (JSON ONLY):
{
    "detectedLanguage": "string",
    "original": "the original text",
    "rewritten": "string",
    "riskyPhrases": [{"text": "offensive phrase", "suggestion": "polite alternative"}],
    "conflictRisk": number
}`;

    try {
        const body = {
            model: settings.model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.2
        };

        // Most providers support response_format for JSON, except some older models
        // We'll try to use it where possible
        if (!settings.providerId || settings.providerId === 'groq' || settings.providerId === 'openai') {
            body.response_format = { type: "json_object" };
        }

        const headers = {
            "Authorization": `Bearer ${settings.apiKey}`,
            "Content-Type": "application/json"
        };

        // OpenRouter specific headers
        if (settings.providerId === 'openrouter') {
            headers["HTTP-Referer"] = "https://calmly-ai.com";
            headers["X-Title"] = "Calmly AI";
        }

        const response = await fetch(settings.apiUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 401) {
                throw new Error("INVALID_API_KEY: Your API key is invalid. Please check it in settings.");
            }
            throw new Error(`API Error ${response.status}: ${errorText.substring(0, 200)}`);
        }

        const json = await response.json();
        const content = json.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("No content received from AI. Check your model name.");
        }

        let result;
        try {
            result = JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse JSON response:", content);
            // Fallback: try to extract JSON from markdown block
            const match = content.match(/```json\s*([\s\S]*?)\s*```/);
            if (match && match[1]) {
                result = JSON.parse(match[1]);
            } else {
                throw new Error("INVALID_RESPONSE: AI did not return valid JSON.");
            }
        }

        return {
            original: text,
            rewritten: result.rewritten || text,
            riskyPhrases: result.riskyPhrases || [],
            conflictRisk: result.conflictRisk ?? 0.0
        };

    } catch (error) {
        console.error("AI Analysis Failed:", error);
        throw error;
    }
}
