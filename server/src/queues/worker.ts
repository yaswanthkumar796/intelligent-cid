import { Worker, Job, Queue } from 'bullmq';
import { Execution, SystemSettings } from '../models';
import { runPipelineContainer } from '../docker/runner';
import { PassThrough } from 'stream';
import { io } from '../index';
import IORedis from 'ioredis';
import { triggerAutoHeal } from '../services/ai/healingEngine';

// Proper BullMQ Redis configuration
const redisConnection = new IORedis(
  process.env.REDIS_URL || 'redis://localhost:6379',
  {
    maxRetriesPerRequest: null,
  }
);

// Queue for pipeline jobs
export const pipelineQueue = new Queue('pipeline-executions', {
  connection: redisConnection,
});

export const startWorker = () => {
  const worker = new Worker(
    'pipeline-executions',
    async (job: Job) => {
      const { executionId, healingCommand } = job.data;

      const execution = await Execution.findById(executionId).populate(
        'pipelineId'
      );

      if (!execution || !execution.pipelineId) {
        console.error('Execution or pipeline not found');
        return;
      }

      const pipeline: any = execution.pipelineId;

      execution.status = 'running';
      execution.startTime = new Date();

      await execution.save();

      io.emit('execution-status', {
        executionId,
        status: 'running',
      });

      let fullLogs = execution.logs ? execution.logs + '\n\n--- AUTO-HEAL RETRY ---\n\n' : '';

      const logStream = new PassThrough();

      logStream.on('data', (chunk) => {
        const logStr = chunk.toString();

        fullLogs += logStr;

        // Clean Docker control characters
        const cleanLog = logStr.replace(
          /[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g,
          ''
        );

        io.emit('pipeline-log', {
          executionId,
          log: cleanLog,
        });
      });

      try {
        const success = await runPipelineContainer(
          pipeline,
          executionId,
          logStream,
          healingCommand
        );

        execution.logs = fullLogs;
        execution.endTime = new Date();

        if (success) {
          execution.status = 'success';

          await execution.save();

          io.emit('execution-status', {
            executionId,
            status: 'success',
            wasAutoHealed: execution.wasAutoHealed,
          });

          console.log(`Execution ${executionId} completed successfully`);
        } else {
          throw new Error('Pipeline exited with failure');
        }
      } catch (error: any) {
        console.error('Pipeline execution failed:', error.message);

        execution.logs = fullLogs;
        execution.status = 'failed';
        execution.endTime = new Date();
        await execution.save();

        await triggerAutoHeal(executionId, error.message);
      }
    },
    {
      connection: redisConnection,
    }
  );

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