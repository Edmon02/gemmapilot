from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import ollama
import asyncio
import json
import os
import subprocess
import re
from pathlib import Path
import mimetypes

app = FastAPI(title="GemmaPilot API", description="Advanced AI coding assistant")

# Allow CORS for VS Code extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class ChatRequest(BaseModel):
    prompt: str
    context: Optional[str] = ""
    workspace_path: Optional[str] = ""
    current_file: Optional[str] = ""
    selection: Optional[str] = ""
    files: Optional[List[Dict[str, str]]] = []

class FileAnalysisRequest(BaseModel):
    file_path: str
    workspace_path: Optional[str] = ""
    analysis_type: str = "overview"  # overview, issues, suggestions, dependencies

class CommandRequest(BaseModel):
    command: str
    workspace_path: str
    explanation: Optional[str] = ""

class ChatResponse(BaseModel):
    response: str
    formatted_response: str
    suggestions: List[str] = []
    files_referenced: List[str] = []
    commands_suggested: List[str] = []

# Initialize Ollama with Gemma-3n 4B
MODEL = "gemma3:1b"
try:
    ollama.pull(MODEL)
    print(f"✅ Model {MODEL} loaded successfully")
except Exception as e:
    print(f"⚠️ Warning: Could not load model {MODEL}: {e}")

# Helper functions
def get_file_content(file_path: str, max_lines: int = 500) -> str:
    """Read file content safely with line limit"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            if len(lines) > max_lines:
                content = ''.join(lines[:max_lines])
                content += f"\n\n... (truncated, showing first {max_lines} lines of {len(lines)} total)"
            else:
                content = ''.join(lines)
            return content
    except Exception as e:
        return f"Error reading file: {str(e)}"

def get_workspace_structure(workspace_path: str, max_depth: int = 3) -> str:
    """Get workspace structure for context"""
    if not os.path.exists(workspace_path):
        return "Workspace path not found"
    
    structure = []
    try:
        for root, dirs, files in os.walk(workspace_path):
            level = root.replace(workspace_path, '').count(os.sep)
            if level >= max_depth:
                dirs[:] = []  # Don't go deeper
                continue
            
            indent = '  ' * level
            structure.append(f'{indent}{os.path.basename(root)}/')
            
            # Add files
            sub_indent = '  ' * (level + 1)
            for file in files[:10]:  # Limit files per directory
                if not file.startswith('.'):
                    structure.append(f'{sub_indent}{file}')
            
            if len(files) > 10:
                structure.append(f'{sub_indent}... ({len(files) - 10} more files)')
                
    except Exception as e:
        return f"Error reading workspace: {str(e)}"
    
    return '\n'.join(structure[:100])  # Limit total lines

def format_ai_response(response: str) -> str:
    """Format AI response for better display in VS Code"""
    # Convert markdown-like formatting to HTML
    formatted = response
    
    # Code blocks
    formatted = re.sub(r'```(\w+)?\n(.*?)\n```', 
                      r'<div class="code-block"><pre><code class="language-\1">\2</code></pre></div>', 
                      formatted, flags=re.DOTALL)
    
    # Inline code
    formatted = re.sub(r'`([^`]+)`', r'<code>\1</code>', formatted)
    
    # Bold text
    formatted = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', formatted)
    
    # Italic text
    formatted = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', formatted)
    
    # Line breaks
    formatted = formatted.replace('\n', '<br>')
    
    return formatted

def create_enhanced_prompt(request: ChatRequest) -> str:
    """Create enhanced prompt with context"""
    prompt_parts = []
    
    # Add system context
    prompt_parts.append("You are GemmaPilot, an advanced AI coding assistant similar to GitHub Copilot.")
    prompt_parts.append("You can analyze code, suggest improvements, help with debugging, and assist with development tasks.")
    prompt_parts.append("Provide helpful, accurate, and well-formatted responses.")
    
    # Add workspace context if available
    if request.workspace_path and os.path.exists(request.workspace_path):
        structure = get_workspace_structure(request.workspace_path)
        prompt_parts.append(f"\nWorkspace structure:\n{structure}")
    
    # Add current file context
    if request.current_file and os.path.exists(request.current_file):
        file_content = get_file_content(request.current_file)
        file_name = os.path.basename(request.current_file)
        prompt_parts.append(f"\nCurrent file ({file_name}):\n```\n{file_content}\n```")
    
    # Add selection context
    if request.selection:
        prompt_parts.append(f"\nSelected code:\n```\n{request.selection}\n```")
    
    # Add attached files
    if request.files:
        for file_info in request.files:
            file_path = file_info.get('path', '')
            file_content = file_info.get('content', '')
            if file_content:
                prompt_parts.append(f"\nAttached file ({file_path}):\n```\n{file_content}\n```")
    
    # Add general context
    if request.context:
        prompt_parts.append(f"\nAdditional context:\n{request.context}")
    
    # Add user prompt
    prompt_parts.append(f"\nUser request: {request.prompt}")
    
    return "\n".join(prompt_parts)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": MODEL, "features": ["chat", "file_analysis", "code_completion", "command_execution"]}

@app.post("/chat", response_model=ChatResponse)
async def enhanced_chat(request: ChatRequest):
    """Enhanced chat with context awareness and file access"""
    try:
        # Create enhanced prompt with context
        enhanced_prompt = create_enhanced_prompt(request)
        
        # Get AI response
        response = ollama.chat(model=MODEL, messages=[{"role": "user", "content": enhanced_prompt}])
        ai_response = response["message"]["content"]
        
        # Format the response
        formatted_response = format_ai_response(ai_response)
        
        # Extract suggestions and references (basic implementation)
        suggestions = []
        files_referenced = []
        commands_suggested = []
        
        # Look for file mentions
        file_pattern = r'`([^`]*\.(py|js|ts|json|md|txt|yaml|yml|sh))`'
        files_referenced = list(set(re.findall(file_pattern, ai_response)))
        files_referenced = [f[0] for f in files_referenced]
        
        # Look for command suggestions
        command_pattern = r'`([a-zA-Z][a-zA-Z0-9_-]*(?:\s+[^`]*)?)`'
        potential_commands = re.findall(command_pattern, ai_response)
        commands_suggested = [cmd for cmd in potential_commands if any(cmd.startswith(prefix) for prefix in ['npm', 'git', 'python', 'node', 'pip', 'cd', 'ls', 'mkdir', 'touch', 'curl', 'docker'])]
        
        return ChatResponse(
            response=ai_response,
            formatted_response=formatted_response,
            suggestions=suggestions,
            files_referenced=files_referenced,
            commands_suggested=commands_suggested
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/analyze_file")
async def analyze_file(request: FileAnalysisRequest):
    """Analyze a specific file"""
    try:
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        file_content = get_file_content(request.file_path)
        file_name = os.path.basename(request.file_path)
        file_ext = os.path.splitext(request.file_path)[1]
        
        # Create analysis prompt based on type
        if request.analysis_type == "overview":
            prompt = f"Analyze this {file_ext} file and provide an overview of its purpose, structure, and key components:\n\n{file_content}"
        elif request.analysis_type == "issues":
            prompt = f"Review this {file_ext} file for potential issues, bugs, or improvements:\n\n{file_content}"
        elif request.analysis_type == "suggestions":
            prompt = f"Suggest improvements and best practices for this {file_ext} file:\n\n{file_content}"
        elif request.analysis_type == "dependencies":
            prompt = f"Analyze the dependencies and imports in this {file_ext} file:\n\n{file_content}"
        else:
            prompt = f"Analyze this {file_ext} file:\n\n{file_content}"
        
        response = ollama.chat(model=MODEL, messages=[{"role": "user", "content": prompt}])
        analysis = response["message"]["content"]
        
        return {
            "file_path": request.file_path,
            "file_name": file_name,
            "analysis_type": request.analysis_type,
            "analysis": analysis,
            "formatted_analysis": format_ai_response(analysis)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@app.post("/execute_command")
async def execute_command(request: CommandRequest):
    """Execute a command with permission (to be called from VS Code after user approval)"""
    try:
        if not request.workspace_path or not os.path.exists(request.workspace_path):
            raise HTTPException(status_code=400, detail="Invalid workspace path")
        
        # Security check - only allow safe commands
        dangerous_patterns = [
            r'rm\s+-rf',
            r'sudo\s+rm',
            r'format',
            r'del\s+/f',
            r'shutdown',
            r'reboot',
            r'dd\s+if=',
            r'mkfs',
            r'fdisk',
            r'passwd',
            r'chmod\s+777'
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, request.command, re.IGNORECASE):
                raise HTTPException(status_code=403, detail=f"Command blocked for security: {request.command}")
        
        # Execute command in workspace directory
        result = subprocess.run(
            request.command,
            shell=True,
            cwd=request.workspace_path,
            capture_output=True,
            text=True,
            timeout=30  # 30 second timeout
        )
        
        return {
            "command": request.command,
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "explanation": request.explanation,
            "success": result.returncode == 0
        }
        
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Command timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")

@app.post("/complete")
async def complete_code(data: dict):
    """Enhanced code completion with better context"""
    try:
        prompt = data.get("prompt", "")
        context = data.get("context", "")
        language = data.get("language", "")
        current_file = data.get("current_file", "")
        
        # Enhanced completion prompt
        completion_prompt = f"""You are an expert {language} developer. Complete the following code:

Context from file:
{context}

Current line/code to complete:
{prompt}

Provide a concise, accurate completion that follows best practices for {language}."""
        
        response = ollama.generate(model=MODEL, prompt=completion_prompt)
        completion = response["response"].strip()
        
        # Clean up completion (remove explanations, just return code)
        lines = completion.split('\n')
        code_lines = []
        for line in lines:
            if not line.strip().startswith('#') and not line.strip().startswith('//'):
                code_lines.append(line)
            if len(code_lines) >= 3:  # Limit completion length
                break
        
        clean_completion = '\n'.join(code_lines)
        
        return {
            "completion": clean_completion,
            "confidence": 0.8,
            "language": language
        }
        
    except Exception as e:
        return {"completion": "", "error": str(e)}

@app.get("/workspace_files")
async def get_workspace_files(workspace_path: str, file_extension: str = ""):
    """Get list of files in workspace"""
    try:
        if not os.path.exists(workspace_path):
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        files = []
        for root, dirs, filenames in os.walk(workspace_path):
            # Skip hidden directories and common build/cache directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__', 'build', 'dist', 'out']]
            
            for filename in filenames:
                if not filename.startswith('.'):
                    if not file_extension or filename.endswith(file_extension):
                        file_path = os.path.join(root, filename)
                        rel_path = os.path.relpath(file_path, workspace_path)
                        files.append({
                            "name": filename,
                            "path": rel_path,
                            "full_path": file_path,
                            "size": os.path.getsize(file_path),
                            "extension": os.path.splitext(filename)[1]
                        })
        
        return {"files": files[:100]}  # Limit to 100 files
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading workspace: {str(e)}")

@app.websocket("/ws/complete")
async def websocket_complete(websocket: WebSocket):
    """Enhanced WebSocket for real-time completion"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            prompt = data.get("prompt", "")
            context = data.get("context", "")
            language = data.get("language", "")
            
            # Enhanced streaming completion
            completion_prompt = f"""Complete this {language} code:
            
Context:
{context}

Code to complete:
{prompt}

Provide only the completion, no explanations."""
            
            response = ollama.generate(model=MODEL, prompt=completion_prompt, stream=True)
            
            completion_text = ""
            for chunk in response:
                if chunk.get("response"):
                    completion_text += chunk["response"]
                    await websocket.send_json({
                        "completion": completion_text,
                        "is_complete": chunk.get("done", False),
                        "language": language
                    })
                    
                if chunk.get("done"):
                    break
                    
    except Exception as e:
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting GemmaPilot Enhanced Backend...")
    print("📋 Features: File analysis, Enhanced chat, Command execution, Workspace integration")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

