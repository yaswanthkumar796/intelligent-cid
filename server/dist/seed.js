"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("./models");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const samplePipelines = [
    {
        name: 'Frontend React Build',
        repository: 'github.com/org/react-app',
        language: 'node',
        steps: [
            { name: 'Install', command: 'npm install' },
            { name: 'Build', command: 'npm run build' }
        ],
        envVars: [{ key: 'NODE_ENV', value: 'production' }]
    },
    {
        name: 'Python ML Training',
        repository: 'github.com/org/ml-model',
        language: 'python',
        steps: [
            { name: 'Install', command: 'pip install pandas scikit-learn' },
            { name: 'Train', command: 'python train.py' }
        ],
        envVars: []
    },
    {
        name: 'Frontend Build (Dependency Error)',
        repository: 'github.com/org/react-app-broken',
        language: 'node',
        steps: [
            { name: 'Install', command: 'if [ $((RANDOM % 2)) -eq 0 ]; then echo "npm ERR! code ERESOLVE" && exit 1; else echo "Packages installed successfully" && exit 0; fi' }
        ],
        envVars: []
    },
    {
        name: 'Flaky Test Simulation',
        repository: 'github.com/org/flaky-app',
        language: 'node',
        steps: [
            { name: 'Test', command: 'if [ $((RANDOM % 2)) -eq 0 ]; then echo "Randomised test failed, check seed 12345" && exit 1; else echo "Test passed on retry 2" && exit 0; fi' }
        ],
        envVars: []
    },
    {
        name: 'Network Error Simulation',
        repository: 'github.com/org/network-app',
        language: 'node',
        steps: [
            { name: 'Fetch', command: 'if [ $((RANDOM % 2)) -eq 0 ]; then echo "ECONNREFUSED: Connection refused by 127.0.0.1:5432" && exit 1; else echo "Connected successfully" && exit 0; fi' }
        ],
        envVars: []
    },
    {
        name: 'Java Spring Boot API',
        repository: 'github.com/org/spring-api',
        language: 'java',
        steps: [
            { name: 'Build', command: 'mvn clean package -DskipTests' },
            { name: 'Test', command: 'mvn test' },
            { name: 'Docker Build', command: 'docker build -t spring-api:latest .' }
        ],
        envVars: [{ key: 'JAVA_HOME', value: '/usr/lib/jvm/java-17' }, { key: 'SPRING_PROFILES_ACTIVE', value: 'staging' }]
    },
    {
        name: 'Docker Container Build',
        repository: 'github.com/org/docker-app',
        language: 'node',
        steps: [
            { name: 'Lint', command: 'npm run lint' },
            { name: 'Build Image', command: 'docker build -t app:latest .' },
            { name: 'Push Image', command: 'docker push registry.io/app:latest' }
        ],
        envVars: [{ key: 'DOCKER_REGISTRY', value: 'registry.io' }]
    },
    {
        name: 'Kubernetes Deploy Pipeline',
        repository: 'github.com/org/k8s-service',
        language: 'yaml',
        steps: [
            { name: 'Build', command: 'docker build -t k8s-service:latest .' },
            { name: 'Push', command: 'docker push registry.io/k8s-service:latest' },
            { name: 'Deploy', command: 'kubectl apply -f k8s/deployment.yaml' }
        ],
        envVars: [{ key: 'KUBE_CONTEXT', value: 'production' }]
    }
];
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/devops?authSource=admin')
    .then(async () => {
    console.log('Connected to MongoDB');
    await models_1.Pipeline.deleteMany({});
    await models_1.Pipeline.insertMany(samplePipelines);
    console.log('Sample pipelines inserted');
    process.exit(0);
})
    .catch(err => {
    console.error(err);
    process.exit(1);
});
