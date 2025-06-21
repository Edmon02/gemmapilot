#!/usr/bin/env python3
"""
Enhanced Mock Backend for GemmaPilot Extension
Provides comprehensive API endpoints for testing all features
"""

from flask import Flask, request, jsonify
# from flask_cors import CORS  # Commented out for now
import json
import time
import random

app = Flask(__name__)
# CORS(app)  # Commented out for now

# Mock responses for different scenarios
MOCK_RESPONSES = {
    "general": [
        "I can help you with that! Let me analyze your code and provide suggestions.",
        "Based on your code, I notice a few things that could be improved.",
        "Here's what I understand from your request. Let me provide some guidance.",
        "Great question! Let me break this down for you step by step.",
    ],
    "explain": [
        "This code implements a {language} function that {functionality}. Here's how it works:\n\n1. **Input**: {input_description}\n2. **Processing**: {process_description}\n3. **Output**: {output_description}",
        "Looking at this {language} code:\n\n• **Purpose**: {purpose}\n• **Logic Flow**: {flow}\n• **Key Components**: {components}",
    ],
    "fix": [
        "I found several issues in your code that can be fixed:\n\n🔧 **Issues Found:**\n• Missing error handling\n• Potential memory leaks\n• Unused variables\n\n**Suggested Fixes:**\n```{language}\n{fixed_code}\n```",
        "Here are the problems I detected and their solutions:\n\n❌ **Problems:**\n1. Logic error in condition\n2. Missing null checks\n3. Performance bottleneck\n\n✅ **Solutions:**\n{solutions}",
    ],
    "optimize": [
        "I can optimize your code for better performance:\n\n⚡ **Optimizations:**\n• Use more efficient data structures\n• Reduce time complexity\n• Minimize memory allocation\n\n**Optimized Code:**\n```{language}\n{optimized_code}\n```",
        "Here's how to make your code more efficient:\n\n🚀 **Performance Improvements:**\n1. Algorithm optimization\n2. Memory usage reduction\n3. Better caching strategy",
    ],
    "tests": [
        "Here are comprehensive tests for your code:\n\n🧪 **Test Cases:**\n```{language}\n{test_code}\n```\n\n**Coverage:**\n• Unit tests: ✅\n• Edge cases: ✅\n• Error scenarios: ✅",
        "I'll generate test cases covering:\n\n📋 **Test Suite:**\n1. Happy path scenarios\n2. Edge cases\n3. Error conditions\n4. Performance tests",
    ],
    "docs": [
        "Here's comprehensive documentation for your code:\n\n📖 **Documentation:**\n```markdown\n{documentation}\n```\n\n**Includes:**\n• Function descriptions\n• Parameter details\n• Return values\n• Usage examples",
        "I'll create detailed documentation:\n\n📝 **Documentation Elements:**\n• API reference\n• Code examples\n• Best practices\n• Common pitfalls",
    ]
}

def get_mock_response(action, language="javascript", code=""):
    """Generate appropriate mock response based on action"""
    responses = MOCK_RESPONSES.get(action, MOCK_RESPONSES["general"])
    response = random.choice(responses)
    
    # Simple template replacement
    replacements = {
        "{language}": language.title(),
        "{functionality}": "data processing and validation",
        "{input_description}": "User input parameters",
        "{process_description}": "Data transformation and business logic",
        "{output_description}": "Processed results",
        "{purpose}": "Handle user interactions efficiently",
        "{flow}": "Input → Validation → Processing → Output",
        "{components}": "Input handlers, validators, processors",
        "{fixed_code}": "// Fixed version with proper error handling\ntry {\n    // Your improved code here\n} catch (error) {\n    console.error('Error:', error);\n}",
        "{solutions}": "• Add null checks\n• Implement proper error handling\n• Optimize loops",
        "{optimized_code}": "// Optimized version\nconst optimizedFunction = (data) => {\n    // More efficient implementation\n    return processedData;\n};",
        "{test_code}": "describe('Your Function', () => {\n    it('should handle valid input', () => {\n        expect(yourFunction(validInput)).toBe(expectedOutput);\n    });\n});",
        "{documentation}": "# Function Name\n\n## Description\nThis function performs...\n\n## Parameters\n- `param1` (string): Description\n\n## Returns\n- Returns processed data"
    }
    
    for key, value in replacements.items():
        response = response.replace(key, value)
    
    return response

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": time.time()})

@app.route('/chat', methods=['POST'])
def chat():
    """Main chat endpoint"""
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        language = data.get('language', 'javascript')
        
        print(f"💬 Chat request: {prompt[:100]}...")
        
        # Simulate thinking time
        time.sleep(0.5)
        
        # Generate response based on prompt keywords
        if any(word in prompt.lower() for word in ['explain', 'what does', 'how does']):
            response = get_mock_response('explain', language)
        elif any(word in prompt.lower() for word in ['fix', 'error', 'bug', 'problem']):
            response = get_mock_response('fix', language)
        elif any(word in prompt.lower() for word in ['optimize', 'improve', 'performance']):
            response = get_mock_response('optimize', language)
        elif any(word in prompt.lower() for word in ['test', 'testing', 'unit test']):
            response = get_mock_response('tests', language)
        elif any(word in prompt.lower() for word in ['document', 'docs', 'documentation']):
            response = get_mock_response('docs', language)
        else:
            response = random.choice(MOCK_RESPONSES['general'])
        
        suggestions = [
            "Explain this code section",
            "Find potential issues",
            "Optimize for performance",
            "Generate unit tests",
            "Add documentation"
        ]
        
        commands = []
        if 'install' in prompt.lower():
            commands = ["npm install", "yarn install"]
        elif 'test' in prompt.lower():
            commands = ["npm test", "yarn test"]
        elif 'build' in prompt.lower():
            commands = ["npm run build", "yarn build"]
        
        return jsonify({
            "response": response,
            "content": response,
            "suggestions": suggestions[:3],  # Limit suggestions
            "commands": commands,
            "code_blocks": [],
            "timestamp": time.time()
        })
        
    except Exception as e:
        print(f"❌ Chat error: {e}")
        return jsonify({"error": "Failed to process chat request"}), 500

@app.route('/complete', methods=['POST'])
def completion():
    """Code completion endpoint"""
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        language = data.get('language', 'javascript')
        
        print(f"🔄 Completion request for: {prompt}")
        
        # Simple completion logic
        completions = {
            'function': ' (params) {\n    // Implementation here\n    return result;\n}',
            'const': ' = value;',
            'let': ' = value;',
            'var': ' = value;',
            'if': ' (condition) {\n    // Code block\n}',
            'for': ' (let i = 0; i < array.length; i++) {\n    // Loop body\n}',
            'import': ' { Component } from "library";',
            'class': ' ClassName {\n    constructor() {\n        // Initialize\n    }\n}'
        }
        
        completion = ""
        for keyword, template in completions.items():
            if keyword in prompt.lower():
                completion = template
                break
        
        if not completion and len(prompt.strip()) > 2:
            completion = " // Auto-generated suggestion"
        
        return jsonify({
            "completion": completion,
            "confidence": 0.8 if completion else 0.1
        })
        
    except Exception as e:
        print(f"❌ Completion error: {e}")
        return jsonify({"completion": "", "confidence": 0})

@app.route('/analyze', methods=['POST'])
def analyze_file():
    """File analysis endpoint"""
    try:
        data = request.get_json()
        file_path = data.get('file_path', '')
        content = data.get('content', '')
        language = data.get('language', 'javascript')
        
        print(f"📊 Analyzing file: {file_path}")
        
        # Mock analysis
        file_name = file_path.split('/')[-1] if file_path else 'current file'
        
        issues = [
            "Unused variable on line 15",
            "Missing error handling in function",
            "Potential memory leak detected",
            "Consider using const instead of let"
        ]
        
        analysis = f"""
**File Overview:**
• Language: {language.title()}
• Lines of code: {len(content.split(chr(10))) if content else 'N/A'}
• Functions detected: 3
• Complexity: Medium

**Issues Found:**
{chr(10).join(f'• {issue}' for issue in issues[:2])}

**Suggestions:**
• Add TypeScript for better type safety
• Implement proper error handling
• Consider breaking down large functions
• Add comprehensive comments

**Quality Score: 7.5/10**
"""
        
        return jsonify({
            "analysis": analysis,
            "file_name": file_name,
            "suggestions": [
                "Add error handling",
                "Improve code organization",
                "Add type annotations",
                "Write unit tests"
            ],
            "issues": issues[:2]
        })
        
    except Exception as e:
        print(f"❌ Analysis error: {e}")
        return jsonify({"error": "Failed to analyze file"}), 500

@app.route('/code_action', methods=['POST'])
def code_action():
    """Code action endpoint (explain, fix, optimize, etc.)"""
    try:
        data = request.get_json()
        action = data.get('action', 'explain')
        code = data.get('code', '')
        language = data.get('language', 'javascript')
        
        print(f"🔧 Code action: {action} for {language}")
        
        result = get_mock_response(action, language, code)
        
        code_blocks = []
        if action in ['fix', 'optimize', 'generate_tests']:
            example_code = f"// {action.title()} result\\nfunction example() {{\\n    // Generated code here\\n    return result;\\n}}"
            code_blocks = [{
                "language": language,
                "code": example_code
            }]
        
        return jsonify({
            "result": result,
            "action": action,
            "code_blocks": code_blocks,
            "suggestions": [
                f"Learn more about {action}",
                f"Apply {action} to other files",
                f"Review {action} results"
            ]
        })
        
    except Exception as e:
        print(f"❌ Code action error: {e}")
        return jsonify({"error": f"Failed to {action} code"}), 500

@app.route('/execute_command', methods=['POST'])
def execute_command():
    """Command execution endpoint"""
    try:
        data = request.get_json()
        command = data.get('command', '')
        
        print(f"⚡ Executing command: {command}")
        
        # Mock command execution
        mock_outputs = {
            'npm install': 'added 150 packages from 850 contributors',
            'npm test': 'Test Suites: 5 passed, 5 total\nTests: 25 passed, 25 total',
            'git status': 'On branch main\nYour branch is up to date',
            'ls': 'file1.js  file2.ts  package.json  README.md',
            'pwd': '/Users/developer/project'
        }
        
        output = mock_outputs.get(command, f"Command '{command}' executed successfully")
        
        return jsonify({
            "output": output,
            "error": "",
            "exit_code": 0,
            "command": command
        })
        
    except Exception as e:
        print(f"❌ Command execution error: {e}")
        return jsonify({"error": "Failed to execute command"}), 500

if __name__ == '__main__':
    print("🚀 Starting GemmaPilot Mock Backend...")
    print("📡 Available endpoints:")
    print("   • GET  /health - Health check")
    print("   • POST /chat - Chat completions")
    print("   • POST /complete - Code completions")
    print("   • POST /analyze - File analysis")
    print("   • POST /code_action - Code actions")
    print("   • POST /execute_command - Command execution")
    print("\n🌐 Server running on http://localhost:8001")
    
    app.run(host='0.0.0.0', port=8001, debug=True)
