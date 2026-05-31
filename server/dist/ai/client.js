"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeFailure = void 0;
const axios_1 = __importDefault(require("axios"));
const winston_1 = __importDefault(require("winston"));
const ML_ENGINE_URL = process.env.ML_ENGINE_URL || 'http://localhost:8000';
const analyzeFailure = async (logs) => {
    try {
        const response = await axios_1.default.post(`${ML_ENGINE_URL}/predict`, {
            log_text: logs
        });
        return response.data;
    }
    catch (error) {
        winston_1.default.error('Error communicating with ML Engine:', error.message);
        return null;
    }
};
exports.analyzeFailure = analyzeFailure;
