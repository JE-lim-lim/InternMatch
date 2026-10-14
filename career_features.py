"""Career Toolkit API endpoints for InternMatch.

The feature endpoints are deliberately local/offline-friendly. They use skill
matching, transparent scoring rules and structured templates; they do not claim
to be a generative LLM or a hiring decision system.
"""
from __future__ import annotations

import io
import json
import re
from pathlib import Path
from typing import Any

from flask import Blueprint, jsonify, request

career_bp = Blueprint("career", __name__, url_prefix="/api/career")
BASE_DIR = Path(__file__).resolve().parent
JOBS_PATH = BASE_DIR / "jobs_data.json"

KNOWN_SKILLS = [
    "Python", "SQL", "Java", "C++", "C#", "HTML", "CSS", "JavaScript", "Excel",
    "Power BI", "Pandas", "NumPy", "TensorFlow", "PyTorch", "Machine Learning", "AI",
    "Statistics", "Data Analysis", "Figma", "Firebase", "Kotlin", "Android Studio", "VB.NET",
    "Git", "React", "Tableau", "Risk Analysis", "Business Analysis", "Communication",
    "Leadership", "Marketing", "Accounting", "Audit", "Tax", "Financial Reporting",
    "PowerPoint", "UI Design", "UX Research", "Prototyping", "Graphic Design", "Social Media",
    "Content Creation", "Engineering", "Technical Documentation", "Problem Solving",
    "Project Management", "Psychology", "Research", "Counselling", "Human Resources", "SPSS",
    "Customer Experience", "Event Coordination", "Presentation", "Cloud", "Linux",
    "Recruitment", "Supply Chain", "Logistics", "Cybersecurity", "Legal Compliance",
    "Hospitality", "Tourism", "Procurement", "Vendor Management", "Customer Service",
    "Data Visualization", "Database Management", "Teamwork", "Critical Thinking",
]

SKILL_ACTIONS = {
    "Python": "Complete a small script that cleans a CSV file and explain the steps.",
    "SQL": "Practise SELECT, JOIN, GROUP BY and subqueries on a sample database.",
    "Excel": "Build a spreadsheet with formulas, lookup functions and a pivot table.",
    "Power BI": "Create a simple dashboard from a public or synthetic dataset.",
    "Tableau": "Build one interactive chart and write three evidence-based observations.",
    "Pandas": "Load, clean and summarise a CSV dataset using a short notebook.",
    "NumPy": "Practise arrays, filtering and summary calculations in a notebook.",
    "Statistics": "Review descriptive statistics and explain one result in plain language.",
    "Data Analysis": "Analyse a small dataset and document the question, method and finding.",
    "Data Visualization": "Choose suitable charts and explain why each chart fits the data.",
    "Machine Learning": "Train and evaluate a beginner model; report a baseline and metric.",
    "AI": "Document one AI use case, its limitations and how you would validate the output.",
    "Figma": "Create a user flow and one high-fidelity screen for a small app.",
    "UI Design": "Improve hierarchy, spacing and contrast on one existing interface.",
    "UX Research": "Write five neutral user interview questions and summarise key themes.",
    "Prototyping": "Link three prototype screens and test the flow with one reviewer.",
    "JavaScript": "Build a small interactive form with validation and clear error states.",
    "HTML": "Create a semantic page structure with headings, forms and accessible labels.",
    "CSS": "Style a responsive card layout and test it at mobile and desktop widths.",
    "Git": "Practise commits, branches and a README that explains how to run a project.",
    "Firebase": "Create a small demo that reads and writes non-sensitive test data.",
    "Kotlin": "Build a basic Android screen with input validation and state updates.",
    "Android Studio": "Run a small Android app on an emulator and document the setup.",
    "Communication": "Prepare a 60-second explanation of a project and ask for feedback.",
    "Presentation": "Prepare three slides: problem, evidence and recommendation.",
    "Leadership": "Describe a real example using situation, action and outcome.",
    "Business Analysis": "Map a simple process and write requirements with acceptance criteria.",
    "Accounting": "Practise a basic journal-entry and reconciliation example.",
    "Audit": "Learn how evidence, documentation and control testing connect in an audit.",
    "Financial Reporting": "Prepare a simple financial summary and explain the main movements.",
    "Marketing": "Define an audience, campaign objective, channel and success metric.",
    "Social Media": "Draft a one-week content calendar with audience and engagement goals.",
    "Content Creation": "Create one audience-focused post and explain its message and CTA.",
    "Project Management": "Create a mini project plan with milestones, owners and risks.",
    "Problem Solving": "Write down a problem, possible causes, evidence and a tested solution.",
    "Research": "Summarise three credible sources and separate facts from assumptions.",
    "Human Resources": "Draft a structured interview scorecard tied to role requirements.",
    "Recruitment": "Practise mapping role criteria to evidence from an applicant profile.",
    "Cybersecurity": "Complete a safe beginner lab and document the risk and mitigation.",
    "Linux": "Practise common file, permission and process commands in a test environment.",
    "Cloud": "Learn core cloud service models and deploy a small non-sensitive demo.",
    "Customer Experience": "Map a customer journey and identify one measurable friction point.",
    "Customer Service": "Practise a response that confirms the issue, action and next update.",
    "Supply Chain": "Map a basic order-to-delivery flow and identify possible bottlenecks.",
    "Logistics": "Compare a few delivery scenarios using cost, time and reliability.",
    "Procurement": "Build a supplier comparison matrix using transparent criteria.",
    "Vendor Management": "Draft a simple vendor scorecard with service and risk indicators.",
    "Psychology": "Read an introductory research summary and note method and limitations.",
    "SPSS": "Import a sample dataset and practise descriptive analysis with interpretation.",
}


def _load_jobs() -> list[dict[str, Any]]:
    with JOBS_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _find_job(job_id: Any) -> dict[str, Any] | None:
    if job_id in (None, ""):
        return None
    try:
        target_id = int(job_id)
    except (TypeError, ValueError):
        return None
    return next((job for job in _load_jobs() if int(job.get("id", -1)) == target_id), None)


def _extract_text_upload(uploaded) -> str:
    if not uploaded or not uploaded.filename:
        return ""
    filename = uploaded.filename.lower()
    if not (filename.endswith(".pdf") or filename.endswith(".txt")):
        raise ValueError("Please upload a PDF or TXT resume.")
    data = uploaded.read(8 * 1024 * 1024 + 1)
    if len(data) > 8 * 1024 * 1024:
        raise ValueError("Resume must be smaller than 8 MB.")
    if filename.endswith(".pdf"):
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(data))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:
            raise ValueError("Could not read this PDF. Please try a text-based PDF or TXT file.") from exc
    return data.decode("utf-8", errors="ignore")


def _extract_skills(text: str) -> list[str]:
    text = text or ""
    found = []
    for skill in KNOWN_SKILLS:
        # Avoid false positives such as matching "AI" inside unrelated words.
        pattern = r"(?<![a-z0-9])" + re.escape(skill) + r"(?![a-z0-9])"
        if re.search(pattern, text, flags=re.IGNORECASE):
            found.append(skill)
    return sorted(set(found), key=str.casefold)


def _job_from_input(data: dict[str, Any]) -> tuple[dict[str, Any], bool]:
    job = _find_job(data.get("job_id"))
    if job:
        return job, False
    description = (data.get("job_description") or "").strip()
    if description:
        extracted = _extract_skills(description)
        return {
            "id": None,
            "title": "Custom Job Description",
            "company": "Custom target role",
            "field": "General",
            "required": extracted,
            "preferred": [],
            "description": description,
            "responsibilities": [],
        }, True
    return {}, False


def _make_plan(profile: str, job: dict[str, Any], custom: bool) -> dict[str, Any]:
    profile_skills = _extract_skills(profile)
    profile_set = {s.casefold() for s in profile_skills}
    required = list(dict.fromkeys(job.get("required") or []))
    preferred = list(dict.fromkeys(job.get("preferred") or []))

    required_found = [s for s in required if s.casefold() in profile_set]
    required_not_found = [s for s in required if s.casefold() not in profile_set]
    preferred_found = [s for s in preferred if s.casefold() in profile_set]
    preferred_not_found = [s for s in preferred if s.casefold() not in profile_set]

    required_coverage = len(required_found) / len(required) if required else 0.0
    preferred_coverage = len(preferred_found) / len(preferred) if preferred else 0.0
    profile_completeness = 1.0 if len(profile.strip()) >= 350 else 0.75 if len(profile.strip()) >= 150 else 0.45 if len(profile.strip()) >= 60 else 0.2
    readiness = round(100 * (0.70 * required_coverage + 0.15 * preferred_coverage + 0.15 * profile_completeness))

    skill_breakdown = [
        {"skill": skill, "type": "Required", "status": "Found in profile" if skill.casefold() in profile_set else "Not yet evidenced"}
        for skill in required
    ] + [
        {"skill": skill, "type": "Preferred", "status": "Found in profile" if skill.casefold() in profile_set else "Not yet evidenced"}
        for skill in preferred
    ]

    all_gaps = list(dict.fromkeys(required_not_found + preferred_not_found))
    roadmap = _make_roadmap(all_gaps, required_not_found, job)
    resume_tips = _make_resume_tips(profile, job, required_found, required_not_found, preferred_found)
    return {
        "job": {"id": job.get("id"), "title": job.get("title", "Target role"), "company": job.get("company", "Custom target role"), "field": job.get("field", "General")},
        "is_custom_job": custom,
        "readiness_score": readiness,
        "score_note": "Guidance score based on skills detected in the supplied profile and how much profile detail was provided. It is not a hiring probability or an employer assessment.",
        "match_breakdown": {
            "required_coverage": round(required_coverage * 100),
            "preferred_coverage": round(preferred_coverage * 100),
            "profile_detail": round(profile_completeness * 100),
            "required_found_count": len(required_found),
            "required_total": len(required),
            "preferred_found_count": len(preferred_found),
            "preferred_total": len(preferred),
        },
        "profile_skills": profile_skills,
        "required_found": required_found,
        "required_not_found": required_not_found,
        "preferred_found": preferred_found,
        "preferred_not_found": preferred_not_found,
        "skill_breakdown": skill_breakdown,
        "roadmap": roadmap,
        "resume_tips": resume_tips,
    }


def _make_roadmap(gaps: list[str], required_gaps: list[str], job: dict[str, Any]) -> list[dict[str, Any]]:
    required_first = [s for s in gaps if s in required_gaps]
    preferred_later = [s for s in gaps if s not in required_gaps]
    ordered = required_first + preferred_later
    week1 = ordered[:2]
    week2 = ordered[2:4]
    week3 = ordered[4:]
    field = job.get("field", "your target field")
    return [
        {"week": "Week 1", "title": "Build the highest-priority skills", "skills": week1,
         "tasks": [_skill_action(s) for s in week1] or [f"Review the core requirements for {field} and choose one skill to practise."],
         "deliverable": "One short practice exercise or learning note."},
        {"week": "Week 2", "title": "Practise the next skill gaps", "skills": week2,
         "tasks": [_skill_action(s) for s in week2] or ["Improve one existing skill and record evidence of what you can do."],
         "deliverable": "A small exercise showing what you learned."},
        {"week": "Week 3", "title": "Show your skills in a project", "skills": week3,
         "tasks": [_skill_action(s) for s in week3] or [f"Build or refine a small project relevant to {field}. Keep the scope realistic."],
         "deliverable": "A project summary with tools, contribution and a real result."},
        {"week": "Week 4", "title": "Prepare to apply", "skills": [],
         "tasks": ["Update your resume using only skills and achievements you can verify.", "Practise explaining one project with the situation, action and result.", "Re-run InternMatch and review which requirements now have evidence."],
         "deliverable": "An updated resume and a short interview story."},
    ]


def _skill_action(skill: str) -> str:
    return SKILL_ACTIONS.get(skill, f"Complete one small practical exercise using {skill} and record what you can demonstrate.")


def _make_resume_tips(profile: str, job: dict[str, Any], required_found: list[str], required_not_found: list[str], preferred_found: list[str]) -> list[dict[str, str]]:
    tips: list[dict[str, str]] = []
    if required_not_found:
        tips.append({
            "title": "Check missing keyword evidence",
            "detail": "These required skills were not detected in the supplied text: " + ", ".join(required_not_found[:8]) + ". If you genuinely have them, add a real project, coursework or experience example. If not, treat them as learning priorities.",
        })
    if required_found or preferred_found:
        tips.append({
            "title": "Bring relevant skills closer to the top",
            "detail": "Consider highlighting " + ", ".join((required_found + preferred_found)[:6]) + " in a concise Skills section and reinforce the most important ones in your project or experience bullets.",
        })
    tips.append({
        "title": "Use evidence-based project bullets",
        "detail": "A useful structure is: Action + what you built or analysed + tool/skill used + verified result. Add numbers only when they are real and can be explained.",
    })
    tips.append({
        "title": "Tailor without inventing experience",
        "detail": f"For {job.get('title', 'this role')}, reuse relevant wording from the job description only when it accurately describes your work. Do not claim tools, qualifications or outcomes you cannot support.",
    })
    if len(profile.strip()) < 150:
        tips.append({
            "title": "Add more career evidence",
            "detail": "The supplied profile is quite short. Include relevant coursework, projects, responsibilities, tools used and what you personally contributed so the analysis has more evidence to work with.",
        })
    return tips


@career_bp.post("/plan")
def career_plan():
    data = request.form.to_dict() if request.form else (request.get_json(silent=True) or {})
    profile = (data.get("profile") or "").strip()
    try:
        resume_text = _extract_text_upload(request.files.get("resume"))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    combined = "\n".join(part for part in [profile, resume_text] if part).strip()
    if not combined:
        return jsonify({"error": "Please enter your profile/skills or upload a resume."}), 400

    try:
        job, custom = _job_from_input(data)
    except (OSError, json.JSONDecodeError):
        return jsonify({"error": "Could not load internship data."}), 500
    if not job:
        return jsonify({"error": "Choose a target internship or paste a job description."}), 400

    result = _make_plan(combined, job, custom)
    if custom and not (job.get("required") or []):
        return jsonify({"error": "No recognised skills were detected in that job description. Please include explicit skills (for example Python, SQL, Excel, Communication) or choose a listed internship."}), 400
    result["resume_text_found"] = bool(resume_text)
    result["profile_text_length"] = len(combined)
    return jsonify(result)


@career_bp.post("/interview/questions")
def interview_questions():
    data = request.get_json(silent=True) or {}
    profile = (data.get("profile") or "").strip()
    try:
        job, _ = _job_from_input(data)
    except (OSError, json.JSONDecodeError):
        return jsonify({"error": "Could not load internship data."}), 500
    if not job:
        return jsonify({"error": "Choose a target internship or paste a job description first."}), 400

    skills = list(dict.fromkeys((job.get("required") or []) + (job.get("preferred") or [])))
    questions = []
    if skills:
        for skill in skills[:3]:
            questions.append({
                "id": f"skill-{len(questions)+1}",
                "type": "Role-specific",
                "question": f"Tell me about a project, assignment or practical task where you used {skill}. What was your contribution and what did you learn?",
                "focus": f"Evidence of {skill}, personal contribution and learning",
                "keywords": [skill, "project", "used", "result", "learned"],
            })
    questions.extend([
        {"id": "behavior-1", "type": "Behavioral", "question": "Tell me about a time you faced a difficult problem in a project or assignment. How did you approach it?", "focus": "Problem solving and a clear sequence of actions", "keywords": ["problem", "because", "action", "solution", "result"]},
        {"id": "team-1", "type": "Teamwork", "question": "Describe a time you worked with other people to complete a task. What did you personally contribute?", "focus": "Collaboration and your own contribution", "keywords": ["team", "I", "contributed", "communication", "result"]},
        {"id": "motivation-1", "type": "Motivation", "question": f"Why are you interested in the {job.get('title', 'internship')} role, and what do you hope to learn?", "focus": "Role understanding and specific motivation", "keywords": ["role", "skill", "learn", "contribute", "interest"]},
    ])
    return jsonify({"job": {"title": job.get("title"), "company": job.get("company")}, "questions": questions[:6], "evaluation_note": "Feedback uses a transparent structure/relevance checklist. It is practice guidance, not an employer score."})


@career_bp.post("/interview/feedback")
def interview_feedback():
    data = request.get_json(silent=True) or {}
    answer = (data.get("answer") or "").strip()
    keywords = [str(x) for x in (data.get("keywords") or []) if str(x).strip()]
    if not answer:
        return jsonify({"error": "Please write an answer before requesting feedback."}), 400

    words = re.findall(r"\b[\w+#.-]+\b", answer.lower())
    word_count = len(words)
    lower = answer.lower()
    def term_is_present(term: str) -> bool:
        # Single short terms need word boundaries to avoid false positives (e.g. "I" in every word).
        if len(term.strip()) <= 2:
            return bool(re.search(r"(?<![a-z0-9])" + re.escape(term) + r"(?![a-z0-9])", answer, flags=re.IGNORECASE))
        return term.casefold() in lower
    hits = [kw for kw in keywords if term_is_present(kw)]
    length_score = 25 if word_count >= 70 else 18 if word_count >= 40 else 10 if word_count >= 20 else 4
    keyword_score = round(45 * len(hits) / max(1, len(keywords))) if keywords else 25
    structure_terms = ["because", "therefore", "result", "learned", "improved", "so that", "achieved", "finally"]
    structure_hits = [term for term in structure_terms if term in lower]
    structure_score = min(30, len(structure_hits) * 7 + (8 if any(x in lower for x in ["first", "then", "after"]) else 0))
    score = min(100, length_score + keyword_score + structure_score)

    feedback = []
    if word_count < 40:
        feedback.append("Add more detail so the interviewer can understand the situation, your actions and the result.")
    else:
        feedback.append("Your answer has enough detail to review. Keep the story focused and avoid unrelated background.")
    if keywords and len(hits) < min(2, len(keywords)):
        feedback.append("Connect your example more directly to the question and name the relevant skill or task where truthful.")
    if not any(term in lower for term in ["result", "learned", "improved", "achieved"]):
        feedback.append("End with the outcome, what you learned, or what you would improve next time.")
    feedback.append("For a behavioral question, try STAR: Situation, Task, Action and Result. Use your own real experience.")
    return jsonify({
        "practice_score": score,
        "word_count": word_count,
        "relevant_terms_found": hits,
        "feedback": feedback,
        "score_note": "Practice-only heuristic based on answer detail, terms and structure. It is not a measure of interview success.",
    })
