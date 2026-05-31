import axios from 'axios';
import winston from 'winston';

const ML_ENGINE_URL = process.env.ML_ENGINE_URL || 'http://localhost:8000';

export interface AIPrediction {
  category: string;
  confidence: number;
  suggestion: string;
}

export const analyzeFailure = async (logs: string): Promise<AIPrediction | null> => {
  try {
    const response = await axios.post(`${ML_ENGINE_URL}/predict`, {
      log_text: logs
    });
    return response.data;
  } catch (error: any) {
    winston.error('Error communicating with ML Engine:', error.message);
    return null;
  }
};
