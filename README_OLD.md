# GemmaPilot: Professional AI Coding Assistant

GemmaPilot is a professional AI coding assistant powered by Gemma-3n, designed to provide GitHub Copilot-like functionality with local execution. It features intelligent code completion, interactive chat assistance, and seamless VS Code integration.

## ✨ Features- 
   🤖 **AI-Powered Code Completion**: Intelligent code suggestions for multiple programming languages-
   💬 **Interactive Chat Interface**: Direct AI assistance through a dedicated VS Code panel- 
   🔗 **Local Backend**: Runs entirely on your machine for privacy and control- 
   📊 **Real-time Status**: Visual indicators showing backend connection status- 
   ⚡ **High Performance**: Optimized for Apple Silicon (M1/M2/M3 chips)- 
   🛡️ **Safe Command Execution**: Built-in validation for suggested terminal commands## 
   🎯 Prerequisites- **Hardware**: MacBook with Apple Silicon (M1/M2/M3) and 16GB+ unified memory- 
   **Software**:   - macOS Ventura or later  - Visual Studio Code 1.80.0+  - Homebrew  - Node.js 16+## 🚀 Quick Start### 1. Installation```bash# Clone the repositorygit clone https://github.com/your-repo/gemmapilot.gitcd gemmapilot# Run the automated setupchmod +x setup.sh./setup.sh```### 2. Start the Backend```bash# Activate the virtual environmentsource venv/bin/activate# Start the FastAPI backendcd backenduvicorn server:app --host 0.0.0.0 --port 8000```### 3. Install VS Code Extension```bash# Install the extensioncode --install-extension extension/gemmapilot-0.1.0.vsix# Or install manually through VS Code:
# Extensions > Install from VSIX > Select gemmapilot-0.1.0.vsix
```

### 4. Test the Setup
```bash
# Run the test script
./test_extension.sh
```

## 💡 Usage

### Code Completion
- Simply start typing in any supported language file
- GemmaPilot will provide intelligent suggestions
- Press `Tab` to accept completions

### Chat Interface
- Click the GemmaPilot icon in the Activity Bar
- Open the Chat panel
- Type your questions or requests
- Get instant AI-powered responses

### Keyboard Shortcuts
- `Cmd+Shift+G` (Mac) / `Ctrl+Shift+G` (Windows/Linux): Open GemmaPilot Chat

## 🔧 Supported Languages

- Python
- JavaScript/TypeScript
- Java
- C/C++
- Go
- Rust
- PHP
- Ruby

## 🛠️ Troubleshooting

### Extension Issues
If you see "There is no data provider registered that can provide view data":

1. **Ensure Latest Extension**: Reinstall the latest VSIX package
2. **Reload VS Code**: Press `Cmd+R` or restart VS Code
3. **Check Activity Bar**: Look for the GemmaPilot icon (💬)
4. **Verify Installation**: Run `./test_extension.sh`

### Backend Issues
```bash
# Check if backend is running
curl -X GET http://localhost:8000/health

# Test chat functionality
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello"}'
```

### Performance Optimization
- **Memory**: Close other heavy applications
- **Model**: Switch to smaller model if needed: `ollama pull gemma3:1b`
- **Monitoring**: Check `ollama serve` logs for GPU utilization

### Common Solutions
1. **Reinstall Extension**:
   ```bash
   code --uninstall-extension gemmapilot
   code --install-extension extension/gemmapilot-0.1.0.vsix
   ```

2. **Rebuild Extension**:
   ```bash
   cd extension
   npm run compile
   npx @vscode/vsce package
   ```

3. **Reset Backend**:
   ```bash
   ollama stop
   ollama serve
   ```

## 📁 Project Structure

```
gemmapilot/
├── .gitignore              # Comprehensive gitignore file
├── README.md               # This file
├── setup.sh               # Automated setup script
├── test_extension.sh      # Extension testing script
├── backend/               # FastAPI backend
│   └── server.py          # Main server file
└── extension/             # VS Code extension
    ├── src/               # TypeScript source
    ├── out/               # Compiled JavaScript
    ├── package.json       # Extension manifest
    └── gemmapilot-0.1.0.vsix  # Extension package
```

## 🐛 Known Issues

- Initial model download may take time
- First completion request might be slower (model warming)
- Very long contexts may exceed model limits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

If you encounter issues:
1. Run `./test_extension.sh` for diagnostics
2. Check VS Code Developer Tools (Help > Toggle Developer Tools)
3. Review backend logs
4. Create an issue with logs and system info

