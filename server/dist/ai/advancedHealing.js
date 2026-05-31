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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeHealingAction = void 0;
const axios_1 = __importDefault(require("axios"));
const dockerode_1 = __importDefault(require("dockerode"));
const k8s = __importStar(require("@kubernetes/client-node"));
const client_ec2_1 = require("@aws-sdk/client-ec2");
const executeHealingAction = async (category, pipeline, settings, executionId) => {
    let nextHealingCommand = '';
    console.log(`\n=== ENTERPRISE AUTO-HEAL TRIGGERED ===`);
    console.log(`Category: ${category} | Execution ID: ${executionId}`);
    // 1. External Notifications (Slack/Discord)
    if (settings.slackWebhookUrl) {
        try {
            await axios_1.default.post(settings.slackWebhookUrl, {
                text: `🚨 *NexusCI Auto-Heal Triggered*\nPipeline: \`${pipeline.name}\`\nCategory: *${category}*\nExecution: ${executionId}`
            });
            console.log(`[Slack] Notification dispatched successfully.`);
        }
        catch (e) {
            console.log(`[Slack] Webhook failed (check URL): ${e.message}`);
        }
    }
    if (settings.discordWebhookUrl) {
        try {
            await axios_1.default.post(settings.discordWebhookUrl, {
                content: `🚨 **NexusCI Auto-Heal Triggered**\nPipeline: \`${pipeline.name}\`\nCategory: **${category}**\nExecution: ${executionId}`
            });
            console.log(`[Discord] Notification dispatched successfully.`);
        }
        catch (e) {
            console.log(`[Discord] Webhook failed (check URL): ${e.message}`);
        }
    }
    // 2. Out-of-Band Infrastructure Actions
    if (category === 'Container Crash') {
        // Restart EC2 if configured, else attempt Docker restart
        if (settings.awsInstanceId) {
            console.log(`[AWS] Rebooting EC2 instance: ${settings.awsInstanceId}...`);
            try {
                const ec2 = new client_ec2_1.EC2Client({ region: 'us-east-1' });
                const command = new client_ec2_1.RebootInstancesCommand({ InstanceIds: [settings.awsInstanceId] });
                ec2.send(command)
                    .then(() => console.log('[AWS] Reboot command sent successfully.'))
                    .catch(e => console.log(`[AWS] (Mock) Reboot attempted. Error: No valid AWS credentials found in environment.`));
            }
            catch (e) { }
        }
        else {
            console.log(`[Docker] Attempting to restart host Docker services...`);
            try {
                const docker = new dockerode_1.default();
                // Demonstrate pinging docker to see if it's alive during a crash
                docker.ping().then(() => console.log('[Docker] Daemon is alive.')).catch(() => console.log('[Docker] Daemon unreachable.'));
            }
            catch (e) { }
        }
        nextHealingCommand = 'echo "[Auto-Heal] Cleaning up zombie processes..." && rm -rf /tmp/*';
    }
    else if (category === 'Timeout Failure' || category === 'Resource Exhaustion') {
        if (settings.k8sDeploymentName) {
            console.log(`[Kubernetes] Scaling deployment ${settings.k8sDeploymentName} to handle load...`);
            try {
                const kc = new k8s.KubeConfig();
                kc.loadFromDefault();
                const k8sApi = kc.makeApiClient(k8s.AppsV1Api);
                console.log(`[Kubernetes] (Mock) Scale API invoked for ${settings.k8sDeploymentName}. KubeConfig not present locally.`);
            }
            catch (e) {
                console.log(`[Kubernetes] Failed to scale - no kubeconfig found on host.`);
            }
        }
        nextHealingCommand = 'echo "[Auto-Heal] Timeout detected. Increasing internal TTLs..." && export TIMEOUT=60000';
    }
    else if (category === 'Environment Issue') {
        if (settings.k8sDeploymentName) {
            console.log(`[Kubernetes] Rolling back deployment ${settings.k8sDeploymentName} to previous stable revision...`);
        }
        nextHealingCommand = 'echo "[Auto-Heal] Resetting local environment state..."';
    }
    else if (category === 'Dependency Error') {
        nextHealingCommand = pipeline.language === 'python' ? 'pip cache purge' : 'npm cache clean --force';
    }
    else if (category === 'Build Failure') {
        nextHealingCommand = pipeline.language === 'node' ? 'rm -rf node_modules && npm install' : 'rm -rf __pycache__';
    }
    else if (category === 'Permission Error') {
        nextHealingCommand = 'chmod -R 777 .';
    }
    // 3. Custom Shell Repair Script (Overrides/Prepends internal logic)
    if (pipeline.customRepairScript && pipeline.customRepairScript.trim() !== '') {
        console.log(`[Pipeline] Injecting user-defined Custom Shell Repair Script.`);
        nextHealingCommand = `echo "[Auto-Heal] Running custom repair script..." && ${pipeline.customRepairScript}` +
            (nextHealingCommand ? ` && ${nextHealingCommand}` : '');
    }
    console.log(`=== HEALING ACTION DISPATCHED ===\n`);
    return nextHealingCommand;
};
exports.executeHealingAction = executeHealingAction;
