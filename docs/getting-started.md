# Getting Started

This guide will walk you through the process of setting up GemmaPilot for local development.

## Prerequisites

Before you begin, ensure you have the following software installed on your system:

*   **Hardware:** A MacBook with Apple Silicon (M1/M2/M3) is recommended for optimal performance, with at least 16GB of RAM.
*   **Operating System:** macOS Ventura or later, Windows 10 or later, or a modern Linux distribution.
*   **Visual Studio Code:** Version 1.80.0 or later.
*   **Python:** Version 3.8 or later.
*   **Node.js:** Version 16 or later (for extension development).

## Installation

1.  **Install Ollama:** If you haven't already, download and install Ollama from the [official website](https://ollama.ai).

2.  **Pull a Language Model:** Open your terminal and pull a language model. We recommend starting with `codellama:7b` for a good balance of performance and capability.

    ```bash
    ollama pull codellama:7b
    ```

3.  **Install Dependencies:** Navigate to the `backend` directory and install the required Python dependencies.

    ```bash
    cd backend
    pip install -r requirements.txt
    ```

4.  **Start the Backend Server:** Once the dependencies are installed, start the FastAPI backend server.

    ```bash
    python server.py
    ```

    You should see output indicating that the server is running on `http://localhost:8000`.

5.  **Install the VS Code Extension:**
    *   Open the `extension` directory in VS Code.
    *   Install the extension dependencies using npm:
        ```bash
        npm install
        ```
    *   Press `F5` to start a new VS Code window with the GemmaPilot extension running.

6.  **Open the Chat Interface:** In the new VS Code window, open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and search for "GemmaPilot: Open Chat". This will open the chat interface in a new tab.

## Quick Start Guide

Now that you have GemmaPilot up and running, here are a few things you can try:

*   **Ask a question:** Type "Explain the `server.py` file" into the chat input and press Enter.
*   **Analyze your code:** Open a file in your workspace, select a function, and then click the "Explain Code" button in the chat interface.
*   **Get a command:** Type "How do I run the tests?" into the chat and GemmaPilot will provide you with the command. You can then click the "Run Command" button to execute it.

## Troubleshooting

If you encounter any issues during the setup process, here are a few things to check:

*   **Is the backend server running?** Open your browser and navigate to `http://localhost:8000/health`. You should see a JSON response with the status "ok".
*   **Is the VS Code extension installed correctly?** Check the "Extensions" view in VS Code to ensure that the GemmaPilot extension is enabled.
*   **Check the developer console:** If you're having issues with the chat interface, open the developer console (`Help > Toggle Developer Tools`) to check for any errors.
