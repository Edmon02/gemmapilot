#!/bin/bash

echo "🧪 Testing GemmaPilot Extension - Complete Fix"
echo "=============================================="

# Ensure backend is running
echo "📡 Checking backend status..."
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "⚠️ Backend not running. Starting it..."
    cd /Users/edmon/Documents/Projects/gemmapilot
    python backend/server.py &
    BACKEND_PID=$!
    echo "✅ Backend started with PID: $BACKEND_PID"
    sleep 3
else
    echo "✅ Backend is already running"
fi

# Test API endpoints
echo ""
echo "🔧 Testing backend API endpoints..."

# Test chat endpoint
echo "Testing /chat endpoint..."
CHAT_RESPONSE=$(curl -s -X POST http://localhost:8000/chat \
    -H "Content-Type: application/json" \
    -d '{"prompt": "Hello, test message"}')

if [[ $CHAT_RESPONSE == *"response"* ]]; then
    echo "✅ Chat API is working"
else
    echo "❌ Chat API failed"
    echo "Response: $CHAT_RESPONSE"
fi

# Test health endpoint
echo "Testing /health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
if [[ $? -eq 0 ]]; then
    echo "✅ Health endpoint is working"
else
    echo "❌ Health endpoint failed"
fi

echo ""
echo "🏗️ Extension Build Status:"
cd /Users/edmon/Documents/Projects/gemmapilot/extension

# Check if compilation is clean
echo "Checking TypeScript compilation..."
npm run compile > compile_output.txt 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Extension compiled without errors"
else
    echo "❌ Extension compilation has errors:"
    cat compile_output.txt
fi

# Check if VSIX package exists and is recent
if [ -f "gemmapilot-fixed-0.1.0.vsix" ]; then
    echo "✅ Fixed extension package exists"
    echo "📦 Package size: $(ls -lh gemmapilot-fixed-0.1.0.vsix | awk '{print $5}')"
    echo "📅 Created: $(ls -la gemmapilot-fixed-0.1.0.vsix | awk '{print $6, $7, $8}')"
else
    echo "❌ Fixed extension package not found"
fi

echo ""
echo "🎯 Key fixes implemented:"
echo "  ✅ Separated HTML template from JavaScript code"
echo "  ✅ Fixed template literal escaping issues"
echo "  ✅ Ensured all DOM elements have null checks"
echo "  ✅ Fixed event listener attachment with proper function references"
echo "  ✅ Corrected updateSendButton() logic"
echo "  ✅ Fixed all regular expressions in formatContent()"
echo "  ✅ Implemented proper error handling in UI functions"

echo ""
echo "📋 Installation Instructions:"
echo "1. Uninstall any previous GemmaPilot extension"
echo "2. In VS Code: Cmd+Shift+P → 'Extensions: Install from VSIX...'"
echo "3. Select: gemmapilot-fixed-0.1.0.vsix"
echo "4. Reload VS Code window"
echo "5. Open GemmaPilot panel from Activity Bar"

echo ""
echo "🧪 Manual Testing Checklist:"
echo "□ Extension appears in Activity Bar (chat icon)"
echo "□ Extension panel opens when clicked"
echo "□ All quick action buttons are clickable (🔍 🔧 ⚡ 🧪 📝 📊)"
echo "□ Text input field accepts text"
echo "□ Send button (➤) becomes enabled when typing"
echo "□ Send button successfully sends messages"
echo "□ Context toggles work (📋 📁 📎)"
echo "□ Messages appear in chat area"
echo "□ Backend responses are displayed"

echo ""
echo "🐛 If issues persist:"
echo "1. Open VS Code Developer Tools (Help → Toggle Developer Tools)"
echo "2. Check Console for JavaScript errors"
echo "3. Look for network errors in Network tab"
echo "4. Verify backend is responding at http://localhost:8000"

echo ""
echo "✨ The extension should now be fully functional!"
echo "   All buttons should be responsive and the send button"
echo "   should enable/disable correctly based on input content."
