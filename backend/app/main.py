from fastapi import FastAPI, File, HTTPException, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.ai_router import router as ai_router
from app.dependencies import get_current_user
from app.schemas import (
    AuthRequest,
    AuthResponse,
    EnhancedResumeAnalyzeResponse,
    GapAnalyzeRequest,
    GapAnalyzeResponse,
    InterviewEvaluateRequest,
    InterviewEvaluateResponse,
    InterviewGenerateRequest,
    InterviewGenerateResponse,
    ResumeAnalyzeRequest,
    ResumeAnalyzeResponse,
    RoadmapRequest,
    RoadmapResponse,
)
from app.services.auth_service import login, signup
from app.services.gemini_service import analyze_resume_with_gemini
from app.services.interview_service import evaluate_answers, generate_questions
from app.services.resume_service import (
    extract_projects_from_text,
    extract_skills_from_text,
    extract_text_from_resume_file,
)
from app.services.roadmap_service import generate_learning_roadmap
from app.services.skill_service import analyze_skill_gap, get_roles

# Load environment variables
load_dotenv()

app = FastAPI(
    title="AI Interview Intelligence API",
    description="Resume analysis, skill gap detection, interview generation, and roadmap recommendation.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check() -> dict:
    return {"message": "AI Interview Intelligence API is running"}


@app.post("/auth/signup", response_model=AuthResponse)
def signup_user(payload: AuthRequest) -> AuthResponse:
    try:
        result = signup(payload.name, payload.email, payload.password)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return AuthResponse(**result)


@app.post("/auth/login", response_model=AuthResponse)
def login_user(payload: AuthRequest) -> AuthResponse:
    try:
        result = login(payload.email, payload.password)
    except ValueError as error:
        raise HTTPException(status_code=401, detail=str(error)) from error

    return AuthResponse(**result)


@app.get("/auth/me")
def current_user(current_user: str = Depends(get_current_user)) -> dict[str, str]:
    return {"email": current_user}


@app.post("/resume/analyze", response_model=ResumeAnalyzeResponse)
def analyze_resume(payload: ResumeAnalyzeRequest, current_user: str = Depends(get_current_user)) -> ResumeAnalyzeResponse:
    skills = extract_skills_from_text(payload.resume_text)
    projects = extract_projects_from_text(payload.resume_text)
    return ResumeAnalyzeResponse(
        extracted_skills=skills,
        extracted_projects=projects,
        total_skills=len(skills),
        extracted_text=payload.resume_text,
    )


@app.post("/resume/upload", response_model=ResumeAnalyzeResponse)
async def upload_resume(file: UploadFile = File(...), current_user: str = Depends(get_current_user)) -> ResumeAnalyzeResponse:
    content = await file.read()

    try:
        text = extract_text_from_resume_file(file.filename or "", content)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    if len(text.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Could not extract readable resume text from this file.",
        )

    skills = extract_skills_from_text(text)
    projects = extract_projects_from_text(text)
    return ResumeAnalyzeResponse(
        extracted_skills=skills,
        extracted_projects=projects,
        total_skills=len(skills),
        extracted_text=text[:5000],
    )


@app.post("/resume/analyze-enhanced", response_model=EnhancedResumeAnalyzeResponse)
def analyze_resume_enhanced(payload: ResumeAnalyzeRequest, current_user: str = Depends(get_current_user)) -> EnhancedResumeAnalyzeResponse:
    """
    Enhanced resume analysis using Gemini AI.
    Provides AI-powered insights on skills, projects, job fit, and improvement areas.
    """
    result = analyze_resume_with_gemini(payload.resume_text, payload.target_role)
    return result


@app.post("/resume/upload-enhanced", response_model=EnhancedResumeAnalyzeResponse)
async def upload_resume_enhanced(file: UploadFile = File(...), current_user: str = Depends(get_current_user)) -> EnhancedResumeAnalyzeResponse:
    """
    Upload and analyze resume using Gemini AI.
    Provides enhanced insights on skills, projects, and job fit.
    """
    content = await file.read()

    try:
        text = extract_text_from_resume_file(file.filename or "", content)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    if len(text.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Could not extract readable resume text from this file.",
        )

    result = analyze_resume_with_gemini(text)
    return result

@app.get("/roles")
def list_roles() -> list[dict]:
    return get_roles()


@app.post("/skills/analyze-gap", response_model=GapAnalyzeResponse)
def analyze_gap(payload: GapAnalyzeRequest, current_user: str = Depends(get_current_user)) -> GapAnalyzeResponse:
    try:
        result = analyze_skill_gap(payload.candidate_skills, payload.target_role)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    return GapAnalyzeResponse(**result)


@app.post("/interview/generate", response_model=InterviewGenerateResponse)
def create_interview(payload: InterviewGenerateRequest, current_user: str = Depends(get_current_user)) -> InterviewGenerateResponse:
    questions = generate_questions(
        target_role=payload.target_role,
        candidate_skills=payload.candidate_skills,
        missing_skills=payload.missing_skills,
        resume_text=payload.resume_text,
        projects=payload.projects,
    )
    return InterviewGenerateResponse(questions=questions)


@app.post("/interview/evaluate", response_model=InterviewEvaluateResponse)
def evaluate_interview(payload: InterviewEvaluateRequest, current_user: str = Depends(get_current_user)) -> InterviewEvaluateResponse:
    answer_dicts = [answer.model_dump() for answer in payload.answers]
    result = evaluate_answers(
        answer_dicts,
        target_role=payload.target_role,
        candidate_skills=payload.candidate_skills,
        resume_text=payload.resume_text,
    )
    return InterviewEvaluateResponse(**result)


@app.post("/roadmap/generate", response_model=RoadmapResponse)
def create_roadmap(payload: RoadmapRequest, current_user: str = Depends(get_current_user)) -> RoadmapResponse:
    roadmap = generate_learning_roadmap(payload.target_role, payload.missing_skills)
    return RoadmapResponse(target_role=payload.target_role, roadmap=roadmap)
app.include_router(ai_router)
