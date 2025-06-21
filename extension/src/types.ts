/**
 * Type definitions for GemmaPilot VS Code Extension
 */

// Message types for webview communication
export interface ChatMessage {
    type: 'chat' | 'file_analysis' | 'attach_file' | 'execute_command';
    prompt?: string;
    filePath?: string;
    command?: string;
    workspace_path?: string;
    current_file?: string;
    selection?: string;
    files?: Array<{path: string, content: string}>;
}

export interface ResponseMessage {
    type: 'response' | 'file_analysis_result' | 'command_result';
    content: string;
    formatted_content?: string;
    suggestions?: string[];
    files_referenced?: string[];
    commands_suggested?: string[];
    error?: string;
}

export interface ErrorMessage {
    type: 'error';
    error: string;
}

export interface FileAttachmentMessage {
    type: 'file_attached';
    fileName: string;
    content: string;
}

export interface ProgressMessage {
    type: 'progress';
    message: string;
    progress?: number;
}

export type WebviewMessage = ChatMessage | ResponseMessage | ErrorMessage | FileAttachmentMessage | ProgressMessage;

// API request/response types
export interface ChatRequest {
    prompt: string;
    context?: string;
    workspace_path?: string;
    current_file?: string;
    selection?: string;
    files?: Array<{path: string, content: string}>;
}

export interface ChatResponse {
    response: string;
    formatted_response: string;
    suggestions: string[];
    files_referenced: string[];
    commands_suggested: string[];
}

export interface CompletionResponse {
    completion: string;
    confidence?: number;
    language?: string;
}

export interface FileAnalysisRequest {
    file_path: string;
    workspace_path?: string;
    analysis_type: 'overview' | 'issues' | 'suggestions' | 'dependencies';
}

export interface FileAnalysisResponse {
    file_path: string;
    file_name: string;
    analysis_type: string;
    analysis: string;
    formatted_analysis: string;
}

export interface CommandRequest {
    command: string;
    workspace_path: string;
    explanation?: string;
}

export interface CommandResponse {
    command: string;
    exit_code: number;
    stdout: string;
    stderr: string;
    explanation?: string;
    success: boolean;
}

// Configuration types
export interface GemmaPilotConfig {
    backendUrl: string;
    timeout: number;
    enableAutoComplete: boolean;
    supportedLanguages: string[];
    maxFileSize: number;
    enableFileAnalysis: boolean;
    enableCommandExecution: boolean;
}

// Extension context types
export interface ExtensionState {
    isBackendConnected: boolean;
    lastError?: string;
    workspacePath?: string;
    attachedFiles: Array<{name: string, path: string, content: string}>;
}

// File information
export interface FileInfo {
    name: string;
    path: string;
    full_path: string;
    size: number;
    extension: string;
}
