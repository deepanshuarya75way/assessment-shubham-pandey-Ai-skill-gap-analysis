from ast import Dict
import json
import os
import re
from typing import Any
from .question import QUESTIONS
# from app.data import JOB_ROLES, QUESTION_BANK


STRUCTURE_WORDS = {
    "because",
    "example",
    "project",
    "used",
    "implemented",
    "result",
    "therefore",
    "first",
    "second",
    "finally",
}

DIFFICULTIES = {"Beginner", "Medium", "Hard", "Practical"}
def get_static_question(target_role: str, difficulty: str ="beginner", asked_questions: list[str] | None = None):
    if asked_questions is None:
        asked_questions = []

    for question in QUESTIONS:
        role_str = str(question.get('role', '')).lower()
        diff_str = str(question.get('difficulty', '')).lower()
        role_match = role_str == target_role.lower()
        diff_match = diff_str == difficulty.lower()
        if role_match and diff_match:
            q_text = question.get("question") or question.get("questions")
            if q_text not in asked_questions:
                return{
                    "source": "question",
                    "questions": q_text,
                    "skills": question.get("skill", []),
                    "difficulty": question.get("difficulty")
                }
    return None

def generate_questions(
    target_role: str,
    candidate_skills: list[str],
    missing_skills: list[str],
    resume_text: str | None = None,
    projects: list[str] | None = None,
) -> list[dict]:
    ai_questions = _generate_questions_with_ai(
        target_role=target_role,
        candidate_skills=candidate_skills,
        missing_skills=missing_skills,
        resume_text=resume_text,
        projects=projects,
    )
    if ai_questions:
        return ai_questions

    fallback_res= _generate_questions_fallback(
        target_role=target_role,
        candidate_skills=candidate_skills,
        missing_skills=missing_skills,
        resume_text=resume_text,
        projects=projects,
    )
    if isinstance(fallback_res, list):
        return fallback_res
    elif fallback_res:
        return[fallback_res]
    return []


def evaluate_answers(
    answers: list[dict],
    target_role: str | None = None,
    candidate_skills: list[str] | None = None,
    resume_text: str | None = None,
) -> dict:
    ai_result = _evaluate_answers_with_ai(
        answers=answers,
        target_role=target_role,
        candidate_skills=candidate_skills or [],
        resume_text=resume_text,
    )
    if ai_result:
        return {**ai_result, "evaluation_method": "gemini"}

    return {
        **_evaluate_answers_fallback(answers),
        "evaluation_method": "keyword_heuristic",
    }


def _generate_questions_with_ai(
    target_role: str,
    candidate_skills: list[str],
    missing_skills: list[str],
    resume_text: str | None = None,
    projects: list[str] | None = None,
) -> list[dict] | None:
    model = _get_gemini_model()
    if not model:
        return None

    resume_excerpt = _limit_text(resume_text or "", 6000)
    project_lines = "\n".join(f"- {project}" for project in (projects or [])[:6]) or "No projects extracted."
    role_skills = JOB_ROLES.get(target_role, [])

    prompt = f"""
You are an expert technical interviewer.

Create 10 to 12 personalized interview questions for this candidate.
Use the resume, extracted skills, missing skills, target role, and projects.

Target role: {target_role}
Role required skills: {", ".join(role_skills) or "Unknown"}
Candidate skills: {", ".join(candidate_skills) or "None detected"}
Missing skills: {", ".join(missing_skills) or "None detected"}

Resume excerpt:
{resume_excerpt or "No resume text provided."}

Projects:
{project_lines}

Rules:
- Ask practical questions tied to the uploaded resume and projects.
- Include questions for missing skills to test learning gaps.
- Include questions for detected skills to verify real experience.
- Do not invent employers, degrees, metrics, or projects not present in the resume.
- Return ONLY valid JSON with this exact shape:
{{
  "questions": [
    {{
      "id": 1,
      "skill": "Python",
      "difficulty": "Medium",
      "question": "Question text"
    }}
  ]
}}
- id must be sequential from 1.
- difficulty must be one of: Beginner, Medium, Hard, Practical.
"""

    try:
        response = model.generate_content(prompt)
        data = _parse_json_response(response.text)
        return _normalize_questions(data.get("questions", []))
    except Exception as error:
        print(f"Gemini interview question generation failed: {error}")
        return None


def _evaluate_answers_with_ai(
    answers: list[dict],
    target_role: str | None,
    candidate_skills: list[str],
    resume_text: str | None,
) -> dict | None:
    model = _get_gemini_model()
    if not model or not answers:
        return None

    answer_payload = [
        {
            "question_id": answer.get("question_id"),
            "question": answer.get("question"),
            "skill": answer.get("skill"),
            "answer": _limit_text(answer.get("answer", ""), 1800),
        }
        for answer in answers
    ]

    prompt = f"""
You are an AI interview evaluator and technical hiring coach.

Evaluate each answer for correctness, relevance, depth, clarity, and evidence.
Use resume context only to judge whether the candidate supports claims with their own projects or skills.
Do not reward unsupported claims. Do not invent facts.

Target role: {target_role or "Not specified"}
Candidate skills: {", ".join(candidate_skills) or "None provided"}

Resume excerpt:
{_limit_text(resume_text or "", 5000) or "No resume text provided."}

Answers:
{json.dumps(answer_payload, indent=2)}

Return ONLY valid JSON with this exact shape:
{{
  "average_score": 72.5,
  "feedback": [
    {{
      "question_id": 1,
      "skill": "Python",
      "score": 75,
      "feedback": "Specific feedback in one or two sentences.",
      "strengths": ["What was good"],
      "improvements": ["What to improve"],
      "ideal_answer": "Short model answer or answer outline."
    }}
  ]
}}

Scoring:
- 0 means no answer or completely incorrect.
- 50 means partial, shallow, or unclear.
- 75 means mostly correct with some practical detail.
- 90+ means correct, structured, role-relevant, and supported with concrete evidence.
"""

    try:
        response = model.generate_content(prompt)
        data = _parse_json_response(response.text)
        return _normalize_evaluation(data, answers)
    except Exception as error:
        print(f"Gemini interview answer evaluation failed: {error}")
        return None


def _generate_questions_fallback(
    target_role: str,
    candidate_skills: list[str],
    missing_skills: list[str],
    resume_text: str | None = None,
    projects: list[str] | None = None,
) -> list[dict]:
    role_skills = JOB_ROLES.get(target_role, [])
    candidate_set = {skill.lower() for skill in candidate_skills}
    missing_set = {skill.lower() for skill in missing_skills}
    projects = projects or []

    questions = []
    question_id = 1

    for project in projects[:4]:
        questions.append(
            {
                "id": question_id,
                "skill": "Project",
                "difficulty": "Practical",
                "question": (
                    f"Explain your resume project '{project}'. What problem did it solve, "
                    "what technologies did you use, and what was your contribution?"
                ),
            }
        )
        question_id += 1

    if resume_text and len(questions) < 4:
        questions.append(
            {
                "id": question_id,
                "skill": "Resume",
                "difficulty": "Practical",
                "question": (
                    "Walk me through your resume. Which project or experience best proves "
                    f"your readiness for the {target_role} role?"
                ),
            }
        )
        question_id += 1

    priority_skills = missing_skills + [
        skill for skill in role_skills if skill.lower() not in missing_set
    ] + [
        skill for skill in candidate_skills if skill not in role_skills
    ]

    used_skill_questions = set()
    for skill in priority_skills:
        if len(questions) >= 12:
            break
        if skill.lower() in used_skill_questions:
            continue
        used_skill_questions.add(skill.lower())

        bank = QUESTION_BANK.get(skill)
        if bank:
            bank_index = 1 if skill.lower() in candidate_set and len(bank) > 1 else 0
            question_text = bank[bank_index]
        else:
            question_text = f"Explain your practical experience with {skill}."

        difficulty = "Hard" if skill.lower() in candidate_set else "Beginner"

        questions.append(
            {
                "id": question_id,
                "skill": skill,
                "difficulty": difficulty,
                "question": question_text,
            }
        )
        question_id += 1

    while len(questions) < 10:
        fallback_prompts = [
            f"Why should we select you for the {target_role} role?",
            "Describe one technical challenge you faced and how you solved it.",
            "How do you validate that your project output is correct?",
            "Explain one project decision where you had to choose between two approaches.",
            "What will you improve in your resume projects if you get one more week?",
        ]
        prompt = fallback_prompts[(len(questions) - 1) % len(fallback_prompts)]
        questions.append(
            {
                "id": question_id,
                "skill": "Behavioral + Technical",
                "difficulty": "Medium",
                "question": prompt,
            }
        )
        question_id += 1

    return questions


def _evaluate_answers_fallback(answers: list[dict]) -> dict:
    feedback = []

    for answer in answers:
        text = answer["answer"].strip()
        normalized_text = text.lower()
        words = normalized_text.split()
        word_count = len(words)
        question_terms = {
            token.strip(".,:?()").lower()
            for token in answer["question"].split()
            if len(token.strip(".,:?()")) > 4
        }
        relevance_hits = sum(1 for term in question_terms if term in normalized_text)
        structure_hits = sum(1 for term in STRUCTURE_WORDS if term in normalized_text)

        if word_count == 0:
            score = 0
            message = "No answer submitted. Candidate needs to attempt the question."
            improvements = ["Attempt the question with a direct explanation and example."]
        else:
            length_score = min(40, int((word_count / 70) * 40))
            relevance_score = min(35, relevance_hits * 8)
            structure_score = min(25, structure_hits * 5)
            score = max(20, min(100, length_score + relevance_score + structure_score))

            if score < 45:
                message = "Answer is weak. Add correct concepts, explanation, and a practical example."
            elif score < 70:
                message = "Basic answer. Improve structure and connect it more clearly to the question."
            elif score < 85:
                message = "Good answer. Add stronger project evidence or measurable result."
            else:
                message = "Strong answer with good relevance, structure, and practical detail."
            improvements = ["Use a clear structure: concept, approach, project example, and result."]

        feedback.append(
            {
                "question_id": answer["question_id"],
                "skill": answer["skill"],
                "score": score,
                "feedback": message,
                "strengths": ["Relevant attempt"] if score > 0 else [],
                "improvements": improvements,
                "ideal_answer": "Cover the core concept, explain the method, and support it with a resume project example.",
            }
        )

    average = 0
    if feedback:
        average = round(
            sum(item["score"] for item in feedback) / len(feedback),
            2,
        )

    return {"average_score": average, "feedback": feedback}


def _get_gemini_model():
    try:
        import google.generativeai as genai
    except ImportError:
        return None

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    genai.configure(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL", "gemini-pro")
    return genai.GenerativeModel(model_name)


def _parse_json_response(response_text: str) -> dict:
    cleaned = response_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned, flags=re.IGNORECASE).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


def _normalize_questions(raw_questions: list[dict]) -> list[dict] | None:
    questions = []
    seen = set()

    for raw in raw_questions:
        question_text = str(raw.get("question", "")).strip()
        if len(question_text) < 12 or question_text.lower() in seen:
            continue

        skill = str(raw.get("skill", "General")).strip() or "General"
        difficulty = str(raw.get("difficulty", "Medium")).strip().title()
        if difficulty not in DIFFICULTIES:
            difficulty = "Medium"

        questions.append(
            {
                "id": len(questions) + 1,
                "skill": skill[:60],
                "difficulty": difficulty,
                "question": question_text,
            }
        )
        seen.add(question_text.lower())

        if len(questions) >= 12:
            break

    if len(questions) < 8:
        return None

    return questions


def _normalize_evaluation(data: dict, answers: list[dict]) -> dict | None:
    raw_feedback = data.get("feedback", [])
    if not isinstance(raw_feedback, list):
        return None

    answer_by_id = {answer.get("question_id"): answer for answer in answers}
    feedback = []

    for raw in raw_feedback:
        question_id = raw.get("question_id")
        answer = answer_by_id.get(question_id, {})
        score = _clamp_score(raw.get("score", 0))
        feedback_text = str(raw.get("feedback", "")).strip()
        if not feedback_text:
            feedback_text = "Answer reviewed. Add more technical depth and evidence."

        feedback.append(
            {
                "question_id": question_id,
                "skill": str(raw.get("skill") or answer.get("skill") or "General"),
                "score": score,
                "feedback": feedback_text,
                "strengths": _normalize_string_list(raw.get("strengths")),
                "improvements": _normalize_string_list(raw.get("improvements")),
                "ideal_answer": str(raw.get("ideal_answer", "")).strip() or None,
            }
        )

    if len(feedback) != len(answers):
        existing_ids = {item["question_id"] for item in feedback}
        for answer in answers:
            if answer.get("question_id") in existing_ids:
                continue
            feedback.append(
                {
                    "question_id": answer.get("question_id"),
                    "skill": answer.get("skill", "General"),
                    "score": 0 if not answer.get("answer", "").strip() else 50,
                    "feedback": "AI did not return detailed feedback for this answer.",
                    "strengths": [],
                    "improvements": ["Give a complete answer with specific technical detail."],
                    "ideal_answer": None,
                }
            )

    average = round(sum(item["score"] for item in feedback) / len(feedback), 2) if feedback else 0
    return {
        "average_score": _clamp_score(data.get("average_score", average)),
        "feedback": feedback,
    }


def _normalize_string_list(value) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()][:4]


def _clamp_score(value) -> float:
    try:
        score = float(value)
    except (TypeError, ValueError):
        score = 0
    return max(0, min(100, round(score, 2)))


def _limit_text(value: str, limit: int) -> str:
    value = value.strip()
    if len(value) <= limit:
        return value
    return value[:limit] + "\n[truncated]"
