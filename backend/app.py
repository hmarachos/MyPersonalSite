import os
import sys
import logging
from typing import List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from openai import OpenAI

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    try:
        logger.info(f"Received message: {req.message}")
        
        if not req.message.strip():
            raise HTTPException(status_code=400, detail="Message is empty")

        # For now, use a default session ID. In production, get from request headers/cookies
        session_id = "default_session"
        thread_id = get_or_create_thread(session_id)
        logger.info(f"Using thread: {thread_id}")

        # Add message to thread
        client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=req.message
        )
        logger.info("Message added to thread")

        # Run assistant
        run = client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=ASSISTANT_ID
        )
        logger.info(f"Run created: {run.id}, status: {run.status}")

        # Wait for completion with timeout
        import time
        max_attempts = 120  # 60 seconds max
        attempts = 0
        while run.status != "completed" and attempts < max_attempts:
            if run.status == "failed":
                logger.error(f"Run failed: {run.last_error}")
                raise HTTPException(status_code=500, detail=f"Assistant run failed: {run.last_error}")
            time.sleep(0.5)
            run = client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run.id)
            attempts += 1
            if attempts % 10 == 0:
                logger.info(f"Still waiting... status: {run.status}")

        if run.status != "completed":
            logger.error(f"Run timeout after {max_attempts * 0.5} seconds")
            raise HTTPException(status_code=500, detail="Assistant response timeout")

        logger.info("Run completed")

        # Get latest message from assistant
        messages = client.beta.threads.messages.list(thread_id=thread_id)
        assistant_message = None
        for msg in messages.data:
            if msg.role == "assistant":
                # Extract text value from Text object
                assistant_message = msg.content[0].text.value
                break

        if not assistant_message:
            logger.error("No assistant message found")
            raise HTTPException(status_code=500, detail="No response from assistant")

        logger.info(f"Returning message: {assistant_message[:100]}...")
        return ChatResponse(answer=assistant_message)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.get("/health")
async def health():
    return {"status": "ok"}


