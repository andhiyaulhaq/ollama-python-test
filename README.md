# AI Chat Application

A fast, fully-local, full-stack AI chat application featuring a premium glassmorphic UI, powered by a local Qwen 2.5 LLM.

## 🚀 Features

- **Modern UI**: Stunning dark-mode glassmorphic design, smooth CSS transitions, and an animated AI typing effect.
- **Real-time Streaming**: LLM responses are streamed back to the UI in real time using FastAPI's StreamingResponse.
- **Local AI**: Fully private, on-device inference using Ollama and the `qwen2.5:0.5b` model.
- **Simple Authentication**: A database-free login overlay to protect your AI endpoints.
- **Dockerized**: Easy multi-stage Docker setup for seamless, single-container deployment.

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML/CSS/JS, bundled with **Vite**, using **pnpm**.
- **Backend**: **Python** & **FastAPI** for high-performance async routing.
- **AI Engine**: **Ollama** Python Client.

## 🔒 Authentication

By default, the application is protected by a simple login screen. 
- **Username:** `admin`
- **Password:** `password123`

You can change these hardcoded credentials in `backend/main.py`.

## 💻 Local Development

### Prerequisites
- Node.js & `pnpm`
- Python 3.11+ & `uv`
- [Ollama](https://ollama.com/) running locally with the Qwen 2.5 model pulled (`ollama run qwen2.5:0.5b`).

### 1. Start the Backend
```bash
cd backend
# Create a virtual environment and install dependencies
uv venv
uv pip install -r requirements.txt
# Run the FastAPI server
uv run uvicorn main:app --reload
```
The backend will run on `http://127.0.0.1:8000`.

### 2. Start the Frontend
```bash
cd frontend
# Install dependencies
pnpm install
# Start the Vite development server
pnpm dev
```
Access the application at `http://localhost:5173`. Vite will automatically proxy `/api` requests to the FastAPI backend.

## 🐳 Docker Deployment

You can run the entire application (frontend + backend) in a single Docker container using Docker Compose. The frontend will be built automatically and served statically by FastAPI.

### Important: Ollama Configuration on Windows
If you are running Docker on Windows and Ollama on your host machine, you must configure Ollama to listen on all network interfaces so the Docker container can reach it via `host.docker.internal`.
1. Add a system environment variable: `OLLAMA_HOST=0.0.0.0`
2. Restart the Ollama application.

### Running with Docker Compose
```bash
docker compose up --build -d
```
Once built and running, you can access the production-ready application at `http://localhost:8000`.

## 📂 Project Structure

```text
/
├── backend/
│   ├── main.py              # FastAPI application & auth logic
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── index.html           # Main chat interface & login overlay
│   ├── main.js              # UI logic, auth state, and API streaming
│   ├── style.css            # Premium glassmorphic styles
│   ├── package.json         # Node dependencies (Vite, marked)
│   └── vite.config.js       # Vite configuration and proxy settings
├── Dockerfile               # Multi-stage build for frontend & backend
├── docker-compose.yml       # Docker compose configuration
└── README.md
```
