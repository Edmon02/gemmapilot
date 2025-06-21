import * as vscode from 'vscode';
import { Utils, CONFIG } from './config';

/**
 * Status bar manager for GemmaPilot extension
 */
export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private checkInterval: NodeJS.Timeout | undefined;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 
            100
        );
        this.statusBarItem.command = 'gemmapilot.openChat';
    }

    /**
     * Initialize status bar and start health checks
     */
    public initialize(): void {
        this.updateStatus('checking');
        this.statusBarItem.show();
        this.startHealthCheck();
    }

    /**
     * Start periodic health checks
     */
    private startHealthCheck(): void {
        // Initial check
        this.checkBackendHealth();
        
        // Check every 30 seconds
        this.checkInterval = setInterval(() => {
            this.checkBackendHealth();
        }, 30000);
    }

    /**
     * Check backend health and update status
     */
    private async checkBackendHealth(): Promise<void> {
        try {
            const isHealthy = await Utils.checkBackendHealth();
            this.updateStatus(isHealthy ? 'connected' : 'disconnected');
        } catch (error) {
            this.updateStatus('error');
        }
    }

    /**
     * Update status bar appearance
     */
    private updateStatus(status: 'connected' | 'disconnected' | 'checking' | 'error'): void {
        switch (status) {
            case 'connected':
                this.statusBarItem.text = '$(check) GemmaPilot';
                this.statusBarItem.tooltip = 'GemmaPilot backend is connected';
                this.statusBarItem.backgroundColor = undefined;
                break;
            case 'disconnected':
                this.statusBarItem.text = '$(x) GemmaPilot';
                this.statusBarItem.tooltip = 'GemmaPilot backend is not available';
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                break;
            case 'checking':
                this.statusBarItem.text = '$(sync~spin) GemmaPilot';
                this.statusBarItem.tooltip = 'Checking GemmaPilot backend status...';
                this.statusBarItem.backgroundColor = undefined;
                break;
            case 'error':
                this.statusBarItem.text = '$(alert) GemmaPilot';
                this.statusBarItem.tooltip = 'Error connecting to GemmaPilot backend';
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                break;
        }
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        this.statusBarItem.dispose();
    }
}
