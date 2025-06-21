# GemmaPilot Extension - Troubleshooting Guide

## Issues Fixed in This Update

### 1. ❌ **Buttons Not Responding**
**Problem**: Quick action buttons (Explain, Fix, Optimize, etc.) were not responding to clicks.

**Root Cause**: JavaScript syntax errors in the webview HTML due to improper template literal escaping.

**Fix Applied**: 
- Replaced malformed template literals (`\`${}\``) with proper string concatenation
- Fixed event listener attachment in the setupEventListeners function
- Ensured all DOM elements are properly referenced

### 2. ❌ **Send Button Always Disabled**
**Problem**: The send button (➤) remained disabled even when typing text.

**Root Cause**: The `updateSendButton()` function had syntax errors preventing proper execution.

**Fix Applied**:
- Fixed template literal syntax errors
- Corrected the button state logic
- Ensured input event listeners are properly attached

### 3. ❌ **JavaScript Console Errors**
**Problem**: Multiple JavaScript syntax errors were preventing the webview from functioning.

**Root Cause**: Template literals inside a template string were incorrectly escaped.

**Fix Applied**:
- Converted all template literals to string concatenation
- Fixed regular expression syntax
- Corrected DOM manipulation code

## Installation Instructions

1. **Uninstall the old version** (if installed):
   - Open VS Code
   - Go to Extensions view (Cmd+Shift+X)
   - Find "GemmaPilot" and uninstall it
   - Reload VS Code window

2. **Install the fixed version**:
   - Open Command Palette (Cmd+Shift+P)
   - Type "Extensions: Install from VSIX..."
   - Select the `gemmapilot-0.1.0.vsix` file from the extension folder
   - Reload VS Code window when prompted

3. **Verify the backend is running**:
   ```bash
   curl http://localhost:8000/health
   ```
   If the backend isn't running:
   ```bash
   cd /path/to/gemmapilot
   python backend/server.py
   ```

## Testing the Extension

### 1. **Basic Functionality Test**
1. Open the GemmaPilot panel (click the chat icon in the Activity Bar)
2. Type "hello" in the input field
3. The send button (➤) should become enabled
4. Click the send button - it should send the message

### 2. **Quick Actions Test**
1. Open a code file
2. Select some code
3. Click any of the quick action buttons (🔍 Explain, 🔧 Fix, etc.)
4. The button should respond and send a request

### 3. **Context Toggles Test**
1. Click the "📋 Selection" toggle - it should become active/inactive
2. Click the "📁 Workspace" toggle - it should become active/inactive
3. Click the "📎 Attach" toggle - it should trigger file attachment

## Debugging Tips

### 1. **Check Developer Console**
If buttons still don't work:
1. Help > Toggle Developer Tools
2. Check the Console tab for errors
3. Look for errors in the webview context

### 2. **Common Error Messages and Solutions**

**Error**: "Cannot read property 'addEventListener' of null"
**Solution**: DOM element not found - check element IDs in HTML

**Error**: "Unexpected token in template literal"
**Solution**: Template literal syntax error - this should be fixed in the update

**Error**: "vscode is not defined"
**Solution**: Webview context issue - ensure `acquireVsCodeApi()` is called

### 3. **Backend Connection Issues**

**Symptom**: Messages sent but no response received
**Check**: 
1. Backend server is running on localhost:8000
2. No CORS errors in console
3. Network requests are reaching the backend

**Test**: 
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}'
```

## Features That Should Now Work

✅ **All Quick Action Buttons**:
- 🔍 Explain Code
- 🔧 Fix Code  
- ⚡ Optimize Code
- 🧪 Generate Tests
- 📝 Generate Docs
- 📊 Analyze File

✅ **Chat Interface**:
- Text input with auto-resize
- Send button (➤) enabled when typing
- Message display with proper formatting
- Loading indicators

✅ **Context Toggles**:
- Selection toggle (📋)
- Workspace toggle (📁)  
- File attachment (📎)

✅ **Keyboard Shortcuts**:
- Enter to send message
- Shift+Enter for new line

## Still Having Issues?

If you're still experiencing problems after installing the fixed version:

1. **Clear VS Code Cache**:
   - Close VS Code
   - Delete: `~/Library/Application Support/Code/User/workspaceStorage/[workspace-hash]`
   - Restart VS Code

2. **Check Extension Host Logs**:
   - Help > Toggle Developer Tools
   - Console tab > Filter by "Extension Host"

3. **Reinstall from Source**:
   ```bash
   cd extension
   npm run compile
   vsce package --allow-star-activation
   ```

4. **Check Network Connectivity**:
   - Ensure no firewall blocking localhost:8000
   - Test backend API directly with curl

The extension should now be fully functional with responsive buttons and proper message handling!
