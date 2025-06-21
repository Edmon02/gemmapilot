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
exports.StatusBarManager = void 0;
const vscode = __importStar(require("vscode"));
const config_1 = require("./config");
/**
 * Status bar manager for GemmaPilot extension
 */
class StatusBarManager {
    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'gemmapilot.openChat';
    }
    /**
     * Initialize status bar and start health checks
     */
    initialize() {
        this.updateStatus('checking');
        this.statusBarItem.show();
        this.startHealthCheck();
    }
    /**
     * Start periodic health checks
     */
    startHealthCheck() {
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
    checkBackendHealth() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const isHealthy = yield config_1.Utils.checkBackendHealth();
                this.updateStatus(isHealthy ? 'connected' : 'disconnected');
            }
            catch (error) {
                this.updateStatus('error');
            }
        });
    }
    /**
     * Update status bar appearance
     */
    updateStatus(status) {
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
    dispose() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        this.statusBarItem.dispose();
    }
}
exports.StatusBarManager = StatusBarManager;
