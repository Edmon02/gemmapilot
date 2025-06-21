#!/bin/bash

echo "🧪 GemmaPilot Final Comprehensive Test"
echo "======================================="

# Test backend health
echo "1. Testing Backend Health..."
response=$(curl -s http://localhost:8001/health)
if [[ $? -eq 0 ]]; then
    echo "✅ Backend is healthy: $response"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Test chat endpoint
echo -e "\n2. Testing Chat Endpoint..."
response=$(curl -s -X POST http://localhost:8001/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "Hello, this is a test message"}')
if [[ $response == *"response"* ]]; then
    echo "✅ Chat endpoint working"
    echo "   Response: $(echo $response | jq -r '.response' | head -c 50)..."
else
    echo "❌ Chat endpoint failed"
    echo "   Response: $response"
fi

# Test code action endpoint
echo -e "\n3. Testing Code Action Endpoint..."
response=$(curl -s -X POST http://localhost:8001/code_action \
    -H "Content-Type: application/json" \
    -d '{"action": "explain", "code": "def hello():\n    print(\"Hello World\")", "language": "python"}')
if [[ $response == *"explanation"* ]]; then
    echo "✅ Code action endpoint working"
    echo "   Explanation: $(echo $response | jq -r '.explanation' | head -c 50)..."
else
    echo "❌ Code action endpoint failed"
    echo "   Response: $response"
fi

# Test command execution endpoint
echo -e "\n4. Testing Command Execution Endpoint..."
response=$(curl -s -X POST http://localhost:8001/execute_command \
    -H "Content-Type: application/json" \
    -d '{"command": "echo test"}')
if [[ $response == *"success"* ]]; then
    echo "✅ Command execution endpoint working"
    echo "   Result: $(echo $response | jq -r '.output' | head -c 50)..."
else
    echo "❌ Command execution endpoint failed"
    echo "   Response: $response"
fi

# Test different code actions
echo -e "\n5. Testing All Code Actions..."
actions=("explain" "fix" "optimize" "generate_tests" "generate_docs")
for action in "${actions[@]}"; do
    response=$(curl -s -X POST http://localhost:8001/code_action \
        -H "Content-Type: application/json" \
        -d "{\"action\": \"$action\", \"code\": \"def test(): pass\", \"language\": \"python\"}")
    if [[ $response == *"$action"* || $response == *"explanation"* || $response == *"suggestion"* ]]; then
        echo "✅ $action action working"
    else
        echo "❌ $action action failed"
    fi
done

# Test file analysis
echo -e "\n6. Testing File Analysis Endpoint..."
response=$(curl -s -X POST http://localhost:8001/analyze \
    -H "Content-Type: application/json" \
    -d '{"code": "def hello():\n    print(\"Hello\")", "language": "python"}')
if [[ $response == *"suggestions"* ]]; then
    echo "✅ File analysis endpoint working"
else
    echo "❌ File analysis endpoint failed"
    echo "   Response: $response"
fi

echo -e "\n🎉 Backend Testing Complete!"
echo "📦 Extension package ready: gemmapilot-final-0.1.0.vsix"
echo -e "\n📋 Installation Instructions:"
echo "1. Open VS Code"
echo "2. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)"
echo "3. Type 'Extensions: Install from VSIX...'"
echo "4. Select the gemmapilot-final-0.1.0.vsix file"
echo "5. Reload VS Code when prompted"
echo -e "\n🔧 Manual Testing Steps:"
echo "- Open a code file and try code actions (right-click → GemmaPilot)"
echo "- Open the GemmaPilot chat panel and send messages"
echo "- Test quick action buttons in the chat interface"
echo "- Verify file creation and command execution prompts appear"
