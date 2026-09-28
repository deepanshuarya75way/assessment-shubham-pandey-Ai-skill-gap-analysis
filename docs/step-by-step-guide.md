# Step By Step Project Guide

## Phase 1: Backend Foundation

The backend receives resumes, extracts skills and projects, compares role skills, generates questions, evaluates answers, and returns learning recommendations.

## Phase 2: Resume Analysis

The app accepts:

- PDF
- DOCX
- TXT

It extracts:

- candidate skills
- project names/descriptions
- resume text preview

If the PDF is scanned as an image, OCR is required as a future upgrade.

## Phase 3: Skill Gap Analysis

Formula:

```text
score = matched_skills / required_skills * 100
```

The system shows matched skills, missing skills, and role-readiness percentage.

## Phase 4: Resume-Based Webcam Interview

The system generates 10-12 questions using:

- resume projects
- extracted skills
- missing skills
- selected job role

The candidate answers using webcam and microphone. Browser speech recognition converts spoken answers into text.

## Phase 5: Confidence And Communication Analysis

The webcam module estimates:

- confidence
- eye contact
- communication score
- face presence

If eye contact is weak, the system shows a popup suggestion to look near the webcam and keep the face centered.

## Phase 6: Report Analysis

The report page includes:

- resume match score
- interview marks
- confidence score
- eye-contact score
- communication score
- graphs
- resume improvement feedback
- interview improvement suggestions
- downloadable PDF report

## Phase 7: Chatbot

The chatbot answers website-related questions such as:

- how to upload resume
- how webcam interview works
- how report scoring works
- how to download PDF
- how to improve resume
- what skill gaps mean

## Research Value

This project combines:

- NLP
- machine learning style scoring
- adaptive assessment
- recommendation systems
- recruitment analytics
- human-computer interaction

Research problem:

```text
How can AI analyze a candidate's resume, conduct webcam-based interviews,
detect skill gaps, estimate communication confidence, and recommend a
personalized improvement path?
```
