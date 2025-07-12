# Configuration and Customization

GemmaPilot is designed to be highly configurable, so you can tailor it to your specific needs.

## Configuration File

The configuration for the VS Code extension is located in the `extension/src/config.ts` file. Here's a breakdown of the available options:

```typescript
export const CONFIG: GemmaPilotConfig = {
    backendUrl: 'http://localhost:8000',
    timeout: 30000,
    enableAutoComplete: true,
    maxFileSize: 1024 * 1024, // 1MB
    enableFileAnalysis: true,
    enableCommandExecution: true,
    supportedLanguages: [
        // ...
    ]
};
```

*   **`backendUrl`:** The URL of the FastAPI backend server.
*   **`timeout`:** The timeout for API requests, in milliseconds.
*   **`enableAutoComplete`:** Whether to enable inline code completions.
*   **`maxFileSize`:** The maximum file size for attachments, in bytes.
*   **`enableFileAnalysis`:** Whether to enable the file analysis feature.
*   **`enableCommandExecution`:** Whether to enable the command execution feature.
*   **`supportedLanguages`:** A list of the languages that are supported by the extension.

## Customization

### Changing the AI Model

By default, GemmaPilot uses the `gemma3:4b` model. However, you can change this to any other model that is supported by Ollama. To do so, simply change the `MODEL` variable in the `backend/server.py` file:

```python
MODEL = "your-model-name"
```

### Customizing the Prompt

The `create_enhanced_prompt` function in `backend/server.py` is responsible for creating the prompt that is sent to the language model. You can customize this function to add your own context or to change the way the prompt is formatted.

### Adding New Quick Actions

The quick actions in the chat interface are defined in the `getHtmlTemplate` method in `extension/src/extension.ts`. You can add new buttons to this template and then add a new message handler in the `resolveWebviewView` method to handle the new action.
