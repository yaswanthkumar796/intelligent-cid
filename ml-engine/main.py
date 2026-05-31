from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import os
import train_model

app = FastAPI(title="DevOps AI Engine")

MODEL_PATH = "models/failure_classifier.joblib"
model = None

class LogRequest(BaseModel):
    log_text: str

class PredictionResponse(BaseModel):
    category: str
    confidence: float
    suggestion: str

def get_suggestion(category: str) -> str:
    suggestions = {
        "Build Failure": "Check syntax, missing semicolons, or compiler versions.",
        "Test Failure": "Review test assertions, mock data, or update test snapshots.",
        "Dependency Error": "Run npm install/pip install, check package.json or requirements.txt.",
        "Environment Issue": "Verify environment variables (.env), secrets, and config files.",
        "Timeout Failure": "Increase timeout limits, check for infinite loops or deadlocks.",
        "Flaky Test": "Mark as flaky, re-run, check for race conditions or state leakage.",
        "Network Failure": "Check network connectivity, DNS resolution, and firewall rules.",
        "Container Crash": "Inspect OOM issues, check memory limits, review Dockerfile ENTRYPOINT.",
        "Permission Error": "Fix file permissions (chmod/chown) or IAM roles."
    }
    return suggestions.get(category, "Review logs for more details.")

@app.on_event("startup")
async def startup_event():
    global model
    print("Initializing AI Engine...")
    if not os.path.exists(MODEL_PATH):
        print("Model not found. Auto-training on startup...")
        train_model.train_and_save()
    
    print("Loading model...")
    model = joblib.load(MODEL_PATH)
    print("Model loaded successfully.")

@app.post("/predict", response_model=PredictionResponse)
async def predict_failure(request: LogRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")
    
    try:
        prediction = model.predict([request.log_text])[0]
        probabilities = model.predict_proba([request.log_text])[0]
        confidence = float(max(probabilities))
        
        return PredictionResponse(
            category=prediction,
            confidence=confidence,
            suggestion=get_suggestion(prediction)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}
