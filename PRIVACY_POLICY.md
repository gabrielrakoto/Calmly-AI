# Privacy Policy for Calmly AI

**Effective Date:** February 15, 2026

## 1. Introduction
Calmly AI ("we", "our", or "us") is dedicated to protecting your privacy. This Privacy Policy explains how our Chrome Extension ("Calmly AI") handles your data.

## 2. Data Collection and Usage
**We do not verify, store, or share your messages on our own servers.**

### How it works:
- **Local Analysis**: The extension interface runs locally in your browser.
- **API Keys**: Your API Key (for Groq, OpenAI, etc.) is stored secure locally in your browser using `chrome.storage.sync`. It effectively never leaves your browser except to authenticate with the LLM provider you chose.
- **Message Processing**: To analyze the tone of your message, the text is sent directly from your browser to the LLM provider you selected (e.g., Groq, OpenAI, Mistral).
- **Data Retention**: We do not retain any of your message data.

## 3. Third-Party Services
This extension interacts with third-party Large Language Model (LLM) providers based on your selection. By using this extension, you acknowledge that your text data is processed by these providers according to their respective privacy policies:
- **Groq**: [https://groq.com/privacy-policy/](https://groq.com/privacy-policy/)
- **OpenAI**: [https://openai.com/privacy/](https://openai.com/privacy/)
- **Mistral**: [https://mistral.ai/privacy/](https://mistral.ai/privacy/)

## 4. Permissions
- **Read Content**: The extension requires permission to read the text you are typing in specific fields to provide the analysis service. This data is only accessed when you trigger the analysis.
- **Storage**: Used to save your settings (preferred provider, API key) locally.

## 5. Contact
If you have any questions about this Privacy Policy, please contact the developer at: [Your Email]
