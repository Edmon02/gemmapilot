from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import ollama
import asyncio
import json

app = FastAPI()

# Allow CORS for VS Code extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Ollama with Gemma-3n 4B
MODEL = "gemma3:1b"
ollama.pull(MODEL)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/complete")
async def complete_code(data: dict):
    prompt = data.get("prompt", "")
    context = data.get("context", "")
    full_prompt = f"{context}\n\n{prompt}"
    response = ollama.generate(model=MODEL, prompt=full_prompt)
    return {"completion": response["response"]}

@app.post("/chat")
async def chat(data: dict):
    prompt = data.get("prompt", "")
    response = ollama.chat(model=MODEL, messages=[{"role": "user", "content": prompt}])
    return {"response": response["message"]["content"]}

@app.websocket("/ws/complete")
async def websocket_complete(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_json()
        prompt = data.get("prompt", "")
        context = data.get("context", "")
        full_prompt = f"{context}\n\n{prompt}"
        response = ollama.generate(model=MODEL, prompt=full_prompt, stream=True)
        for chunk in response:
            await websocket.send_json({"completion": chunk["response"]})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

