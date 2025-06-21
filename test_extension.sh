#!/bin/bash

# GemmaPilot Extension Test Script
echo "🚀 Testing GemmaPilot Extension Setup..."

# Test backend health
echo "📡 Testing backend health..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding properly"
    echo "Response: $HEALTH_RESPONSE"
    exit 1
fi

# Test chat endpoint
echo "💬 Testing chat endpoint..."
CHAT_RESPONSE=$(curl -s -X POST http://localhost:8000/chat -H "Content-Type: application/json" -d '{"prompt":"Test"}')
if [[ $CHAT_RESPONSE == *"response"* ]]; then
    echo "✅ Chat endpoint is working"
else
    echo "❌ Chat endpoint is not working"
    echo "Response: $CHAT_RESPONSE"
    exit 1
fi

# Check if extension files exist
echo "📦 Checking extension files..."
if [ -f "/Users/edmon/Documents/Projects/gemmapilot/extension/gemmapilot-0.1.0.vsix" ]; then
    echo "✅ VSIX package exists"
else
    echo "❌ VSIX package not found"
    exit 1
fi

if [ -d "/Users/edmon/Documents/Projects/gemmapilot/extension/out" ]; then
    echo "✅ Compiled TypeScript files exist"
else
    echo "❌ Compiled TypeScript files not found"
    exit 1
fi

echo "🎉 All tests passed! Extension should work properly."
echo ""
echo "📝 Next steps:"
echo "1. Install the extension: code --install-extension /Users/edmon/Documents/Projects/gemmapilot/extension/gemmapilot-0.1.0.vsix"
echo "2. Reload VS Code"
echo "3. Look for the GemmaPilot icon in the Activity Bar"
echo "4. Open the GemmaPilot view and test the chat functionality"
