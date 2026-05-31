"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPipelineContainer = void 0;
const dockerode_1 = __importDefault(require("dockerode"));
const winston_1 = __importDefault(require("winston"));
// If Docker Desktop is using WSL2, it is usually available via default named pipe on Windows
// or standard socket on Linux. Dockerode handles this automatically if no options are passed,
// but we might need specific configuration if it fails.
const docker = new dockerode_1.default();
const runPipelineContainer = async (pipeline, executionId, logStream, healingCommand) => {
    try {
        // Basic image based on language
        const image = pipeline.language === 'python' ? 'python:3.9-slim' : 'node:18-alpine';
        // Pull image if not exists
        await new Promise((resolve, reject) => {
            docker.pull(image, (err, stream) => {
                if (err)
                    return reject(err);
                docker.modem.followProgress(stream, onFinished, onProgress);
                function onFinished(err, output) {
                    if (err)
                        return reject(err);
                    resolve();
                }
                function onProgress(event) { }
            });
        });
        // Create entrypoint script combining all steps
        let setupCmd = '';
        if (pipeline.language === 'python') {
            setupCmd = 'apt-get update && apt-get install -y git curl && ';
        }
        else {
            setupCmd = 'apk add --no-cache git curl && ';
        }
        let cloneCmd = '';
        if (pipeline.repository && pipeline.repository.startsWith('https://')) {
            const branchFlag = pipeline.branch ? `-b ${pipeline.branch}` : '';
            cloneCmd = `git clone ${branchFlag} ${pipeline.repository} /workspace && cd /workspace && `;
        }
        const commands = pipeline.steps.map(s => s.command).join(' && ');
        let activeHealing = '';
        if (healingCommand) {
            activeHealing = `echo "[Self-Healing] Executing injected healing command: ${healingCommand}" && ${healingCommand} && `;
        }
        const cmd = ['sh', '-c', `${setupCmd}${cloneCmd}${activeHealing}${commands}`];
        // Prepare env vars
        const Env = pipeline.envVars.map(e => `${e.key}=${e.value}`);
        const container = await docker.createContainer({
            Image: image,
            Cmd: cmd,
            Env,
            Tty: false,
            HostConfig: {
                AutoRemove: true,
                Memory: 512 * 1024 * 1024 // 512MB limit
            }
        });
        // Attach stream
        const stream = await container.attach({
            stream: true,
            stdout: true,
            stderr: true
        });
        stream.pipe(logStream);
        await container.start();
        // Wait for container to exit
        const data = await container.wait();
        if (data.StatusCode !== 0) {
            throw new Error(`Container exited with code ${data.StatusCode}`);
        }
        return true;
    }
    catch (error) {
        logStream.write(`\n[ERROR] ${error.message}\n`);
        winston_1.default.error(`Docker execution failed for ${executionId}:`, error);
        return false;
    }
};
exports.runPipelineContainer = runPipelineContainer;
