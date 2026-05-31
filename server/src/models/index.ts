import mongoose, { Document, Schema } from 'mongoose';

export interface IPipeline extends Document {
  name: string;
  repository: string;
  branch: string;
  language: string;
  steps: { name: string; command: string }[];
  envVars: { key: string; value: string }[];
  customRepairScript?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PipelineSchema: Schema = new Schema({
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

export const Pipeline = mongoose.model<IPipeline>('Pipeline', PipelineSchema);

export interface IExecution extends Document {
  pipelineId: mongoose.Types.ObjectId;
  status: 'pending' | 'running' | 'success' | 'failed' | 'retrying';
  logs: string;
  errorCategory?: string;
  aiSuggestion?: string;
  aiConfidence?: number;
  retryCount: number;
  startTime?: Date;
  endTime?: Date;
  healingSteps: { action: string; timestamp: Date; logs: string }[];
  rootCause?: string;
  recoveryStrategy?: string;
  recoveryDuration?: number;
  wasAutoHealed?: boolean;
}

const ExecutionSchema: Schema = new Schema({
  pipelineId: { type: Schema.Types.ObjectId, ref: 'Pipeline', required: true },
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

export const Execution = mongoose.model<IExecution>('Execution', ExecutionSchema);

export interface ISystemSettings extends Document {
  autoHealEnabled: boolean;
  maxRetries: number;
  autoRetryCategories: string[];
  slackWebhookUrl?: string;
  discordWebhookUrl?: string;
  k8sDeploymentName?: string;
  awsInstanceId?: string;
}

const SystemSettingsSchema: Schema = new Schema({
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

export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
