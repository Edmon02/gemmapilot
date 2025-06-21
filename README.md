# GemmaPilot: A GitHub Copilot-like AI Assistant

GemmaPilot is a local AI coding assistant powered by Gemma-3n 4B, designed to run on a MacBook M1 Pro with 16GB unified memory. It replicates GitHub Copilot’s interface and functionality, including code completion, chat assistance, file operations, and command execution.

## Prerequisites
- MacBook M1 Pro with 16GB unified memory
- macOS Ventura or later
- Visual Studio Code
- Homebrew

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/gemmapilot.git
   cd gemmapilot
   ```
2. Run the setup script:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
3. Install the VS Code extension:
   - Open VS Code, go to Extensions, and select "Install from VSIX".
   - Choose `gemmapilot/extension/gemmapilot.vsix`.

## Usage
1. Start the backend:
   ```bash
   source venv/bin/activate
   uvicorn server:app --host 0.0.0.0 --port 8000
   ```
2. Open VS Code and use GemmaPilot:
   - **Code Completion**: Type in a supported language (Python, JavaScript, etc.) to see inline suggestions.
   - **Chat**: Open the "GemmaPilot Chat" view in the Explorer sidebar to ask coding questions.
   - **File Operations**: Use the chat interface to create or modify files.
   - **Commands**: Run suggested commands via the "GemmaPilot: Execute Command" command (Ctrl+Shift+P).

## Example Prompts
- **Code Completion**: In a Python file, type `def factorial(n):` and see the suggested implementation.
- **Chat**: In the chat panel, enter “Write a JavaScript function to fetch API data” to get a response.
- **Command**: Ask “Suggest a git command to stage all changes” and execute it after approval.

## Troubleshooting
- **Memory Issues**: Ensure no other heavy applications are running. If needed, switch to Gemma-3n 1B model (`ollama pull gemma3:1b`).
- **Performance**: Verify Ollama is using the M1’s GPU (check `ollama serve` logs).
- **Extension Errors**: Rebuild the extension with `npm run compile` in the `extension` folder.

## License
MIT

