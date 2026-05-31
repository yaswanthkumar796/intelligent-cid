"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecoveryStrategy = void 0;
const getRecoveryStrategy = (category, language) => {
    switch (category) {
        case 'Container Crash':
            return {
                strategyName: 'Container Restart Protocol',
                actions: [
                    { type: 'log', message: '[AI] Container crash detected' },
                    { type: 'log', message: '[HEAL] Restarting container...' },
                    { type: 'wait', duration: 2000 },
                    { type: 'log', message: '[HEAL] Re-running pipeline after container restart' }
                ],
                injectCommand: ''
            };
        case 'Network Failure':
            return {
                strategyName: 'Network Backoff Retry',
                actions: [
                    { type: 'log', message: '[AI] Network instability detected' },
                    { type: 'wait', duration: 3000 },
                    { type: 'log', message: '[HEAL] Retrying dependency installation' }
                ],
                injectCommand: language === 'python' ? 'pip install -r requirements.txt' : 'npm install'
            };
        case 'Dependency Error':
            return {
                strategyName: 'Cache Purge & Reinstall',
                actions: [
                    { type: 'log', message: '[HEAL] Cleaning dependency cache' },
                    { type: 'log', message: '[HEAL] Reinstalling packages' }
                ],
                injectCommand: language === 'python' ? 'pip cache purge && pip install -r requirements.txt' : 'npm cache clean --force && rm -rf node_modules && npm install'
            };
        case 'Flaky Test':
            return {
                strategyName: 'Automated Test Retry',
                actions: [
                    { type: 'log', message: '[AI] Flaky test pattern detected' },
                    { type: 'log', message: '[HEAL] Retrying test suite automatically' }
                ],
                injectCommand: language === 'python' ? 'pytest' : 'npm test'
            };
        default:
            return null;
    }
};
exports.getRecoveryStrategy = getRecoveryStrategy;
