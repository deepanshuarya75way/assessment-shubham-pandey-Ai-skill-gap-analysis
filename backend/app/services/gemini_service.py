import os
import json
from pydantic import BaseModel


class SkillWithConfidence(BaseModel):
    """Skill with confidence score from AI analysis."""
    name: str
    confidence: float  # 0.0 to 1.0
    category: str  # e.g., "technical", "soft", "language"
    level: str  # e.g., "beginner", "intermediate", "expert"


class Project(BaseModel):
    """Project extracted from resume with AI-generated insights."""
    name: str
    description: str
    technologies: list[str]
    impact: str  # AI-generated impact statement


class EnhancedResumeAnalysis(BaseModel):
    """Enhanced resume analysis using Gemini AI."""
    skills: list[SkillWithConfidence]
    projects: list[Project]
    summary: str
    job_fit_score: float  # 0.0 to 1.0
    experience_level: str  # "entry", "mid", "senior", "executive"
    key_strengths: list[str]
    improvement_areas: list[str]


def init_gemini():
    """Initialize Gemini API with environment variable."""
    try:
        import google.generativeai as genai
    except ImportError as error:
        raise RuntimeError(
            "google-generativeai is not installed. Run: pip install -r requirements.txt"
        ) from error

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY environment variable is not set. "
            "Please set it in your .env file."
        )
    genai.configure(api_key=api_key)
    return genai


def analyze_resume_with_gemini(resume_text: str, target_role: str = None) -> EnhancedResumeAnalysis:
    """
    Analyze resume using Google Gemini API.
    
    Args:
        resume_text: The resume content as text
        target_role: Optional target role for job fit analysis
    
    Returns:
        EnhancedResumeAnalysis with skills, projects, and insights
    """
    try:
        genai = init_gemini()
    except (RuntimeError, ValueError) as e:
        # Fallback to basic analysis if Gemini is not configured
        print(f"Warning: {e}. Using basic analysis instead.")
        return _fallback_resume_analysis(resume_text)
    
    prompt = f"""Analyze the following resume and provide structured insights in JSON format.

Resume:
{resume_text}

Target Role: {target_role or "Not specified"}

Provide a JSON response with EXACTLY this structure (no markdown, just pure JSON):
{{
    "skills": [
        {{"name": "skill_name", "confidence": 0.9, "category": "technical", "level": "expert"}},
        {{"name": "Python", "confidence": 0.85, "category": "technical", "level": "intermediate"}}
    ],
    "projects": [
        {{"name": "project_name", "description": "brief description", "technologies": ["tech1", "tech2"], "impact": "what was achieved"}}
    ],
    "summary": "1-2 sentence summary of candidate's background",
    "job_fit_score": 0.75,
    "experience_level": "mid",
    "key_strengths": ["strength1", "strength2", "strength3"],
    "improvement_areas": ["area1", "area2"]
}}

Requirements:
- skills: Extract 5-10 key skills with confidence scores (0.0-1.0) and categorize them
- projects: Extract 2-4 key projects with technologies and AI-generated impact statements
- summary: 1-2 sentence professional summary
- job_fit_score: Score 0.0-1.0 indicating fit for the target role (0.5 if no target role)
- experience_level: "entry", "mid", "senior", or "executive"
- key_strengths: 3-4 main professional strengths
- improvement_areas: 2-3 areas for improvement or skill gaps
- All confidence values must be between 0.0 and 1.0
- All lists must have at least 2 items
"""

    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        
        # Parse the JSON response
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        response_text = response_text.strip()
        
        data = json.loads(response_text)
        
        # Convert to Pydantic models
        skills = [SkillWithConfidence(**skill) for skill in data.get("skills", [])]
        projects = [Project(**project) for project in data.get("projects", [])]
        
        return EnhancedResumeAnalysis(
            skills=skills,
            projects=projects,
            summary=data.get("summary", ""),
            job_fit_score=float(data.get("job_fit_score", 0.5)),
            experience_level=data.get("experience_level", "mid"),
            key_strengths=data.get("key_strengths", []),
            improvement_areas=data.get("improvement_areas", []),
        )
    
    except json.JSONDecodeError as e:
        print(f"Failed to parse Gemini response as JSON: {e}")
        return _fallback_resume_analysis(resume_text)
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return _fallback_resume_analysis(resume_text)


def _fallback_resume_analysis(resume_text: str) -> EnhancedResumeAnalysis:
    """Fallback basic analysis when Gemini is unavailable."""
    # Extract basic skills by looking for common keywords
    tech_keywords = [
        "python", "javascript", "java", "c++", "react", "django", "fastapi",
        "sql", "mongodb", "aws", "docker", "kubernetes", "git", "linux",
    ]
    
    found_skills = [
        skill for skill in tech_keywords
        if skill.lower() in resume_text.lower()
    ]
    
    skills = [
        SkillWithConfidence(
            name=skill.title(),
            confidence=0.6,
            category="technical",
            level="intermediate"
        )
        for skill in found_skills[:5]
    ]
    
    if not skills:
        skills = [
            SkillWithConfidence(
                name="Communication",
                confidence=0.5,
                category="soft",
                level="intermediate"
            )
        ]
    
    return EnhancedResumeAnalysis(
        skills=skills,
        projects=[],
        summary="Resume analysis. Gemini API not configured.",
        job_fit_score=0.5,
        experience_level="mid",
        key_strengths=["Adaptability", "Learning Ability"],
        improvement_areas=["Configure Gemini API for better analysis"],
    )
