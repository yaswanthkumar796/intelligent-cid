import { SystemSettings, Execution } from '../../models';
import { io } from '../../index';
import { classifyRootCause } from './classifyFailure';
import { getRecoveryStrategy } from './recoveryStrategies';
import { pipelineQueue } from '../../queues/worker';

export const emitLiveLog = async (execution: any, logStr: string) => {
  execution.logs += `\n${logStr}`;
  await execution.save();
  io.emit('pipeline-log', {
    executionId: execution._id,
    log: logStr,
  });
};

export const triggerAutoHeal = async (executionId: string, errorMessage: string) => {
  const execution = await Execution.findById(executionId).populate('pipelineId');
  if (!execution || !execution.pipelineId) return false;
  
  const pipeline: any = execution.pipelineId;

  await emitLiveLog(execution, `[ERROR] Pipeline Failed: ${errorMessage}`);
  
  const settings = await SystemSettings.findOne();
  if (!settings || !settings.autoHealEnabled) {
    execution.status = 'failed';
    await execution.save();
    io.emit('execution-status', { executionId: execution._id, status: 'failed', errorCategory: execution.errorCategory });
    return false;
  }

  const aiAnalysis = await classifyRootCause(execution.logs);
  execution.errorCategory = aiAnalysis.category;
  execution.aiConfidence = aiAnalysis.confidence;
  execution.aiSuggestion = aiAnalysis.suggestion;
  
  io.emit('ai-insight', { executionId: execution._id, prediction: aiAnalysis });
  
  if (execution.retryCount >= settings.maxRetries) {
    await emitLiveLog(execution, `[ERROR] Max retry limit reached (${settings.maxRetries}). Auto-heal aborted.`);
    execution.status = 'failed';
    await execution.save();
    io.emit('execution-status', { executionId: execution._id, status: 'failed', errorCategory: execution.errorCategory });
    return false;
  }

  const strategy = getRecoveryStrategy(aiAnalysis.category, pipeline.language);
  if (!strategy) {
    await emitLiveLog(execution, `[ERROR] No recovery strategy mapped for: ${aiAnalysis.category}`);
    execution.status = 'failed';
    await execution.save();
    io.emit('execution-status', { executionId: execution._id, status: 'failed', errorCategory: execution.errorCategory });
    return false;
  }

  execution.status = 'retrying';
  execution.retryCount += 1;
  execution.rootCause = aiAnalysis.category;
  execution.recoveryStrategy = strategy.strategyName;
  execution.wasAutoHealed = true;
  
  const startTime = Date.now();
  io.emit('execution-status', { executionId: execution._id, status: 'retrying', wasAutoHealed: true });
  
  for (const action of strategy.actions) {
    if (action.type === 'log') {
      const msg = action.message || '';
      await emitLiveLog(execution, msg);
      execution.healingSteps.push({ action: msg, timestamp: new Date(), logs: msg });
    } else if (action.type === 'wait' && action.duration) {
      await new Promise(r => setTimeout(r, action.duration));
    }
  }

  execution.recoveryDuration = Date.now() - startTime;
  await execution.save();

  await pipelineQueue.add(
    'run-pipeline',
    { executionId: execution._id, healingCommand: strategy.injectCommand },
    { delay: 1000 }
  );

  return true;
};
