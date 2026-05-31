"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const worker_1 = require("./queues/worker");
const models_1 = require("./models");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
mongoose_1.default
    .connect(process.env.MONGODB_URI ||
    'mongodb://admin:password@localhost:27017/devops?authSource=admin')
    .then(() => {
    console.log('Connected to MongoDB');
})
    .catch((err) => {
    console.error('MongoDB connection error:', err);
});
/* =========================================================
   START BULLMQ WORKER
========================================================= */
(0, worker_1.startWorker)();
/* =========================================================
   PIPELINE ROUTES
========================================================= */
// Create Pipeline
app.post('/api/pipelines', async (req, res) => {
    try {
        const pipeline = new models_1.Pipeline(req.body);
        await pipeline.save();
        res.status(201).json(pipeline);
    }
    catch (error) {
        res.status(400).json({
            error: error.message,
        });
    }
});
// Get All Pipelines
app.get('/api/pipelines', async (req, res) => {
    try {
        const pipelines = await models_1.Pipeline.find().sort({
            createdAt: -1,
        });
        res.json(pipelines);
    }
    catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
});
// Delete Pipeline
app.delete('/api/pipelines/:id', async (req, res) => {
    try {
        const pipeline = await models_1.Pipeline.findByIdAndDelete(req.params.id);
        if (!pipeline) {
            return res.status(404).json({
                error: 'Pipeline not found',
            });
        }
        res.json({ success: true, message: 'Pipeline deleted successfully' });
    }
    catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
});
// Execute Pipeline
app.post('/api/pipelines/:id/execute', async (req, res) => {
    try {
        const pipeline = await models_1.Pipeline.findById(req.params.id);
        if (!pipeline) {
            return res.status(404).json({
                error: 'Pipeline not found',
            });
        }
        // Create execution entry
        const execution = new models_1.Execution({
            pipelineId: pipeline._id,
            status: 'pending',
            logs: '',
            retryCount: 0,
        });
        await execution.save();
        // Add job to BullMQ
        await worker_1.pipelineQueue.add('run-pipeline', {
            executionId: execution._id,
        });
        // Emit socket update
        exports.io.emit('execution-created', execution);
        res.status(202).json({
            success: true,
            message: 'Pipeline execution started',
            execution,
        });
    }
    catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
});
// Create Execution (Alternative way triggered by Frontend and test script)
app.post('/api/executions', async (req, res) => {
    try {
        const { pipelineId } = req.body;
        const pipeline = await models_1.Pipeline.findById(pipelineId);
        if (!pipeline) {
            return res.status(404).json({
                error: 'Pipeline not found',
            });
        }
        // Create execution entry
        const execution = new models_1.Execution({
            pipelineId: pipeline._id,
            status: 'pending',
            logs: '',
            retryCount: 0,
        });
        await execution.save();
        // Add job to BullMQ
        await worker_1.pipelineQueue.add('run-pipeline', {
            executionId: execution._id,
        });
        // Emit socket update
        exports.io.emit('execution-created', execution);
        res.status(201).json(execution);
    }
    catch (error) {
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
        const executions = await models_1.Execution.find()
            .populate('pipelineId')
            .sort({
            createdAt: -1,
        });
        res.json(executions);
    }
    catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
});
// Get Single Execution
app.get('/api/executions/:id', async (req, res) => {
    try {
        const execution = await models_1.Execution.findById(req.params.id).populate('pipelineId');
        if (!execution) {
            return res.status(404).json({
                error: 'Execution not found',
            });
        }
        res.json(execution);
    }
    catch (error) {
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
        let settings = await models_1.SystemSettings.findOne();
        if (!settings) {
            settings = await models_1.SystemSettings.create({});
        }
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/settings', async (req, res) => {
    try {
        let settings = await models_1.SystemSettings.findOne();
        if (!settings) {
            settings = new models_1.SystemSettings(req.body);
        }
        else {
            Object.assign(settings, req.body);
        }
        await settings.save();
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/* =========================================================
   SOCKET.IO
========================================================= */
exports.io.on('connection', (socket) => {
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
