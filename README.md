# Terms of Service with AI Chrome Extension

A Chrome extension that uses OpenAI's GPT API to generate concise summaries of web pages. Simply click the extension icon, press "Start," and get an AI-powered summary of your current webpage.


https://github.com/user-attachments/assets/8315a80a-8d43-46e5-8d45-b674aa085ae3



## Features

- 🚀 One-click webpage summarization
- 🔒 Secure API key storage
- 📱 Clean, user-friendly interface
- 🔄 Works on any webpage
- ⚙️ Customizable via options page
- 🔐 Uses your own OpenAI API key

## Installation

### From Source (For Developers)

1. Clone this repository:

```bash
git clone https://github.com/yourusername/webpage-summarizer.git
cd webpage-summarizer
```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the directory containing the extension files (extension). Literally just select the folder, not any specific file.

### Configuration

1. Get an OpenAI API key:

   - Visit [OpenAI's website](https://platform.openai.com/)
   - Create an account or sign in
   - Navigate to the API section
   - Generate a new API key

2. Configure the extension:
   - Click the extension's options icon in Chrome's extensions menu
   - Enter your OpenAI API key
   - Click "Save"

## Usage

1. Navigate to any webpage you want to summarize
2. Click the extension icon in your Chrome toolbar
3. View the current URL
4. Click "Start" to generate a summary
5. Wait a few seconds for the AI-generated summary to appear

## Technical Details

The extension is built using:

- Manifest V3
- Chrome Extensions API
- OpenAI Chat Completions API
- HTML/CSS/JavaScript

### Project Structure

```
webpage-summarizer/
├── manifest.json
├── popup.html
├── popup.js
├── content-script.js
├── options.html
├── options.js
├── icon48.png
└── icon128.png
```

## Privacy & Security

- Your OpenAI API key is stored securely in Chrome's storage system
- The extension only accesses webpage content when you click "Start"
- No data is stored or transmitted except to generate the summary
- The extension only requests necessary permissions

## Development

To modify the extension:

1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test the updated functionality
