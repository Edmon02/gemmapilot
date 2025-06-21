# 🚀 GemmaPilot - Advanced AI Coding Assistant

> **Now Enhanced!** GemmaPilot v0.1.0 brings GitHub Copilot-level features with advanced capabilities like file analysis, command execution, and beautiful chat UI - all running locally!

GemmaPilot is a powerful AI coding assistant for VS Code that provides intelligent code suggestions, explanations, and assistance using local language models via Ollama. Unlike cloud-based solutions, GemmaPilot keeps your code private and secure on your machine.

## ✨ New Features in v0.1.0

### 🎯 Core AI Capabilities
- **💬 Context-Aware Chat**: Intelligent conversations with full workspace awareness
- **📄 File Analysis**: Deep code analysis and detailed explanations  
- **⚡ Code Completion**: Smart autocomplete suggestions with context
- **📎 File Attachment**: Attach and analyze specific files in chat
- **🌐 Workspace Integration**: Access and analyze your entire project structure
- **⚙️ Command Execution**: Run terminal commands with AI assistance (user approval required)

### 🎨 Beautiful Interface
- **Modern WebView UI**: Clean, responsive chat interface with toolbar
- **📝 Markdown & Code Rendering**: Properly formatted responses with syntax highlighting
- **🎛️ Context Controls**: Toggle workspace, selection, and file context
- **🔧 Professional Design**: GitHub-inspired styling with dark theme support

### 🔒 Privacy & Security
- **🏠 Local Processing**: Uses your own Ollama instance - no data leaves your machine
- **✅ Command Approval**: User confirmation required for all command executions
- **🛡️ Safe Filtering**: Dangerous commands automatically blocked
- **🔐 Zero Data Sharing**: Everything stays on your computer

## 🚀 Quick Start

### Installation
1. **Install Ollama**: [Download from ollama.ai](https://ollama.ai)
2. **Pull a Model**: `ollama pull codellama:7b`
3. **Install Dependencies**: `pip install fastapi uvicorn ollama pydantic`
4. **Start Backend**: `cd backend && python server.py`
5. **Install Extension**: Load `gemmapilot-0.1.0.vsix` in VS Code
6. **Open Chat**: `Ctrl+Shift+P` → "GemmaPilot: Open Chat"

### Usage Examples
- **💡 Ask Questions**: "Explain this function" or "How can I optimize this code?"
- **📎 Analyze Files**: Attach files and ask "What does this code do?"
- **🔍 Context Help**: Select code and ask "Refactor this function"
- **⚡ Get Commands**: "Run the tests" or "Install dependencies" (with approval)

## 📊 Architecture

```
┌─────────────────┐    HTTP/REST    ┌──────────────────┐
│   VS Code       │ ◄─────────────► │ FastAPI Backend  │
│   Extension     │                 │                  │
│                 │                 │ ┌──────────────┐ │
│ ┌─────────────┐ │                 │ │   Ollama     │ │
│ │ WebView UI  │ │                 │ │   (Local LLM)│ │
│ │ (Chat)      │ │                 │ └──────────────┘ │
│ └─────────────┘ │                 └──────────────────┘
└─────────────────┘
```

- **Frontend**: TypeScript VS Code extension with WebView UI
- **Backend**: FastAPI server with Ollama integration  
- **AI Model**: Local Ollama instance (codellama, gemma3, etc.)
- **Communication**: REST API for all interactions

## 🛠️ Available Features

| Feature | Description | Status |
|---------|-------------|--------|
| 💬 **Enhanced Chat** | Context-aware conversations with workspace integration | ✅ Ready |
| 📎 **File Attachment** | Attach and analyze specific files | ✅ Ready |
| 🌐 **Workspace Context** | Full project structure awareness | ✅ Ready |
| 🎯 **Selection Context** | Analyze selected code snippets | ✅ Ready |
| ⚙️ **Command Execution** | Run AI-suggested terminal commands | ✅ Ready |
| 📄 **File Analysis** | Deep code analysis and explanations | ✅ Ready |
| ⚡ **Code Completion** | Smart autocomplete suggestions | ✅ Ready |
| 🎨 **Beautiful UI** | Modern WebView interface | ✅ Ready |

## 🎯 Prerequisites

- **Hardware**: MacBook with Apple Silicon (M1/M2/M3) recommended, 16GB+ RAM
- **Software**:
  - macOS Ventura+ or Windows 10+ or Linux
  - Visual Studio Code 1.80.0+
  - Python 3.8+
  - Node.js 16+ (for development)

## 📁 Project Structure

```
gemmapilot/
├── README.md                    # This file
├── USAGE_GUIDE.md              # Comprehensive usage guide
├── ENHANCEMENT_COMPLETE.md     # Enhancement summary
├── .gitignore                  # Professional gitignore
├── setup.sh                    # Automated setup script
├── test_features.py            # Feature testing script
├── backend/                    # FastAPI backend
│   └── server.py              # Enhanced server with all features
└── extension/                  # VS Code extension
    ├── src/                   # TypeScript source
    │   ├── extension.ts       # Main extension logic
    │   ├── types.ts          # Type definitions
    │   ├── config.ts         # Configuration
    │   └── statusBar.ts      # Status bar integration
    ├── package.json           # Extension manifest
    └── gemmapilot-0.1.0.vsix # Ready-to-install extension
```

## 🔧 Supported Languages

- **Primary**: Python, JavaScript/TypeScript, Go, Rust
- **Secondary**: Java, C/C++, PHP, Ruby, Swift
- **Markup**: HTML, CSS, Markdown, JSON, YAML
- **Databases**: SQL, MongoDB queries
- **DevOps**: Docker, Kubernetes, Shell scripts

## 🛠️ Troubleshooting

### Backend Issues
```bash
# Check if backend is running
curl -X GET http://localhost:8000/health

# Test chat functionality  
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello", "context":"test"}'
```

### Extension Issues
1. **Reload VS Code**: `Ctrl+Shift+P` → "Developer: Reload Window"
2. **Check Extension**: Look for GemmaPilot icon in Activity Bar
3. **Reinstall**: Uninstall and reinstall the VSIX file
4. **Debug**: `Help` → `Toggle Developer Tools` for console logs

### Performance Tips
- Use smaller models for faster responses: `ollama pull codellama:7b`
- Close other memory-intensive applications
- Monitor Ollama with `ollama ps`

## 🧪 Testing

Run comprehensive feature tests:
```bash
# Test all backend features
python test_features.py

# Expected output:
# 🚀 GemmaPilot Backend Feature Tests
# ✓ Chat endpoint working
# ✓ Code completion working  
# ✓ File analysis working
# ✓ Workspace file listing working
# ✓ Command execution working
# 🎉 All tests passed!
```

## 🔒 Security Features

- **Local Processing**: All AI inference happens on your machine
- **Command Filtering**: Dangerous commands (rm -rf, format, etc.) blocked
- **User Approval**: All command executions require explicit user consent
- **No Telemetry**: No usage data sent anywhere
- **Sandboxed**: Commands run in specified workspace directory only

## 🆚 vs GitHub Copilot

| Feature | GitHub Copilot | GemmaPilot | Advantage |
|---------|----------------|------------|-----------|
| Code Completion | ✅ | ✅ | Equal |
| Chat Interface | ✅ | ✅ | Equal |
| File Analysis | ✅ | ✅ | Equal |
| Context Awareness | ✅ | ✅ | Equal |
| **Command Execution** | ❌ | ✅ | 🏆 GemmaPilot |
| **File Attachment** | ❌ | ✅ | 🏆 GemmaPilot |
| **Local Processing** | ❌ | ✅ | 🏆 GemmaPilot |
| **Custom Models** | ❌ | ✅ | 🏆 GemmaPilot |
| **Open Source** | ❌ | ✅ | 🏆 GemmaPilot |
| **Free** | ❌ | ✅ | 🏆 GemmaPilot |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Ollama** for excellent local LLM serving
- **VS Code** for the powerful extension API
- **FastAPI** for the robust backend framework
- **GitHub Copilot** for inspiration and reference

## 🆘 Support & Documentation

- **Usage Guide**: See `USAGE_GUIDE.md` for comprehensive documentation
- **API Documentation**: Visit `http://localhost:8000/docs` when backend is running
- **Issues**: Report bugs and feature requests on GitHub
- **Discussions**: Join our community discussions

---

**Experience the future of AI-assisted coding - locally, privately, and powerfully! 🚀**

*Built with ❤️ for developers who value privacy, control, and cutting-edge AI assistance.*
