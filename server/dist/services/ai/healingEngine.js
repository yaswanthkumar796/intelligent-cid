"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerAutoHeal = exports.emitLiveLog = void 0;
const models_1 = require("../../models");
const index_1 = require("../../index");
const classifyFailure_1 = require("./classifyFailure");
const recoveryStrategies_1 = require("./recoveryStrategies");
const worker_1 = require("../../queues/worker");
const emitLiveLog = async (execution, logStr) => {
    execution.logs += `\n${logStr}`;
    await execution.save();
    index_1.io.emit('pipeline-log', {
        executionId: execution._id,
        log: logStr,
    });
};
exports.emitLiveLog = emitLiveLog;
const triggerAutoHeal = async (executionId, errorMessage) => {
    const execution = await models_1.Execution.findById(executionId).populate('pipelineId');
    if (!execution || !execution.pipelineId)
        return false;
    const pipeline = execution.pipelineId;
    await (0, exports.emitLiveLog)(execution, `[ERROR] Pipeline Failed: ${errorMessage}`);
    const settings = await models_1.SystemSettings.findOne();
    if (!settings || !settings.autoHealEnabled) {
        execution.status = 'failed';
        await execution.save();
        index_1.io.emit('execution-status', { executionId: execution._id, status: 'failed', errorCategory: execution.errorCategory });
        return false;
    }
    const aiAnalysis = await (0, classifyFailure_1.classifyRootCause)(execution.logs);
    execution.errorCategory = aiAnalysis.category;
    execution.aiConfidence = aiAnalysis.confidence;
    execution.aiSuggestion = aiAnalysis.suggestion;
    index_1.io.emit('ai-insight', { executionId: execution._id, prediction: aiAnalysis });
    if (execution.retryCount >= settings.maxRetries) {
        await (0, exports.emitLiveLog)(execution, `[ERROR] Max retry limit reached (${settings.maxRetries}). Auto-heal aborted.`);
        execution.status = 'failed';
        await execution.save();
        index_1.io.emit('execution-status', { executionId: execution._id, status: 'failed', errorCategory: execution.errorCategory });
        return false;
    }
    const strategy = (0, recoveryStrategies_1.getRecoveryStrategy)(aiAnalysis.category, pipeline.language);
    if (!strategy) {
        await (0, exports.emitLiveLog)(execution, `[ERROR] No recovery strategy mapped for: ${aiAnalysis.category}`);
        execution.status = 'failed';
        await execution.save();
        index_1.io.emit('execution-status', { executionId: execution._id, status: 'failed', errorCategory: execution.errorCategory });
        return false;
    }
    execution.status = 'retrying';
    execution.retryCount += 1;
    execution.rootCause = aiAnalysis.category;
    execution.recoveryStrategy = strategy.strategyName;
    execution.wasAutoHealed = true;
    const startTime = Date.now();
    index_1.io.emit('execution-status', { executionId: execution._id, status: 'retrying' });
    for (const action of strategy.actions) {
        if (action.type === 'log') {
            const msg = action.message || '';
            await (0, exports.emitLiveLog)(execution, msg);
            execution.healingSteps.push({ action: msg, timestamp: new Date(), logs: msg });
        }
        else if (action.type === 'wait' && action.duration) {
            await new Promise(r => setTimeout(r, action.duration));
        }
    }
    execution.recoveryDuration = Date.now() - startTime;
    await execution.save();
    await worker_1.pipelineQueue.add('run-pipeline', { executionId: execution._id, healingCommand: strategy.injectCommand }, { delay: 1000 });
    return true;
};
exports.triggerAutoHeal = triggerAutoHeal;
