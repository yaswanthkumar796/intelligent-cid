"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyRootCause = void 0;
const analyzeLogs_1 = require("./analyzeLogs");
const axios_1 = __importDefault(require("axios"));
const classifyRootCause = async (logs) => {
    const parsedLogs = (0, analyzeLogs_1.parseExecutionLogs)(logs).toLowerCase() + ' ' + logs.toLowerCase();
    // Try using the ML Engine (FastAPI) at ML_ENGINE_URL
    const mlEngineUrl = process.env.ML_ENGINE_URL || 'http://localhost:8000';
    try {
        console.log(`[AI] Attempting failure classification via ML Engine at ${mlEngineUrl}...`);
        const response = await axios_1.default.post(`${mlEngineUrl}/predict`, {
            log_text: logs
        }, { timeout: 3000 });
        if (response.data && response.data.category) {
            console.log(`[AI] ML Engine prediction successful. Category: ${response.data.category}, Confidence: ${response.data.confidence}`);
            return {
                category: response.data.category,
                confidence: response.data.confidence || 0.90,
                suggestion: response.data.suggestion || 'Review logs for more details.'
            };
        }
    }
    catch (error) {
        console.warn(`[AI] ML Engine request failed (${error.message}). Falling back to rule-based classification.`);
    }
    // Fallback to local rule-based system
    if (parsedLogs.includes('container exited') || parsedLogs.includes('oomkilled') || parsedLogs.includes('segmentation fault') || parsedLogs.includes('container crash')) {
        return { category: 'Container Crash', confidence: 0.95, suggestion: 'Restart the container to clear segmentation faults or transient OOM issues.' };
    }
    if (parsedLogs.includes('etimedout') || parsedLogs.includes('network timeout') || parsedLogs.includes('connection reset') || parsedLogs.includes('econnrefused')) {
        return { category: 'Network Failure', confidence: 0.92, suggestion: 'Network instability detected. Retry the command with backoff.' };
    }
    if (parsedLogs.includes('cannot find module') || parsedLogs.includes('module not found') || parsedLogs.includes('npm err') || parsedLogs.includes('eresolve')) {
        return { category: 'Dependency Error', confidence: 0.98, suggestion: 'Clear the package manager cache and reinstall dependencies.' };
    }
    if (parsedLogs.includes('randomly failed') || parsedLogs.includes('expected true to be false') || parsedLogs.includes('flaky') || parsedLogs.includes('test failed') || parsedLogs.includes('randomised test')) {
        return { category: 'Flaky Test', confidence: 0.85, suggestion: 'Test suite instability detected. Rerunning to rule out transient failures.' };
    }
    return { category: 'Unknown Error', confidence: 0.50, suggestion: 'Manual intervention required.' };
};
exports.classifyRootCause = classifyRootCause;
