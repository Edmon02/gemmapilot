/**
 * Type definitions for GemmaPilot VS Code Extension
 */

// Message types for webview communication
export interface ChatMessage {
    type: 'chat';
    prompt: string;
}

export interface ResponseMessage {
    type: 'response';
    content: string;
}

export interface ErrorMessage {
    type: 'error';
    error: string;
}

export type WebviewMessage = ChatMessage | ResponseMessage | ErrorMessage;

// API response types
export interface CompletionResponse {
    completion: string;
    confidence?: number;
}

export interface ChatResponse {
    response: string;
    model?: string;
    timestamp?: string;
}

// Configuration types
export interface GemmaPilotConfig {
    backendUrl: string;
    timeout: number;
    enableAutoComplete: boolean;
    supportedLanguages: string[];
}

// Extension context types
export interface ExtensionState {
    isBackendConnected: boolean;
    lastError?: string;
}
