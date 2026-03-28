import os
import sys
from typing import List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from openai import OpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ASSISTANT_ID = os.getenv("PROJECT_ENV")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is not set. Please set it in your environment or in a .env file.")

if not ASSISTANT_ID:
    raise RuntimeError("PROJECT_ENV (Assistant ID) is not set. Please set it in your environment or in a .env file.")

client = OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI(title="FAQ RAG Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str


# Store threads per session (in production use database)
threads = {}


def get_or_create_thread(session_id: str) -> str:
    """Get existing thread or create new one for session"""
    if session_id not in threads:
        thread = client.beta.threads.create()
        threads[session_id] = thread.id
    return threads[session_id]


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message is empty")

    # For now, use a default session ID. In production, get from request headers/cookies
    session_id = "default_session"
    thread_id = get_or_create_thread(session_id)

    # Add message to thread
    client.beta.threads.messages.create(
        thread_id=thread_id,
        role="user",
        content=req.message
    )

    # Run assistant
    run = client.beta.threads.runs.create(
        thread_id=thread_id,
        assistant_id=ASSISTANT_ID
    )

    # Wait for completion
    import time
    while run.status != "completed":
        if run.status == "failed":
            raise HTTPException(status_code=500, detail="Assistant run failed")
        time.sleep(0.5)
        run = client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run.id)

    # Get latest message from assistant
    messages = client.beta.threads.messages.list(thread_id=thread_id)
    assistant_message = None
    for msg in messages.data:
        if msg.role == "assistant":
            # Extract text value from Text object
            assistant_message = msg.content[0].text.value
            break

    if not assistant_message:
        raise HTTPException(status_code=500, detail="No response from assistant")

    return ChatResponse(answer=assistant_message)


@app.get("/health")
async def health():
    return {"status": "ok"}


