import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  BrainCircuit,
  Check,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  MessageCircle,
  Mic,
  PieChart,
  Route,
  Upload,
  Video,
} from "lucide-react";
import Header from "./components/layout/Header";
import {
  analyzeSkillGap,
  generateInterview,
  generateRoadmap,
  getCurrentUser,
  getRoles,
} from "./api.js";
import AuthScreen from "./components/AuthScreen.jsx";
import Dashboard from "./components/Dashboard.jsx";
import InfoChatbot from "./components/InfoChatbot.jsx";
import LearningRoadmap from "./components/LearningRoadmap.jsx";
import MockInterview from "./components/MockInterview.jsx";
import ProfessorVisual from "./components/ProfessorVisual.jsx";
import ReportAnalysis from "./components/ReportAnalysis.jsx";
import ResumeUploader from "./components/ResumeUploader.jsx";
import RoleSelector from "./components/RoleSelector.jsx";
import SkillGapReport from "./components/SkillGapReport.jsx";
import WebcamInterview from "./components/WebcamInterview.jsx";

const pages = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "resume", label: "Resume", icon: Upload },
  { id: "interview", label: "Interview", icon: Video },
  { id: "report", label: "Analysis", icon: PieChart },
  { id: "roadmap", label: "Roadmap", icon: Route },
  { id: "chatbot", label: "Chatbot", icon: MessageCircle },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(() => {
    try {
      return Boolean(JSON.parse(localStorage.getItem("ai_interview_auth") || "null")?.token);
    } catch {
      return false;
    }
  });
  const [roles, setRoles] = useState([]);
  const [candidateSkills, setCandidateSkills] = useState([]);
  const [resumeProfile, setResumeProfile] = useState({
    text: "",
    projects: [],
  });
  const [targetRole, setTargetRole] = useState("");
  const [gapReport, setGapReport] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [evaluationDate, setEvaluationDate] = useState(null);
  const [confidenceReport, setConfidenceReport] = useState(null);
  const [roadmap, setRoadmap] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const [activeFlowStep, setActiveFlowStep] = useState(null);
  const [pdfDownloadRequested, setPdfDownloadRequested] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let savedAuth;
    try {
      savedAuth = JSON.parse(localStorage.getItem("ai_interview_auth") || "null");
    } catch {
      savedAuth = null;
    }

    if (!savedAuth?.token || !savedAuth?.user?.email) {
      localStorage.removeItem("ai_interview_auth");
      setAuthChecking(false);
      return;
    }

    getCurrentUser()
      .then(({ email }) => {
        if (email?.toLowerCase() === savedAuth.user.email.toLowerCase()) {
          setUser(savedAuth.user);
          setActiveFlowStep("setup");
        } else {
          localStorage.removeItem("ai_interview_auth");
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecking(false));
  }, []);

  useEffect(() => {
    getRoles()
      .then((data) => {
        setRoles(data);
        if (data.length > 0) {
          setTargetRole(data[0].name);
        }
      })
      .catch(() => setError("Backend is not running. Start FastAPI on port 8000."));
  }, []);

  useEffect(() => {
    function handleAuthExpired() {
      clearAssessmentData();
      setUser(null);
      setError("Your session expired. Sign in again to continue.");
    }

    window.addEventListener("ai-interview-auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("ai-interview-auth-expired", handleAuthExpired);
    };
  }, []);

  const selectedRole = useMemo(
    () => roles.find((role) => role.name === targetRole),
    [roles, targetRole],
  );

  function clearAssessmentData() {
    setCandidateSkills([]);
    setResumeProfile({ text: "", projects: [] });
    setGapReport(null);
    setQuestions([]);
    setEvaluation(null);
    setEvaluationDate(null);
    setConfidenceReport(null);
    setRoadmap([]);
    setActivePage("dashboard");
    setActiveFlowStep("setup");
    setPdfDownloadRequested(false);
    setPdfDownloaded(false);
  }

  function handleInterviewEvaluation(result) {
    setEvaluation(result);
    setEvaluationDate(new Date().toISOString());
    setActivePage("report");
    setActiveFlowStep("analysis");
  }

  function handlePageChange(page) {
    setActivePage(page);
    const flowStepByPage = {
      resume: gapReport ? "skill-gap" : "setup",
      interview: "interview",
      report: "analysis",
      roadmap: "learning",
    };
    setActiveFlowStep(flowStepByPage[page] || null);
  }

  function selectFlowStep(stepId, page) {
    setActiveFlowStep(stepId);
    if (page) setActivePage(page);
    if (stepId === "download-pdf") setPdfDownloadRequested(true);
  }

  function handlePdfDownloadComplete(success) {
    setPdfDownloadRequested(false);
    if (success) setPdfDownloaded(true);
  }

  if (authChecking) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-semibold text-slate-600">
        Verifying your session...
      </main>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        initialError={error}
        onAuth={(authenticatedUser) => {
          clearAssessmentData();
          setError("");
          setUser(authenticatedUser);
          setActiveFlowStep("setup");
        }}
      />
    );
  }

  async function handleAnalyzeGap() {
    if (!candidateSkills.length || !targetRole) return;
    setLoading("gap");
    setError("");

    try {
      const report = await analyzeSkillGap(candidateSkills, targetRole);
      setGapReport(report);
      setActiveFlowStep("skill-gap");
      const roadmapResult = await generateRoadmap(targetRole, report.missing_skills);
      setRoadmap(roadmapResult.roadmap);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading("");
    }
  }

  async function handleGenerateInterview() {
    if (!gapReport) return;
    setLoading("interview");
    setError("");

    try {
      const result = await generateInterview(
        targetRole,
        candidateSkills,
        gapReport.missing_skills,
        resumeProfile.text,
        resumeProfile.projects,
      );
      setQuestions(result.questions);
      setEvaluation(null);
      setEvaluationDate(null);
      setConfidenceReport(null);
      setPdfDownloaded(false);
      setActivePage("interview");
      setActiveFlowStep("interview");
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading("");
    }
  }

  function pageClass(pageId) {
    return activePage === pageId ? "block animate-page-in" : "hidden";
  }

  return (
    <main className="app-shell min-h-screen">
      <Header
        activePage={activePage}
        setActivePage={handlePageChange}
        user={user}
        onLogout={() => {
        localStorage.removeItem("ai_interview_auth");
        clearAssessmentData();
        setError("");
        setUser(null);
        }}
      />

      <AssessmentStepper
        activeStep={activeFlowStep}
        onStepSelect={selectFlowStep}
        candidateSkills={candidateSkills}
        gapReport={gapReport}
        questions={questions}
        evaluation={evaluation}
        roadmap={roadmap}
        pdfDownloaded={pdfDownloaded}
      />

      <div className="mx-auto max-w-[1500px] px-5 py-5 sm:px-6 sm:py-6 lg:px-10">
        {error ? (
          <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-8 lg:px-10 py-3 text-sm font-semibold text-rose">
            {error}
          </div>
        ) : null}
        <section className={pageClass("dashboard")}>
          <div className="space-y-6">
            <Dashboard
              user={user}
              candidateSkills={candidateSkills}
              gapReport={gapReport}
              evaluation={evaluation}
              confidenceReport={confidenceReport}
              setActivePage={handlePageChange}
              active={activePage === "dashboard"}
            />
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <LearningRoadmap roadmap={roadmap} />
              <section className="border-t border-slate-200 py-5">
                <h2 className="section-title">Project Summary</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                  Resume skills, role requirements, interview results, and learning resources for this assessment.
                </p>
              </section>
            </div>
          </div>
        </section>

        <section className={pageClass("resume")}>
          <div className="space-y-5">
            <ResumeUploader
              onSkillsExtracted={setCandidateSkills}
              onResumeAnalyzed={setResumeProfile}
            />

            <RoleSelector
              roles={roles}
              selectedRole={targetRole}
              onRoleChange={setTargetRole}
              selectedRoleData={selectedRole}
              onAnalyzeGap={handleAnalyzeGap}
              loading={loading === "gap"}
              candidateSkills={candidateSkills}
            />

            <SkillGapReport
              report={gapReport}
              onGenerateInterview={handleGenerateInterview}
              loading={loading === "interview"}
            />
          </div>
        </section>

        <section className={pageClass("interview")}>
          <div className="space-y-5">
            <WebcamInterview
              questions={questions}
              onEvaluation={handleInterviewEvaluation}
              evaluation={evaluation}
              onConfidenceReport={setConfidenceReport}
              targetRole={targetRole}
              candidateSkills={candidateSkills}
              resumeProfile={resumeProfile}
            />

            <MockInterview
              questions={questions}
              onEvaluation={handleInterviewEvaluation}
              evaluation={evaluation}
              targetRole={targetRole}
              candidateSkills={candidateSkills}
              resumeProfile={resumeProfile}
            />
          </div>
        </section>

        <section className={pageClass("report")}>
          <ReportAnalysis
            user={user}
            targetRole={targetRole}
            evaluationDate={evaluationDate}
            candidateSkills={candidateSkills}
            resumeProfile={resumeProfile}
            gapReport={gapReport}
            evaluation={evaluation}
            confidenceReport={confidenceReport}
            roadmap={roadmap}
            active={activePage === "report"}
            focusSection={activeFlowStep === "feedback" ? "report-feedback" : activeFlowStep === "report" ? "report-summary" : null}
            pdfDownloadRequested={pdfDownloadRequested}
            onPdfDownloadComplete={handlePdfDownloadComplete}
          />
        </section>

        <section className={pageClass("roadmap")}>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <LearningRoadmap roadmap={roadmap} />
            <ProfessorVisual />
          </div>
        </section>

        <section className={pageClass("chatbot")}>
          <InfoChatbot
            candidateSkills={candidateSkills}
            resumeProfile={resumeProfile}
            gapReport={gapReport}
            evaluation={evaluation}
            confidenceReport={confidenceReport}
            roadmap={roadmap}
          />
        </section>
      </div>
    </main>
  );
}

function AssessmentStepper({
  activeStep,
  onStepSelect,
  candidateSkills,
  gapReport,
  questions,
  evaluation,
  roadmap,
  pdfDownloaded,
}) {
  const steps = [
    { id: "login", label: "Login", page: null, complete: true, enabled: true },
    { id: "setup", label: "Interview Setup", page: "resume", complete: Boolean(candidateSkills.length && gapReport), enabled: true },
    { id: "interview", label: "Interview", page: "interview", complete: Boolean(evaluation), enabled: Boolean(questions.length) },
    { id: "analysis", label: "Analysis", page: "report", complete: Boolean(evaluation), enabled: Boolean(evaluation) },
    { id: "skill-gap", label: "Skill Gap", page: "resume", complete: Boolean(gapReport), enabled: Boolean(gapReport) },
    { id: "feedback", label: "Feedback", page: "report", complete: Boolean(evaluation), enabled: Boolean(evaluation) },
    { id: "learning", label: "Learning", page: "roadmap", complete: Boolean(roadmap.length), enabled: Boolean(roadmap.length) },
    { id: "report", label: "Report", page: "report", complete: Boolean(evaluation), enabled: Boolean(evaluation) },
    { id: "download-pdf", label: "Download PDF", page: "report", complete: pdfDownloaded, enabled: Boolean(evaluation) },
  ];

  return (
    <nav aria-label="Assessment process" className="border-b border-slate-200 bg-white">
      <ol className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-5 py-3 sm:px-6 lg:px-10">
        {steps.map((step, index) => {
          const current = step.id === activeStep;
          return (
            <li key={step.label} className="flex shrink-0 items-center">
              <button
                type="button"
                disabled={!step.enabled || !step.page}
                aria-current={current ? "step" : undefined}
                onClick={() => step.page && onStepSelect(step.id, step.page)}
                className={`flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-bold ${
                  current
                    ? "bg-ink text-white"
                    : step.complete
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-slate-50 text-slate-600"
                } disabled:cursor-default disabled:opacity-100`}
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20 text-[10px]">
                  {step.complete ? <Check size={12} /> : index + 1}
                </span>
                {step.label}
              </button>
              {index < steps.length - 1 ? (
                <ChevronRight aria-hidden="true" size={14} className="mx-1 shrink-0 text-slate-300" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
