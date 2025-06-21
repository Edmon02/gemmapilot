import { GemmaPilotConfig } from './types';
import * as http from 'http';

/**
 * Configuration constants for GemmaPilot extension
 */
export const CONFIG: GemmaPilotConfig = {
    backendUrl: 'http://localhost:8000',
    timeout: 30000,
    enableAutoComplete: true,
    maxFileSize: 1024 * 1024, // 1MB
    enableFileAnalysis: true,
    enableCommandExecution: true,
    supportedLanguages: [
        'python',
        'javascript', 
        'typescript',
        'java',
        'cpp',
        'c',
        'go',
        'rust',
        'php',
        'ruby',
        'json',
        'yaml',
        'markdown',
        'html',
        'css',
        'sql',
        'shell'
    ]
};

/**
 * Common utility functions
 */
export class Utils {
    /**
     * Sanitizes HTML content to prevent XSS attacks
     */
    static sanitizeHtml(content: string): string {
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Validates if a command is potentially dangerous
     */
    static isDangerousCommand(command: string): boolean {
        const dangerousPatterns = [
            'rm -rf',
            'sudo rm',
            'format',
            'fdisk',
            'mkfs',
            'dd if=',
            '> /dev/',
            'chmod 777',
            'chown -R',
            'killall',
            'shutdown',
            'reboot',
            'init 0',
            'init 6',
            'halt',
            'poweroff',
            'del /f',
            '> /dev/null'
        ];
        
        const lowerCommand = command.toLowerCase().trim();
        return dangerousPatterns.some(pattern => lowerCommand.includes(pattern));
    }

    /**
     * Checks if the backend is reachable
     */
    static async checkBackendHealth(): Promise<boolean> {
        return new Promise((resolve) => {
            try {
                const url = new URL(`${CONFIG.backendUrl}/health`);
                const req = http.request({
                    hostname: url.hostname,
                    port: url.port || 8000,
                    path: '/health',
                    method: 'GET',
                    timeout: 5000
                }, (res) => {
                    resolve(res.statusCode === 200);
                });
                
                req.on('error', () => resolve(false));
                req.on('timeout', () => resolve(false));
                req.end();
            } catch {
                resolve(false);
            }
        });
    }
}
