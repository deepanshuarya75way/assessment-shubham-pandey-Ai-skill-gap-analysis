from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.schemas import AIChatRequest, AIChatResponse
from app.services.openai_service import ask_resume_ai

router = APIRouter(
    prefix="/ai",
    tags=["AI Assistant"]
)


@router.post("/chat", response_model=AIChatResponse)
def ai_chat(payload: AIChatRequest, _current_user: str = Depends(get_current_user)):

    answer = ask_resume_ai(
        payload.message,
        payload.resumeText
    )

    return AIChatResponse(
        answer=answer
    )