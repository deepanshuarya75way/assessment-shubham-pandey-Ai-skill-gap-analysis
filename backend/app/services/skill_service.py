from app.data import JOB_ROLES


def get_roles() -> list[dict]:
    return [
        {"name": role_name, "required_skills": skills}
        for role_name, skills in JOB_ROLES.items()
    ]


def analyze_skill_gap(candidate_skills: list[str], target_role: str) -> dict:
    if target_role not in JOB_ROLES:
        raise ValueError(f"Unknown target role: {target_role}")

    required_skills = JOB_ROLES[target_role]
    candidate_set = {skill.lower() for skill in candidate_skills}

    matched = [
        skill for skill in required_skills
        if skill.lower() in candidate_set
    ]
    missing = [
        skill for skill in required_skills
        if skill.lower() not in candidate_set
    ]

    score = round((len(matched) / len(required_skills)) * 100, 2)

    return {
        "target_role": target_role,
        "required_skills": required_skills,
        "matched_skills": matched,
        "missing_skills": missing,
        "score": score,
    }

