# GemmaPilot VS Code Extension

A professional AI coding assistant powered by Gemma-3n, providing intelligent code completion and chat assistance directly in VS Code.

## Features

- **AI Chat Interface**: Interactive chat panel for code assistance and questions
- **Smart Code Completion**: Context-aware code suggestions for multiple programming languages
- **Safe Command Execution**: Validated command execution with safety checks
- **Professional UI**: Modern, VS Code-themed interface with proper error handling
- **Security**: Input validation and XSS protection

## Supported Languages

- Python
- JavaScript/TypeScript
- Java
- C/C++
- Go
- Rust
- PHP
- Ruby

## Requirements

- VS Code 1.80.0 or higher
- GemmaPilot backend server running on `http://localhost:8000`

## Installation & Setup

1. Install the extension
2. Start the GemmaPilot backend server
3. Open the GemmaPilot Chat panel from the Explorer view
4. Start coding with AI assistance!

## Commands

- `GemmaPilot: Open Chat` (Ctrl+Shift+G / Cmd+Shift+G) - Opens the chat panel
- `GemmaPilot: Execute Command` - Safely execute AI-suggested commands

## Configuration

The extension automatically configures itself with sensible defaults. The backend URL and other settings can be modified in the source code if needed.

## Security Features

- Input validation for all user inputs
- XSS protection for chat responses
- Dangerous command detection
- Request timeouts to prevent hanging
- Safe HTML sanitization

## Development

### Building

```bash
npm install
npm run compile
```

### Watching

```bash
npm run watch
```

## Architecture

The extension is built with a modular architecture:

- `extension.ts` - Main extension logic
- `types.ts` - TypeScript interfaces and type definitions
- `config.ts` - Configuration constants and utility functions

## Error Handling

The extension includes comprehensive error handling:

- Network request failures
- Backend unavailability
- Invalid responses
- User input validation
- Graceful degradation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[Add your license here]
