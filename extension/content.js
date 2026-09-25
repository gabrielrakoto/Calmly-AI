// Calmly AI Content Script v0.2.0
// Features: Auto-analysis, language detection, keyboard shortcut, enable/disable

console.log("Calmly AI: Content script v0.2.0 active.");

let currentFocus = null;
let calmlyButton = null;
let suggestionBox = null;
let debounceTimer = null;
let extensionEnabled = true;
let autoModeEnabled = false;
let lastAutoRisk = null;

// ── Settings Loader ─────────────────────────────────────────────
function loadSettings() {
    chrome.storage.sync.get(['enabled', 'autoMode'], (settings) => {
        extensionEnabled = settings.enabled !== false; // Default: true
        autoModeEnabled = settings.autoMode === true;  // Default: false
        console.log("Calmly AI: Settings loaded - enabled:", extensionEnabled, "autoMode:", autoModeEnabled);
    });
}

loadSettings();

// Listen for settings changes in real-time
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
        if (changes.enabled !== undefined) {
            extensionEnabled = changes.enabled.newValue !== false;
            if (!extensionEnabled) {
                // Clean up UI when disabled
                if (calmlyButton) { calmlyButton.remove(); calmlyButton = null; }
                removeSuggestionBox();
            }
        }
        if (changes.autoMode !== undefined) {
            autoModeEnabled = changes.autoMode.newValue === true;
            // Reset auto indicator when disabled
            if (!autoModeEnabled && calmlyButton) {
                calmlyButton.className = 'calmly-trigger-btn';
                lastAutoRisk = null;
            }
        }
    }
});

// ── Event Listeners ─────────────────────────────────────────────
document.addEventListener('focusin', handleFocus);
document.addEventListener('click', (e) => {
    if (suggestionBox && !suggestionBox.contains(e.target) && e.target !== calmlyButton) {
        removeSuggestionBox();
    }
});

// Listen for keyboard shortcut from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "triggerAnalysis" && currentFocus) {
        analyzeText(currentFocus);
    }
});

// ── Focus Handler ───────────────────────────────────────────────
function handleFocus(e) {
    if (!extensionEnabled) return;

    const target = e.target;
    if (target.isContentEditable ||
        target.tagName === 'TEXTAREA' ||
        (target.tagName === 'INPUT' && (target.type === 'text' || target.type === 'search')) ||
        target.getAttribute('role') === 'textbox') {

        console.log("Calmly AI: Detected editable field:", target);
        currentFocus = target;
        injectButton(target);

        // Set up auto-analysis listener
        if (autoModeEnabled) {
            target.removeEventListener('input', handleAutoInput);
            target.addEventListener('input', handleAutoInput);
        }
    }
}

// ── Auto-Analysis (Debounced) ───────────────────────────────────
function handleAutoInput(e) {
    if (!autoModeEnabled || !extensionEnabled) return;

    clearTimeout(debounceTimer);

    // Show "thinking" state on button
    if (calmlyButton) {
        calmlyButton.className = 'calmly-trigger-btn calmly-thinking';
    }

    debounceTimer = setTimeout(() => {
        const target = e.target;
        const root = getEditableRoot(target) || target;
        const text = root.innerText || root.value || root.textContent;

        if (!text || text.trim().length < 8) {
            // Reset indicator for short text
            if (calmlyButton) {
                calmlyButton.className = 'calmly-trigger-btn';
                lastAutoRisk = null;
            }
            return;
        }

        quickAnalyze(text);
    }, 2000); // 2 seconds after user stops typing
}

function quickAnalyze(text) {
    const detectedLang = document.documentElement.lang || 'auto';

    chrome.runtime.sendMessage({
        action: "quickAnalyze",
        data: { message: text, language: detectedLang }
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Calmly AI: Auto-analysis error:", chrome.runtime.lastError);
            if (calmlyButton) calmlyButton.className = 'calmly-trigger-btn';
            return;
        }

        if (response && response.success) {
            lastAutoRisk = response.data.conflictRisk;
            updateButtonIndicator(response.data.conflictRisk);
        } else {
            if (calmlyButton) calmlyButton.className = 'calmly-trigger-btn';
        }
    });
}

function updateButtonIndicator(risk) {
    if (!calmlyButton) return;

    // Remove all risk classes
    calmlyButton.classList.remove('calmly-thinking', 'calmly-safe', 'calmly-caution', 'calmly-danger');

    if (risk <= 0.3) {
        calmlyButton.classList.add('calmly-safe');
        calmlyButton.title = "✅ Your message looks calm and polite!";
    } else if (risk <= 0.6) {
        calmlyButton.classList.add('calmly-caution');
        calmlyButton.title = "⚠️ Your message might cause tension. Click to see suggestions.";
    } else {
        calmlyButton.classList.add('calmly-danger');
        calmlyButton.title = "🔴 High conflict risk detected! Click to rewrite.";
    }
}

// ── Button Injection ────────────────────────────────────────────
function injectButton(target) {
    if (calmlyButton) calmlyButton.remove();

    calmlyButton = document.createElement('div');
    calmlyButton.className = 'calmly-trigger-btn';
    calmlyButton.innerHTML = '🌱';
    calmlyButton.title = "Analyze tone with Calmly AI (Ctrl+Shift+Y)";

    updateButtonPosition(target);

    calmlyButton.addEventListener('click', () => analyzeText(target));

    document.body.appendChild(calmlyButton);

    window.addEventListener('scroll', () => updateButtonPosition(target), true);
    window.addEventListener('resize', () => updateButtonPosition(target));
}

function updateButtonPosition(target) {
    if (!calmlyButton) return;
    const rect = target.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    calmlyButton.style.top = `${window.scrollY + rect.bottom - 40}px`;
    calmlyButton.style.left = `${window.scrollX + rect.right - 40}px`;
}

// ── Editable Root Finder ────────────────────────────────────────
function getEditableRoot(node) {
    while (node && node.parentNode) {
        if (node.getAttribute && node.getAttribute('contenteditable') === 'true') {
            return node;
        }
        node = node.parentNode;
    }
    return node;
}

// ── Full Analysis ───────────────────────────────────────────────
function analyzeText(target) {
    if (!extensionEnabled) return;

    console.log("Calmly AI: Analyze button clicked");

    let root = getEditableRoot(target);
    if (!root) root = target;

    const text = root.innerText || root.value || root.textContent;
    console.log("Calmly AI: Extracted text:", text);

    if (!text || text.trim().length < 2) {
        const originalText = calmlyButton.innerHTML;
        calmlyButton.innerHTML = '⚠️';
        alert("Calmly AI: Please type a longer message first!");
        setTimeout(() => calmlyButton.innerHTML = originalText, 1000);
        return;
    }

    const originalIcon = calmlyButton.innerHTML;
    calmlyButton.innerHTML = '⏳';
    calmlyButton.className = 'calmly-trigger-btn calmly-thinking';

    const detectedLang = document.documentElement.lang || 'auto';

    try {
        chrome.runtime.sendMessage({
            action: "analyze",
            data: { message: text, language: detectedLang }
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Calmly AI Runtime Error:", chrome.runtime.lastError);
                calmlyButton.innerHTML = '🔌';
                calmlyButton.className = 'calmly-trigger-btn';
                calmlyButton.title = "Extension Error: Reload the extension.";
                setTimeout(() => { calmlyButton.innerHTML = originalIcon; }, 4000);
                return;
            }

            if (response && response.success) {
                console.log("Calmly AI: Data received:", response.data);
                calmlyButton.innerHTML = originalIcon;
                updateButtonIndicator(response.data.conflictRisk);
                showSuggestion(response.data, root);
            } else {
                console.error("Calmly AI Error:", response ? response.error : "Unknown error");
                const errMsg = response ? response.error : "";

                if (errMsg.includes("NO_API_KEY")) {
                    calmlyButton.innerHTML = '🔑';
                    calmlyButton.title = "Please set your API key in the Calmly AI popup.";
                } else if (errMsg.includes("INVALID_API_KEY")) {
                    calmlyButton.innerHTML = '🔑';
                    calmlyButton.title = "Invalid API key. Check settings.";
                } else if (errMsg.includes("Failed to fetch") || errMsg.includes("NetworkError")) {
                    calmlyButton.innerHTML = '🔌';
                    calmlyButton.title = "Connection Error: Check your internet.";
                } else {
                    calmlyButton.innerHTML = '❌';
                    calmlyButton.title = "Analysis Error: " + errMsg;
                }

                calmlyButton.className = 'calmly-trigger-btn';
                setTimeout(() => { calmlyButton.innerHTML = originalIcon; }, 4000);
            }
        });

    } catch (error) {
        console.error("Calmly AI Client Error:", error);
        calmlyButton.innerHTML = '❌';
        calmlyButton.className = 'calmly-trigger-btn';
        setTimeout(() => { calmlyButton.innerHTML = originalIcon; }, 4000);
    }
}

// ── Suggestion Box ──────────────────────────────────────────────
function showSuggestion(data, target) {
    removeSuggestionBox();

    suggestionBox = document.createElement('div');
    suggestionBox.className = 'calmly-suggestion-box';

    let riskColor, riskLabel;
    if (data.conflictRisk > 0.7) {
        riskColor = '#ef4444';
        riskLabel = 'High Risk';
    } else if (data.conflictRisk > 0.4) {
        riskColor = '#f59e0b';
        riskLabel = 'Medium Risk';
    } else {
        riskColor = '#10b981';
        riskLabel = 'Low Risk';
    }

    let contentHtml = '';
    let actionsHtml = '';

    if (data.conflictRisk <= 0.4) {
        // Safe message
        contentHtml = `
            <div style="text-align:center; padding: 10px 0;">
                <span style="font-size: 28px;">🎉</span><br/>
                <strong style="font-size: 15px;">Great job!</strong><br/>
                <span style="color:#666">Your message is calm and polite.</span>
            </div>
        `;
        actionsHtml = `
            <button class="calmly-btn calmly-btn-primary" id="calmly-dismiss" style="width:100%">Awesome</button>
        `;
    } else {
        // Risky message - show original, suggestion, AND risky phrases
        let riskyPhrasesHtml = '';
        if (data.riskyPhrases && data.riskyPhrases.length > 0) {
            riskyPhrasesHtml = `
                <div class="calmly-risky-phrases">
                    <strong style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">⚠️ Flagged phrases:</strong>
                    <div style="margin-top: 6px;">
                        ${data.riskyPhrases.map(p => `
                            <div class="calmly-phrase-item">
                                <span class="calmly-phrase-bad">${p.text}</span>
                                <span class="calmly-phrase-arrow">→</span>
                                <span class="calmly-phrase-good">${p.suggestion}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        contentHtml = `
            <strong>Original:</strong><br/>
            <span style="color:#666">${data.original}</span>
            <br/><br/>
            <strong>Suggestion:</strong><br/>
            <span style="color:#333">${data.rewritten}</span>
            ${riskyPhrasesHtml}
        `;
        actionsHtml = `
            <button class="calmly-btn calmly-btn-ghost" id="calmly-dismiss">Dismiss</button>
            <button class="calmly-btn calmly-btn-primary" id="calmly-replace">Replace</button>
        `;
    }

    // Risk meter bar
    const riskPercent = Math.round(data.conflictRisk * 100);

    suggestionBox.innerHTML = `
    <div class="calmly-header">
      <span style="display:flex;align-items:center;gap:6px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${riskColor}"></span>
        Calmly Analysis
        <span class="calmly-risk-badge" style="background:${riskColor}20;color:${riskColor};font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600;">${riskLabel}</span>
      </span>
      <span class="calmly-close">&times;</span>
    </div>
    <div class="calmly-risk-meter">
        <div class="calmly-risk-bar" style="width:${riskPercent}%;background:${riskColor};"></div>
    </div>
    <div class="calmly-content">
      ${contentHtml}
    </div>
    <div class="calmly-actions">
      ${actionsHtml}
    </div>
    <div class="calmly-shortcut-hint">💡 Tip: Use <kbd>Ctrl+Shift+Y</kbd> to analyze quickly</div>
  `;

    document.body.appendChild(suggestionBox);

    // Events
    suggestionBox.querySelector('.calmly-close').onclick = removeSuggestionBox;

    const dismissBtn = suggestionBox.querySelector('#calmly-dismiss');
    if (dismissBtn) dismissBtn.onclick = removeSuggestionBox;

    const replaceBtn = suggestionBox.querySelector('#calmly-replace');
    if (replaceBtn) {
        replaceBtn.onclick = () => {
            replaceText(target, data.rewritten);
            // Track rewrite usage
            chrome.runtime.sendMessage({ action: "incrementRewrites" });
            removeSuggestionBox();
        };
    }
}

function removeSuggestionBox() {
    if (suggestionBox) {
        suggestionBox.remove();
        suggestionBox = null;
    }
}

function replaceText(target, newText) {
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        target.value = newText;
    } else {
        target.innerText = newText;
    }
    target.dispatchEvent(new Event('input', { bubbles: true }));
}
