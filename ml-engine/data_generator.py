import pandas as pd
import random
import os

CATEGORIES = [
    "Build Failure",
    "Test Failure",
    "Dependency Error",
    "Environment Issue",
    "Timeout Failure",
    "Flaky Test",
    "Network Failure",
    "Container Crash",
    "Permission Error"
]

LOG_TEMPLATES = {
    "Build Failure": [
        "error: expected ';' before '}' token",
        "make: *** [all] Error 2",
        "SyntaxError: Unexpected token",
        "ModuleNotFoundError: No module named 'src.utils'",
        "error: ISO C++ forbids comparison between pointer and integer",
        "TS2322: Type 'string' is not assignable to type 'number'."
    ],
    "Test Failure": [
        "FAIL src/components/App.test.tsx",
        "Expected value to equal: 5 Received: 4",
        "AssertionError: expected False to be True",
        "test_user_auth_failed: user is not authenticated",
        "Error: expect(received).toBe(expected)"
    ],
    "Dependency Error": [
        "npm ERR! code ERESOLVE",
        "npm ERR! peerDependencies WARNING",
        "pip: No matching distribution found for numpy==99.9.9",
        "Could not resolve dependencies for project",
        "Failed to load resource: net::ERR_NAME_NOT_RESOLVED",
        "Missing dependency: left-pad is not installed"
    ],
    "Environment Issue": [
        "Error: Missing environment variable DB_PASSWORD",
        "FileNotFoundError: [Errno 2] No such file or directory: '/etc/config.json'",
        "Cannot read property 'url' of undefined from process.env",
        "Exception: AWS_REGION is not set",
        "Configuration Error: Invalid JSON in config.yaml"
    ],
    "Timeout Failure": [
        "Error: Timeout of 5000ms exceeded. For async tests and hooks, ensure \"done()\" is called",
        "Job terminated: Exceeded maximum allowed runtime",
        "Request timeout while fetching https://api.github.com",
        "Gateway Timeout: 504",
        "Connection timed out after 30000 milliseconds"
    ],
    "Flaky Test": [
        "Randomised test failed, check seed 12345",
        "Test passed on retry 2",
        "Intermittent failure in test_network_connection",
        "AssertionError: timestamp mismatch (flaky)",
        "WARN: Test execution time varied by more than 50%"
    ],
    "Network Failure": [
        "ECONNREFUSED: Connection refused by 127.0.0.1:5432",
        "socket hang up",
        "urllib.error.URLError: <urlopen error [Errno 111] Connection refused>",
        "Failed to connect to repository: Could not resolve host",
        "Network is unreachable"
    ],
    "Container Crash": [
        "OOMKilled: Container exited with code 137",
        "Segmentation fault (core dumped)",
        "docker run failed: container crashed unexpectedly",
        "Error response from daemon: container cannot be started",
        "panic: runtime error: invalid memory address or nil pointer dereference"
    ],
    "Permission Error": [
        "EACCES: permission denied, open '/var/log/app.log'",
        "chmod: changing permissions of 'script.sh': Operation not permitted",
        "403 Forbidden: Access denied",
        "User does not have permission to execute this action",
        "AccessDeniedException: User is not authorized to perform: iam:PassRole"
    ]
}

def generate_dataset(num_samples=1000):
    data = []
    for _ in range(num_samples):
        category = random.choice(CATEGORIES)
        template = random.choice(LOG_TEMPLATES[category])
        
        # Add some random noise to simulate real logs
        noise = f" [INFO] Thread-{random.randint(1,10)} executing task " if random.random() > 0.5 else " "
        log = f"[{random.randint(1000, 9999)}] {noise}{template} - Execution ID {random.randint(10000,99999)}"
        data.append({"log": log, "category": category})
        
    df = pd.DataFrame(data)
    os.makedirs("data", exist_ok=True)
    df.to_csv("data/sample_logs.csv", index=False)
    print(f"Generated {num_samples} samples in data/sample_logs.csv")

if __name__ == "__main__":
    generate_dataset()
