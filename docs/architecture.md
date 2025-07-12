# Architecture Overview

GemmaPilot is designed with a classic client-server architecture, which provides a clean separation of concerns between the user interface and the backend logic. This architecture allows for a high degree of flexibility and scalability.

## High-Level Architecture

The project is composed of two main components:

1.  **VS Code Extension (Frontend):** This is the client-side component that runs within Visual Studio Code. It's responsible for providing the user interface, capturing user input, and communicating with the backend. The UI is built using a WebView, which allows for the use of standard web technologies (HTML, CSS, JavaScript) to create a rich and interactive experience.

2.  **FastAPI Backend (Backend):** This is the server-side component that handles the core logic of the application. It's responsible for processing user requests, interacting with the Ollama language model, and sending responses back to the frontend.

Here's a diagram that illustrates the high-level architecture:

```mermaid
graph TD;
    A[VS Code Extension] -->|HTTP/REST| B(FastAPI Backend);
    B --> C{Ollama (Local LLM)};
```

## Directory Structure

The project is organized into the following directory structure:

```
gemmapilot/
├── docs/                     # Documentation files
├── backend/                  # FastAPI backend
│   └── server.py             # Main server logic
└── extension/                # VS Code extension
    ├── src/                  # TypeScript source code
    │   ├── extension.ts      # Main extension logic
    │   ├── webview.ts        # Logic for the chat webview
    │   └── ...
    ├── package.json          # Extension manifest
    └── ...
```

*   `docs/`: Contains all of the project documentation.
*   `backend/`: Contains the Python code for the FastAPI backend.
    *   `server.py`: The main entry point for the backend server. It defines the API endpoints and handles all communication with the Ollama language model.
*   `extension/`: Contains the TypeScript code for the VS Code extension.
    *   `src/`: The source code for the extension.
        *   `extension.ts`: The main entry point for the extension. It's responsible for registering commands, creating the webview panel, and managing the extension's state.
        *   `webview.ts`: Contains the logic for creating and managing the chat webview.
    *   `package.json`: The manifest file for the extension. It defines the extension's metadata, such as its name, version, and contributions.

## Design Patterns

GemmaPilot employs several design patterns to ensure a clean and maintainable codebase:

*   **Singleton:** The `ExtensionState` class in the VS Code extension is implemented as a singleton. This ensures that there's only one instance of the extension's state, which is shared across all components of the extension.
*   **Factory:** The `WebviewPanelFactory` class is used to create instances of the webview panel. This allows for a clean separation between the creation of the panel and its implementation.
*   **Observer:** The VS Code extension API makes extensive use of the observer pattern. For example, the `onDidChangeTextDocument` event is used to notify the extension when a document has been changed. This allows the extension to react to events in the editor without having to constantly poll for changes.
