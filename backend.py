from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
from pathlib import Path
import io
import json
import joblib
import os
import secrets
import uuid
import re
from datetime import timedelta
from werkzeug.security import check_password_hash, generate_password_hash

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from career_features import career_bp

BASE = Path(__file__).resolve().parent
MODEL_PATH = BASE / "internmatch_model.joblib"
TRAINING_PATH = BASE / "training_data.csv"
JOBS_PATH = BASE / "jobs_data.json"
# Employer accounts are data, not code. An optional shared data location allows
# accounts to survive switching between project versions.
DATA_DIR = Path(os.environ.get("INTERNMATCH_DATA_DIR", str(BASE))).expanduser().resolve()
DATA_DIR.mkdir(parents=True, exist_ok=True)
EMPLOYERS_PATH = DATA_DIR / "employers.json"
FRONTEND = BASE / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="")
# Set INTERNMATCH_SECRET_KEY in deployment for a stable secret across restarts.
def persistent_session_secret():
    """Keep local development cookies valid across server restarts.

    In production prefer INTERNMATCH_SECRET_KEY supplied from the environment.
    Never commit the generated .internmatch_secret_key file to source control.
    """
    configured = os.environ.get("INTERNMATCH_SECRET_KEY")
    if configured:
        return configured
    path = DATA_DIR / ".internmatch_secret_key"
    if path.exists():
        value = path.read_text(encoding="utf-8").strip()
        if len(value) >= 32:
            return value
    value = secrets.token_hex(32)
    try:
        # Exclusive creation avoids replacing a secret if two instances start.
        with path.open("x", encoding="utf-8") as fh:
            fh.write(value)
        try:
            os.chmod(path, 0o600)
        except OSError:
            pass
    except FileExistsError:
        value = path.read_text(encoding="utf-8").strip()
    return value


app.secret_key = persistent_session_secret()
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("INTERNMATCH_HTTPS", "0") == "1",
    PERMANENT_SESSION_LIFETIME=timedelta(days=7),
)
CORS(app, supports_credentials=True)
app.register_blueprint(career_bp)

with JOBS_PATH.open(encoding="utf-8") as fh:
    JOBS = json.load(fh)

KNOWN_SKILLS = sorted({
    "Python", "SQL", "Java", "C++", "C#", "HTML", "CSS", "JavaScript", "Excel",
    "Power BI", "Pandas", "NumPy", "TensorFlow", "PyTorch", "Machine Learning", "AI",
    "Statistics", "Data Analysis", "Figma", "Firebase", "Kotlin", "Android Studio", "VB.NET",
    "Git", "React", "Tableau", "Risk Analysis", "Business Analysis", "Communication",
    "Leadership", "Marketing", "Accounting", "Audit", "Tax", "Financial Reporting",
    "PowerPoint", "UI Design", "UX Research", "Prototyping", "Graphic Design", "Social Media",
    "Content Creation", "Engineering", "Technical Documentation", "Problem Solving",
    "Project Management", "Psychology", "Research", "Counselling", "Human Resources", "SPSS",
    "Customer Experience", "Event Coordination", "Presentation", "Cloud", "Linux",
    "REST API", "Node.js", "Docker", "TypeScript", "Django", "Flask"
})


def train_model():
    import pandas as pd
    from sklearn.pipeline import Pipeline
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression

    df = pd.read_csv(TRAINING_PATH)
    model = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), lowercase=True, sublinear_tf=True)),
        ("clf", LogisticRegression(max_iter=4000, random_state=42, class_weight="balanced")),
    ])
    model.fit(df["profile_text"], df["target_role"])
    joblib.dump(model, MODEL_PATH)
    return model


def load_model():
    # Retrain when the model is missing or the CSV has been updated.
    if (not MODEL_PATH.exists()) or TRAINING_PATH.stat().st_mtime > MODEL_PATH.stat().st_mtime:
        return train_model()
    return joblib.load(MODEL_PATH)


MODEL = load_model()


def extract_skills(text):
    """Match skill tokens at word boundaries (avoid e.g. AI inside 'training')."""
    value = str(text or "")
    found = set()
    for skill in KNOWN_SKILLS:
        pattern = r"(?<![\w])" + re.escape(skill) + r"(?![\w])"
        if re.search(pattern, value, flags=re.IGNORECASE):
            found.add(skill)
    return sorted(found)



def extract_pdf_text(file_storage):
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(file_storage.read()))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def predict_roles(profile_text):
    probabilities = MODEL.predict_proba([profile_text])[0]
    ranked = sorted(zip(MODEL.classes_, probabilities), key=lambda item: item[1], reverse=True)
    return [{"role": role, "confidence": round(float(probability) * 100, 1)} for role, probability in ranked[:5]]


def match_job(profile_text, job):
    profile_skills = {skill.lower() for skill in extract_skills(profile_text)}
    required = job.get("required", [])
    preferred = job.get("preferred", [])

    required_matches = [skill for skill in required if skill.lower() in profile_skills]
    required_unknown = [skill for skill in required if skill.lower() not in profile_skills]
    preferred_matches = [skill for skill in preferred if skill.lower() in profile_skills]
    preferred_unknown = [skill for skill in preferred if skill.lower() not in profile_skills]

    required_score = len(required_matches) / max(1, len(required))
    preferred_score = len(preferred_matches) / max(1, len(preferred))

    comparison_text = " ".join([
        job.get("title", ""),
        job.get("field", ""),
        job.get("description", ""),
        " ".join(required),
        " ".join(preferred),
    ])
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), lowercase=True)
    matrix = vectorizer.fit_transform([profile_text, comparison_text])
    semantic = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])

    # Score only on available evidence, with no automatic starting points.
    # Missing job requirement categories do not silently cost the applicant points.
    weights = {"required": 70.0 if required else 0.0,
               "preferred": 15.0 if preferred else 0.0,
               "text_similarity": 15.0}
    total_weight = sum(weights.values())
    if total_weight:
        weights = {key: 100.0 * value / total_weight for key, value in weights.items()}
    score = round(min(100, max(0, required_score * weights["required"]
                                 + preferred_score * weights["preferred"]
                                 + semantic * weights["text_similarity"])))
    reason = (f"Evidence found for {len(required_matches)} of {len(required)} required skills"
              if required else "No explicit required skills were listed")
    if required_matches:
        reason += ": " + ", ".join(required_matches[:3])
    if required_unknown:
        reason += ". Review: " + ", ".join(required_unknown[:2])
    return {
        "score_components": {
            "base_points": 0,
            "effective_weights": {key: round(value, 2) for key, value in weights.items()},
            "required_points": round(required_score * weights["required"], 2),
            "preferred_points": round(preferred_score * weights["preferred"], 2),
            "text_similarity_points": round(semantic * weights["text_similarity"], 2),
        },
        "required_coverage": round(required_score * 100, 1),
        "preferred_coverage": round(preferred_score * 100, 1),
        "required_count": len(required),
        "preferred_count": len(preferred),
        "recommendation_reason": reason,
        "score_disclaimer": "Heuristic resume-to-job evidence score, not hiring probability or validated recruitment accuracy.",
        "score": score,
        "required_matches": required_matches,
        "required_unknown": required_unknown,
        "preferred_matches": preferred_matches,
        "preferred_unknown": preferred_unknown,
        "semantic_similarity": round(semantic * 100, 1),
    }


PRIVATE_JOB_FIELDS = {"employer_id", "employer_email", "status", "created_at"}


def public_job(job):
    """Return catalogue fields only; keep employer ownership metadata private."""
    return {key: value for key, value in job.items() if key not in PRIVATE_JOB_FIELDS}


def suggested_jobs(profile_text, limit=6):
    ranked = []
    for job in reload_jobs():
        analysis = match_job(profile_text, job)
        ranked.append((analysis["score"], job, analysis))
    ranked.sort(key=lambda item: (item[0], item[1]["company"]), reverse=True)
    return [dict(public_job(job), match_score=score, match_details=analysis) for score, job, analysis in ranked[:limit]]


@app.get("/")
def index():
    return send_from_directory(FRONTEND, "index.html")



def reload_jobs():
    global JOBS

    with JOBS_PATH.open(encoding="utf-8") as fh:
        JOBS = json.load(fh)

    return JOBS

@app.get("/api/jobs")
def api_jobs():
    global JOBS

    try:
        with JOBS_PATH.open(encoding="utf-8") as file:
            JOBS = json.load(file)

        return jsonify([public_job(job) for job in JOBS])

    except (OSError, json.JSONDecodeError) as error:
        app.logger.exception("Unable to load jobs_data.json")
        return jsonify({
            "error": "Unable to load internship data"
        }), 500

@app.get("/api/jobs/<int:job_id>")
def api_job(job_id):
    try:
        jobs = reload_jobs()
    except (OSError, json.JSONDecodeError):
        app.logger.exception("Unable to load jobs_data.json")
        return jsonify({
            "error": "Unable to load internship data."
        }), 500

    job = next(
        (item for item in jobs if item["id"] == job_id),
        None
    )

    if not job:
        return jsonify({
            "error": "Internship not found."
        }), 404

    return jsonify(public_job(job))

def load_employers():
    """Load employer accounts from a separate store; job catalogue stays shared."""
    if not EMPLOYERS_PATH.exists():
        return []
    with EMPLOYERS_PATH.open(encoding="utf-8") as fh:
        data = json.load(fh)
    return data if isinstance(data, list) else []


def save_employers(employers):
    temporary = EMPLOYERS_PATH.with_suffix(".tmp")
    with temporary.open("w", encoding="utf-8") as fh:
        json.dump(employers, fh, ensure_ascii=False, indent=2)
    temporary.replace(EMPLOYERS_PATH)


def public_employer(employer):
    return {
        "id": employer.get("id", ""),
        "company_name": employer.get("company_name", ""),
        "contact_name": employer.get("contact_name", ""),
        "email": employer.get("email", ""),
        "website": employer.get("website", ""),
    }


def current_employer():
    employer_id = session.get("employer_id")
    if not employer_id:
        return None
    try:
        return next((item for item in load_employers() if item.get("id") == employer_id), None)
    except (OSError, json.JSONDecodeError):
        app.logger.exception("Unable to load employer accounts")
        return None


def employer_job_payload(payload, employer, job_id, existing=None):
    """Build a job object compatible with the existing jobs_data.json catalogue."""
    def clean(value, maximum=5000):
        return str(value or "").strip()[:maximum]

    def skill_list(value):
        if isinstance(value, list):
            values = value
        else:
            values = str(value or "").replace("\n", ",").split(",")
        output, seen = [], set()
        for item in values:
            skill = clean(item, 80)
            key = skill.casefold()
            if skill and key not in seen:
                seen.add(key)
                output.append(skill)
        return output[:30]

    title = clean(payload.get("title"), 120)
    location = clean(payload.get("location"), 120)
    work_mode = clean(payload.get("work_mode"), 40)
    duration = clean(payload.get("duration"), 60)
    allowance = clean(payload.get("allowance"), 80)
    field = clean(payload.get("field"), 100)
    description = clean(payload.get("description"), 5000)
    required = skill_list(payload.get("required"))
    if not all([title, location, work_mode, duration, allowance, field, description]) or not required:
        raise ValueError("Please complete all required fields, including at least one required skill.")

    website = clean(payload.get("website"), 500)
    if website and not website.lower().startswith(("https://", "http://")):
        raise ValueError("The company website must start with https:// or http://.")
    responsibilities = payload.get("responsibilities", [])
    if isinstance(responsibilities, str):
        responsibilities = responsibilities.splitlines()
    if not isinstance(responsibilities, list):
        responsibilities = []
    responsibilities = [clean(line, 240) for line in responsibilities if clean(line, 240)][:15]
    if not responsibilities:
        responsibilities = [
            "Support day-to-day tasks related to the internship role",
            "Work with the team on assigned projects and documentation",
            "Share progress and learn from supervisor feedback",
        ]

    return {
        "id": job_id,
        "title": title,
        "company": employer.get("company_name", "Employer"),
        "location": location,
        "work_mode": work_mode,
        "allowance": allowance,
        "duration": duration,
        "field": field,
        "required": required,
        "preferred": skill_list(payload.get("preferred")),
        "description": description,
        "responsibilities": responsibilities,
        "company_description": clean(payload.get("company_description"), 1500) or f"{employer.get('company_name', 'The company')} is sharing an internship opportunity with students on InternMatch.",
        "employment_type": "Internship",
        "website": website or "",
        "contact_url": website or "",
        "contact_label": "Company Website / Contact",
        "logo": "",
        "logo_url": "",
        "employer_id": employer.get("id"),
        "status": "active",
        "created_at": (existing or {}).get("created_at") or __import__("datetime").datetime.now().isoformat(timespec="seconds"),
    }


@app.post("/api/employer/register")
def employer_register():
    payload = request.get_json(silent=True) or {}
    company_name = str(payload.get("company_name", "")).strip()[:160]
    contact_name = str(payload.get("contact_name", "")).strip()[:120]
    email = str(payload.get("email", "")).strip().lower()[:254]
    password = str(payload.get("password", ""))
    website = str(payload.get("website", "")).strip()[:500]
    if not company_name or not contact_name or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify({"error": "Please provide a company name, contact person and valid work email."}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must contain at least 8 characters."}), 400
    if website and not website.lower().startswith(("https://", "http://")):
        return jsonify({"error": "Company website must start with https:// or http://."}), 400
    try:
        employers = load_employers()
    except (OSError, json.JSONDecodeError):
        return jsonify({"error": "Employer accounts could not be loaded."}), 500
    if any(item.get("email", "").casefold() == email.casefold() for item in employers):
        return jsonify({"error": "An account with this work email already exists. Please log in."}), 409
    employer = {
        "id": uuid.uuid4().hex,
        "company_name": company_name,
        "contact_name": contact_name,
        "email": email,
        "website": website,
        "password_hash": generate_password_hash(password),
    }
    employers.append(employer)
    try:
        save_employers(employers)
    except OSError:
        app.logger.exception("Unable to save employer account")
        return jsonify({"error": "The account could not be saved. Please try again."}), 500
    session.clear()
    session["employer_id"] = employer["id"]
    session.permanent = True
    return jsonify({"ok": True, "employer": public_employer(employer)}), 201


@app.post("/api/employer/login")
def employer_login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    try:
        employers = load_employers()
    except (OSError, json.JSONDecodeError):
        return jsonify({"error": "Employer accounts could not be loaded."}), 500
    employer = next((item for item in employers if item.get("email", "").casefold() == email.casefold()), None)
    if not employer:
        return jsonify({"error": "No employer account was found for this email in the current data folder. Check the email or the server's data directory.", "code": "ACCOUNT_NOT_FOUND"}), 401
    try:
        password_valid = check_password_hash(employer.get("password_hash", ""), password)
    except (ValueError, TypeError):
        app.logger.exception("Invalid employer password hash")
        return jsonify({"error": "This employer account's password hash is invalid. Please contact the project administrator.", "code": "INVALID_PASSWORD_HASH"}), 500
    if not password_valid:
        return jsonify({"error": "The password for this employer account is incorrect.", "code": "INVALID_PASSWORD"}), 401
    session.clear()
    session["employer_id"] = employer["id"]
    session.permanent = True
    return jsonify({"ok": True, "employer": public_employer(employer)})


@app.get("/api/employer/session-status")
def employer_session_status():
    """Help diagnose a missing session cookie without exposing private data."""
    return jsonify({
        "authenticated": current_employer() is not None,
        "cookies_require_https": app.config["SESSION_COOKIE_SECURE"],
        "request_is_https": request.is_secure,
        "data_file_available": EMPLOYERS_PATH.is_file(),
    })


@app.get("/api/employer/me")
def employer_me():
    employer = current_employer()
    if not employer:
        return jsonify({"error": "Please log in as an employer."}), 401
    return jsonify({"employer": public_employer(employer)})


@app.post("/api/employer/logout")
def employer_logout():
    session.clear()
    return jsonify({"ok": True})


@app.get("/api/employer/jobs")
def employer_listings():
    employer = current_employer()
    if not employer:
        return jsonify({"error": "Please log in as an employer."}), 401
    try:
        jobs = reload_jobs()
    except (OSError, json.JSONDecodeError):
        return jsonify({"error": "Internship data could not be loaded."}), 500
    owned = [job for job in jobs if job.get("employer_id") == employer.get("id")]
    owned.sort(key=lambda job: int(job.get("id", 0)), reverse=True)
    return jsonify(owned)


@app.post("/api/employer/jobs")
def employer_create_listing():
    employer = current_employer()
    if not employer:
        return jsonify({"error": "Please log in as an employer."}), 401
    try:
        jobs = reload_jobs()
        next_id = max((int(job.get("id", 0)) for job in jobs), default=0) + 1
        job = employer_job_payload(request.get_json(silent=True) or {}, employer, next_id)
        jobs.append(job)
        with JOBS_PATH.open("w", encoding="utf-8") as fh:
            json.dump(jobs, fh, ensure_ascii=False, indent=2)
        global JOBS
        JOBS = jobs
        return jsonify({"ok": True, "job": job}), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except (OSError, json.JSONDecodeError):
        app.logger.exception("Unable to publish employer listing")
        return jsonify({"error": "The internship could not be published. Please try again."}), 500


@app.put("/api/employer/jobs/<int:job_id>")
def employer_update_listing(job_id):
    employer = current_employer()
    if not employer:
        return jsonify({"error": "Please log in as an employer."}), 401
    try:
        jobs = reload_jobs()
        index = next((i for i, job in enumerate(jobs) if int(job.get("id", -1)) == job_id), None)
        if index is None or jobs[index].get("employer_id") != employer.get("id"):
            return jsonify({"error": "That listing was not found in your company account."}), 404
        job = employer_job_payload(request.get_json(silent=True) or {}, employer, job_id, jobs[index])
        jobs[index] = job
        with JOBS_PATH.open("w", encoding="utf-8") as fh:
            json.dump(jobs, fh, ensure_ascii=False, indent=2)
        global JOBS
        JOBS = jobs
        return jsonify({"ok": True, "job": job})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except (OSError, json.JSONDecodeError):
        app.logger.exception("Unable to update employer listing")
        return jsonify({"error": "The internship could not be updated. Please try again."}), 500


@app.delete("/api/employer/jobs/<int:job_id>")
def employer_delete_listing(job_id):
    employer = current_employer()
    if not employer:
        return jsonify({"error": "Please log in as an employer."}), 401
    try:
        jobs = reload_jobs()
        job = next((item for item in jobs if int(item.get("id", -1)) == job_id), None)
        if not job or job.get("employer_id") != employer.get("id"):
            return jsonify({"error": "That listing was not found in your company account."}), 404
        jobs = [item for item in jobs if int(item.get("id", -1)) != job_id]
        with JOBS_PATH.open("w", encoding="utf-8") as fh:
            json.dump(jobs, fh, ensure_ascii=False, indent=2)
        global JOBS
        JOBS = jobs
        return jsonify({"ok": True})
    except (OSError, json.JSONDecodeError):
        app.logger.exception("Unable to delete employer listing")
        return jsonify({"error": "The internship could not be deleted. Please try again."}), 500


@app.post("/api/analyze")
def analyze():
    profile = request.form.get("profile", "").strip()
    job_description = request.form.get("job_description", "").strip()
    selected_job_id = request.form.get("job_id", "").strip()

    uploaded = request.files.get("resume")
    resume_text = ""
    if uploaded and uploaded.filename:
        try:
            if uploaded.filename.lower().endswith(".pdf"):
                resume_text = extract_pdf_text(uploaded)
            else:
                resume_text = uploaded.read().decode("utf-8", errors="ignore")
        except Exception as exc:
            return jsonify({"error": f"Could not read resume: {exc}"}), 400

    combined = (profile + "\n" + resume_text).strip()
    if not combined:
        return jsonify({"error": "Please provide your skills/profile or upload a resume."}), 400

    skills = extract_skills(combined)
    roles = predict_roles(combined)

    response = {
        "extracted_skills": skills,
        "predicted_roles": roles,
        "resume_text_found": bool(resume_text),
        "suggested_jobs": suggested_jobs(combined, limit=6),
    }

    if job_description or selected_job_id:
        selected_job = None
        if selected_job_id:
            if not selected_job_id.isdigit():
                return jsonify({"error": "Invalid selected internship ID."}), 400
            selected_job = next((j for j in reload_jobs() if j.get("id") == int(selected_job_id)), None)
            if not selected_job:
                return jsonify({"error": "Selected internship was not found."}), 404
        temp_job = selected_job or {
            "title": "Pasted Job Description",
            "field": "",
            "required": extract_skills(job_description),
            "preferred": [],
            "description": job_description,
        }
        result = match_job(combined, temp_job)
        response["job_analysis"] = {
            "match_score": result["score"],
            "job_skills_found": temp_job["required"],
            "matched_skills": result["required_matches"],
            "not_found_in_profile": result["required_unknown"],
            "note": "Not detected means not evidenced in this text, not that you lack the skill. This score is not hiring probability.",
            "job_id": selected_job.get("id") if selected_job else None,
            "job_title": temp_job.get("title", "Custom job"),
            "required_matches": result["required_matches"],
            "required_unknown": result["required_unknown"],
            "preferred_matches": result["preferred_matches"],
            "preferred_unknown": result["preferred_unknown"],
            "required_coverage": result["required_coverage"],
            "preferred_coverage": result["preferred_coverage"],
            "required_count": result["required_count"],
            "preferred_count": result["preferred_count"],
            "semantic_similarity": result["semantic_similarity"],
            "score_components": result["score_components"],
            "recommendation_reason": result["recommendation_reason"],
        }
    else:
        response["job_analysis"] = None

    return jsonify(response)


@app.post("/api/advisor")
def advisor():
    """Grounded FAQ over a previously computed matching breakdown; no external AI dependency."""
    payload = request.get_json(silent=True) or {}
    question = str(payload.get("question", ""))[:500].strip().lower()
    data = payload.get("analysis") or {}
    if not isinstance(data, dict) or not question:
        return jsonify({"error": "Analyze an internship and choose a question first."}), 400
    missing = [str(x)[:60] for x in data.get("required_unknown", []) if isinstance(x, str)][:8]
    found = [str(x)[:60] for x in data.get("required_matches", []) if isinstance(x, str)][:8]
    missing_text = ", ".join(missing[:3]) if missing else "no additional required skills were flagged"
    found_text = ", ".join(found[:3]) if found else "no required skills were detected in your uploaded text"
    score = max(0, min(100, int(data.get("match_score", 0))))
    if any(word in question for word in ("why", "score", "match", "percent")):
        reply = (f"Your heuristic match score is {score}/99. Required-skill coverage and resume-to-job text similarity have the largest influence. "
                 f"The analysis detected {found_text}; it did not detect {missing_text}. "
                 "Skills not detected may still be skills you have—add truthful examples to your profile.")
    elif any(word in question for word in ("project", "portfolio", "build")):
        topic = missing[0] if missing else (found[0] if found else "your chosen field")
        reply = (f"Build one small, demonstrable project using {topic}. Document the problem, your approach, code or screenshots, "
                 "and measurable results. Only claim skills you actually used. Then re-run your match.")
    elif any(word in question for word in ("apply", "ready", "chance")):
        reply = (f"A score of {score} is not a probability of getting hired. You can still apply if you meet the employer's mandatory requirements. "
                 f"Review {missing_text}, confirm the internship dates and allowance, and tailor your CV with truthful examples.")
    else:
        reply = (f"Start with {missing_text}. Learn the basics, practise with a small project, then add evidence to your resume. "
                 "Use Career Toolkit for a more detailed learning roadmap.")
    return jsonify({"reply": reply, "mode": "Grounded match advisor (rule-based)",
                    "disclaimer": "Guidance from the supplied match result; not an external generative AI chatbot."})


@app.post("/api/match/<int:job_id>")
def match_existing(job_id):
    profile = (request.json or {}).get("profile", "").strip()
    if not profile:
        return jsonify({"error": "Profile is required."}), 400
    job = next((job for job in JOBS if job["id"] == job_id), None)
    if not job:
        return jsonify({"error": "Internship not found."}), 404
    return jsonify({"job": public_job(job), "analysis": match_job(profile, job)})


@app.post("/api/retrain")
def retrain():
    global MODEL
    MODEL = train_model()
    return jsonify({"ok": True, "message": "Model retrained from the updated training_data.csv", "rows": 96})


if __name__ == "__main__":
    print("InternMatch running at http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False)
