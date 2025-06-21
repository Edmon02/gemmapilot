import * as vscode from 'vscode';
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
        
        webviewView.webview.onDidReceiveMessage(async (message: ChatMessage) => {
            try {
                if (message.type === 'chat' && message.prompt?.trim()) {
                    await this.handleChatMessage(webviewView, message.prompt);
                }
            } catch (error) {
                console.error('Error handling chat message:', error);
                webviewView.webview.postMessage({ 
                    type: 'response', 
                    content: 'Sorry, there was an error processing your request.' 
                });
            }
        });

        // Show a welcome message
        webviewView.show?.(true);
    }

    private async handleChatMessage(webviewView: WebviewView, prompt: string): Promise<void> {
        try {
            const response = await makeRequest(`${CONFIG.backendUrl}/chat`, {
                method: 'POST',
                body: JSON.stringify({ prompt: prompt.trim() }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json() as ChatResponse;
            webviewView.webview.postMessage({ 
                type: 'response', 
                content: Utils.sanitizeHtml(data.response) 
            });
        } catch (error) {
            console.error('Error fetching chat response:', error);
            webviewView.webview.postMessage({ 
                type: 'response', 
                content: 'Failed to get response from GemmaPilot backend.' 
            });
        }
    }

    private getWebviewContent(): string {
        console.log('🎨 Generating webview HTML content');
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GemmaPilot Chat</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 20px; 
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                    }
                    #status { margin-bottom: 20px; color: green; }
                    #chat-input { 
                        width: 100%; 
                        padding: 10px; 
                        margin-bottom: 10px;
                        border: 1px solid var(--vscode-input-border);
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                    }
                    #chat-output { 
                        border: 1px solid var(--vscode-input-border);
                        padding: 10px;
                        min-height: 200px;
                        background-color: var(--vscode-editor-background);
                    }
                    .message { margin-bottom: 10px; }
                </style>
            </head>
            <body>
                <div id="status">✅ GemmaPilot Chat is working!</div>
                <input id="chat-input" type="text" placeholder="Type your message here..." />
                <div id="chat-output">
                    <div class="message">Welcome to GemmaPilot! Type a message above and press Enter.</div>
                </div>
                
                <script>
                    console.log('🚀 GemmaPilot webview script loaded');
                    const vscode = acquireVsCodeApi();
                    const input = document.getElementById('chat-input');
                    const output = document.getElementById('chat-output');
                    
                    function addMessage(text, isUser = false) {
                        const div = document.createElement('div');
                        div.className = 'message';
                        div.textContent = (isUser ? 'You: ' : 'GemmaPilot: ') + text;
                        output.appendChild(div);
                        output.scrollTop = output.scrollHeight;
                    }
                    
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter' && input.value.trim()) {
                            console.log('📤 Sending message:', input.value);
                            addMessage(input.value, true);
                            vscode.postMessage({ type: 'chat', prompt: input.value });
                            input.value = '';
                        }
                    });
                    
                    window.addEventListener('message', (event) => {
                        console.log('📥 Received message:', event.data);
                        const message = event.data;
                        if (message.type === 'response') {
                            addMessage(message.content);
                        }
                    });
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

