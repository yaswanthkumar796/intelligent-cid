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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSettings = exports.Execution = exports.Pipeline = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PipelineSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    repository: { type: String, required: true },
    branch: { type: String, default: 'main' },
    language: { type: String, required: true },
    steps: [{
            name: { type: String, required: true },
            command: { type: String, required: true }
        }],
    envVars: [{
            key: { type: String, required: true },
            value: { type: String, required: true }
        }],
    customRepairScript: { type: String }
}, { timestamps: true });
exports.Pipeline = mongoose_1.default.model('Pipeline', PipelineSchema);
const ExecutionSchema = new mongoose_1.Schema({
    pipelineId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Pipeline', required: true },
    status: {
        type: String,
        enum: ['pending', 'running', 'success', 'failed', 'retrying'],
        default: 'pending'
    },
    logs: { type: String, default: '' },
    errorCategory: { type: String },
    aiSuggestion: { type: String },
    aiConfidence: { type: Number },
    retryCount: { type: Number, default: 0 },
    startTime: { type: Date },
    endTime: { type: Date },
    healingSteps: [{
            action: { type: String },
            timestamp: { type: Date, default: Date.now },
            logs: { type: String }
        }],
    rootCause: { type: String },
    recoveryStrategy: { type: String },
    recoveryDuration: { type: Number },
    wasAutoHealed: { type: Boolean, default: false }
}, { timestamps: true });
exports.Execution = mongoose_1.default.model('Execution', ExecutionSchema);
const SystemSettingsSchema = new mongoose_1.Schema({
    autoHealEnabled: { type: Boolean, default: true },
    maxRetries: { type: Number, default: 2 },
    autoRetryCategories: {
        type: [String],
        default: ['Network Failure', 'Timeout Failure', 'Flaky Test', 'Container Crash', 'Dependency Error']
    },
    slackWebhookUrl: { type: String, default: '' },
    discordWebhookUrl: { type: String, default: '' },
    k8sDeploymentName: { type: String, default: '' },
    awsInstanceId: { type: String, default: '' }
}, { timestamps: true });
exports.SystemSettings = mongoose_1.default.model('SystemSettings', SystemSettingsSchema);
