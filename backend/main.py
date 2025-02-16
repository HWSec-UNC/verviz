from fastapi import FastAPI, File, UploadFile
import shutil
import os
import subprocess
from pydantic import BaseModel
from typing import Dict

app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ExecutionResult(BaseModel):
    stdout: str
    stderr: str

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "path": file_path}

@app.post("/analyze/")
async def analyze_file(filename: str) -> Dict[str, str]:
    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        # Run Sylvia's symbolic execution
        result = subprocess.run(
            ["python3", "Sylvia/sylvia.py", file_path],
            capture_output=True, text=True
        )
        return {"stdout": result.stdout, "stderr": result.stderr}

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
