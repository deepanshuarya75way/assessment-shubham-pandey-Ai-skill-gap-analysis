from dotenv import load_dotenv
import os
import json


# --------------------------------------------------
# ENVIRONMENT
# --------------------------------------------------

load_dotenv()


def get_model():
    try:
        import google.generativeai as genai
    except ImportError:
        return None

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-pro"))


# --------------------------------------------------
# SYSTEM PROMPT
# --------------------------------------------------

SYSTEM_PROMPT = """
You are an expert AI Resume Reviewer, ATS Specialist,
Technical Recruiter and Interview Coach.

Your job is to intelligently analyze the candidate resume.

IMPORTANT RULES:

1. Use ONLY information present in the resume.
2. Never invent skills, experience, projects or achievements.
3. If information is missing, clearly say it is missing.
4. Skill confidence must be based on evidence.
5. Project impact must be based on actual evidence.
6. Weaknesses must include evidence from the resume.
7. Scores must be between 0 and 100.
8. Be objective and professional.
"""


# ==================================================
# BASIC RESUME CHAT
# ==================================================

def ask_resume_ai(question, resume_text):
    model = get_model()
    if not model:
        return "Gemini API key is not configured. Add GEMINI_API_KEY in backend/.env to enable AI chat."

    prompt = f"""
{SYSTEM_PROMPT}

Resume:
----------------
{resume_text}
----------------

Question:
{question}

Answer based only on the resume.
"""

    response = model.generate_content(prompt)

    return response.text


# ==================================================
# INTELLIGENT CANDIDATE PROFILE
# ==================================================

def analyze_candidate_profile(resume_text):
    model = get_model()
    if not model:
        raise Exception(
            "Gemini API key is not configured. Add GEMINI_API_KEY in backend/.env."
        )


    prompt = f"""
{SYSTEM_PROMPT}

Analyze the following resume and create a structured
candidate profile.

Resume:
----------------
{resume_text}
----------------

Analyze:

1. Candidate summary
2. Skills
3. Skill confidence
4. Skill evidence
5. Experience level
6. Estimated experience
7. Experience evidence
8. Projects
9. Project technologies
10. Project impact
11. Education
12. Certifications
13. Achievements
14. Strengths
15. Weaknesses
16. Evidence for weaknesses
17. ATS score
18. Recruiter-fit score
19. Content score
20. Keyword optimization score
21. Formatting score
22. Recommendations

Return ONLY valid JSON.

Use exactly this structure:

{{
    "summary": "",

    "skills": [
        {{
            "name": "",
            "category": "",
            "confidence": 0,
            "evidence": ""
        }}
    ],

    "experience": {{
        "level": "",
        "years": 0,
        "evidence": ""
    }},

    "projects": [
        {{
            "name": "",
            "description": "",
            "technologies": [],
            "impactScore": 0,
            "impactEvidence": "",
            "hasQuantifiableImpact": false
        }}
    ],

    "education": [
        {{
            "degree": "",
            "institution": "",
            "field": "",
            "year": ""
        }}
    ],

    "certifications": [],

    "achievements": [],

    "strengths": [],

    "weaknesses": [
        {{
            "issue": "",
            "evidence": "",
            "severity": ""
        }}
    ],

    "scores": {{
        "atsScore": 0,
        "recruiterFitScore": 0,
        "contentScore": 0,
        "keywordScore": 0,
        "formattingScore": 0
    }},

    "recommendations": []
}}

SCORING RULES:

Skill confidence:
0-100

Project impact:
0-100

ATS score:
0-100

Recruiter fit:
0-100

Content:
0-100

Keyword optimization:
0-100

Formatting:
0-100

Do NOT make up numerical achievements.

If the resume does not contain measurable
project impact, set:

"hasQuantifiableImpact": false

and explain that in:

"impactEvidence".
"""

    response = model.generate_content(prompt)

    result = response.text.strip()

    # --------------------------------------------------
    # Remove markdown code fences if Gemini adds them
    # --------------------------------------------------

    if result.startswith("```json"):
        result = result[7:]

    elif result.startswith("```"):
        result = result[3:]

    if result.endswith("```"):
        result = result[:-3]

    result = result.strip()

    # --------------------------------------------------
    # Convert Gemini JSON string to Python dictionary
    # --------------------------------------------------

    try:

        analysis = json.loads(result)

        return analysis

    except json.JSONDecodeError as error:

        print("Gemini JSON parsing error:")
        print(error)

        print("Gemini response:")
        print(result)

        raise Exception(
            "Gemini returned an invalid JSON response."
        )
