import os
import json
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from schemas import ChatRequest
from utils import get_system_prompt
from openai import AsyncOpenAI
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Note: The slowapi Limiter expects the request object. 
# We'll apply the rate limit decorator here.
from rate_limiter import limiter

@router.post("/chat")
@limiter.limit("5/minute")
async def chat_endpoint(request: Request, chat_req: ChatRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")

    client = AsyncOpenAI(api_key=api_key)

    system_prompt = get_system_prompt(chat_req.persona)
    
    # Construct message list
    messages = [{"role": "system", "content": system_prompt}]
    for msg in chat_req.messages:
        messages.append({"role": msg.role, "content": msg.content})

    async def event_generator():
        try:
            stream = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                stream=True,
                max_tokens=512,
                temperature=0.7,
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield f"data: {json.dumps({'content': chunk.choices[0].delta.content})}\n\n"
        except Exception as e:
            logger.error(f"OpenAI API Error: {str(e)}")
            yield f"data: {json.dumps({'error': '😓 Oops, something went wrong. Please try again.'})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
