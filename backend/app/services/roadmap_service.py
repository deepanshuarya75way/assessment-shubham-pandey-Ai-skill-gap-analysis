from app.data import VIDEO_RECOMMENDATIONS


def videos_for_skill(skill: str) -> list[dict]:
    if skill in VIDEO_RECOMMENDATIONS:
        return VIDEO_RECOMMENDATIONS[skill]

    query = skill.lower().replace(" ", "+")
    return [
        {
            "title": f"{skill} tutorial videos",
            "url": f"https://www.youtube.com/results?search_query={query}+tutorial",
        }
    ]


def generate_learning_roadmap(target_role: str, missing_skills: list[str]) -> list[dict]:
    if not missing_skills:
        return [
            {
                "week": 1,
                "skill": "Interview Practice",
                "goal": f"Prepare for advanced {target_role} interviews.",
                "tasks": [
                    "Solve 20 role-specific interview questions.",
                    "Build one portfolio project.",
                    "Practice explaining your project clearly.",
                ],
                "videos": [
                    {
                        "title": f"{target_role} interview preparation videos",
                        "url": f"https://www.youtube.com/results?search_query={target_role.replace(' ', '+')}+interview+preparation",
                    }
                ],
            }
        ]

    roadmap = []
    for index, skill in enumerate(missing_skills, start=1):
        roadmap.append(
            {
                "week": index,
                "skill": skill,
                "goal": f"Build practical understanding of {skill}.",
                "tasks": [
                    f"Study fundamentals of {skill}.",
                    f"Complete one mini exercise using {skill}.",
                    f"Answer 5 interview questions on {skill}.",
                    f"Add {skill} evidence to your resume or portfolio.",
                ],
                "videos": videos_for_skill(skill),
            }
        )

    return roadmap
