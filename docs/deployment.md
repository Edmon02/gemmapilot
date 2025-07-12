# Deployment and Maintenance

This section provides instructions for deploying and maintaining GemmaPilot.

## Deployment

GemmaPilot is designed to be run locally on your own machine. However, it is also possible to deploy it to a server so that it can be accessed by multiple users.

### Backend

The backend is a standard FastAPI application, and it can be deployed to any server that supports Python. Here are a few options:

*   **Heroku:** Heroku is a popular platform for deploying web applications. You can deploy the backend to Heroku using the `git` command-line tool.
*   **AWS:** Amazon Web Services (AWS) is a cloud computing platform that provides a variety of services for deploying and managing web applications. You can deploy the backend to AWS using the Elastic Beanstalk service.
*   **Docker:** You can also deploy the backend using Docker. A `Dockerfile` is not included in the project, but you can create one yourself.

### Frontend

The frontend is a VS Code extension, and it can be deployed to the Visual Studio Code Marketplace. To do so, you will need to create a publisher account and then use the `vsce` command-line tool to package and publish the extension.

## Maintenance

### Updating the AI Model

The AI model is the heart of GemmaPilot, and it's important to keep it up to date. To update the model, simply change the `MODEL` variable in the `backend/server.py` file to the name of the new model.

### Monitoring the Backend

It's a good idea to monitor the backend to ensure that it is running correctly. You can use a tool like `pm2` or `supervisor` to monitor the backend process and automatically restart it if it crashes.

### Troubleshooting

If you encounter any issues with GemmaPilot, here are a few things to check:

*   **Is the backend server running?** Open your browser and navigate to `http://localhost:8000/health`. You should see a JSON response with the status "ok".
*   **Is the VS Code extension installed correctly?** Check the "Extensions" view in VS Code to ensure that the GemmaPilot extension is enabled.
*   **Check the developer console:** If you're having issues with the chat interface, open the developer console (`Help > Toggle Developer Tools`) to check for any errors.
