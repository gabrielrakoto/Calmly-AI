// Calmly AI Popup Script v0.3.2
const $ = id => document.getElementById(id);
let PROVIDERS = {};
let providersLoaded = false;

function showToast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Fallback providers (if service worker is asleep) ──
const FALLBACK_PROVIDERS = {
    groq: {
        name: "Groq (Free)",
        models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
        defaultModel: "llama-3.3-70b-versatile",
        keyPrefix: "gsk_",
        signupUrl: "https://console.groq.com/keys"
    },
    openai: {
        name: "OpenAI",
        models: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
        defaultModel: "gpt-4o-mini",
        keyPrefix: "sk-",
        signupUrl: "https://platform.openai.com/api-keys"
    },
    mistral: {
        name: "Mistral AI",
        models: ["mistral-large-latest", "mistral-small-latest", "open-mistral-7b"],
        defaultModel: "mistral-small-latest",
        keyPrefix: "",
        signupUrl: "https://console.mistral.ai/api-keys"
    },
    openrouter: {
        name: "OpenRouter (Multi-model)",
        models: ["google/gemini-2.0-flash-001", "meta-llama/llama-3.3-70b-instruct", "mistralai/mistral-small-25-02"],
        defaultModel: "google/gemini-2.0-flash-001",
        keyPrefix: "sk-or-",
        signupUrl: "https://openrouter.ai/keys"
    },
    together: {
        name: "Together AI",
        models: ["meta-llama/Llama-3.3-70B-Instruct-Turbo", "mistralai/Mixtral-8x7B-Instruct-v0.1"],
        defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        keyPrefix: "",
        signupUrl: "https://api.together.xyz/settings/api-keys"
    },
    custom: {
        name: "Custom (any URL)",
        models: [],
        defaultModel: "",
        keyPrefix: "",
        signupUrl: ""
    }
};

// ── Load providers with retry ──────────────────────────────
function loadProviders(retries = 3) {
    chrome.runtime.sendMessage({ action: 'getProviders' }, (r) => {
        if (chrome.runtime.lastError) {
            console.warn("Calmly AI Popup: sendMessage error:", chrome.runtime.lastError.message);
        }
        if (r && r.providers) {
            PROVIDERS = r.providers;
            providersLoaded = true;
            loadSettings();
        } else if (retries > 0) {
            console.log("Calmly AI Popup: Retrying getProviders...", retries);
            setTimeout(() => loadProviders(retries - 1), 500);
        } else {
            console.warn("Calmly AI Popup: Using fallback providers");
            PROVIDERS = FALLBACK_PROVIDERS;
            providersLoaded = true;
            loadSettings();
        }
    });
}

// Start loading
loadProviders();

function loadSettings() {
    chrome.storage.sync.get(['enabled', 'autoMode', 'provider', 'apiKey', 'model', 'customUrl'], (s) => {
        if (chrome.runtime.lastError) {
            console.error("Calmly AI Popup: storage error:", chrome.runtime.lastError.message);
            showToast('⚠️ Error loading settings');
            return;
        }

        $('toggleEnabled').classList.toggle('active', s.enabled !== false);
        $('toggleAuto').classList.toggle('active', s.autoMode === true);
        $('statusDot').className = 'status-dot ' + (s.enabled !== false ? 'green' : 'red');

        const prov = s.provider || 'groq';
        $('providerSelect').value = prov;
        updateProviderUI(prov);

        if (s.apiKey) $('apiKeyInput').value = s.apiKey;
        if (s.model) {
            setTimeout(() => {
                const select = $('modelSelect');
                const optionExists = Array.from(select.options).some(o => o.value === s.model);
                if (optionExists) {
                    select.value = s.model;
                } else if (prov === 'custom') {
                    // Custom provider might need custom input
                    // kept simple for now
                }
            }, 100);
        }
        if (s.customUrl) $('customUrlInput').value = s.customUrl;
    });

    chrome.runtime.sendMessage({ action: 'getStats' }, (r) => {
        if (chrome.runtime.lastError) return;
        if (r && r.stats) {
            $('statAnalyzed').textContent = r.stats.analyzed || 0;
            $('statRewrites').textContent = r.stats.rewrites || 0;
            const avg = r.stats.analyzed > 0 ? (r.stats.totalRisk / r.stats.analyzed).toFixed(2) : '0.0';
            $('statAvgRisk').textContent = avg;
        }
    });
}

function updateProviderUI(providerId) {
    const prov = PROVIDERS[providerId];
    if (!prov) return;

    // Show/hide custom URL
    $('customUrlRow').classList.toggle('visible', providerId === 'custom');

    // Populate models
    const select = $('modelSelect');
    select.innerHTML = ''; // Clear existing

    if (prov.models && prov.models.length > 0) {
        prov.models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            select.appendChild(opt);
        });
        select.style.display = 'block';

        // Remove custom model input if it exists
        const cmi = $('customModelInput');
        if (cmi) cmi.style.display = 'none';

    } else {
        // No models defined (e.g. custom provider), use text input
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Enter model name manually...';
        select.appendChild(opt);
        select.style.display = 'none';

        let customModelInput = $('customModelInput');
        if (!customModelInput) {
            customModelInput = document.createElement('input');
            customModelInput.id = 'customModelInput';
            customModelInput.placeholder = 'e.g. gpt-4o';
            customModelInput.style.marginTop = '4px';
            select.parentNode.appendChild(customModelInput);
        }
        customModelInput.style.display = 'block';
    }

    // Update signup link
    if (prov.signupUrl) {
        $('signupLink').href = prov.signupUrl;
        $('signupLink').style.display = 'inline-block';
        $('signupLink').textContent = `🔗 Get a free API key for ${prov.name}`;
    } else {
        $('signupLink').style.display = 'none';
    }

    // Update placeholder
    $('apiKeyInput').placeholder = prov.keyPrefix ? prov.keyPrefix + '...' : 'Enter your API key...';
}

// Provider change
$('providerSelect').addEventListener('change', (e) => {
    updateProviderUI(e.target.value);
});

// Toggle: Enabled
$('toggleEnabled').addEventListener('click', () => {
    const el = $('toggleEnabled');
    el.classList.toggle('active');
    const enabled = el.classList.contains('active');
    chrome.storage.sync.set({ enabled });
    $('statusDot').className = 'status-dot ' + (enabled ? 'green' : 'red');
    showToast(enabled ? 'Extension enabled' : 'Extension disabled');
});

// Toggle: Auto Mode
$('toggleAuto').addEventListener('click', () => {
    const el = $('toggleAuto');
    el.classList.toggle('active');
    chrome.storage.sync.set({ autoMode: el.classList.contains('active') });
    showToast(el.classList.contains('active') ? 'Auto-scan ON' : 'Auto-scan OFF');
});

// Save Settings
$('saveBtn').addEventListener('click', () => {
    const provider = $('providerSelect').value;
    const apiKey = $('apiKeyInput').value.trim();
    const customUrl = $('customUrlInput').value.trim();

    let model = $('modelSelect').value;
    const cmi = $('customModelInput');
    if (cmi && cmi.style.display !== 'none') {
        model = cmi.value.trim();
    }

    if (!apiKey) { showToast('⚠️ Please enter an API key'); return; }
    if (provider === 'custom' && !customUrl) { showToast('⚠️ Please enter an API URL'); return; }

    chrome.storage.sync.set({ provider, apiKey, model, customUrl }, () => {
        if (chrome.runtime.lastError) {
            console.error("Calmly AI Popup: Save error:", chrome.runtime.lastError.message);
            showToast('❌ Error saving: ' + chrome.runtime.lastError.message);
            return;
        }
        showToast('✅ Settings saved!');
    });
});

// Reset Stats
$('resetStatsBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'resetStats' }, () => {
        if (chrome.runtime.lastError) return;
        $('statAnalyzed').textContent = '0';
        $('statRewrites').textContent = '0';
        $('statAvgRisk').textContent = '0.0';
        showToast('Stats reset');
    });
});
