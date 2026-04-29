from pydantic import BaseModel
from typing import List, Literal

class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    persona: Literal["Anshuman", "Abhimanyu", "Kshitij"]
    messages: List[Message]
