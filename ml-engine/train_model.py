import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os
import data_generator

MODEL_PATH = "models/failure_classifier.joblib"

def train_and_save():
    os.makedirs("models", exist_ok=True)
    
    if not os.path.exists("data/sample_logs.csv"):
        print("Dataset not found, generating...")
        data_generator.generate_dataset(2000)
        
    print("Loading data...")
    df = pd.read_csv("data/sample_logs.csv")
    
    X = df['log']
    y = df['category']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training model...")
    # Using TF-IDF + Random Forest
    model = make_pipeline(
        TfidfVectorizer(max_features=1000, ngram_range=(1, 2)),
        RandomForestClassifier(n_estimators=100, random_state=42)
    )
    
    model.fit(X_train, y_train)
    
    print("Evaluating model...")
    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred))
    
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_and_save()
