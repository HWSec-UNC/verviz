# Use official Python image
FROM python:3.10

# Set the working directory
WORKDIR /app

# Copy backend files
COPY . /app

# Install dependencies
RUN pip install --no-cache-dir -r Sylvia/requirements.txt
RUN pip install fastapi uvicorn pymongo

# Expose API port
EXPOSE 8000

# Start FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
