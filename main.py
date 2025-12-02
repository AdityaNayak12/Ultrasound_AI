from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv
import base64
from perplexity import Perplexity

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="frontend"), name="static")

API_KEY = os.getenv("PERPLEXITY_API_KEY")
if not API_KEY:
    raise RuntimeError("PERPLEXITY_API_KEY environment variable is not set")

client = Perplexity(api_key=API_KEY)

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        encoded_image = base64.b64encode(file_bytes).decode()

        mime_type = file.content_type or "image/png"
        image_data_uri = f"data:{mime_type};base64,{encoded_image}"

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Please analyze this ultrasound image. Structure your response with clear headings and bullet points using Markdown."},
                    {"type": "image_url", "image_url": {"url": image_data_uri}}
                ]
            }
        ]

        completion = client.chat.completions.create(
            model="sonar",
            messages=messages
        )

        content = completion.choices[0].message.content
        return {"analysis": content}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return FileResponse('frontend/index.html')

