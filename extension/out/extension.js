"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const config_1 = require("./config");
const statusBar_1 = require("./statusBar");
// Simple HTTP client to replace fetch
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname,
            method: options.method || 'GET',
            headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers)
        };
        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, json: () => Promise.resolve(jsonData), status: res.statusCode });
                }
                catch (e) {
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
class GemmaPilotChatProvider {
    resolveWebviewView(webviewView) {
        console.log('🔧 GemmaPilotChatProvider.resolveWebviewView called');
        console.log('📋 WebviewView object:', webviewView);
        vscode.window.showInformationMessage('GemmaPilot: WebView is being resolved!');
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: []
        };
        console.log('🎨 Setting webview HTML content');
        webviewView.webview.html = this.getWebviewContent();
        console.log('✅ WebView HTML content set');
        webviewView.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (message.type === 'chat' && ((_a = message.prompt) === null || _a === void 0 ? void 0 : _a.trim())) {
                    yield this.handleChatMessage(webviewView, message.prompt);
                }
            }
            catch (error) {
                console.error('Error handling chat message:', error);
                webviewView.webview.postMessage({
                    type: 'response',
                    content: 'Sorry, there was an error processing your request.'
                });
            }
        }));
    }
    handleChatMessage(webviewView, prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield makeRequest(`${config_1.CONFIG.backendUrl}/chat`, {
                    method: 'POST',
                    body: JSON.stringify({ prompt: prompt.trim() }),
                    headers: { 'Content-Type': 'application/json' }
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = yield response.json();
                webviewView.webview.postMessage({
                    type: 'response',
                    content: config_1.Utils.sanitizeHtml(data.response)
                });
            }
            catch (error) {
                console.error('Error fetching chat response:', error);
                webviewView.webview.postMessage({
                    type: 'response',
                    content: 'Failed to get response from GemmaPilot backend.'
                });
            }
        });
    }
    getWebviewContent() {
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
function activate(context) {
    console.log('🚀 GemmaPilot extension is now active!');
    vscode.window.showInformationMessage('GemmaPilot extension activated!');
    // Initialize status bar
    const statusBar = new statusBar_1.StatusBarManager();
    statusBar.initialize();
    context.subscriptions.push(statusBar);
    // Register chat provider
    console.log('📝 Registering GemmaPilot chat provider...');
    const chatProvider = new GemmaPilotChatProvider();
    const chatDisposable = vscode.window.registerWebviewViewProvider('gemmapilot.chat', chatProvider);
    context.subscriptions.push(chatDisposable);
    console.log('✅ GemmaPilot chat provider registered successfully');
    // Register code completion provider with improved error handling
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(config_1.CONFIG.supportedLanguages, {
        provideCompletionItems(document, position) {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const lineText = document.lineAt(position.line).text;
                    const context = document.getText();
                    // Only trigger completion for meaningful content
                    if (!lineText.trim() || lineText.length < 2) {
                        return [];
                    }
                    const response = yield makeRequest(`${config_1.CONFIG.backendUrl}/complete`, {
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
                    const data = yield response.json();
                    if (!((_a = data.completion) === null || _a === void 0 ? void 0 : _a.trim())) {
                        return [];
                    }
                    const completion = new vscode.CompletionItem(data.completion, vscode.CompletionItemKind.Snippet);
                    completion.detail = 'GemmaPilot AI Suggestion';
                    completion.documentation = 'AI-generated code completion';
                    completion.sortText = '0'; // High priority
                    return [completion];
                }
                catch (error) {
                    console.error('Error in completion provider:', error);
                    return [];
                }
            });
        }
    }, '.', ' ', '\n' // Trigger characters
    ));
    // Register command execution with improved safety
    context.subscriptions.push(vscode.commands.registerCommand('gemmapilot.executeCommand', () => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const command = yield vscode.window.showInputBox({
                prompt: 'Enter command suggested by GemmaPilot',
                placeHolder: 'e.g., npm install, git status',
                validateInput: (value) => {
                    if (!(value === null || value === void 0 ? void 0 : value.trim())) {
                        return 'Command cannot be empty';
                    }
                    // Basic validation to prevent dangerous commands
                    if (config_1.Utils.isDangerousCommand(value.toLowerCase())) {
                        return 'This command appears potentially dangerous';
                    }
                    return null;
                }
            });
            if (!(command === null || command === void 0 ? void 0 : command.trim())) {
                return;
            }
            const confirmation = yield vscode.window.showWarningMessage(`Execute command: ${command}?`, { modal: true }, 'Execute', 'Cancel');
            if (confirmation === 'Execute') {
                const terminal = vscode.window.createTerminal({
                    name: 'GemmaPilot',
                    cwd: (_b = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.uri.fsPath
                });
                terminal.sendText(command);
                terminal.show();
            }
        }
        catch (error) {
            console.error('Error in execute command:', error);
            vscode.window.showErrorMessage('Failed to execute command');
        }
    })));
    // Register additional helpful commands
    context.subscriptions.push(vscode.commands.registerCommand('gemmapilot.openChat', () => {
        console.log('🔍 Opening GemmaPilot chat view...');
        vscode.commands.executeCommand('gemmapilot.chat.focus');
    }));
    // Debug command to test webview creation
    context.subscriptions.push(vscode.commands.registerCommand('gemmapilot.debug', () => {
        console.log('🐛 Debug command triggered');
        vscode.window.showInformationMessage('GemmaPilot debug: Extension is active and commands are working!');
    }));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
