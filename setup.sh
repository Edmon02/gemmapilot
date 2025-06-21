#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define project root directory
PROJECT_ROOT="$(dirname "$0")"
cd "$PROJECT_ROOT"

echo "Starting GemmaPilot setup..."

# Install Homebrew if not installed
if ! command -v brew &> /dev/null; then
    echo "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo "Homebrew installed successfully."
else
    echo "Homebrew is already installed."
fi

# Install Ollama
if ! command -v ollama &> /dev/null; then
    echo "Ollama not found. Installing Ollama..."
    brew install ollama
    echo "Ollama installed successfully."
else
    echo "Ollama is already installed."
fi

# Pull Gemma-3n 4B model
echo "Pulling Gemma-3n 4B model..."
ollama pull gemma3:4b || {
    echo "Failed to pull gemma3:4b. Attempting to pull gemma2:9b as fallback."
    ollama pull gemma2:9b || {
        echo "Failed to pull gemma2:9b. Please ensure Ollama is running and you have an internet connection."
        exit 1
    }
    echo "Successfully pulled gemma2:9b as fallback."
}
echo "Gemma model pulled successfully."

# Install Python and dependencies for backend
echo "Setting up Python backend dependencies..."
if ! command -v python3 &> /dev/null; then
    echo "Python3 not found. Installing Python3..."
    brew install python
    echo "Python3 installed successfully."
fi

python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn ollama
echo "Python backend dependencies installed."

# Install Node.js and VS Code extension dependencies
echo "Setting up Node.js and VS Code extension dependencies..."
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing Node.js..."
    brew install node
    echo "Node.js installed successfully."
fi

cd extension
npm install
cd ..
echo "Node.js and VS Code extension dependencies installed."

echo "GemmaPilot setup complete. You can now start the backend and install the VS Code extension."

# Instructions to start Ollama and backend (for user to run manually)
echo "
To start Ollama (if not already running):
ollama serve &

To start the backend server:
source venv/bin/activate
python3 backend/server.py &

To compile the VS Code extension (after testing):
cd extension
npm run compile
cd ..

To install the VS Code extension:
Open VS Code, go to Extensions (Ctrl+Shift+X or Cmd+Shift+X),
click on '...' (More Actions) -> 'Install from VSIX...',
and select 'extension/gemmapilot-0.0.1.vsix' from the project directory.
"


