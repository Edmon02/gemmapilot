#!/bin/bash

echo "🧪 Testing GemmaPilot Extension - Fixed Version"
echo "============================================="

# Check if backend is running
echo "📡 Checking backend status..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Starting backend..."
    cd /Users/edmon/Documents/Projects/gemmapilot
    python backend/server.py &
    BACKEND_PID=$!
    sleep 3
    echo "✅ Backend started with PID: $BACKEND_PID"
fi

# Test API endpoint
echo "🔧 Testing chat API..."
RESPONSE=$(curl -s -X POST http://localhost:8000/chat \
    -H "Content-Type: application/json" \
    -d '{"prompt": "test"}')

if [[ $RESPONSE == *"response"* ]]; then
    echo "✅ Chat API is working"
else
    echo "❌ Chat API failed"
    echo "Response: $RESPONSE"
fi

# Check extension compilation
echo "🏗️ Checking extension compilation..."
cd /Users/edmon/Documents/Projects/gemmapilot/extension
npm run compile
if [ $? -eq 0 ]; then
    echo "✅ Extension compiled successfully"
else
    echo "❌ Extension compilation failed"
    exit 1
fi

# Check if VSIX was created
if [ -f "gemmapilot-0.1.0.vsix" ]; then
    echo "✅ Extension package (VSIX) exists"
    echo "📦 Package size: $(ls -lh gemmapilot-0.1.0.vsix | awk '{print $5}')"
else
    echo "❌ Extension package not found"
fi

echo ""
echo "🎯 Summary of fixes applied:"
echo "  1. Fixed JavaScript template literal escaping in webview HTML"
echo "  2. Corrected regular expressions in formatContent function"
echo "  3. Fixed string concatenation in message display functions"
echo "  4. Ensured all event listeners are properly attached"
echo "  5. Fixed the updateSendButton function logic"
echo ""
echo "📝 To install the fixed extension:"
echo "  1. In VS Code, open Command Palette (Cmd+Shift+P)"
echo "  2. Run 'Extensions: Install from VSIX...'"
echo "  3. Select the gemmapilot-0.1.0.vsix file"
echo "  4. Reload VS Code window"
echo "  5. The extension should now work properly with responsive buttons"
echo ""
echo "🐛 If you still experience issues:"
echo "  1. Open VS Code Developer Tools (Help > Toggle Developer Tools)"
echo "  2. Check the Console tab for any JavaScript errors"
echo "  3. Look for errors in the webview context"
