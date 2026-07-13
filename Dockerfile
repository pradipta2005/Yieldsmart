# Use official Python 3.10 slim image
FROM python:3.10-slim

# Install basic system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /app

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend files into the container
COPY . .

# Set permissions to make the directory writable for SQLite databases
RUN chmod -R 777 /app

# Expose the port Hugging Face Spaces expects (7860)
EXPOSE 7860

# Start FastAPI server binding to host 0.0.0.0 on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
