# Overview

Welcome to GemmaPilot, a powerful AI coding assistant that runs entirely on your local machine. This project was born out of a desire to create a tool with the power and convenience of GitHub Copilot, but with the privacy and security that can only be achieved by keeping your code on your own machine.

## Why This Project Exists

In an era where AI-powered development tools are becoming increasingly prevalent, there's a growing concern about the privacy and security of our code. Many of these tools send your code to the cloud for processing, which can be a deal-breaker for developers working on sensitive projects or those who simply prefer to keep their data private.

GemmaPilot was created to address this concern. It provides a powerful set of AI-powered features, including code completion, chat, and file analysis, without ever sending your code to the cloud. It leverages the power of local language models through Ollama, so you can have the best of both worlds: a powerful AI assistant and complete control over your data.

This project is for any developer who values privacy and security, and for those who want to harness the power of AI without compromising their principles. It's for the self-hosters, the security-conscious, and anyone who believes that your code should be yours and yours alone.

## Tech Stack

GemmaPilot is built on a modern, robust tech stack:

*   **Backend:** [FastAPI](https://fastapi.tiangolo.com/), a high-performance Python web framework, serves as the backbone of the project, handling all communication with the local language model.
*   **Frontend:** The user interface is a [VS Code extension](https://code.visualstudio.com/api) built with [TypeScript](https://www.typescriptlang.org/), providing a seamless and integrated experience within your favorite editor.
*   **AI Model:** GemmaPilot uses [Ollama](https://ollama.ai/) to run large language models locally. This allows you to choose the model that best suits your needs and hardware.
*   **Communication:** The frontend and backend communicate via a REST API, ensuring a clean separation of concerns and a scalable architecture.
