# 🚀 GemmaPilot - Advanced AI Assistant for VS Code

GemmaPilot is an enhanced AI coding assistant that brings GitHub Copilot-like functionality to VS Code using open-source models. With advanced features like file analysis, context awareness, command execution, and a beautiful chat interface.

## ✨ Key Features

### 🎯 Core Capabilities
- **Context-Aware Chat**: Intelligent conversations with full workspace awareness
- **File Analysis**: Deep code analysis and explanations
- **Command Execution**: Run terminal commands with AI assistance (with user permission)
- **Code Completion**: Smart autocomplete suggestions
- **File Attachment**: Attach and analyze specific files in chat
- **Workspace Integration**: Access and analyze your entire project structure

### 🎨 Beautiful Interface
- **Modern WebView UI**: Clean, responsive chat interface
- **Markdown & Code Rendering**: Properly formatted responses with syntax highlighting
- **Toolbar Controls**: Easy access to features and settings
- **Context Toggles**: Control what context is shared with the AI
- **File Browser**: Attach files directly from your workspace

### 🔒 Security & Privacy
- **Local Processing**: Uses your own Ollama instance
- **Command Approval**: User confirmation required for all command executions
- **Safe Command Filtering**: Dangerous commands are automatically blocked
- **No Data Sharing**: Everything stays on your machine

## 🚀 Quick Start

### Prerequisites
1. **VS Code** installed
2. **Ollama** installed and running
3. **Python 3.8+** for the backend
4. **Node.js** for extension development (if building from source)

### Installation

#### 1. Install Dependencies
```bash
# Install Ollama (if not already installed)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model (e.g., codellama for coding tasks)
ollama pull codellama:7b

# Install Python dependencies
pip install fastapi uvicorn ollama pydantic
```

#### 2. Start the Backend
```bash
cd backend
python server.py
```
The backend will start on `http://localhost:8000`

#### 3. Install Extension
- Download the latest `gemmapilot-x.x.x.vsix` file
- In VS Code: `Ctrl+Shift+P` → "Extensions: Install from VSIX"
- Select the downloaded `.vsix` file

#### 4. Start Using GemmaPilot
- Open Command Palette: `Ctrl+Shift+P`
- Run: "GemmaPilot: Open Chat"
- Start chatting with your AI assistant!

## 💡 Usage Examples

### Basic Chat
1. Open GemmaPilot chat panel
2. Ask questions like:
   - "Explain this function to me"
   - "How can I optimize this code?"
   - "Write a unit test for this class"

### File Analysis
1. Click the "📎 Attach File" button in the toolbar
2. Select a file from your workspace
3. Ask specific questions about the file:
   - "What does this code do?"
   - "Are there any potential bugs?"
   - "How can I improve this?"

### Context-Aware Assistance
1. Select code in your editor
2. Toggle "Selection Context" in the toolbar
3. Ask questions about the selected code:
   - "Refactor this function"
   - "Add error handling to this code"
   - "Convert this to use async/await"

### Command Execution
1. Ask GemmaPilot to help with terminal tasks:
   - "Run the tests for this project"
   - "Install the dependencies"
   - "Build the project"
2. Review the suggested command
3. Approve execution if it looks correct

### Workspace Exploration
1. Toggle "Workspace Context" in the toolbar
2. Ask questions about your project:
   - "What files are in this project?"
   - "Show me the main components"
   - "How is this project structured?"

## 🛠️ Configuration

### Backend Configuration
Edit `backend/server.py` to customize:
- **Model Selection**: Change the Ollama model
- **Security Settings**: Modify command restrictions
- **Response Formatting**: Adjust output formatting

### Extension Configuration
The extension can be configured via VS Code settings:
- `gemmapilot.backend.url`: Backend server URL (default: http://localhost:8000)
- `gemmapilot.backend.timeout`: Request timeout in seconds
- `gemmapilot.features.fileAttachment`: Enable/disable file attachment
- `gemmapilot.features.commandExecution`: Enable/disable command execution

## 🔧 Advanced Features

### Custom Prompts
Create custom prompt templates for specific tasks:

```python
# In backend/server.py, modify the chat endpoint
custom_prompts = {
    "code_review": "You are an expert code reviewer. Analyze this code for...",
    "documentation": "You are a technical writer. Create documentation for...",
    "testing": "You are a testing expert. Write comprehensive tests for..."
}
```

### API Integration
The backend provides a RESTful API that can be used by other tools:

```bash
# Chat
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "context": "workspace context"}'

# File Analysis
curl -X POST http://localhost:8000/analyze_file \
  -H "Content-Type: application/json" \
  -d '{"file_path": "/path/to/file.py", "analysis_type": "overview"}'

# Code Completion
curl -X POST http://localhost:8000/complete \
  -H "Content-Type: application/json" \
  -d '{"prompt": "def fibonacci(", "language": "python"}'
```

## 📊 Available Endpoints

### Chat Endpoint
- **URL**: `POST /chat`
- **Purpose**: Main chat interface
- **Input**: `{"prompt": "string", "context": "string"}`
- **Output**: Formatted response with suggestions

### File Analysis
- **URL**: `POST /analyze_file`
- **Purpose**: Analyze specific files
- **Input**: `{"file_path": "string", "analysis_type": "string"}`
- **Output**: Detailed code analysis

### Command Execution
- **URL**: `POST /execute_command`
- **Purpose**: Execute terminal commands
- **Input**: `{"command": "string", "workspace_path": "string"}`
- **Output**: Command results with exit code

### Code Completion
- **URL**: `POST /complete`
- **Purpose**: Code autocompletion
- **Input**: `{"prompt": "string", "language": "string"}`
- **Output**: Code completion suggestions

### Workspace Files
- **URL**: `GET /workspace_files`
- **Purpose**: List workspace files
- **Input**: `?workspace_path=string&file_extension=string`
- **Output**: List of files with metadata

## 🐛 Troubleshooting

### Common Issues

1. **Backend Not Starting**
   - Check if Ollama is running: `ollama list`
   - Verify Python dependencies: `pip list`
   - Check port 8000 availability: `lsof -i :8000`

2. **Extension Not Loading**
   - Reload VS Code window: `Ctrl+Shift+P` → "Developer: Reload Window"
   - Check VS Code Developer Console: `Help` → `Toggle Developer Tools`

3. **Slow Responses**
   - Try a smaller model: `ollama pull codellama:7b`
   - Increase timeout in extension settings
   - Check system resources (CPU/RAM usage)

4. **Command Execution Blocked**
   - Review security restrictions in `backend/server.py`
   - Check command syntax and permissions
   - Verify workspace path is correct

### Debug Mode
Enable debug logging by setting environment variable:
```bash
export GEMMAPILOT_DEBUG=1
python backend/server.py
```

## 🤝 Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install` (extension), `pip install -r requirements.txt` (backend)
3. Make your changes
4. Test: `npm run test` (extension), `python test_features.py` (backend)
5. Build: `npm run compile && npx vsce package`

### Architecture
- **Backend**: FastAPI server with Ollama integration
- **Extension**: TypeScript VS Code extension with WebView UI
- **Communication**: REST API between extension and backend

## 📄 License

MIT License - feel free to use and modify as needed.

## 🙏 Acknowledgments

- **Ollama** for local LLM serving
- **VS Code** for the excellent extension API
- **FastAPI** for the robust backend framework
- **GitHub Copilot** for inspiration

---

**Happy Coding with GemmaPilot! 🚀**
