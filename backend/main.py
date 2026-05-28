import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import ollama

app = FastAPI()

# --- Authentication Configuration ---
USERNAME = "admin"
PASSWORD = "password123"
FAKE_TOKEN = "secret-token-12345"

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != FAKE_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/login")
async def login(request: LoginRequest):
    if request.username == USERNAME and request.password == PASSWORD:
        return {"access_token": FAKE_TOKEN, "token_type": "bearer"}
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password"
    )

# --- Chat Functionality ---
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]

@app.post("/api/chat")
async def chat(request: ChatRequest, token: str = Depends(verify_token)):
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

# --- Static File Serving ---
# Get the directory of the current file (backend)
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the parent directory (project root)
root_dir = os.path.dirname(current_dir)
frontend_dir = os.path.join(root_dir, "frontend")

# Ensure the frontend directory exists so FastAPI doesn't crash on startup if it's missing
os.makedirs(frontend_dir, exist_ok=True)

app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
