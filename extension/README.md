# 🚀 Calmly AI - Chrome Extension (Beta)

## Installation
1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select this `extension` folder.

## Setup
1. Ensure the Calmly AI server is running locally:
   ```bash
   cd ..
   npm run dev
   ```
2. The server must be listening on port 3000 (default).

## Usage
1. Open **Gmail** (compose a new email) or **WhatsApp Web**.
2. Click inside the message input area.
3. A small **🌱** icon should appear near the text field.
4. Type a message (e.g., "This is stupid").
5. Click the 🌱 icon to analyze.

## Troubleshooting
- If the icon doesn't appear: Refresh the page.
- Errors in console: Right-click the extension icon > Inspect Popup vs Inspect Page.
