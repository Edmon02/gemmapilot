# Code Walkthrough

This section provides a detailed, line-by-line breakdown of the GemmaPilot codebase. We'll start with the backend, which is the heart of the project, and then move on to the frontend VS Code extension.

## Backend: `backend/server.py`

The `backend/server.py` file is a single-file FastAPI application that serves as the brain of GemmaPilot. It handles all communication with the Ollama language model and exposes a set of API endpoints that the frontend can use to perform various actions.

### Imports and Setup

```python
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import ollama
import asyncio
import json
import os
import subprocess
import re
from pathlib import Path
import mimetypes

app = FastAPI(title="GemmaPilot API", description="Advanced AI coding assistant")

# Allow CORS for VS Code extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

*   **FastAPI and Pydantic:** The code starts by importing the necessary components from FastAPI and Pydantic. FastAPI is the web framework used to build the API, and Pydantic is used for data validation and settings management.
*   **CORS Middleware:** The `CORSMiddleware` is added to the FastAPI application to allow cross-origin requests from the VS Code extension. This is a security measure that prevents other websites from making requests to the API.

### Pydantic Models

```python
class ChatRequest(BaseModel):
    # ...

class FileAnalysisRequest(BaseModel):
    # ...

class CommandRequest(BaseModel):
    # ...

class ChatResponse(BaseModel):
    # ...
```

*   **Data Validation:** A series of Pydantic models are defined to validate the data sent to and from the API. This ensures that the data is in the correct format and helps to prevent errors. For example, the `ChatRequest` model defines the expected structure of a chat request from the frontend.

### Ollama Initialization

```python
MODEL = "gemma3:4b"
try:
    ollama.pull(MODEL)
    print(f"✅ Model {MODEL} loaded successfully")
except Exception as e:
    print(f"⚠️ Warning: Could not load model {MODEL}: {e}")
```

*   **Model Loading:** The code initializes the Ollama client and attempts to pull the `gemma3:4b` model. This is the default model used by GemmaPilot, but it can be changed to any other model supported by Ollama.

### Helper Functions

```python
def get_file_content(file_path: str, max_lines: int = 500) -> str:
    # ...

def get_workspace_structure(workspace_path: str, max_depth: int = 3) -> str:
    # ...

def format_ai_response(response: str) -> str:
    # ...

def create_enhanced_prompt(request: ChatRequest) -> str:
    # ...
```

*   **Utility Functions:** A set of helper functions are defined to perform common tasks, such as reading file content, getting the workspace structure, formatting the AI's response, and creating an enhanced prompt. The `create_enhanced_prompt` function is particularly important, as it assembles the final prompt that is sent to the language model, including context from the user's workspace, the current file, and any selected code.

### API Endpoints

The `server.py` file defines a set of API endpoints that the frontend can use to interact with the backend. Here are some of the key endpoints:

*   **`GET /health`:** A simple health check endpoint that can be used to verify that the server is running.
*   **`POST /chat`:** The main chat endpoint. It receives a chat request from the frontend, creates an enhanced prompt, sends it to the language model, and then returns the AI's response.
*   **`POST /analyze_file`:** This endpoint is used to analyze a specific file. It takes a file path and an analysis type as input, and then returns an analysis of the file from the AI.
*   **`POST /execute_command`:** This endpoint is used to execute a command in the user's terminal. It includes a security check to prevent dangerous commands from being executed.
*   **`POST /complete`:** This endpoint is used for code completion. It takes a prompt, context, and language as input, and then returns a code completion from the AI.
*   **`GET /workspace_files`:** This endpoint returns a list of all the files in the user's workspace.
*   **`WEBSOCKET /ws/complete`:** A WebSocket endpoint for real-time code completion.
*   **`POST /code_action`:** This endpoint handles various code actions, such as explaining code, fixing code, optimizing code, generating tests, and generating documentation.
*   **`POST /file_operation`:** This endpoint is used to perform file operations, such as creating, reading, writing, and deleting files.

Each of these endpoints is a self-contained function that handles a specific task. They use the helper functions and the Ollama client to perform their work, and they return a JSON response to the frontend.

## Frontend: VS Code Extension

The frontend of GemmaPilot is a VS Code extension written in TypeScript. It's responsible for providing the user interface, handling user input, and communicating with the backend.

### `extension/src/extension.ts`

This is the main entry point for the extension. It's responsible for activating and deactivating the extension, registering commands, and creating the webview panel.

*   **`activate(context: vscode.ExtensionContext)`:** This function is called when the extension is activated. It registers the `GemmaPilotChatProvider`, which is responsible for creating the chat webview, and the `GemmaPilotCompletionProvider`, which provides inline code completions. It also registers the commands that can be triggered from the command palette.
*   **`deactivate()`:** This function is called when the extension is deactivated. It's a good place to clean up any resources that were allocated during activation.

### `extension/src/GemmaPilotChatProvider.ts`

This class is a `WebviewViewProvider` that is responsible for creating and managing the chat webview.

*   **`resolveWebviewView(...)`:** This method is called when the webview is first created. It sets up the webview's HTML content and registers a message listener to handle communication between the webview and the extension.
*   **Message Handling:** The `resolveWebviewView` method sets up a message listener that handles a variety of message types, such as `chat`, `attach_file`, `analyze_file`, and `execute_command`. Each of these message types is handled by a dedicated method (e.g., `handleChatMessage`, `handleFileAttachment`, etc.).
*   **`getWebviewContent()`:** This method returns the HTML content for the webview. It includes the HTML template, the JavaScript code, and the CSS styles.

### `extension/src/config.ts`

This file contains the configuration for the extension.

*   **`CONFIG`:** This constant defines the configuration for the extension, such as the backend URL, the timeout for API requests, and the maximum file size for attachments.
*   **`Utils`:** This class provides a set of utility functions, such as `sanitizeHtml` to prevent XSS attacks and `isDangerousCommand` to validate commands before execution.

### `extension/src/statusBar.ts`

This file is responsible for managing the status bar item for the extension.

*   **`StatusBarManager`:** This class creates a status bar item that shows the status of the backend connection. It periodically checks the health of the backend and updates the status bar item accordingly.

### `extension/src/types.ts`

This file contains the type definitions for the data that is passed between the frontend and the backend.

*   **Interfaces:** A set of interfaces are defined to describe the structure of the data, such as `ChatMessage`, `ResponseMessage`, `ChatRequest`, and `ChatResponse`. This helps to ensure that the data is consistent and helps to prevent errors.
