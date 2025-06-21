#!/usr/bin/env python3
"""
Test script for GemmaPilot features
Tests all backend endpoints and functionality
"""

import requests
import json
import os
import sys

BASE_URL = "http://localhost:8000"

def test_chat():
    """Test basic chat functionality"""
    print("Testing chat endpoint...")
    data = {
        "prompt": "Explain what a Python function is",
        "context": "Learning Python basics"
    }
    response = requests.post(f"{BASE_URL}/chat", json=data)
    if response.status_code == 200:
        result = response.json()
        print("✓ Chat endpoint working")
        print(f"Response length: {len(result['response'])} characters")
        return True
    else:
        print(f"✗ Chat endpoint failed: {response.status_code}")
        return False

def test_code_completion():
    """Test code completion"""
    print("\nTesting code completion...")
    data = {
        "code": "def fibonacci(",
        "language": "python"
    }
    response = requests.post(f"{BASE_URL}/complete", json=data)
    if response.status_code == 200:
        result = response.json()
        print("✓ Code completion working")
        print(f"Completion: {result['completion'][:100]}...")
        return True
    else:
        print(f"✗ Code completion failed: {response.status_code}")
        return False

def test_file_analysis():
    """Test file analysis"""
    print("\nTesting file analysis...")
    
    # Create a test file
    test_file = "/tmp/test_analysis.py"
    with open(test_file, "w") as f:
        f.write("""
def hello_world():
    '''A simple greeting function'''
    print("Hello, World!")
    return "greeting"

class Calculator:
    def __init__(self):
        self.result = 0
    
    def add(self, x, y):
        return x + y

if __name__ == "__main__":
    hello_world()
    calc = Calculator()
    print(calc.add(2, 3))
""")
    
    data = {
        "file_path": test_file,
        "analysis_type": "overview"
    }
    response = requests.post(f"{BASE_URL}/analyze_file", json=data)
    if response.status_code == 200:
        result = response.json()
        print("✓ File analysis working")
        print(f"Analysis: {result['analysis'][:200]}...")
        # Cleanup
        os.remove(test_file)
        return True
    else:
        print(f"✗ File analysis failed: {response.status_code}")
        if os.path.exists(test_file):
            os.remove(test_file)
        return False

def test_workspace_files():
    """Test workspace file listing"""
    print("\nTesting workspace file listing...")
    params = {
        "workspace_path": "/Users/edmon/Documents/Projects/gemmapilot"
    }
    response = requests.get(f"{BASE_URL}/workspace_files", params=params)
    if response.status_code == 200:
        result = response.json()
        print("✓ Workspace file listing working")
        print(f"Found {len(result['files'])} files")
        print("Sample files:", result['files'][:5])
        return True
    else:
        print(f"✗ Workspace file listing failed: {response.status_code}")
        return False

def test_command_execution():
    """Test command execution"""
    print("\nTesting command execution...")
    data = {
        "command": "echo 'Hello from GemmaPilot!'",
        "workspace_path": "/Users/edmon/Documents/Projects/gemmapilot",
        "explanation": "Test echo command"
    }
    response = requests.post(f"{BASE_URL}/execute_command", json=data)
    if response.status_code == 200:
        result = response.json()
        print("✓ Command execution working")
        print(f"Output: {result['stdout'].strip()}")
        return True
    else:
        print(f"✗ Command execution failed: {response.status_code}")
        return False

def main():
    """Run all tests"""
    print("🚀 GemmaPilot Backend Feature Tests")
    print("=" * 40)
    
    tests = [
        test_chat,
        test_code_completion,
        test_file_analysis,
        test_workspace_files,
        test_command_execution
    ]
    
    passed = 0
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"✗ Test failed with exception: {e}")
    
    print("\n" + "=" * 40)
    print(f"Tests passed: {passed}/{len(tests)}")
    
    if passed == len(tests):
        print("🎉 All tests passed! GemmaPilot is ready to go!")
    else:
        print("⚠️  Some tests failed. Check the backend configuration.")
    
    return passed == len(tests)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
