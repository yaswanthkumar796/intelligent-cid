import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';

import { startWorker, pipelineQueue } from './queues/worker';
import { Pipeline, Execution, SystemSettings } from './models';

const app = express();

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is healthy',
  });
});

/* =========================================================
   MONGODB CONNECTION
========================================================= */

mongoose
  .connect(
    process.env.MONGODB_URI ||
      'mongodb://admin:password@localhost:27017/devops?authSource=admin'
  )
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Auto-seed if database is empty
    try {
      const count = await Pipeline.countDocuments();
      if (count === 0) {
        console.log('Database is fresh. Seeding sample pipelines...');
        const { exec } = require('child_process');
        exec('npx ts-node src/seed.ts', { cwd: __dirname + '/..' }, (err: any, stdout: any, stderr: any) => {
          if (err) {
             console.error('Error seeding database:', err);
          } else {
             console.log('Database seeded successfully.');
          }
        });
      }
    } catch (err) {
      console.error('Error checking pipeline count:', err);
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

/* =========================================================
   START BULLMQ WORKER
========================================================= */

startWorker();

/* =========================================================
   PIPELINE ROUTES
========================================================= */

// Create Pipeline
app.post('/api/pipelines', async (req, res) => {
  try {
    const pipeline = new Pipeline(req.body);

    await pipeline.save();

    res.status(201).json(pipeline);
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// Get All Pipelines
app.get('/api/pipelines', async (req, res) => {
  try {
    const pipelines = await Pipeline.find().sort({
      createdAt: -1,
    });

    res.json(pipelines);
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// Delete Pipeline
app.delete('/api/pipelines/:id', async (req, res) => {
  try {
    const pipeline = await Pipeline.findByIdAndDelete(req.params.id);
    if (!pipeline) {
      return res.status(404).json({
        error: 'Pipeline not found',
      });
    }
    res.json({ success: true, message: 'Pipeline deleted successfully' });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// Execute Pipeline
app.post('/api/pipelines/:id/execute', async (req, res) => {
  try {
    const pipeline = await Pipeline.findById(req.params.id);

    if (!pipeline) {
      return res.status(404).json({
        error: 'Pipeline not found',
      });
    }

    // Create execution entry
    const execution = new Execution({
      pipelineId: pipeline._id,
      status: 'pending',
      logs: '',
      retryCount: 0,
    });

    await execution.save();

    // Add job to BullMQ
    await pipelineQueue.add('run-pipeline', {
      executionId: execution._id,
    });

    // Emit socket update
    io.emit('execution-created', execution);

    res.status(202).json({
      success: true,
      message: 'Pipeline execution started',
      execution,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// Create Execution (Alternative way triggered by Frontend and test script)
app.post('/api/executions', async (req, res) => {
  try {
    const { pipelineId } = req.body;
    const pipeline = await Pipeline.findById(pipelineId);

    if (!pipeline) {
      return res.status(404).json({
        error: 'Pipeline not found',
      });
    }

    // Create execution entry
    const execution = new Execution({
      pipelineId: pipeline._id,
      status: 'pending',
      logs: '',
      retryCount: 0,
    });

    await execution.save();

    // Add job to BullMQ
    await pipelineQueue.add('run-pipeline', {
      executionId: execution._id,
    });

    // Emit socket update
    io.emit('execution-created', execution);

    res.status(201).json(execution);
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
    });
  }
});


/* =========================================================
   EXECUTION ROUTES
========================================================= */

// Get All Executions
app.get('/api/executions', async (req, res) => {
  try {
    const executions = await Execution.find()
      .populate('pipelineId')
      .sort({
        createdAt: -1,
      });

    res.json(executions);
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// Get Single Execution
app.get('/api/executions/:id', async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id).populate(
      'pipelineId'
    );

    if (!execution) {
      return res.status(404).json({
        error: 'Execution not found',
      });
    }

    res.json(execution);
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/* =========================================================
   SETTINGS ROUTES
========================================================= */

app.get('/api/settings', async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================================================
   SOCKET.IO
========================================================= */

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.emit('connected', {
    message: 'Socket connected successfully',
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

/* =========================================================
   SERVER START
========================================================= */

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});