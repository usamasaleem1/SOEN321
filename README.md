# Web Page Summarizer Chrome Extension

A Chrome extension that uses OpenAI's GPT API to generate concise summaries of web pages. Simply click the extension icon, press "Start," and get an AI-powered summary of your current webpage.

![Extension Demo](demo.gif)

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
   - Select the directory containing the extension files

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Development

To modify the extension:

1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test the updated functionality

### Building for Production

For production deployment:

1. Remove any console.log statements
2. Minify JavaScript files
3. Optimize images
4. Update version number in manifest.json
