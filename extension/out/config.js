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
exports.Utils = exports.CONFIG = void 0;
const http = __importStar(require("http"));
/**
 * Configuration constants for GemmaPilot extension
 */
exports.CONFIG = {
    backendUrl: 'http://localhost:8000',
    timeout: 30000,
    enableAutoComplete: true,
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
        'ruby'
    ]
};
/**
 * Common utility functions
 */
class Utils {
    /**
     * Sanitizes HTML content to prevent XSS attacks
     */
    static sanitizeHtml(content) {
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
    static isDangerousCommand(command) {
        const dangerous = [
            'rm -rf',
            'sudo rm',
            'format',
            'del /f',
            '> /dev/null',
            'shutdown',
            'reboot',
            'dd if=',
            'mkfs'
        ];
        return dangerous.some(cmd => command.toLowerCase().includes(cmd));
    }
    /**
     * Checks if the backend is reachable
     */
    static checkBackendHealth() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                try {
                    const url = new URL(`${exports.CONFIG.backendUrl}/health`);
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
                }
                catch (_a) {
                    resolve(false);
                }
            });
        });
    }
}
exports.Utils = Utils;
