import os
import json
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from schemas import ChatRequest
from utils import get_system_prompt
from google import genai
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

from rate_limiter import limiter

@router.post("/chat")
@limiter.limit("10/minute")
async def chat_endpoint(request: Request, chat_req: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    client = genai.Client(api_key=api_key)
    system_prompt = get_system_prompt(chat_req.persona)

    # Build contents list from message history (exclude system role)
    contents = []
    for msg in chat_req.messages:
        role = "user" if msg.role == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg.content}]})

    from google.genai import types

    async def event_generator():
        try:
            response = client.models.generate_content_stream(
                model="gemini-2.0-flash",
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    max_output_tokens=512,
                    temperature=0.7,
                ),
            )
            for chunk in response:
                if chunk.text:
                    yield f"data: {json.dumps({'content': chunk.text})}\n\n"
        except Exception as e:
            logger.error(f"Gemini API Error: {str(e)}")
            yield f"data: {json.dumps({'error': '😓 Oops, something went wrong. Please try again.'})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
