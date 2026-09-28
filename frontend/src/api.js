const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getAuthToken() {
  const auth = localStorage.getItem("ai_interview_auth");
  if (!auth) return null;
  try {
    const parsed = JSON.parse(auth);
    return parsed.token;
  } catch {
    return null;
  }
}

function getAuthHeaders() {
  const token = getAuthToken();
  if (!token) {
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

function handleUnauthorized() {
  localStorage.removeItem("ai_interview_auth");
  window.dispatchEvent(new Event("ai-interview-auth-expired"));
}

async function getErrorMessage(response, fallback) {
  const text = await response.text();
  if (!text) return fallback;

  try {
    const parsed = JSON.parse(text);
    return parsed.detail || parsed.message || text;
  } catch {
    return text;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    const message = await getErrorMessage(response, "API request failed");
    throw new Error(message || "API request failed");
  }

  return response.json();
}

export function analyzeResume(resumeText) {
  return request("/resume/analyze", {
    method: "POST",
    body: JSON.stringify({ resume_text: resumeText }),
  });
}

export function analyzeResumeEnhanced(resumeText, targetRole = null) {
  return request("/resume/analyze-enhanced", {
    method: "POST",
    body: JSON.stringify({ resume_text: resumeText, target_role: targetRole }),
  });
}

export async function uploadResumeFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/resume/upload`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    const message = await getErrorMessage(response, "Resume upload failed");
    throw new Error(message || "Resume upload failed");
  }

  return response.json();
}

export async function uploadResumeFileEnhanced(file, targetRole = null) {
  const formData = new FormData();
  formData.append("file", file);
  if (targetRole) {
    formData.append("target_role", targetRole);
  }

  const response = await fetch(`${API_BASE_URL}/resume/upload-enhanced`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    const message = await getErrorMessage(response, "Resume upload failed");
    throw new Error(message || "Resume upload failed");
  }

  return response.json();
}

export function signupUser(name, email, password) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function loginUser(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser() {
  return request("/auth/me");
}

export function getRoles() {
  return request("/roles");
}

export function analyzeSkillGap(candidateSkills, targetRole) {
  return request("/skills/analyze-gap", {
    method: "POST",
    body: JSON.stringify({
      candidate_skills: candidateSkills,
      target_role: targetRole,
    }),
  });
}

export function generateInterview(
  targetRole,
  candidateSkills,
  missingSkills,
  resumeText = "",
  projects = [],
) {
  return request("/interview/generate", {
    method: "POST",
    body: JSON.stringify({
      target_role: targetRole,
      candidate_skills: candidateSkills,
      missing_skills: missingSkills,
      resume_text: resumeText,
      projects,
    }),
  });
}

export function evaluateInterview(answers, context = {}) {
  return request("/interview/evaluate", {
    method: "POST",
    body: JSON.stringify({
      answers,
      target_role: context.targetRole || null,
      candidate_skills: context.candidateSkills || [],
      resume_text: context.resumeText || "",
    }),
  });
}

export function generateRoadmap(targetRole, missingSkills) {
  return request("/roadmap/generate", {
    method: "POST",
    body: JSON.stringify({
      target_role: targetRole,
      missing_skills: missingSkills,
    }),
  });
}
// ================= AI Chat =================

export function askAI(message, resumeText = "") {
  return request("/ai/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      resumeText: resumeText,
    }),
  });
}
