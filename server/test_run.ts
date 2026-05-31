import axios from 'axios';
import { io } from 'socket.io-client';

const API = 'http://localhost:5000';
const socket = io(API);

async function runTest() {
  const { data: pipelines } = await axios.get(`${API}/api/pipelines`);
  
  // Find the Network Error Simulation
  const pipe = pipelines.find((p: any) => p.name === 'Network Error Simulation');
  
  console.log('Triggering pipeline:', pipe.name);
  const { data: execution } = await axios.post(`${API}/api/executions`, { pipelineId: pipe._id });
  console.log('Execution started:', execution._id);

  socket.on('pipeline-log', (data: any) => {
    if (data.executionId === execution._id) {
      console.log(`LOG: ${data.log.trim()}`);
    }
  });

  socket.on('ai-insight', (data: any) => {
    if (data.executionId === execution._id) {
      console.log(`AI INSIGHT:`, data.prediction);
    }
  });

  socket.on('execution-status', (data: any) => {
    if (data.executionId === execution._id) {
      console.log(`STATUS UPDATE: ${data.status}`);
      if (data.status === 'success' || data.status === 'failed') {
        console.log('Test completed.');
        process.exit(0);
      }
    }
  });
}

runTest();
