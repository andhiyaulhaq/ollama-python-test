import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import ollama

app = FastAPI()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]

@app.post("/api/chat")
async def chat(request: ChatRequest):
    def generate():
        try:
            stream = ollama.chat(
                model='qwen2.5:0.5b',
                messages=[m.model_dump() for m in request.messages],
                stream=True,
            )
            for chunk in stream:
                yield chunk['message']['content']
        except Exception as e:
            yield f"Error: {str(e)}"
            
    return StreamingResponse(generate(), media_type="text/plain")

# Get the directory of the current file (backend)
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the parent directory (project root)
root_dir = os.path.dirname(current_dir)
frontend_dir = os.path.join(root_dir, "frontend")

# Ensure the frontend directory exists so FastAPI doesn't crash on startup if it's missing
os.makedirs(frontend_dir, exist_ok=True)

app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
