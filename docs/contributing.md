# Contributing Guide

We welcome contributions from the community! If you'd like to contribute to GemmaPilot, please follow these guidelines.

## Getting Started

1.  Fork the repository on GitHub.
2.  Clone your fork to your local machine.
3.  Create a new branch for your changes.
4.  Make your changes and commit them to your branch.
5.  Push your branch to your fork on GitHub.
6.  Create a pull request to the `main` branch of the original repository.

## Coding Standards

*   **Python:** We follow the [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide for Python code.
*   **TypeScript:** We follow the [standard](https://github.com/standard/standard) style guide for TypeScript code.

## Commit Message Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for our commit messages. This helps us to maintain a clear and consistent commit history.

Each commit message should consist of a **header**, a **body**, and a **footer**.

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

*   **Type:** The type of the commit, such as `feat` for a new feature, `fix` for a bug fix, or `docs` for documentation changes.
*   **Scope:** The scope of the commit, such as `backend`, `frontend`, or `docs`.
*   **Subject:** A short, imperative-style description of the change.
*   **Body:** A more detailed explanation of the change.
*   **Footer:** Any breaking changes or issue references.

## How to Add a Feature

Here's a quick tutorial on how to add a new feature to GemmaPilot.

1.  **Create a new branch:**

    ```bash
    git checkout -b feat/my-new-feature
    ```

2.  **Add a new API endpoint to the backend:**

    Open the `backend/server.py` file and add a new API endpoint. For example:

    ```python
    @app.get("/my-new-feature")
    async def my_new_feature():
        return {"message": "This is my new feature!"}
    ```

3.  **Add a new message handler to the frontend:**

    Open the `extension/src/extension.ts` file and add a new message handler to the `resolveWebviewView` method. For example:

    ```typescript
    case 'my_new_feature':
        const response = await makeRequest(`${CONFIG.backendUrl}/my-new-feature`);
        if (response.ok) {
            const data = await response.json();
            webviewView.webview.postMessage({
                type: 'response',
                content: data.message,
            });
        }
        break;
    ```

4.  **Add a new button to the chat interface:**

    Open the `extension/src/extension.ts` file and add a new button to the `getHtmlTemplate` method. For example:

    ```html
    <button class="quick-action-btn" id="my-new-feature-btn">
        My New Feature
    </button>
    ```

5.  **Add a new event listener to the chat interface:**

    Open the `extension/src/extension.ts` file and add a new event listener to the `getJavaScriptContent` method. For example:

    ```javascript
    document.getElementById('my-new-feature-btn').addEventListener('click', () => {
        vscode.postMessage({ type: 'my_new_feature' });
    });
    ```

6.  **Commit your changes:**

    ```bash
    git commit -m "feat(frontend): add my new feature"
    ```

7.  **Push your changes to your fork:**

    ```bash
    git push origin feat/my-new-feature
    ```

8.  **Create a pull request:**

    Go to the GitHub website and create a pull request to the `main` branch of the original repository.
