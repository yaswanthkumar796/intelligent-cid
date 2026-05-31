"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWorker = exports.pipelineQueue = void 0;
const bullmq_1 = require("bullmq");
const models_1 = require("../models");
const runner_1 = require("../docker/runner");
const stream_1 = require("stream");
const index_1 = require("../index");
const ioredis_1 = __importDefault(require("ioredis"));
// Proper BullMQ Redis configuration
const redisConnection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});
// Queue for pipeline jobs
exports.pipelineQueue = new bullmq_1.Queue('pipeline-executions', {
    connection: redisConnection,
});
const startWorker = () => {
    const worker = new bullmq_1.Worker('pipeline-executions', async (job) => {
        const { executionId, healingCommand } = job.data;
        const execution = await models_1.Execution.findById(executionId).populate('pipelineId');
        if (!execution || !execution.pipelineId) {
            console.error('Execution or pipeline not found');
            return;
        }
        const pipeline = execution.pipelineId;
        execution.status = 'running';
        execution.startTime = new Date();
        await execution.save();
        index_1.io.emit('execution-status', {
            executionId,
            status: 'running',
        });
        let fullLogs = execution.logs ? execution.logs + '\n\n--- AUTO-HEAL RETRY ---\n\n' : '';
        const logStream = new stream_1.PassThrough();
        logStream.on('data', (chunk) => {
            const logStr = chunk.toString();
            fullLogs += logStr;
            // Clean Docker control characters
            const cleanLog = logStr.replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g, '');
            index_1.io.emit('pipeline-log', {
                executionId,
                log: cleanLog,
            });
        });
        try {
            const success = await (0, runner_1.runPipelineContainer)(pipeline, executionId, logStream, healingCommand);
            execution.logs = fullLogs;
            execution.endTime = new Date();
            if (success) {
                execution.status = 'success';
                await execution.save();
                index_1.io.emit('execution-status', {
                    executionId,
                    status: 'success',
                });
                console.log(`Execution ${executionId} completed successfully`);
            }
            else {
                throw new Error('Pipeline exited with failure');
            }
        }
        catch (error) {
            console.error('Pipeline execution failed:', error.message);
            execution.logs = fullLogs;
            execution.status = 'failed';
            execution.endTime = new Date();
            await execution.save();
            // Auto-heal/retrying disabled
            index_1.io.emit('execution-status', { executionId: execution._id, status: 'failed' });
            // await triggerAutoHeal(executionId, error.message);
        }
    }, {
        connection: redisConnection,
    });
    worker.on('completed', (job) => {
        console.log(`Job ${job.id} completed`);
    });
    worker.on('failed', (job, err) => {
        console.error(`Job ${job?.id} failed: ${err.message}`);
    });
    worker.on('error', (err) => {
        console.error('Worker error:', err);
    });
    console.log('BullMQ Worker started successfully');
};
exports.startWorker = startWorker;
