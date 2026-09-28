# Step 1.2: Enhanced Resume Analysis with Gemini - Setup Guide

## What's Included

✅ **Gemini AI Integration** - Smart resume parsing using Google's Gemini API
✅ **AI-Powered Skills Analysis** - Confidence scores and skill categorization  
✅ **Job Fit Scoring** - AI-generated job fit percentage for target roles
✅ **Project Insights** - Automatic technology and impact extraction
✅ **Career Assessment** - Experience level detection and improvement areas
✅ **Fallback Mode** - Basic analysis works even without API key

## Setup Instructions

### 1. Get a Gemini API Key (FREE)

1. Visit: https://ai.google.dev/
2. Click "Get API Key" 
3. Create a new API key (free tier available)
4. Copy your API key

### 2. Configure Your Backend

Create a `.env` file in the `backend/` folder:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your API key:

```
JWT_SECRET_KEY=your-secret-key-here-change-in-production
GEMINI_API_KEY=your-actual-gemini-api-key-here
```

### 3. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Start the Backend

```bash
python -m uvicorn app.main:app --reload --port 8000
```

## New API Endpoints

### Standard Resume Analysis (Rule-Based)
```
POST /resume/analyze
POST /resume/upload
```

### Enhanced Resume Analysis (AI-Powered) ⭐ NEW
```
POST /resume/analyze-enhanced
POST /resume/upload-enhanced
```

Request:
```json
{
  "resume_text": "...",
  "target_role": "Python Developer"  // optional
}
```

Response:
```json
{
  "skills": [
    {
      "name": "Python",
      "confidence": 0.95,
      "category": "technical",
      "level": "expert"
    }
  ],
  "projects": [
    {
      "name": "E-commerce Platform",
      "description": "...",
      "technologies": ["Python", "FastAPI", "PostgreSQL"],
      "impact": "Increased throughput by 40%"
    }
  ],
  "summary": "Senior backend engineer with 5+ years experience",
  "job_fit_score": 0.92,
  "experience_level": "senior",
  "key_strengths": ["System Design", "Python", "FastAPI"],
  "improvement_areas": ["Cloud DevOps", "Kubernetes"]
}
```

## Frontend Integration

New API functions available in `src/api.js`:

```javascript
// Analyze resume text with AI
analyzeResumeEnhanced(resumeText, targetRole)

// Upload and analyze file with AI
uploadResumeFileEnhanced(file, targetRole)
```

## Features Unlocked

With Gemini AI integration, your platform now has:

✅ **AI-Powered Skill Detection**
   - Confidence scoring for each skill
   - Automatic categorization (technical, soft, language)
   - Proficiency level estimation

✅ **Smart Project Recognition**
   - Automatic technology stack detection
   - AI-generated impact statements
   - Project relevance analysis

✅ **Career Intelligence**
   - Experience level classification
   - Job fit percentage for target roles
   - Key strengths identification
   - Improvement areas recommendation

✅ **Actionable Insights**
   - Professional summary generation
   - Personalized improvement suggestions
   - Role-specific feedback

## Next Steps

- **Step 1.3**: Improved scoring UI/UX (visualize confidence scores)
- **Step 1.4**: Better dashboard layout (showcase AI insights)
- **Step 2**: Adaptive AI interview questions powered by Gemini
- **Step 3**: Real-time answer evaluation with speech-to-text

## Troubleshooting

**Issue**: "GEMINI_API_KEY environment variable is not set"
- **Solution**: Create `.env` file in backend folder with your API key

**Issue**: "Using basic analysis instead"
- **Solution**: This is normal if API key isn't set. System falls back to rule-based analysis

**Issue**: JSON parse errors from Gemini
- **Solution**: Your API key might have rate limits. Try again in a moment, or check your quota at https://ai.google.dev/

## Cost

- **FREE tier**: 60 requests per minute (perfect for development)
- **Gemini 1.5 Pro**: Standard API pricing applies for paid usage

See pricing: https://ai.google.dev/pricing
