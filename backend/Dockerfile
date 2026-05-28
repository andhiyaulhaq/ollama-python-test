FROM python:3.12-slim
WORKDIR /app

# Copy the contents of the backend folder into /app/backend/
COPY . ./backend/

# Install python dependencies from pyproject.toml
RUN pip install --no-cache-dir ./backend

# Expose FastAPI port
EXPOSE 8000

# Run uvicorn (matching the package structure)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
