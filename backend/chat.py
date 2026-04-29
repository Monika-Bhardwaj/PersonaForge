import os
import json
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from schemas import ChatRequest
from utils import get_system_prompt
from groq import Groq
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

from rate_limiter import limiter

@router.post("/chat")
@limiter.limit("10/minute")
async def chat_endpoint(request: Request, chat_req: ChatRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    client = Groq(api_key=api_key)
    system_prompt = get_system_prompt(chat_req.persona)

    messages = [{"role": "system", "content": system_prompt}]
    for msg in chat_req.messages:
        messages.append({"role": msg.role, "content": msg.content})

    async def event_generator():
        try:
            stream = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                stream=True,
                max_tokens=512,
                temperature=0.7,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield f"data: {json.dumps({'content': delta})}\n\n"
        except Exception as e:
            logger.error(f"Groq API Error: {str(e)}")
            yield f"data: {json.dumps({'error': '😓 Oops, something went wrong. Please try again.'})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
