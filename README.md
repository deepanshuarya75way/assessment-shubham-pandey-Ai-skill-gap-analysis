# AI-Powered Interview Intelligence & Skill Gap Analysis Platform

This is a full-stack MVP for an AI/ML final-year style project.

## Features

- Login and sign-up
- Resume text upload and skill extraction
- Role-based skill gap analysis
- Mock interview question generation
- Interview answer evaluation
- Live webcam interview practice
- Webcam readiness report calculation
- Personalized learning roadmap
- Performance dashboard charts
- Downloadable PDF analysis report
- Resume improvement feedback
- Website information chatbot
- Chatbot file, image, and video attachments
- Confidence, eye-contact, and communication analysis
- Branded graph-based PDF report export
- Professor-style roadmap/features visual

## Tech Stack

Frontend:

- React
- Vite
- Tailwind CSS
- Recharts
- Browser webcam API

Backend:

- Python
- FastAPI
- Pydantic
- In-memory demo authentication
- Rule-based NLP skill extraction

This MVP does not require a paid AI API. It uses rule-based logic first so the project works for college demos. Later you can add PostgreSQL, JWT, OpenAI/Gemini, speech-to-text, and real face-emotion analysis.

## Project Structure

```text
ai-interview-platform/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── data.py
│   │   ├── schemas.py
│   │   └── services/
│   │       ├── auth_service.py
│   │       ├── resume_service.py
│   │       ├── skill_service.py
│   │       ├── interview_service.py
│   │       └── roadmap_service.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── roadmap-features-professor.svg
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       └── components/
│           ├── AuthScreen.jsx
│           ├── ResumeUploader.jsx
│           ├── RoleSelector.jsx
│           ├── SkillGapReport.jsx
│           ├── MockInterview.jsx
│           ├── WebcamInterview.jsx
│           ├── ReportAnalysis.jsx
│           ├── InfoChatbot.jsx
│           ├── ProfessorVisual.jsx
│           ├── Dashboard.jsx
│           └── LearningRoadmap.jsx
└── docs/
    └── step-by-step-guide.md
```

## Run Backend

Open PowerShell:

```powershell
cd C:\Users\Lenovo\Documents\Codex\2026-06-18\files-mentioned-by-the-user-chatgpt\outputs\ai-interview-platform\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs:

```text
http://127.0.0.1:8000/docs
```

## Run Frontend

Open a second PowerShell:

```powershell
cd C:\Users\Lenovo\Documents\Codex\2026-06-18\files-mentioned-by-the-user-chatgpt\outputs\ai-interview-platform\frontend
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

## Demo Flow

1. Click `Sign Up` and create a demo account.
2. Paste resume text or upload a `.txt` resume.
3. Click `Analyze Resume`.
4. Select target job role.
5. Click `Analyze Skill Gap`.
6. Generate mock interview questions.
7. Type answers and evaluate them.
8. Start webcam practice and allow camera permission.
9. Finish practice to calculate the webcam readiness report.
10. Show dashboard, roadmap, chatbot, confidence metrics, and downloadable report.

## Important Notes

- Demo login data is stored in backend memory. If you restart FastAPI, sign up again.
- Webcam access works best on `http://127.0.0.1:5173` in Chrome or Edge.
- The webcam report estimates confidence, eye contact, communication, and face presence. Speech recognition auto-reconnects when the browser pauses the mic.
- The report download opens a print/PDF view with logo, company name, graphs, scores, and suggestions. Choose `Save as PDF` in the browser print dialog.
- Eye-contact analysis uses browser face detection when available and a fallback frame estimate otherwise. Real emotion detection can be added later with face-api.js, MediaPipe, or a Python computer vision model.
