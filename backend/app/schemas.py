from pydantic import BaseModel, Field, model_validator


class AuthRequest(BaseModel):
    name: str | None = None
    email: str
    password: str = Field(..., min_length=6)


class AuthResponse(BaseModel):
    token: str
    user: dict


class ResumeAnalyzeRequest(BaseModel):
    resume_text: str = Field(..., min_length=10)
    target_role: str | None = None


class SkillWithConfidence(BaseModel):
    """Skill with confidence score from AI analysis."""
    name: str
    confidence: float
    category: str  # "technical", "soft", "language", etc.
    level: str  # "beginner", "intermediate", "expert"


class Project(BaseModel):
    """Project extracted from resume with AI insights."""
    name: str
    description: str
    technologies: list[str]
    impact: str


class ResumeAnalyzeResponse(BaseModel):
    extracted_skills: list[str]
    extracted_projects: list[str] = Field(default_factory=list)
    total_skills: int
    extracted_text: str | None = None


class EnhancedResumeAnalyzeResponse(BaseModel):
    """Enhanced resume analysis using Gemini AI."""
    skills: list[SkillWithConfidence]
    projects: list[Project]
    summary: str
    job_fit_score: float
    experience_level: str
    key_strengths: list[str]
    improvement_areas: list[str]


class GapAnalyzeRequest(BaseModel):
    candidate_skills: list[str]
    target_role: str


class GapAnalyzeResponse(BaseModel):
    target_role: str
    required_skills: list[str]
    matched_skills: list[str]
    missing_skills: list[str]
    score: float


class InterviewGenerateRequest(BaseModel):
    target_role: str
    candidate_skills: list[str]
    missing_skills: list[str]
    resume_text: str | None = None
    projects: list[str] = Field(default_factory=list)


class InterviewQuestion(BaseModel):
    id: int
    skill: str
    difficulty: str
    question: str


class InterviewGenerateResponse(BaseModel):
    questions: list[InterviewQuestion]


class CandidateAnswer(BaseModel):
    question_id: int
    question: str
    skill: str
    answer: str


class InterviewEvaluateRequest(BaseModel):
    answers: list[CandidateAnswer]
    target_role: str | None = None
    candidate_skills: list[str] = Field(default_factory=list)
    resume_text: str | None = None


class AnswerFeedback(BaseModel):
    question_id: int
    skill: str
    score: float
    feedback: str
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)
    ideal_answer: str | None = None


class InterviewEvaluateResponse(BaseModel):
    average_score: float
    feedback: list[AnswerFeedback]
    evaluation_method: str = "keyword_heuristic"


class RoadmapRequest(BaseModel):
    target_role: str
    missing_skills: list[str]


class RoadmapItem(BaseModel):
    week: int
    skill: str
    goal: str
    tasks: list[str]
    videos: list[dict] = Field(default_factory=list)


class RoadmapResponse(BaseModel):
    target_role: str
    roadmap: list[RoadmapItem]


# ==========================
# AI Chat Schemas
# ==========================

class AIChatRequest(BaseModel):
    question: str = ""
    message: str = ""
    resumeText: str = ""

    @model_validator(mode="after")
    def normalize_question(self):
        if not self.question and self.message:
            self.question = self.message
        return self


class AIChatResponse(BaseModel):
    answer: str
