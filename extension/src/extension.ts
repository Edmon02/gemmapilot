import * as vscode from 'vscode';
import * as path from 'path';
import { WebviewViewProvider, WebviewView } from 'vscode';
import * as https from 'https';
import * as http from 'http';
import { ChatMessage, ChatResponse, CompletionResponse, WebviewMessage } from './types';
import { CONFIG, Utils } from './config';
import { StatusBarManager } from './statusBar';

// Simple HTTP client to replace fetch
function makeRequest(url: string, options: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ ok: res.statusCode! >= 200 && res.statusCode! < 300, json: () => Promise.resolve(jsonData), status: res.statusCode });
                } catch (e) {
                    resolve({ ok: false, json: () => Promise.resolve({}), status: res.statusCode });
                }
            });
        });

        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

class GemmaPilotChatProvider implements WebviewViewProvider {
    public static readonly viewType = 'gemmapilot.chat';

    constructor(private readonly context: vscode.ExtensionContext) {}

    resolveWebviewView(
        webviewView: WebviewView,
        context: vscode.WebviewViewResolveContext<unknown>,
        token: vscode.CancellationToken
    ): void | Thenable<void> {
        console.log('🔧 GemmaPilotChatProvider.resolveWebviewView called');
        console.log('📋 WebviewView object:', webviewView);
        vscode.window.showInformationMessage('GemmaPilot: WebView is being resolved!');
        
        webviewView.webview.options = { 
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };
        
        console.log('🎨 Setting webview HTML content');
        webviewView.webview.html = this.getWebviewContent();
        console.log('✅ WebView HTML content set');
        
        webviewView.webview.onDidReceiveMessage(async (message: any) => {
            try {
                console.log('📥 Received message from webview:', message);
                
                switch (message.type) {
                    case 'chat':
                        await this.handleChatMessage(webviewView, message);
                        break;
                    case 'attach_file':
                        await this.handleFileAttachment(webviewView);
                        break;
                    case 'file_analysis':
                        await this.handleFileAnalysis(webviewView, message.filePath);
                        break;
                    case 'execute_command':
                        await this.handleCommandExecution(webviewView, message.command);
                        break;
                    default:
                        console.log('Unknown message type:', message.type);
                }
            } catch (error) {
                console.error('Error handling message:', error);
                webviewView.webview.postMessage({ 
                    type: 'error', 
                    error: 'Sorry, there was an error processing your request.' 
                });
            }
        });

        // Show a welcome message
        webviewView.show?.(true);
    }

    private async handleChatMessage(webviewView: WebviewView, message: any): Promise<void> {
        try {
            const prompt = message.prompt?.trim();
            if (!prompt) return;

            // Get current context
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            const activeEditor = vscode.window.activeTextEditor;
            
            // Build request payload
            const requestData: any = {
                prompt: prompt,
                workspace_path: workspaceFolder?.uri.fsPath || '',
                current_file: activeEditor?.document.fileName || '',
                context: activeEditor?.document.getText() || '',
                files: message.attachedFiles || []
            };

            // Add selection if requested
            if (message.includeSelection && activeEditor?.selection) {
                const selection = activeEditor.document.getText(activeEditor.selection);
                if (selection) {
                    requestData.selection = selection;
                }
            }

            console.log('🚀 Sending enhanced chat request:', requestData);

            const response = await makeRequest(`${CONFIG.backendUrl}/chat`, {
                method: 'POST',
                body: JSON.stringify(requestData),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📥 Received chat response:', data);

            webviewView.webview.postMessage({ 
                type: 'response', 
                content: data.response,
                formatted_content: data.formatted_response,
                suggestions: data.suggestions || [],
                files_referenced: data.files_referenced || [],
                commands_suggested: data.commands_suggested || []
            });

            // Handle command suggestions
            if (data.commands_suggested && data.commands_suggested.length > 0) {
                this.showCommandSuggestions(data.commands_suggested);
            }

        } catch (error) {
            console.error('Error in enhanced chat:', error);
            webviewView.webview.postMessage({ 
                type: 'error', 
                error: 'Failed to get response from GemmaPilot backend. Please check the connection.' 
            });
        }
    }

    private async handleFileAttachment(webviewView: WebviewView): Promise<void> {
        try {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectMany: false,
                openLabel: 'Attach File',
                filters: {
                    'Code Files': ['js', 'ts', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb'],
                    'Text Files': ['txt', 'md', 'json', 'yaml', 'yml', 'xml', 'html', 'css'],
                    'All Files': ['*']
                }
            });

            if (fileUri && fileUri[0]) {
                const filePath = fileUri[0].fsPath;
                const fileName = path.basename(filePath);
                
                // Check file size
                const stats = await vscode.workspace.fs.stat(fileUri[0]);
                if (stats.size > CONFIG.maxFileSize) {
                    vscode.window.showWarningMessage(`File ${fileName} is too large (max ${CONFIG.maxFileSize / 1024}KB)`);
                    return;
                }

                // Read file content
                const fileContent = await vscode.workspace.fs.readFile(fileUri[0]);
                const content = Buffer.from(fileContent).toString('utf8');

                webviewView.webview.postMessage({
                    type: 'file_attached',
                    fileName: fileName,
                    content: content
                });

                vscode.window.showInformationMessage(`File ${fileName} attached successfully`);
            }
        } catch (error) {
            console.error('Error attaching file:', error);
            vscode.window.showErrorMessage('Failed to attach file');
        }
    }

    private async handleFileAnalysis(webviewView: WebviewView, filePath?: string): Promise<void> {
        try {
            const targetFile = filePath || vscode.window.activeTextEditor?.document.fileName;
            
            if (!targetFile) {
                vscode.window.showWarningMessage('No file to analyze. Please open a file first.');
                return;
            }

            const analysisType = await vscode.window.showQuickPick([
                { label: 'Overview', value: 'overview', description: 'General analysis of the file' },
                { label: 'Issues', value: 'issues', description: 'Find potential problems and bugs' },
                { label: 'Suggestions', value: 'suggestions', description: 'Improvement recommendations' },
                { label: 'Dependencies', value: 'dependencies', description: 'Analyze imports and dependencies' }
            ], {
                placeHolder: 'Select analysis type'
            });

            if (!analysisType) return;

            webviewView.webview.postMessage({
                type: 'progress',
                message: 'Analyzing file...'
            });

            const response = await makeRequest(`${CONFIG.backendUrl}/analyze_file`, {
                method: 'POST',
                body: JSON.stringify({
                    file_path: targetFile,
                    workspace_path: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
                    analysis_type: analysisType.value
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Analysis failed: ${response.status}`);
            }

            const data = await response.json();
            
            webviewView.webview.postMessage({
                type: 'response',
                content: `📁 **File Analysis: ${data.file_name}**\n\n${data.analysis}`,
                formatted_content: data.formatted_analysis
            });

        } catch (error) {
            console.error('Error analyzing file:', error);
            webviewView.webview.postMessage({
                type: 'error',
                error: 'Failed to analyze file'
            });
        }
    }

    private async handleCommandExecution(webviewView: WebviewView, command: string): Promise<void> {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showWarningMessage('No workspace folder found');
                return;
            }

            // Show confirmation dialog
            const confirmation = await vscode.window.showWarningMessage(
                `Execute command: ${command}?`,
                { modal: true },
                'Execute',
                'Cancel'
            );

            if (confirmation !== 'Execute') {
                return;
            }

            webviewView.webview.postMessage({
                type: 'progress',
                message: 'Executing command...'
            });

            const response = await makeRequest(`${CONFIG.backendUrl}/execute_command`, {
                method: 'POST',
                body: JSON.stringify({
                    command: command,
                    workspace_path: workspaceFolder.uri.fsPath,
                    explanation: `Executed from GemmaPilot: ${command}`
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Command execution failed: ${response.status}`);
            }

            const data = await response.json();
            
            let resultMessage = `**Command:** \`${command}\`\n\n`;
            if (data.success) {
                resultMessage += `✅ **Success** (exit code: ${data.exit_code})\n\n`;
                if (data.stdout) {
                    resultMessage += `**Output:**\n\`\`\`\n${data.stdout}\n\`\`\`\n\n`;
                }
            } else {
                resultMessage += `❌ **Failed** (exit code: ${data.exit_code})\n\n`;
                if (data.stderr) {
                    resultMessage += `**Error:**\n\`\`\`\n${data.stderr}\n\`\`\`\n\n`;
                }
            }

            webviewView.webview.postMessage({
                type: 'response',
                content: resultMessage
            });

        } catch (error) {
            console.error('Error executing command:', error);
            webviewView.webview.postMessage({
                type: 'error',
                error: 'Failed to execute command'
            });
        }
    }

    private async showCommandSuggestions(commands: string[]): Promise<void> {
        if (commands.length === 0) return;

        const selection = await vscode.window.showInformationMessage(
            'GemmaPilot suggests running some commands. Would you like to see them?',
            'Show Commands',
            'Dismiss'
        );

        if (selection === 'Show Commands') {
            const commandToRun = await vscode.window.showQuickPick(
                commands.map(cmd => ({
                    label: cmd,
                    description: 'Click to execute this command'
                })),
                {
                    placeHolder: 'Select a command to execute'
                }
            );

            if (commandToRun) {
                vscode.commands.executeCommand('gemmapilot.executeCommand', commandToRun.label);
            }
        }
    }

    private getWebviewContent(): string {
        console.log('🎨 Generating enhanced webview HTML content');
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GemmaPilot Assistant</title>
                <style>
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }
                    
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        padding: 0;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .header {
                        background: var(--vscode-titleBar-activeBackground);
                        padding: 12px 16px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        flex-shrink: 0;
                    }
                    
                    .header-icon {
                        width: 20px;
                        height: 20px;
                        background: var(--vscode-button-background);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: var(--vscode-button-foreground);
                        font-weight: bold;
                    }
                    
                    .header-title {
                        font-weight: 600;
                        font-size: 14px;
                    }
                    
                    .status-indicator {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: #28a745;
                        margin-left: auto;
                    }
                    
                    .chat-container {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }
                    
                    .toolbar {
                        padding: 8px 16px;
                        background: var(--vscode-sideBar-background);
                        border-bottom: 1px solid var(--vscode-panel-border);
                        display: flex;
                        gap: 8px;
                        flex-wrap: wrap;
                    }
                    
                    .toolbar-btn {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                        border: none;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 11px;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    }
                    
                    .toolbar-btn:hover {
                        background: var(--vscode-button-secondaryHoverBackground);
                    }
                    
                    .toolbar-btn.active {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }
                    
                    .chat-messages {
                        flex: 1;
                        overflow-y: auto;
                        padding: 16px;
                        scroll-behavior: smooth;
                    }
                    
                    .message {
                        margin-bottom: 16px;
                        animation: fadeIn 0.3s ease-in;
                    }
                    
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    .message-user {
                        text-align: right;
                    }
                    
                    .message-content {
                        display: inline-block;
                        max-width: 80%;
                        padding: 12px 16px;
                        border-radius: 16px;
                        word-wrap: break-word;
                        position: relative;
                    }
                    
                    .message-user .message-content {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border-bottom-right-radius: 4px;
                    }
                    
                    .message-assistant .message-content {
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-bottom-left-radius: 4px;
                        text-align: left;
                    }
                    
                    .message-label {
                        font-size: 11px;
                        opacity: 0.7;
                        margin-bottom: 4px;
                        font-weight: 500;
                    }
                    
                    .code-block {
                        background: var(--vscode-textCodeBlock-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        padding: 12px;
                        margin: 8px 0;
                        font-family: 'Monaco', 'Consolas', monospace;
                        font-size: 13px;
                        overflow-x: auto;
                    }
                    
                    .code-block pre {
                        margin: 0;
                        white-space: pre-wrap;
                    }
                    
                    .inline-code {
                        background: var(--vscode-textCodeBlock-background);
                        padding: 2px 4px;
                        border-radius: 3px;
                        font-family: 'Monaco', 'Consolas', monospace;
                        font-size: 12px;
                    }
                    
                    .suggestions {
                        margin-top: 8px;
                        padding: 8px;
                        background: var(--vscode-notificationsInfoIcon-foreground);
                        background-opacity: 0.1;
                        border-radius: 6px;
                        border-left: 3px solid var(--vscode-notificationsInfoIcon-foreground);
                    }
                    
                    .suggestion-item {
                        font-size: 12px;
                        padding: 2px 0;
                        cursor: pointer;
                        opacity: 0.8;
                    }
                    
                    .suggestion-item:hover {
                        opacity: 1;
                        text-decoration: underline;
                    }
                    
                    .input-area {
                        padding: 16px;
                        background: var(--vscode-sideBar-background);
                        border-top: 1px solid var(--vscode-panel-border);
                        flex-shrink: 0;
                    }
                    
                    .input-container {
                        position: relative;
                        display: flex;
                        align-items: flex-end;
                        gap: 8px;
                    }
                    
                    .chat-input {
                        flex: 1;
                        min-height: 36px;
                        max-height: 120px;
                        padding: 8px 40px 8px 12px;
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 18px;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        font-family: inherit;
                        font-size: 14px;
                        resize: none;
                        outline: none;
                        transition: border-color 0.2s;
                    }
                    
                    .chat-input:focus {
                        border-color: var(--vscode-focusBorder);
                    }
                    
                    .chat-input::placeholder {
                        color: var(--vscode-input-placeholderForeground);
                    }
                    
                    .send-btn {
                        position: absolute;
                        right: 8px;
                        bottom: 8px;
                        width: 28px;
                        height: 28px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: background-color 0.2s;
                    }
                    
                    .send-btn:hover:not(:disabled) {
                        background: var(--vscode-button-hoverBackground);
                    }
                    
                    .send-btn:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                    
                    .action-buttons {
                        display: flex;
                        gap: 8px;
                        flex-direction: column;
                    }
                    
                    .action-btn {
                        width: 32px;
                        height: 32px;
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: background-color 0.2s;
                        font-size: 16px;
                    }
                    
                    .action-btn:hover {
                        background: var(--vscode-button-secondaryHoverBackground);
                    }
                    
                    .typing-indicator {
                        display: none;
                        padding: 8px 16px;
                        color: var(--vscode-descriptionForeground);
                        font-style: italic;
                        font-size: 13px;
                    }
                    
                    .typing-indicator.show {
                        display: block;
                    }
                    
                    .attached-files {
                        margin-bottom: 8px;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 4px;
                    }
                    
                    .file-chip {
                        background: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 11px;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }
                    
                    .file-chip-remove {
                        cursor: pointer;
                        font-weight: bold;
                    }
                    
                    .welcome-message {
                        text-align: center;
                        padding: 40px 20px;
                        color: var(--vscode-descriptionForeground);
                    }
                    
                    .welcome-icon {
                        font-size: 48px;
                        margin-bottom: 16px;
                    }
                    
                    .welcome-title {
                        font-size: 18px;
                        font-weight: 600;
                        margin-bottom: 8px;
                        color: var(--vscode-foreground);
                    }
                    
                    .feature-list {
                        list-style: none;
                        padding: 0;
                        margin: 16px 0;
                        text-align: left;
                        max-width: 300px;
                        margin-left: auto;
                        margin-right: auto;
                    }
                    
                    .feature-list li {
                        padding: 4px 0;
                        font-size: 13px;
                    }
                    
                    .feature-list li:before {
                        content: "✨ ";
                        color: var(--vscode-button-background);
                    }
                    
                    .error-message {
                        background: var(--vscode-inputValidation-errorBackground);
                        border: 1px solid var(--vscode-inputValidation-errorBorder);
                        color: var(--vscode-inputValidation-errorForeground);
                        padding: 8px 12px;
                        border-radius: 6px;
                        margin: 8px 0;
                        font-size: 13px;
                    }
                    
                    .progress-bar {
                        width: 100%;
                        height: 2px;
                        background: var(--vscode-progressBar-background);
                        border-radius: 1px;
                        overflow: hidden;
                        margin: 8px 0;
                    }
                    
                    .progress-fill {
                        height: 100%;
                        background: var(--vscode-button-background);
                        transition: width 0.3s ease;
                        width: 0%;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-icon">GP</div>
                    <div class="header-title">GemmaPilot Assistant</div>
                    <div class="status-indicator" id="status-indicator"></div>
                </div>
                
                <div class="chat-container">
                    <div class="toolbar">
                        <button class="toolbar-btn" id="analyze-file-btn" title="Analyze Current File">🔍 Analyze File</button>
                        <button class="toolbar-btn" id="attach-file-btn" title="Attach File">📎 Attach</button>
                        <button class="toolbar-btn" id="current-selection-btn" title="Use Current Selection">✂️ Selection</button>
                        <button class="toolbar-btn" id="workspace-context-btn" title="Include Workspace Context">📁 Workspace</button>
                        <button class="toolbar-btn" id="clear-chat-btn" title="Clear Chat">🗑️ Clear</button>
                    </div>
                    
                    <div class="chat-messages" id="chat-messages">
                        <div class="welcome-message">
                            <div class="welcome-icon">🤖</div>
                            <div class="welcome-title">Welcome to GemmaPilot!</div>
                            <p>Your AI coding assistant with advanced capabilities:</p>
                            <ul class="feature-list">
                                <li>Analyze and review your code</li>
                                <li>Access workspace files and context</li>
                                <li>Execute commands with your permission</li>
                                <li>Provide intelligent suggestions</li>
                                <li>Attach files for analysis</li>
                            </ul>
                            <p>Type a message below to get started!</p>
                        </div>
                    </div>
                    
                    <div class="typing-indicator" id="typing-indicator">
                        GemmaPilot is thinking...
                    </div>
                </div>
                
                <div class="input-area">
                    <div class="attached-files" id="attached-files"></div>
                    <div class="input-container">
                        <textarea 
                            id="chat-input" 
                            class="chat-input" 
                            placeholder="Ask GemmaPilot anything about your code..." 
                            rows="1"
                        ></textarea>
                        <button class="send-btn" id="send-btn" title="Send message">
                            →
                        </button>
                        <div class="action-buttons">
                            <button class="action-btn" id="voice-btn" title="Voice input (coming soon)">🎤</button>
                        </div>
                    </div>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // DOM elements
                    const chatMessages = document.getElementById('chat-messages');
                    const chatInput = document.getElementById('chat-input');
                    const sendBtn = document.getElementById('send-btn');
                    const typingIndicator = document.getElementById('typing-indicator');
                    const attachedFilesContainer = document.getElementById('attached-files');
                    const statusIndicator = document.getElementById('status-indicator');
                    
                    // State
                    let attachedFiles = [];
                    let isTyping = false;
                    let includeWorkspace = false;
                    let includeSelection = false;
                    
                    // Initialize
                    console.log('🚀 GemmaPilot Enhanced UI loaded');
                    updateSendButton();
                    autoResizeTextarea();
                    
                    // Event listeners
                    chatInput.addEventListener('input', function() {
                        autoResizeTextarea();
                        updateSendButton();
                    });
                    
                    chatInput.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    });
                    
                    sendBtn.addEventListener('click', sendMessage);
                    
                    // Toolbar buttons
                    document.getElementById('analyze-file-btn').addEventListener('click', () => {
                        vscode.postMessage({ type: 'chat', prompt: 'Please analyze the current file for issues, improvements, and provide an overview.' });
                    });
                    
                    document.getElementById('attach-file-btn').addEventListener('click', () => {
                        vscode.postMessage({ type: 'attach_file' });
                    });
                    
                    document.getElementById('current-selection-btn').addEventListener('click', () => {
                        includeSelection = !includeSelection;
                        document.getElementById('current-selection-btn').classList.toggle('active', includeSelection);
                    });
                    
                    document.getElementById('workspace-context-btn').addEventListener('click', () => {
                        includeWorkspace = !includeWorkspace;
                        document.getElementById('workspace-context-btn').classList.toggle('active', includeWorkspace);
                    });
                    
                    document.getElementById('clear-chat-btn').addEventListener('click', () => {
                        clearChat();
                    });
                    
                    // Functions
                    function sendMessage() {
                        const message = chatInput.value.trim();
                        if (!message || isTyping) return;
                        
                        // Add user message to chat
                        addMessage(message, true);
                        
                        // Show typing indicator
                        showTyping(true);
                        
                        // Send to extension
                        vscode.postMessage({
                            type: 'chat',
                            prompt: message,
                            includeWorkspace: includeWorkspace,
                            includeSelection: includeSelection,
                            attachedFiles: attachedFiles
                        });
                        
                        // Clear input
                        chatInput.value = '';
                        autoResizeTextarea();
                        updateSendButton();
                    }
                    
                    function addMessage(content, isUser = false, formatted = false) {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = \`message \${isUser ? 'message-user' : 'message-assistant'}\`;
                        
                        const label = document.createElement('div');
                        label.className = 'message-label';
                        label.textContent = isUser ? 'You' : 'GemmaPilot';
                        
                        const contentDiv = document.createElement('div');
                        contentDiv.className = 'message-content';
                        
                        if (formatted && !isUser) {
                            contentDiv.innerHTML = formatMessage(content);
                        } else {
                            contentDiv.textContent = content;
                        }
                        
                        messageDiv.appendChild(label);
                        messageDiv.appendChild(contentDiv);
                        
                        // Remove welcome message if it exists
                        const welcomeMessage = chatMessages.querySelector('.welcome-message');
                        if (welcomeMessage) {
                            welcomeMessage.remove();
                        }
                        
                        chatMessages.appendChild(messageDiv);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                    
                    function formatMessage(content) {
                        // Format code blocks
                        content = content.replace(/\`\`\`([\\w]*)\n([\\s\\S]*?)\`\`\`/g, 
                            '<div class="code-block"><pre><code>$2</code></pre></div>');
                        
                        // Format inline code
                        content = content.replace(/\`([^\`]+)\`/g, '<span class="inline-code">$1</span>');
                        
                        // Format bold
                        content = content.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
                        
                        // Format italic
                        content = content.replace(/\\*([^*]+)\\*/g, '<em>$1</em>');
                        
                        // Format line breaks
                        content = content.replace(/\n/g, '<br>');
                        
                        return content;
                    }
                    
                    function showTyping(show) {
                        isTyping = show;
                        typingIndicator.classList.toggle('show', show);
                        updateSendButton();
                        
                        if (show) {
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }
                    }
                    
                    function updateSendButton() {
                        const hasText = chatInput.value.trim().length > 0;
                        sendBtn.disabled = !hasText || isTyping;
                    }
                    
                    function autoResizeTextarea() {
                        chatInput.style.height = 'auto';
                        const newHeight = Math.min(chatInput.scrollHeight, 120);
                        chatInput.style.height = newHeight + 'px';
                    }
                    
                    function addFileChip(fileName) {
                        const chip = document.createElement('div');
                        chip.className = 'file-chip';
                        chip.innerHTML = \`
                            <span>📎 \${fileName}</span>
                            <span class="file-chip-remove" onclick="removeFile('\${fileName}')">×</span>
                        \`;
                        attachedFilesContainer.appendChild(chip);
                    }
                    
                    function removeFile(fileName) {
                        attachedFiles = attachedFiles.filter(f => f.name !== fileName);
                        updateAttachedFilesUI();
                    }
                    
                    function updateAttachedFilesUI() {
                        attachedFilesContainer.innerHTML = '';
                        attachedFiles.forEach(file => addFileChip(file.name));
                    }
                    
                    function clearChat() {
                        chatMessages.innerHTML = \`
                            <div class="welcome-message">
                                <div class="welcome-icon">🤖</div>
                                <div class="welcome-title">Chat Cleared</div>
                                <p>Ready for a new conversation!</p>
                            </div>
                        \`;
                    }
                    
                    function showError(message) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'error-message';
                        errorDiv.textContent = message;
                        chatMessages.appendChild(errorDiv);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                    
                    // Message handling
                    window.addEventListener('message', event => {
                        const message = event.data;
                        console.log('📥 Received message:', message);
                        
                        switch (message.type) {
                            case 'response':
                                showTyping(false);
                                addMessage(message.content, false, true);
                                
                                // Add suggestions if available
                                if (message.suggestions && message.suggestions.length > 0) {
                                    addSuggestions(message.suggestions);
                                }
                                break;
                                
                            case 'error':
                                showTyping(false);
                                showError(message.error);
                                break;
                                
                            case 'file_attached':
                                attachedFiles.push({
                                    name: message.fileName,
                                    content: message.content
                                });
                                updateAttachedFilesUI();
                                break;
                                
                            case 'progress':
                                // Handle progress updates
                                break;
                                
                            default:
                                console.log('Unknown message type:', message.type);
                        }
                    });
                    
                    function addSuggestions(suggestions) {
                        const suggestionsDiv = document.createElement('div');
                        suggestionsDiv.className = 'suggestions';
                        suggestionsDiv.innerHTML = '<strong>💡 Suggestions:</strong>';
                        
                        suggestions.forEach(suggestion => {
                            const item = document.createElement('div');
                            item.className = 'suggestion-item';
                            item.textContent = suggestion;
                            item.onclick = () => {
                                chatInput.value = suggestion;
                                autoResizeTextarea();
                                updateSendButton();
                            };
                            suggestionsDiv.appendChild(item);
                        });
                        
                        chatMessages.appendChild(suggestionsDiv);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                    
                    // Global function for removing files (called from onclick)
                    window.removeFile = removeFile;
                </script>
            </body>
            </html>
        `;
    }
}

export function activate(context: vscode.ExtensionContext): void {
    console.log('🚀 GemmaPilot extension is now active!');
    vscode.window.showInformationMessage('GemmaPilot extension activated!');

    // Initialize status bar
    const statusBar = new StatusBarManager();
    statusBar.initialize();
    context.subscriptions.push(statusBar);

    // Register chat provider
    console.log('📝 Registering GemmaPilot chat provider...');
    const chatProvider = new GemmaPilotChatProvider(context);
    const chatDisposable = vscode.window.registerWebviewViewProvider('gemmapilot.chat', chatProvider);
    context.subscriptions.push(chatDisposable);
    console.log('✅ GemmaPilot chat provider registered successfully');

    // Register code completion provider with improved error handling
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            CONFIG.supportedLanguages,
            {
                async provideCompletionItems(
                    document: vscode.TextDocument, 
                    position: vscode.Position
                ): Promise<vscode.CompletionItem[]> {
                    try {
                        const lineText = document.lineAt(position.line).text;
                        const context = document.getText();
                        
                        // Only trigger completion for meaningful content
                        if (!lineText.trim() || lineText.length < 2) {
                            return [];
                        }

                        const response = await makeRequest(`${CONFIG.backendUrl}/complete`, {
                            method: 'POST',
                            body: JSON.stringify({ 
                                prompt: lineText, 
                                context: context,
                                language: document.languageId 
                            }),
                            headers: { 'Content-Type': 'application/json' }
                        });

                        if (!response.ok) {
                            console.error(`Completion request failed: ${response.status}`);
                            return [];
                        }

                        const data = await response.json() as CompletionResponse;
                        
                        if (!data.completion?.trim()) {
                            return [];
                        }

                        const completion = new vscode.CompletionItem(
                            data.completion,
                            vscode.CompletionItemKind.Snippet
                        );
                        completion.detail = 'GemmaPilot AI Suggestion';
                        completion.documentation = 'AI-generated code completion';
                        completion.sortText = '0'; // High priority
                        
                        return [completion];
                    } catch (error) {
                        console.error('Error in completion provider:', error);
                        return [];
                    }
                }
            },
            '.', ' ', '\n' // Trigger characters
        )
    );

    // Register command execution with improved safety
    context.subscriptions.push(
        vscode.commands.registerCommand('gemmapilot.executeCommand', async () => {
            try {
                const command = await vscode.window.showInputBox({ 
                    prompt: 'Enter command suggested by GemmaPilot',
                    placeHolder: 'e.g., npm install, git status',
                    validateInput: (value) => {
                        if (!value?.trim()) {
                            return 'Command cannot be empty';
                        }
                        // Basic validation to prevent dangerous commands
                        if (Utils.isDangerousCommand(value.toLowerCase())) {
                            return 'This command appears potentially dangerous';
                        }
                        return null;
                    }
                });

                if (!command?.trim()) {
                    return;
                }

                const confirmation = await vscode.window.showWarningMessage(
                    `Execute command: ${command}?`,
                    { modal: true },
                    'Execute',
                    'Cancel'
                );

                if (confirmation === 'Execute') {
                    const terminal = vscode.window.createTerminal({
                        name: 'GemmaPilot',
                        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
                    });
                    terminal.sendText(command);
                    terminal.show();
                }
            } catch (error) {
                console.error('Error in execute command:', error);
                vscode.window.showErrorMessage('Failed to execute command');
            }
        })
    );

    // Register additional helpful commands
    context.subscriptions.push(
        vscode.commands.registerCommand('gemmapilot.openChat', () => {
            console.log('🔍 Opening GemmaPilot chat view...');
            vscode.commands.executeCommand('workbench.view.extension.gemmapilot');
        })
    );

    // Debug command to test webview creation
    context.subscriptions.push(
        vscode.commands.registerCommand('gemmapilot.debug', () => {
            console.log('🐛 Debug command triggered');
            vscode.window.showInformationMessage('GemmaPilot debug: Extension is active and commands are working!');
        })
    );
}

export function deactivate() {}

