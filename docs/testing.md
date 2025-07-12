# Testing and Validation

GemmaPilot has a suite of tests to ensure that it is working correctly.

## Backend Tests

The backend tests are located in the `test_features.py` file. This file contains a set of tests that verify the functionality of the FastAPI backend.

To run the backend tests, navigate to the root directory of the project and run the following command:

```bash
python test_features.py
```

This will run a series of tests that check the following:

*   That the chat endpoint is working correctly.
*   That the code completion endpoint is working correctly.
*   That the file analysis endpoint is working correctly.
*   That the workspace file listing endpoint is working correctly.
*   That the command execution endpoint is working correctly.

## Frontend Tests

The frontend of GemmaPilot is a VS Code extension, and it can be tested using the built-in testing capabilities of VS Code. To run the frontend tests, open the `extension` directory in VS Code and press `F5`. This will open a new VS Code window with the extension running. You can then manually test the functionality of the extension.

## End-to-End Tests

In addition to the backend and frontend tests, there is also a set of end-to-end tests that verify the functionality of the entire application. These tests are located in the `test_extension.sh` script.

To run the end-to-end tests, navigate to the root directory of the project and run the following command:

```bash
./test_extension.sh
```

This will start the backend server, install the VS Code extension, and then run a series of tests that simulate user interaction with the application.
