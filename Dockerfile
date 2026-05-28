# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

# Install pnpm
RUN npm install -g pnpm

# Copy frontend source and install dependencies
COPY frontend/package.json frontend/pnpm-lock.yaml* ./
RUN pnpm install

# Copy all frontend files and build
COPY frontend/ ./
RUN pnpm build

# Stage 2: Backend & Final Image
FROM python:3.12-slim
WORKDIR /app

# Copy backend source
COPY backend/ ./backend/

# Install python dependencies from pyproject.toml
RUN pip install --no-cache-dir ./backend

# Copy built frontend from Stage 1 to /app/frontend
# (main.py statically mounts the /app/frontend directory)
COPY --from=frontend-builder /app/frontend/dist ./frontend

# Expose FastAPI port
EXPOSE 8000

# Run uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
