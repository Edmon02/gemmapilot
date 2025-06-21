import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { WebviewViewProvider, WebviewView } from 'vscode';
import * as https from 'https';
import * as http from 'http';
import { ChatMessage, ChatResponse, CompletionResponse, WebviewMessage } from './types';
import { CONFIG, Utils } from './config';
import { StatusBarManager } from './statusBar';

// Enhanced HTTP client to replace fetch
function makeRequest(url: string, options: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + (urlObj.search || ''),
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'GemmaPilot-VSCode-Extension',
                ...options.headers
            },
            timeout: options.timeout || CONFIG.timeout
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : {};
                    resolve({ 
                        ok: res.statusCode! >= 200 && res.statusCode! < 300, 
                        json: () => Promise.resolve(jsonData), 
                        status: res.statusCode,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({ 
                        ok: false, 
                        json: () => Promise.resolve({}), 
                        status: res.statusCode,
                        data: {}
                    });
                }
            });
        });

        req.on('error', (error) => {
            console.error('Request error:', error);
            reject(new Error(`Network error: ${error.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

export class GemmaPilotChatProvider implements WebviewViewProvider {
    public static readonly viewType = 'gemmapilot.chat';
    private _view?: WebviewView;

    constructor(private readonly context: vscode.ExtensionContext) {}

    resolveWebviewView(
        webviewView: WebviewView,
        context: vscode.WebviewViewResolveContext<unknown>,
        token: vscode.CancellationToken
    ): void | Thenable<void> {
        this._view = webviewView;
        
        webviewView.webview.options = { 
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };
        
        webviewView.webview.html = this.getWebviewContent();
        
        // Handle messages from the webview
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
                    case 'analyze_file':
                        await this.handleFileAnalysis(webviewView);
                        break;
                    case 'get_selection':
                        await this.handleGetSelection(webviewView);
                        break;
                    case 'get_workspace':
                        await this.handleGetWorkspace(webviewView);
                        break;
                    case 'execute_command':
                        await this.handleCommandExecution(webviewView, message.command);
                        break;
                    case 'inline_completion':
                        await this.handleInlineCompletion(webviewView, message);
                        break;
                    case 'explain_code':
                        await this.handleExplainCode(webviewView);
                        break;
                    case 'fix_code':
                        await this.handleFixCode(webviewView);
                        break;
                    case 'optimize_code':
                        await this.handleOptimizeCode(webviewView);
                        break;
                    case 'generate_tests':
                        await this.handleGenerateTests(webviewView);
                        break;
                    case 'generate_docs':
                        await this.handleGenerateDocs(webviewView);
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
                language: activeEditor?.document.languageId || '',
                files: message.attachedFiles || []
            };

            // Add selection if requested
            if (message.includeSelection && activeEditor?.selection) {
                const selection = activeEditor.document.getText(activeEditor.selection);
                if (selection) {
                    requestData.selection = selection;
                    requestData.context = this.getContextAroundSelection(activeEditor);
                }
            } else if (activeEditor) {
                // Always include some context from the current file
                requestData.context = this.getFileContext(activeEditor);
            }

            // Add workspace context if requested
            if (message.includeWorkspace && workspaceFolder) {
                requestData.workspace_files = await this.getWorkspaceFiles(workspaceFolder.uri.fsPath);
            }

            console.log('🚀 Sending chat request to backend');

            const response = await makeRequest(`${CONFIG.backendUrl}/chat`, {
                method: 'POST',
                body: JSON.stringify(requestData),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = response.data || {};
            
            webviewView.webview.postMessage({ 
                type: 'response', 
                content: data.response || data.content || 'I received your message but couldn\'t generate a response.',
                suggestions: data.suggestions || [],
                commands: data.commands || [],
                code_blocks: data.code_blocks || []
            });

            // Check if the AI response contains file creation or command suggestions
            const aiResponse = data.response || data.content || '';
            await this.parseAndHandleAIActions(webviewView, aiResponse);

        } catch (error) {
            console.error('Error in chat message:', error);
            webviewView.webview.postMessage({ 
                type: 'error', 
                error: 'I\'m having trouble connecting to the backend. Please make sure the GemmaPilot server is running.' 
            });
        }
    }

    private async handleFileAttachment(webviewView: WebviewView): Promise<void> {
        try {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectMany: false,
                openLabel: 'Attach File',
                filters: {
                    'All Files': ['*']
                }
            });

            if (fileUri && fileUri[0]) {
                const filePath = fileUri[0].fsPath;
                const fileName = path.basename(filePath);
                
                // Check file size
                const stats = fs.statSync(filePath);
                if (stats.size > CONFIG.maxFileSize) {
                    webviewView.webview.postMessage({
                        type: 'error',
                        error: `File ${fileName} is too large. Maximum size is ${CONFIG.maxFileSize / 1024 / 1024}MB.`
                    });
                    return;
                }

                const content = fs.readFileSync(filePath, 'utf8');
                webviewView.webview.postMessage({
                    type: 'file_attached',
                    fileName: fileName,
                    content: content
                });

                vscode.window.showInformationMessage(`File ${fileName} attached successfully`);
            }
        } catch (error) {
            console.error('Error attaching file:', error);
            webviewView.webview.postMessage({
                type: 'error',
                error: 'Failed to attach file'
            });
        }
    }

    private async handleFileAnalysis(webviewView: WebviewView): Promise<void> {
        try {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                webviewView.webview.postMessage({
                    type: 'error',
                    error: 'No file to analyze. Please open a file first.'
                });
                return;
            }

            const document = activeEditor.document;
            const content = document.getText();
            
            webviewView.webview.postMessage({
                type: 'progress',
                message: 'Analyzing file...'
            });

            const requestData = {
                file_path: document.fileName,
                content: content,
                language: document.languageId,
                analysis_type: 'comprehensive'
            };

            const response = await makeRequest(`${CONFIG.backendUrl}/analyze`, {
                method: 'POST',
                body: JSON.stringify(requestData),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Analysis failed: ${response.status}`);
            }

            const data = response.data || {};
            webviewView.webview.postMessage({
                type: 'response',
                content: `📁 **File Analysis: ${path.basename(document.fileName)}**\n\n${data.analysis || 'Analysis complete'}`,
                suggestions: data.suggestions || [],
                issues: data.issues || []
            });

        } catch (error) {
            console.error('Error analyzing file:', error);
            webviewView.webview.postMessage({
                type: 'error',
                error: 'Failed to analyze file. The backend might be unavailable.'
            });
        }
    }

    private async handleGetSelection(webviewView: WebviewView): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || activeEditor.selection.isEmpty) {
            webviewView.webview.postMessage({
                type: 'selection_result',
                hasSelection: false,
                message: 'No text selected'
            });
            return;
        }

        const selection = activeEditor.document.getText(activeEditor.selection);
        webviewView.webview.postMessage({
            type: 'selection_result',
            hasSelection: true,
            selection: selection,
            language: activeEditor.document.languageId,
            fileName: path.basename(activeEditor.document.fileName)
        });
    }

    private async handleGetWorkspace(webviewView: WebviewView): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            webviewView.webview.postMessage({
                type: 'workspace_result',
                hasWorkspace: false,
                message: 'No workspace folder open'
            });
            return;
        }

        try {
            const files = await this.getWorkspaceFiles(workspaceFolder.uri.fsPath);
            webviewView.webview.postMessage({
                type: 'workspace_result',
                hasWorkspace: true,
                workspaceName: workspaceFolder.name,
                fileCount: files.length,
                files: files.slice(0, 10) // Preview first 10 files
            });
        } catch (error) {
            webviewView.webview.postMessage({
                type: 'workspace_result',
                hasWorkspace: false,
                message: 'Error reading workspace'
            });
        }
    }

    private async handleCommandExecution(webviewView: WebviewView, command?: string): Promise<void> {
        if (!command) return;

        try {
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

                webviewView.webview.postMessage({
                    type: 'response',
                    content: `✅ Executed command: \`${command}\``
                });
            }
        } catch (error) {
            console.error('Error executing command:', error);
            webviewView.webview.postMessage({
                type: 'error',
                error: 'Failed to execute command'
            });
        }
    }

    // GitHub Copilot-like features
    private async handleInlineCompletion(webviewView: WebviewView, message: any): Promise<void> {
        try {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) return;

            const position = activeEditor.selection.active;
            const lineText = activeEditor.document.lineAt(position.line).text;
            const context = this.getFileContext(activeEditor);

            const requestData = {
                prompt: lineText,
                context: context,
                language: activeEditor.document.languageId,
                position: { line: position.line, character: position.character }
            };

            const response = await makeRequest(`${CONFIG.backendUrl}/complete`, {
                method: 'POST',
                body: JSON.stringify(requestData),
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = response.data || {};
                webviewView.webview.postMessage({
                    type: 'inline_completion',
                    completion: data.completion || '',
                    confidence: data.confidence || 0
                });
            }
        } catch (error) {
            console.error('Error in inline completion:', error);
        }
    }

    private async handleExplainCode(webviewView: WebviewView): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            webviewView.webview.postMessage({
                type: 'error',
                error: 'No active editor found'
            });
            return;
        }

        const selection = activeEditor.selection.isEmpty 
            ? activeEditor.document.getText()
            : activeEditor.document.getText(activeEditor.selection);

        await this.sendCodeAnalysisRequest(webviewView, 'explain', selection, activeEditor.document.languageId);
    }

    private async handleFixCode(webviewView: WebviewView): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            webviewView.webview.postMessage({
                type: 'error',
                error: 'No active editor found'
            });
            return;
        }

        const selection = activeEditor.selection.isEmpty 
            ? activeEditor.document.getText()
            : activeEditor.document.getText(activeEditor.selection);

        await this.sendCodeAnalysisRequest(webviewView, 'fix', selection, activeEditor.document.languageId);
    }

    private async handleOptimizeCode(webviewView: WebviewView): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            webviewView.webview.postMessage({
                type: 'error',
                error: 'No active editor found'
            });
            return;
        }

        const selection = activeEditor.selection.isEmpty 
            ? activeEditor.document.getText()
            : activeEditor.document.getText(activeEditor.selection);

        await this.sendCodeAnalysisRequest(webviewView, 'optimize', selection, activeEditor.document.languageId);
    }

    private async handleGenerateTests(webviewView: WebviewView): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            webviewView.webview.postMessage({
                type: 'error',
                error: 'No active editor found'
            });
            return;
        }

        const selection = activeEditor.selection.isEmpty 
            ? activeEditor.document.getText()
            : activeEditor.document.getText(activeEditor.selection);

        await this.sendCodeAnalysisRequest(webviewView, 'generate_tests', selection, activeEditor.document.languageId);
    }

    private async handleGenerateDocs(webviewView: WebviewView): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            webviewView.webview.postMessage({
                type: 'error',
                error: 'No active editor found'
            });
            return;
        }

        const selection = activeEditor.selection.isEmpty 
            ? activeEditor.document.getText()
            : activeEditor.document.getText(activeEditor.selection);

        await this.sendCodeAnalysisRequest(webviewView, 'generate_docs', selection, activeEditor.document.languageId);
    }

    private async sendCodeAnalysisRequest(webviewView: WebviewView, action: string, code: string, language: string): Promise<void> {
        try {
            webviewView.webview.postMessage({
                type: 'progress',
                message: `${action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ')}ing code...`
            });

            const activeEditor = vscode.window.activeTextEditor;
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

            const requestData = {
                action: action,
                code: code,
                language: language,
                file_path: activeEditor?.document.fileName || '',
                workspace_path: workspaceFolder?.uri.fsPath || ''
            };

            const response = await makeRequest(`${CONFIG.backendUrl}/code_action`, {
                method: 'POST',
                body: JSON.stringify(requestData),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Code analysis failed: ${response.status}`);
            }

            const data = response.data || {};
            
            // Handle the response and show it to user
            const content = data.result || data.response || 'Analysis complete';
            webviewView.webview.postMessage({
                type: 'response',
                content: content
            });

            // If there's suggested code, offer to create/apply it
            if (data.suggested_code) {
                await this.handleCodeSuggestion(webviewView, data.suggested_code, action);
            }

            // If there are code blocks, offer to apply them
            if (data.code_blocks && data.code_blocks.length > 0) {
                for (const block of data.code_blocks) {
                    await this.handleCodeSuggestion(webviewView, block.code, action);
                }
            }

            // If there are file operations suggested, handle them
            if (data.file_operations && data.file_operations.length > 0) {
                await this.handleFileOperationSuggestions(webviewView, data.file_operations);
            }

            // If there are commands suggested, handle them
            if (data.commands && data.commands.length > 0) {
                await this.handleCommandSuggestions(webviewView, data.commands);
            }

        } catch (error) {
            console.error(`Error in ${action}:`, error);
            webviewView.webview.postMessage({
                type: 'error',
                error: `Failed to ${action.replace('_', ' ')} code: ${error}`
            });
        }
    }

    private async handleCodeSuggestion(webviewView: WebviewView, suggestedCode: string, action: string): Promise<void> {
        try {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                webviewView.webview.postMessage({
                    type: 'response',
                    content: `Here's the suggested code:\n\n\`\`\`code\n${suggestedCode}\n\`\`\``
                });
                return;
            }

            // Ask user if they want to apply the suggested code
            const choice = await vscode.window.showInformationMessage(
                `Apply the suggested ${action.replace('_', ' ')}?`,
                'Apply to Selection',
                'Create New File',
                'Show Only'
            );

            if (choice === 'Apply to Selection') {
                const edit = new vscode.WorkspaceEdit();
                const selection = activeEditor.selection.isEmpty 
                    ? new vscode.Range(activeEditor.document.positionAt(0), activeEditor.document.positionAt(activeEditor.document.getText().length))
                    : activeEditor.selection;
                    
                edit.replace(activeEditor.document.uri, selection, suggestedCode);
                await vscode.workspace.applyEdit(edit);
                
                webviewView.webview.postMessage({
                    type: 'response',
                    content: '✅ Code applied successfully!'
                });
                
            } else if (choice === 'Create New File') {
                const fileName = await vscode.window.showInputBox({
                    prompt: 'Enter filename for the new file',
                    value: `suggested_${action}.${this.getFileExtension(activeEditor.document.languageId)}`
                });
                
                if (fileName) {
                    await this.createNewFileWithContent(fileName, suggestedCode);
                    webviewView.webview.postMessage({
                        type: 'response',
                        content: `✅ Created new file: ${fileName}`
                    });
                }
                
            } else {
                // Show only
                webviewView.webview.postMessage({
                    type: 'response',
                    content: `Here's the suggested code:\n\n\`\`\`${activeEditor.document.languageId}\n${suggestedCode}\n\`\`\``
                });
            }
            
        } catch (error) {
            console.error('Error handling code suggestion:', error);
            webviewView.webview.postMessage({
                type: 'error',
                error: 'Failed to handle code suggestion'
            });
        }
    }

    private async handleFileOperationSuggestions(webviewView: WebviewView, fileOperations: any[]): Promise<void> {
        try {
            for (const operation of fileOperations) {
                const choice = await vscode.window.showInformationMessage(
                    `${operation.description || 'Perform file operation'}?`,
                    'Yes',
                    'No'
                );
                
                if (choice === 'Yes') {
                    // Handle different types of file operations
                    if (operation.type === 'create_file') {
                        const fileName = await vscode.window.showInputBox({
                            prompt: 'Enter filename',
                            value: operation.filename || 'new_file.txt'
                        });
                        
                        if (fileName) {
                            await this.createNewFileWithContent(fileName, operation.content || '');
                            webviewView.webview.postMessage({
                                type: 'response',
                                content: `✅ Created file: ${fileName}`
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error handling file operations:', error);
            webviewView.webview.postMessage({
                type: 'error',
                error: 'Failed to handle file operations'
            });
        }
    }

    private async handleCommandSuggestions(webviewView: WebviewView, commands: string[]): Promise<void> {
        try {
            for (const command of commands) {
                const choice = await vscode.window.showInformationMessage(
                    `Execute command: ${command}?`,
                    'Execute',
                    'Skip'
                );
                
                if (choice === 'Execute') {
                    const terminal = vscode.window.createTerminal({
                        name: 'Gemma Pilot',
                        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
                    });
                    
                    terminal.sendText(command);
                    terminal.show();
                    
                    webviewView.webview.postMessage({
                        type: 'response',
                        content: `✅ Executed command: ${command}`
                    });
                }
            }
        } catch (error) {
            console.error('Error handling command suggestions:', error);
            webviewView.webview.postMessage({
                type: 'error',
                error: 'Failed to handle command suggestions'
            });
        }
    }

    private async createNewFileWithContent(fileName: string, content: string): Promise<void> {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder open');
            }
            
            const filePath = path.join(workspaceFolder.uri.fsPath, fileName);
            const fileUri = vscode.Uri.file(filePath);
            
            // Create directory if needed
            const dirPath = path.dirname(filePath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            
            // Write file
            fs.writeFileSync(filePath, content, 'utf8');
            
            // Open the file
            const document = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(document);
            
        } catch (error) {
            console.error('Error creating file:', error);
            throw error;
        }
    }

    private getFileExtension(languageId: string): string {
        const extensions: { [key: string]: string } = {
            'typescript': 'ts',
            'javascript': 'js',
            'python': 'py',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'go': 'go',
            'rust': 'rs',
            'php': 'php',
            'ruby': 'rb',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'yaml': 'yml',
            'markdown': 'md'
        };
        
        return extensions[languageId] || 'txt';
    }

    private async parseAndHandleAIActions(webviewView: WebviewView, aiResponse: string): Promise<void> {
        try {
            // Look for file creation suggestions
            const createFileRegex = /(?:create|make|generate)\s+(?:a\s+)?(?:new\s+)?file\s+(?:called\s+|named\s+)?["`']?([^"`'\s]+)["`']?/gi;
            let match;
            
            while ((match = createFileRegex.exec(aiResponse)) !== null) {
                const fileName = match[1];
                
                // Extract code block that might be intended for this file
                const codeBlockRegex = new RegExp(`\`\`\`\\w*\\n([\\s\\S]*?)\\n\`\`\``, 'g');
                const codeMatch = codeBlockRegex.exec(aiResponse);
                const codeContent = codeMatch ? codeMatch[1] : '';
                
                const choice = await vscode.window.showInformationMessage(
                    `Create file "${fileName}"?`,
                    'Create',
                    'Skip'
                );
                
                if (choice === 'Create') {
                    await this.createNewFileWithContent(fileName, codeContent);
                    webviewView.webview.postMessage({
                        type: 'response',
                        content: `✅ Created file: ${fileName}`
                    });
                }
            }
            
            // Look for command execution suggestions
            const commandPatterns = [
                /npm install ([^\s]+)/gi,
                /pip install ([^\s]+)/gi,
                /yarn add ([^\s]+)/gi,
                /cargo add ([^\s]+)/gi,
                /go get ([^\s]+)/gi,
                /mkdir ([^\s]+)/gi,
                /cd ([^\s]+)/gi
            ];
            
            for (const pattern of commandPatterns) {
                let commandMatch;
                while ((commandMatch = pattern.exec(aiResponse)) !== null) {
                    const fullCommand = commandMatch[0];
                    
                    const choice = await vscode.window.showInformationMessage(
                        `Execute command: "${fullCommand}"?`,
                        'Execute',
                        'Skip'
                    );
                    
                    if (choice === 'Execute') {
                        const terminal = vscode.window.createTerminal({
                            name: 'GemmaPilot',
                            cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
                        });
                        
                        terminal.sendText(fullCommand);
                        terminal.show();
                        
                        webviewView.webview.postMessage({
                            type: 'response',
                            content: `✅ Executed: ${fullCommand}`
                        });
                    }
                }
            }
            
            // Look for directory creation suggestions
            const mkdirRegex = /(?:create|make)\s+(?:a\s+)?(?:new\s+)?(?:directory|folder)\s+(?:called\s+|named\s+)?["`']?([^"`'\s]+)["`']?/gi;
            let mkdirMatch;
            
            while ((mkdirMatch = mkdirRegex.exec(aiResponse)) !== null) {
                const dirName = mkdirMatch[1];
                
                const choice = await vscode.window.showInformationMessage(
                    `Create directory "${dirName}"?`,
                    'Create',
                    'Skip'
                );
                
                if (choice === 'Create') {
                    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                    if (workspaceFolder) {
                        const dirPath = path.join(workspaceFolder.uri.fsPath, dirName);
                        fs.mkdirSync(dirPath, { recursive: true });
                        
                        webviewView.webview.postMessage({
                            type: 'response',
                            content: `✅ Created directory: ${dirName}`
                        });
                    }
                }
            }
            
        } catch (error) {
            console.error('Error parsing AI actions:', error);
        }
    }

    // Utility methods
    private getFileContext(editor: vscode.TextEditor): string {
        const document = editor.document;
        const position = editor.selection.active;
        
        // Get context around current position
        const startLine = Math.max(0, position.line - 10);
        const endLine = Math.min(document.lineCount - 1, position.line + 10);
        
        let context = '';
        for (let i = startLine; i <= endLine; i++) {
            context += document.lineAt(i).text + '\n';
        }
        
        return context;
    }

    private getContextAroundSelection(editor: vscode.TextEditor): string {
        const document = editor.document;
        const selection = editor.selection;
        
        // Get 5 lines before and after the selection
        const startLine = Math.max(0, selection.start.line - 5);
        const endLine = Math.min(document.lineCount - 1, selection.end.line + 5);
        
        let context = '';
        for (let i = startLine; i <= endLine; i++) {
            context += document.lineAt(i).text + '\n';
        }
        
        return context;
    }

    private async getWorkspaceFiles(workspacePath: string): Promise<string[]> {
        try {
            const files: string[] = [];
            
            const scanDirectory = (dir: string, depth: number = 0): void => {
                if (depth > 2) return; // Limit depth
                
                try {
                    const items = fs.readdirSync(dir);
                    for (const item of items) {
                        if (item.startsWith('.') || item === 'node_modules' || item === 'dist' || item === 'build') {
                            continue;
                        }
                        
                        const fullPath = path.join(dir, item);
                        const stat = fs.statSync(fullPath);
                        
                        if (stat.isDirectory()) {
                            scanDirectory(fullPath, depth + 1);
                        } else if (stat.isFile() && this.isTextFile(item)) {
                            files.push(fullPath);
                        }
                        
                        if (files.length >= 50) break; // Limit total files
                    }
                } catch (error) {
                    console.error(`Error scanning directory ${dir}:`, error);
                }
            };
            
            scanDirectory(workspacePath);
            return files;
        } catch (error) {
            console.error('Error getting workspace files:', error);
            return [];
        }
    }

    private isTextFile(fileName: string): boolean {
        const textExtensions = [
            '.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rs', 
            '.php', '.rb', '.json', '.yaml', '.yml', '.md', '.html', 
            '.css', '.sql', '.sh', '.vue', '.jsx', '.tsx', '.scss', 
            '.less', '.xml', '.toml', '.ini', '.cfg', '.conf'
        ];
        return textExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    }

    private getWebviewContent(): string {
        const htmlContent = this.getHtmlTemplate();
        const jsContent = this.getJavaScriptContent();
        
        return `${htmlContent}<script>${jsContent}</script></body></html>`;
    }

    private getHtmlTemplate(): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GemmaPilot</title>
                <style>
                    :root {
                        --primary-color: #007acc;
                        --primary-hover: #005a9e;
                        --success-color: #28a745;
                        --warning-color: #ffc107;
                        --danger-color: #dc3545;
                        --info-color: #17a2b8;
                        --border-radius: 6px;
                        --transition: all 0.2s ease;
                    }

                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }
                    
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        font-size: 13px;
                    }
                    
                    /* Header */
                    .header {
                        background: var(--vscode-titleBar-activeBackground);
                        padding: 8px 12px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        flex-shrink: 0;
                    }
                    
                    .header-icon {
                        width: 20px;
                        height: 20px;
                        background: var(--primary-color);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-size: 12px;
                    }
                    
                    .header-title {
                        font-weight: 600;
                        font-size: 14px;
                        flex: 1;
                    }
                    
                    .status-indicator {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: var(--success-color);
                    }
                    
                    /* Quick Actions */
                    .quick-actions {
                        padding: 8px 12px;
                        background: var(--vscode-sideBar-background);
                        border-bottom: 1px solid var(--vscode-panel-border);
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 6px;
                    }
                    
                    .quick-action-btn {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                        border: 1px solid var(--vscode-button-border);
                        padding: 6px 8px;
                        border-radius: var(--border-radius);
                        font-size: 11px;
                        cursor: pointer;
                        transition: var(--transition);
                        text-align: center;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    
                    .quick-action-btn:hover {
                        background: var(--vscode-button-secondaryHoverBackground);
                        transform: translateY(-1px);
                    }

                    .quick-action-btn:active {
                        transform: translateY(0);
                    }

                    .quick-action-btn.active {
                        background: var(--primary-color);
                        color: white;
                        border-color: var(--primary-color);
                    }
                    
                    /* Chat Container */
                    .chat-container {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }
                    
                    /* Messages Area */
                    .messages-area {
                        flex: 1;
                        overflow-y: auto;
                        padding: 12px;
                        scroll-behavior: smooth;
                    }
                    
                    .message {
                        margin-bottom: 16px;
                        animation: fadeIn 0.3s ease;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    .message-header {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 6px;
                        font-size: 12px;
                        font-weight: 600;
                    }
                    
                    .message-avatar {
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 10px;
                        font-weight: bold;
                    }
                    
                    .message-user .message-avatar {
                        background: var(--primary-color);
                        color: white;
                    }
                    
                    .message-assistant .message-avatar {
                        background: var(--success-color);
                        color: white;
                    }
                    
                    .message-content {
                        background: var(--vscode-input-background);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: var(--border-radius);
                        padding: 12px;
                        line-height: 1.5;
                        word-wrap: break-word;
                    }

                    .message-user .message-content {
                        background: var(--vscode-button-secondaryBackground);
                        border-color: var(--primary-color);
                    }
                    
                    /* Code blocks */
                    .code-block {
                        background: var(--vscode-textCodeBlock-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: var(--border-radius);
                        margin: 8px 0;
                        overflow-x: auto;
                    }
                    
                    .code-block pre {
                        padding: 12px;
                        margin: 0;
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        white-space: pre-wrap;
                    }
                    
                    .inline-code {
                        background: var(--vscode-textCodeBlock-background);
                        padding: 2px 4px;
                        border-radius: 3px;
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                    }

                    /* Welcome message */
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
                        color: var(--vscode-editor-foreground);
                    }

                    /* Progress indicator */
                    .progress-indicator {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 12px;
                        background: var(--vscode-input-background);
                        border-radius: var(--border-radius);
                        margin-bottom: 12px;
                        animation: pulse 1.5s ease-in-out infinite;
                    }

                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.7; }
                    }
                    
                    .spinner {
                        width: 16px;
                        height: 16px;
                        border: 2px solid var(--vscode-panel-border);
                        border-top: 2px solid var(--primary-color);
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }

                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    /* Input Area */
                    .input-area {
                        padding: 12px;
                        background: var(--vscode-editor-background);
                        border-top: 1px solid var(--vscode-panel-border);
                        flex-shrink: 0;
                    }
                    
                    .input-container {
                        display: flex;
                        gap: 8px;
                        align-items: flex-end;
                    }
                    
                    .input-wrapper {
                        flex: 1;
                        position: relative;
                    }
                    
                    .chat-input {
                        width: 100%;
                        min-height: 36px;
                        max-height: 120px;
                        padding: 8px 40px 8px 12px;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: var(--border-radius);
                        font-family: inherit;
                        font-size: 13px;
                        line-height: 1.4;
                        resize: none;
                        outline: none;
                        transition: var(--transition);
                    }
                    
                    .chat-input:focus {
                        border-color: var(--primary-color);
                        box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
                    }
                    
                    .chat-input::placeholder {
                        color: var(--vscode-input-placeholderForeground);
                    }
                    
                    .send-btn {
                        position: absolute;
                        right: 4px;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 32px;
                        height: 32px;
                        background: var(--primary-color);
                        color: white;
                        border: none;
                        border-radius: var(--border-radius);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: var(--transition);
                        font-size: 14px;
                    }
                    
                    .send-btn:hover:not(:disabled) {
                        background: var(--primary-hover);
                        transform: translateY(-50%) scale(1.05);
                    }
                    
                    .send-btn:disabled {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-disabledForeground);
                        cursor: not-allowed;
                    }

                    /* Context toggles */
                    .context-toggles {
                        display: flex;
                        gap: 6px;
                        margin-bottom: 8px;
                    }

                    .context-toggle {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                        border: 1px solid var(--vscode-button-border);
                        padding: 4px 8px;
                        border-radius: var(--border-radius);
                        font-size: 11px;
                        cursor: pointer;
                        transition: var(--transition);
                    }

                    .context-toggle:hover {
                        background: var(--vscode-button-secondaryHoverBackground);
                    }

                    .context-toggle.active {
                        background: var(--primary-color);
                        color: white;
                        border-color: var(--primary-color);
                    }

                    /* Attached files */
                    .attached-files {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 6px;
                        margin-bottom: 8px;
                    }

                    .file-chip {
                        background: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        padding: 4px 8px;
                        border-radius: var(--border-radius);
                        font-size: 11px;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }

                    .file-chip-remove {
                        cursor: pointer;
                        font-weight: bold;
                        opacity: 0.7;
                        transition: var(--transition);
                    }

                    .file-chip-remove:hover {
                        opacity: 1;
                        color: var(--danger-color);
                    }

                    /* Error messages */
                    .error-message {
                        background: var(--danger-color);
                        color: white;
                        padding: 12px;
                        border-radius: var(--border-radius);
                        margin-bottom: 12px;
                        font-size: 12px;
                    }

                    /* Suggestions */
                    .suggestions {
                        margin-top: 12px;
                        padding: 12px;
                        background: var(--vscode-input-background);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: var(--border-radius);
                    }

                    .suggestions-title {
                        font-weight: 600;
                        margin-bottom: 8px;
                        font-size: 12px;
                        color: var(--vscode-editor-foreground);
                    }

                    .suggestion-item {
                        padding: 6px 8px;
                        background: var(--vscode-button-secondaryBackground);
                        border: 1px solid var(--vscode-button-border);
                        border-radius: var(--border-radius);
                        margin-bottom: 4px;
                        cursor: pointer;
                        font-size: 11px;
                        transition: var(--transition);
                    }

                    .suggestion-item:hover {
                        background: var(--vscode-button-secondaryHoverBackground);
                        border-color: var(--primary-color);
                    }

                    /* Scrollbar styling */
                    .messages-area::-webkit-scrollbar {
                        width: 6px;
                    }

                    .messages-area::-webkit-scrollbar-track {
                        background: var(--vscode-scrollbar-shadow);
                    }

                    .messages-area::-webkit-scrollbar-thumb {
                        background: var(--vscode-scrollbarSlider-background);
                        border-radius: 3px;
                    }

                    .messages-area::-webkit-scrollbar-thumb:hover {
                        background: var(--vscode-scrollbarSlider-hoverBackground);
                    }

                    /* Responsive design */
                    @media (max-width: 300px) {
                        .quick-actions {
                            grid-template-columns: repeat(2, 1fr);
                        }
                        
                        .quick-action-btn {
                            font-size: 10px;
                            padding: 4px 6px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-icon">G</div>
                    <div class="header-title">GemmaPilot</div>
                    <div class="status-indicator" id="status-indicator"></div>
                </div>
                
                <div class="quick-actions">
                    <button class="quick-action-btn" id="explain-btn" title="Explain selected code">
                        🔍 Explain
                    </button>
                    <button class="quick-action-btn" id="fix-btn" title="Fix code issues">
                        🔧 Fix
                    </button>
                    <button class="quick-action-btn" id="optimize-btn" title="Optimize code">
                        ⚡ Optimize
                    </button>
                    <button class="quick-action-btn" id="tests-btn" title="Generate tests">
                        🧪 Tests
                    </button>
                    <button class="quick-action-btn" id="docs-btn" title="Generate documentation">
                        📝 Docs
                    </button>
                    <button class="quick-action-btn" id="analyze-btn" title="Analyze current file">
                        📊 Analyze
                    </button>
                </div>
                
                <div class="chat-container">
                    <div class="messages-area" id="messages-area">
                        <div class="welcome-message">
                            <div class="welcome-icon">🤖</div>
                            <div class="welcome-title">Welcome to GemmaPilot</div>
                            <p>Your AI coding assistant powered by Gemma. Ask me anything about your code!</p>
                        </div>
                    </div>
                    
                    <div class="input-area">
                        <div class="context-toggles">
                            <button class="context-toggle" id="selection-toggle">📋 Selection</button>
                            <button class="context-toggle" id="workspace-toggle">📁 Workspace</button>
                            <button class="context-toggle" id="attach-toggle">📎 Attach</button>
                        </div>
                        
                        <div class="attached-files" id="attached-files"></div>
                        
                        <div class="input-container">
                            <div class="input-wrapper">
                                <textarea 
                                    id="chat-input" 
                                    class="chat-input" 
                                    placeholder="Ask GemmaPilot anything about your code..."
                                    rows="1"
                                ></textarea>
                                <button class="send-btn" id="send-btn" disabled title="Send message">
                                    ➤
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
        `;
    }

    private getJavaScriptContent(): string {
        return `
            const vscode = acquireVsCodeApi();
            
            // State management
            let state = {
                attachedFiles: [],
                includeSelection: false,
                includeWorkspace: false,
                isTyping: false
            };
            
            // DOM elements
            const elements = {
                messagesArea: document.getElementById('messages-area'),
                chatInput: document.getElementById('chat-input'),
                sendBtn: document.getElementById('send-btn'),
                attachedFiles: document.getElementById('attached-files'),
                statusIndicator: document.getElementById('status-indicator'),
                selectionToggle: document.getElementById('selection-toggle'),
                workspaceToggle: document.getElementById('workspace-toggle'),
                attachToggle: document.getElementById('attach-toggle'),
                explainBtn: document.getElementById('explain-btn'),
                fixBtn: document.getElementById('fix-btn'),
                optimizeBtn: document.getElementById('optimize-btn'),
                testsBtn: document.getElementById('tests-btn'),
                docsBtn: document.getElementById('docs-btn'),
                analyzeBtn: document.getElementById('analyze-btn')
            };
            
            // Initialize
            init();
            
            function init() {
                console.log('🚀 GemmaPilot UI initialized');
                setupEventListeners();
                updateUI();
                if (elements.chatInput) {
                    elements.chatInput.focus();
                }
            }
            
            function setupEventListeners() {
                // Input handling
                if (elements.chatInput) {
                    elements.chatInput.addEventListener('input', handleInputChange);
                    elements.chatInput.addEventListener('keydown', handleKeyDown);
                }
                if (elements.sendBtn) {
                    elements.sendBtn.addEventListener('click', sendMessage);
                }
                
                // Context toggles
                if (elements.selectionToggle) {
                    elements.selectionToggle.addEventListener('click', function() { toggleContext('selection'); });
                }
                if (elements.workspaceToggle) {
                    elements.workspaceToggle.addEventListener('click', function() { toggleContext('workspace'); });
                }
                if (elements.attachToggle) {
                    elements.attachToggle.addEventListener('click', handleAttachFile);
                }
                
                // Quick actions
                if (elements.explainBtn) {
                    elements.explainBtn.addEventListener('click', function() { sendQuickAction('explain_code'); });
                }
                if (elements.fixBtn) {
                    elements.fixBtn.addEventListener('click', function() { sendQuickAction('fix_code'); });
                }
                if (elements.optimizeBtn) {
                    elements.optimizeBtn.addEventListener('click', function() { sendQuickAction('optimize_code'); });
                }
                if (elements.testsBtn) {
                    elements.testsBtn.addEventListener('click', function() { sendQuickAction('generate_tests'); });
                }
                if (elements.docsBtn) {
                    elements.docsBtn.addEventListener('click', function() { sendQuickAction('generate_docs'); });
                }
                if (elements.analyzeBtn) {
                    elements.analyzeBtn.addEventListener('click', function() { sendQuickAction('analyze_file'); });
                }
                
                // Message listener
                window.addEventListener('message', handleMessage);
            }
            
            function handleInputChange() {
                autoResize();
                updateSendButton();
            }
            
            function handleKeyDown(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            }
            
            function sendMessage() {
                if (!elements.chatInput) return;
                
                const message = elements.chatInput.value.trim();
                if (!message || state.isTyping) return;
                
                addMessage(message, true);
                setTyping(true);
                
                vscode.postMessage({
                    type: 'chat',
                    prompt: message,
                    includeSelection: state.includeSelection,
                    includeWorkspace: state.includeWorkspace,
                    attachedFiles: state.attachedFiles
                });
                
                elements.chatInput.value = '';
                autoResize();
                updateSendButton();
            }
            
            function sendQuickAction(action) {
                setTyping(true);
                vscode.postMessage({ type: action });
            }
            
            function toggleContext(type) {
                if (type === 'selection') {
                    state.includeSelection = !state.includeSelection;
                    if (elements.selectionToggle) {
                        elements.selectionToggle.classList.toggle('active', state.includeSelection);
                    }
                    
                    if (state.includeSelection) {
                        vscode.postMessage({ type: 'get_selection' });
                    }
                } else if (type === 'workspace') {
                    state.includeWorkspace = !state.includeWorkspace;
                    if (elements.workspaceToggle) {
                        elements.workspaceToggle.classList.toggle('active', state.includeWorkspace);
                    }
                    
                    if (state.includeWorkspace) {
                        vscode.postMessage({ type: 'get_workspace' });
                    }
                }
            }
            
            function handleAttachFile() {
                vscode.postMessage({ type: 'attach_file' });
            }
            
            function addMessage(content, isUser) {
                if (!elements.messagesArea) return;
                
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message message-' + (isUser ? 'user' : 'assistant');
                
                messageDiv.innerHTML = 
                    '<div class="message-header">' +
                        '<div class="message-avatar">' + (isUser ? 'U' : 'G') + '</div>' +
                        '<span>' + (isUser ? 'You' : 'GemmaPilot') + '</span>' +
                        '<span style="opacity: 0.6; font-size: 11px; margin-left: auto;">' +
                            new Date().toLocaleTimeString() +
                        '</span>' +
                    '</div>' +
                    '<div class="message-content">' + formatContent(content) + '</div>';
                
                // Remove welcome message
                const welcome = elements.messagesArea.querySelector('.welcome-message');
                if (welcome) {
                    welcome.remove();
                }
                
                elements.messagesArea.appendChild(messageDiv);
                scrollToBottom();
            }
            
            function formatContent(content) {
                // Format code blocks
                content = content.replace(/\`\`\`([\\w]*)\\n([\\s\\S]*?)\`\`\`/g, 
                    '<div class="code-block"><pre><code>$2</code></pre></div>');
                
                // Format inline code
                content = content.replace(/\`([^\`]+)\`/g, '<span class="inline-code">$1</span>');
                
                // Format bold
                content = content.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
                
                // Format italic
                content = content.replace(/\\*([^*]+)\\*/g, '<em>$1</em>');
                
                // Format line breaks
                content = content.replace(/\\n/g, '<br>');
                
                return content;
            }
            
            function showProgress(message) {
                if (!elements.messagesArea) return;
                
                const progressDiv = document.createElement('div');
                progressDiv.className = 'progress-indicator';
                progressDiv.innerHTML = 
                    '<div class="spinner"></div>' +
                    '<span>' + message + '</span>';
                
                elements.messagesArea.appendChild(progressDiv);
                scrollToBottom();
                
                return progressDiv;
            }
            
            function removeProgress() {
                if (!elements.messagesArea) return;
                
                const progress = elements.messagesArea.querySelector('.progress-indicator');
                if (progress) {
                    progress.remove();
                }
            }
            
            function showError(message) {
                if (!elements.messagesArea) return;
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.innerHTML = '❌ ' + message;
                
                elements.messagesArea.appendChild(errorDiv);
                scrollToBottom();
            }
            
            function addSuggestions(suggestions) {
                if (!suggestions || suggestions.length === 0 || !elements.messagesArea) return;
                
                const suggestionsDiv = document.createElement('div');
                suggestionsDiv.className = 'suggestions';
                
                let suggestionsHtml = '<div class="suggestions-title">💡 Suggestions</div>';
                for (let i = 0; i < suggestions.length; i++) {
                    suggestionsHtml += '<div class="suggestion-item" onclick="applySuggestion(\\'' + 
                        suggestions[i].replace(/'/g, "\\\\'") + '\\')">' + suggestions[i] + '</div>';
                }
                
                suggestionsDiv.innerHTML = suggestionsHtml;
                elements.messagesArea.appendChild(suggestionsDiv);
                scrollToBottom();
            }
            
            function applySuggestion(suggestion) {
                if (!elements.chatInput) return;
                
                elements.chatInput.value = suggestion;
                autoResize();
                updateSendButton();
                elements.chatInput.focus();
            }
            
            function addFileChip(fileName) {
                if (!elements.attachedFiles) return;
                
                const chip = document.createElement('div');
                chip.className = 'file-chip';
                chip.innerHTML = 
                    '<span>📎 ' + fileName + '</span>' +
                    '<span class="file-chip-remove" onclick="removeFile(\\'' + 
                        fileName.replace(/'/g, "\\\\'") + '\\')">×</span>';
                elements.attachedFiles.appendChild(chip);
            }
            
            function removeFile(fileName) {
                state.attachedFiles = state.attachedFiles.filter(function(f) { 
                    return f.fileName !== fileName; 
                });
                updateAttachedFilesUI();
            }
            
            function updateAttachedFilesUI() {
                if (!elements.attachedFiles) return;
                
                elements.attachedFiles.innerHTML = '';
                for (let i = 0; i < state.attachedFiles.length; i++) {
                    addFileChip(state.attachedFiles[i].fileName);
                }
            }
            
            function setTyping(isTyping) {
                state.isTyping = isTyping;
                updateUI();
                
                if (isTyping) {
                    showProgress('Thinking...');
                } else {
                    removeProgress();
                }
            }
            
            function updateSendButton() {
                if (!elements.chatInput || !elements.sendBtn) return;
                
                const hasText = elements.chatInput.value.trim().length > 0;
                elements.sendBtn.disabled = !hasText || state.isTyping;
            }
            
            function updateUI() {
                updateSendButton();
                
                // Update status indicator
                if (elements.statusIndicator) {
                    elements.statusIndicator.style.background = state.isTyping ? '#ffc107' : '#28a745';
                }
            }
            
            function autoResize() {
                if (!elements.chatInput) return;
                
                elements.chatInput.style.height = 'auto';
                const newHeight = Math.min(elements.chatInput.scrollHeight, 120);
                elements.chatInput.style.height = newHeight + 'px';
            }
            
            function scrollToBottom() {
                if (!elements.messagesArea) return;
                
                elements.messagesArea.scrollTop = elements.messagesArea.scrollHeight;
            }
            
            function handleMessage(event) {
                const message = event.data;
                console.log('📥 Received:', message);
                
                setTyping(false);
                
                switch (message.type) {
                    case 'response':
                        addMessage(message.content);
                        if (message.suggestions) {
                            addSuggestions(message.suggestions);
                        }
                        break;
                        
                    case 'error':
                        showError(message.error);
                        break;
                        
                    case 'file_attached':
                        state.attachedFiles.push({
                            fileName: message.fileName,
                            content: message.content
                        });
                        updateAttachedFilesUI();
                        break;
                        
                    case 'selection_result':
                        if (message.hasSelection) {
                            addMessage('✅ Selected ' + message.selection.length + ' characters from ' + message.fileName, false);
                        } else {
                            addMessage('ℹ️ No text currently selected', false);
                            state.includeSelection = false;
                            if (elements.selectionToggle) {
                                elements.selectionToggle.classList.remove('active');
                            }
                        }
                        break;
                        
                    case 'workspace_result':
                        if (message.hasWorkspace) {
                            addMessage('✅ Workspace: ' + message.workspaceName + ' (' + message.fileCount + ' files)', false);
                        } else {
                            addMessage('ℹ️ No workspace folder open', false);
                            state.includeWorkspace = false;
                            if (elements.workspaceToggle) {
                                elements.workspaceToggle.classList.remove('active');
                            }
                        }
                        break;
                        
                    case 'progress':
                        showProgress(message.message);
                        break;
                }
            }
            
            // Global functions for inline event handlers
            window.removeFile = removeFile;
            window.applySuggestion = applySuggestion;
        `;
    }
}

// Register providers for inline completions (GitHub Copilot-like)
export class GemmaPilotCompletionProvider implements vscode.InlineCompletionItemProvider {
    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[]> {
        try {
            if (token.isCancellationRequested) return [];
            
            const lineText = document.lineAt(position.line).text;
            const prefix = lineText.substring(0, position.character);
            
            // Only provide completions for meaningful content
            if (prefix.trim().length < 3) return [];
            
            // Get surrounding context
            const startLine = Math.max(0, position.line - 5);
            const endLine = Math.min(document.lineCount - 1, position.line + 5);
            let context = '';
            
            for (let i = startLine; i <= endLine; i++) {
                context += document.lineAt(i).text + '\n';
            }
            
            const requestData = {
                prompt: prefix,
                context: context,
                language: document.languageId,
                position: { line: position.line, character: position.character }
            };
            
            const response = await makeRequest(`${CONFIG.backendUrl}/complete`, {
                method: 'POST',
                body: JSON.stringify(requestData),
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok || !response.data?.completion) {
                return [];
            }
            
            const completion = response.data.completion.trim();
            if (!completion) return [];
            
            const item = new vscode.InlineCompletionItem(
                completion,
                new vscode.Range(position, position)
            );
            
            return [item];
            
        } catch (error) {
            console.error('Error in inline completion:', error);
            return [];
        }
    }
}

export function activate(context: vscode.ExtensionContext): void {
    console.log('🚀 GemmaPilot extension is now active!');

    // Initialize status bar
    const statusBar = new StatusBarManager();
    statusBar.initialize();
    context.subscriptions.push(statusBar);

    // Register chat provider
    const chatProvider = new GemmaPilotChatProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('gemmapilot.chat', chatProvider)
    );

    // Register inline completion provider (GitHub Copilot-like)
    const completionProvider = new GemmaPilotCompletionProvider();
    context.subscriptions.push(
        vscode.languages.registerInlineCompletionItemProvider(
            { pattern: '**' },
            completionProvider
        )
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('gemmapilot.openChat', () => {
            vscode.commands.executeCommand('workbench.view.extension.gemmapilot');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('gemmapilot.executeCommand', async (command?: string) => {
            try {
                const cmd = command || await vscode.window.showInputBox({ 
                    prompt: 'Enter command to execute',
                    placeHolder: 'e.g., npm install, git status',
                });

                if (!cmd?.trim()) return;

                const confirmation = await vscode.window.showWarningMessage(
                    `Execute command: ${cmd}?`,
                    { modal: true },
                    'Execute',
                    'Cancel'
                );

                if (confirmation === 'Execute') {
                    const terminal = vscode.window.createTerminal({
                        name: 'GemmaPilot',
                        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
                    });
                    terminal.sendText(cmd);
                    terminal.show();
                }
            } catch (error) {
                console.error('Error in execute command:', error);
                vscode.window.showErrorMessage('Failed to execute command');
            }
        })
    );

    // Register additional GitHub Copilot-like commands
    context.subscriptions.push(
        vscode.commands.registerCommand('gemmapilot.explainCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;
            
            const selection = editor.selection.isEmpty 
                ? editor.document.getText()
                : editor.document.getText(editor.selection);
                
            vscode.commands.executeCommand('workbench.view.extension.gemmapilot');
            // The webview will handle the explanation
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('gemmapilot.debug', () => {
            vscode.window.showInformationMessage('GemmaPilot is working! 🚀');
        })
    );

    vscode.window.showInformationMessage('GemmaPilot is ready! 🤖');
}

export function deactivate() {
    console.log('GemmaPilot extension deactivated');
}
