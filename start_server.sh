!/bin/bash

# Script to manage Ollama and Backend server, including killing processes.

# --- Setup and Configuration ---

# Check for required tools
if ! command -v ollama &> /dev/null
then
    echo "Error: ollama is not installed. Please install it using: helm install ollama"
    exit 1
fi

if ! command -v uvicorn &> /dev/null
then
    echo "Error: uvicorn is not installed. Please install it using: helm install uvicorn"
    exit 1
fi

if ! command -v python3 &> /dev/null
then
    echo "Error: python3 is not installed. Please install it using: helm install python3"
    exit 1
fi

# ---  Ollama Command Execution ---
echo "Running Ollama to start the server..."
ollama serve &

# --- Backend Server Command Execution ---
echo "Running Uvicorn to start the backend server..."
uvicorn ~/Document/Project/gemmapilot/backend server:app --host 0.0.0.0 --port 8000

# ---  Killing Processes ---
echo "Killing processes to stop the server..."
kill -9 $(lsof -ti :8000)  # Kill the backend server process

echo "Script completed successfully."
