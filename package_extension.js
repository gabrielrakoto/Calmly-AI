const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXT_DIR = path.join(__dirname, 'extension');
const OUTPUT_FILE = path.join(__dirname, 'calmly-ai-extension.zip');

console.log('📦 Creating extension package...');

// Check if 7z is available (Windows) or zip (Mac/Linux)
try {
    // Windows usually has powershell Compress-Archive
    if (process.platform === 'win32') {
        const command = `powershell Compress-Archive -Path "${EXT_DIR}\\*" -DestinationPath "${OUTPUT_FILE}" -Force`;
        execSync(command);
    } else {
        const command = `zip -r "${OUTPUT_FILE}" extension/*`;
        execSync(command);
    }
    console.log(`✅ Success! Package created at: ${OUTPUT_FILE}`);
    console.log('👉 You can upload this file to the Chrome Web Store.');
} catch (error) {
    console.error('❌ Error creating zip:', error.message);
}
