import { useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { analyzeResume, uploadResumeFile } from "../api.js";

export default function ResumeUploader({ onSkillsExtracted, onResumeAnalyzed }) {
  const [resumeText, setResumeText] = useState("");
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setFileName(file.name);

    try {
      const result = await uploadResumeFile(file);
      setSkills(result.extracted_skills);
      setProjects(result.extracted_projects || []);
      setResumeText(result.extracted_text || "");
      onSkillsExtracted(result.extracted_skills);
      onResumeAnalyzed?.({
        text: result.extracted_text || "",
        projects: result.extracted_projects || [],
      });
    } catch (apiError) {
      setError(
        apiError.message === "Invalid authentication credentials"
          ? "Session expired. Please sign up or sign in again, then upload the resume."
          : apiError.message,
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    try {
      const result = await analyzeResume(resumeText);
      setSkills(result.extracted_skills);
      setProjects(result.extracted_projects || []);
      onSkillsExtracted(result.extracted_skills);
      onResumeAnalyzed?.({
        text: result.extracted_text || resumeText,
        projects: result.extracted_projects || [],
      });
    } catch (apiError) {
      setError(
        apiError.message === "Invalid authentication credentials"
          ? "Session expired. Please sign up or sign in again, then analyze the resume."
          : apiError.message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
className="
rounded-3xl
bg-white
p-8
shadow-xl
border
border-slate-200
"
>
      <div className="mb-8 flex items-center justify-between gap-8">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-ocean" />
          <h2 className="section-title">1. Resume Analysis</h2>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700">
          <Upload size={16} />
          PDF / DOCX / TXT
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {fileName ? (
        <p className="mb-3 text-sm font-bold text-slate-600">Uploaded: {fileName}</p>
      ) : null}
      {error ? (
        <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose">
          {error}
        </div>
      ) : null}

      <textarea
        value={resumeText}
        onChange={(event) => setResumeText(event.target.value)}
        className="min-h-36 w-full resize-y rounded-md border border-slate-300 p-3 text-sm leading-6 outline-none focus:border-ocean"
        placeholder="Paste resume text here..."
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          onClick={handleAnalyze}
          disabled={loading || resumeText.trim().length < 10}
          className="inline-flex items-center gap-2 rounded-md bg-ocean px-6 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          Analyze Pasted Text
        </button>

        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {projects.length ? (
        <div className="mt-8 rounded-md border border-indigo-100 bg-indigo-50 p-3">
          <p className="mb-2 text-sm font-black text-indigo-900">
            Projects detected for interview questions
          </p>
          <div className="space-y-1">
            {projects.map((project) => (
              <p key={project} className="text-sm font-semibold text-indigo-800">
                - {project}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
