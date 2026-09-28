import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import { Download, FileWarning, Lightbulb, Loader2, TrendingUp } from "lucide-react";

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

const chartColors = ["#0f766e", "#2563eb", "#059669", "#d97706", "#475569"];

function scoreOrNull(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? clampScore(value)
    : null;
}

function formatAssessmentDate(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString();
}

async function createAssessmentPdf({
  user,
  targetRole,
  evaluationDate,
  candidateSkills,
  gapReport,
  evaluation,
  confidenceReport,
  roadmap,
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  const bottom = 278;
  let y = 27;

  function addPage() {
    doc.addPage();
    y = 27;
  }

  function ensureSpace(height) {
    if (y + height > bottom) addPage();
  }

  function addSection(title) {
    ensureSpace(12);
    doc.setFillColor(15, 118, 110);
    doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), margin + 3, y + 5.5);
    y += 13;
  }

  function addText(value, { bold = false, color = [51, 65, 85], indent = 0 } = {}) {
    const lines = doc.splitTextToSize(String(value), contentWidth - indent);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...color);
    lines.forEach((line) => {
      ensureSpace(5);
      doc.text(line, margin + indent, y);
      y += 4.8;
    });
    y += 1.5;
  }

  function addLinkText(value, url, indent = 0) {
    const lines = doc.splitTextToSize(String(value), contentWidth - indent);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 118, 110);
    lines.forEach((line) => {
      ensureSpace(5);
      doc.text(line, margin + indent, y);
      doc.link(margin + indent, y - 3.5, Math.min(doc.getTextWidth(line), contentWidth - indent), 4.5, { url });
      y += 4.8;
    });
    y += 1.5;
  }

  function addSkillList(title, skills) {
    addSection(title);
    addText(skills?.length ? skills.join("  |  ") : "No skills recorded.");
  }

  doc.setProperties({
    title: "SkillBridge AI Candidate Assessment Report",
    author: "SkillBridge AI",
    subject: `Interview assessment for ${user?.name || user?.email || "candidate"}`,
  });

  addSection("Candidate and Assessment");
  addText(`Candidate: ${user?.name || "Not provided"}`, { bold: true });
  addText(`Candidate ID: ${user?.id || "Not provided"}`);
  addText(`Email: ${user?.email || "Not provided"}`);
  addText(`Role: ${targetRole || "Not recorded"}`);
  addText(`Assessment completed: ${formatAssessmentDate(evaluationDate)}`);

  addSection("Recorded Scores");
  addText(
    `Interview scoring method: ${evaluation?.evaluation_method === "gemini" ? "Gemini AI evaluation" : "deterministic keyword / answer-length heuristic"}`,
  );
  const scores = [
    ["Resume match", scoreOrNull(gapReport?.score)],
    ["Interview average", scoreOrNull(evaluation?.average_score)],
    ["Confidence estimate", scoreOrNull(confidenceReport?.confidenceScore)],
    ["Eye contact estimate", scoreOrNull(confidenceReport?.eyeContactScore)],
    ["Communication estimate", scoreOrNull(confidenceReport?.communicationScore)],
  ].filter(([, score]) => score !== null);

  if (!scores.length) {
    addText("No numeric assessment scores were recorded.");
  } else {
    const cardWidth = (contentWidth - 8) / 3;
    scores.forEach(([label, score], index) => {
      if (index % 3 === 0) {
        ensureSpace(23);
        if (index > 0) y += 2;
      }
      const x = margin + (index % 3) * (cardWidth + 4);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(x, y, cardWidth, 19, 1.5, 1.5, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(String(label), x + 3, y + 6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 27, 53);
      doc.text(`${score}%`, x + 3, y + 14.5);
      if (index % 3 === 2 || index === scores.length - 1) y += 22;
    });
  }

  if (scores.length) {
    addSection("Performance Chart");
    scores.forEach(([label, score]) => {
      ensureSpace(11);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(String(label), margin, y + 4);
      const barX = margin + 54;
      const barWidth = contentWidth - 68;
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(barX, y, barWidth, 5, 1, 1, "F");
      doc.setFillColor(15, 118, 110);
      if (score > 0) doc.roundedRect(barX, y, (barWidth * score) / 100, 5, 1, 1, "F");
      doc.text(`${score}%`, barX + barWidth + 3, y + 4);
      y += 9;
    });
    y += 3;
  }

  addSkillList(
    gapReport ? "Strong / Matched Skills" : "Resume Skills",
    gapReport?.matched_skills || candidateSkills,
  );
  addSkillList("Skill Gaps", gapReport?.missing_skills || []);

  addSection("Interview Feedback");
  if (!evaluation?.feedback?.length) {
    addText("No interview feedback was recorded.");
  } else {
    evaluation.feedback.forEach((item) => {
      const answerScore = scoreOrNull(item.score);
      addText(`${item.skill}${answerScore === null ? "" : ` - ${answerScore}%`}`, { bold: true, color: [15, 27, 53] });
      addText(item.feedback || "No written feedback recorded.", { indent: 3 });
      if (item.strengths?.length) addText(`Strengths: ${item.strengths.join(", ")}`, { indent: 3 });
      if (item.improvements?.length) addText(`To improve: ${item.improvements.join(", ")}`, { indent: 3 });
      if (item.ideal_answer) addText(`Suggested outline: ${item.ideal_answer}`, { indent: 3 });
      y += 2;
    });
  }

  addSection("Recommended Learning and Videos");
  if (!roadmap.length) {
    addText("No learning roadmap was recorded.");
  } else {
    roadmap.forEach((item) => {
      addText(`Week ${item.week}: ${item.skill}`, { bold: true, color: [15, 27, 53] });
      addText(item.goal, { indent: 3 });
      (item.tasks || []).forEach((task) => addText(`- ${task}`, { indent: 4 }));
      (item.videos || []).forEach((video) => {
        addLinkText(video.title || video.url, video.url, 3);
      });
      y += 2;
    });
  }

  addSection("Summary and Next Steps");
  const averageScore = scoreOrNull(evaluation?.average_score);
  addText(
    `Assessment completed for ${targetRole || "the selected role"} on ${formatAssessmentDate(evaluationDate)}. ` +
      `The recorded interview average is ${averageScore === null ? "not available" : `${averageScore}%`} ` +
      `across ${evaluation?.feedback?.length || 0} evaluated answers.`,
  );
  addText(
    gapReport?.missing_skills?.length
      ? `Next steps: prioritize ${gapReport.missing_skills.join(", ")} using the learning plan above, then practice with evidence from your projects.`
      : "Next steps: review the answer-level feedback and continue practicing with concrete examples from your projects.",
  );

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFillColor(15, 27, 53);
    doc.roundedRect(margin, 8, contentWidth, 12, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("SB  SKILLBRIDGE AI", margin + 3, 15.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("CANDIDATE ASSESSMENT", pageWidth - margin - 3, 15.5, { align: "right" });
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, 285, pageWidth - margin, 285);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Confidential candidate assessment", margin, 290);
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, 290, { align: "right" });
  }

  doc.save("skillbridge-candidate-assessment.pdf");
}

function getResumeSuggestions(candidateSkills, resumeProfile, gapReport) {
  const suggestions = [];
  if (candidateSkills.length < 8) {
    suggestions.push("Add a dedicated Skills section with tools, languages, databases, and frameworks.");
  }
  if (!resumeProfile.projects.length) {
    suggestions.push("Add 2-3 project entries with problem statement, technologies, model/API/dashboard, and result.");
  }
  if (gapReport?.missing_skills?.length) {
    suggestions.push(`Add learning evidence for missing skills: ${gapReport.missing_skills.join(", ")}.`);
  }
  if (!/result|impact|accuracy|reduced|improved|dashboard|deployed/i.test(resumeProfile.text || "")) {
    suggestions.push("Write measurable impact: accuracy, users, dashboard insights, speed improvement, or business value.");
  }
  if (!/github|portfolio|linkedin/i.test(resumeProfile.text || "")) {
    suggestions.push("Add GitHub, LinkedIn, or portfolio links so recruiters can verify your work.");
  }
  return suggestions.length
    ? suggestions
    : ["Resume has a good base. Improve it further by adding metrics and deployment links."];
}

function getImprovementTips(confidenceReport, evaluation) {
  const tips = [];
  if (confidenceReport?.eyeContactScore < 55) {
    tips.push("Eye contact is weak. Keep your face centered and look near the webcam while answering.");
  }
  if (confidenceReport?.communicationScore < 60) {
    tips.push("Communication needs structure. Use: definition, method, example, result.");
  }
  if (confidenceReport?.confidenceScore < 60) {
    tips.push("Confidence score is low. Speak for 45-90 seconds with fewer pauses and complete examples.");
  }
  if ((evaluation?.average_score || 0) < 70) {
    tips.push("Interview answers need more technical depth. Mention tools, tradeoffs, and project outcomes.");
  }
  return tips.length ? tips : ["Good performance. Practice advanced questions and add stronger project evidence."];
}

export default function ReportAnalysis({
  user,
  targetRole,
  evaluationDate,
  candidateSkills,
  resumeProfile,
  gapReport,
  evaluation,
  confidenceReport,
  roadmap,
  active = true,
  focusSection = null,
  pdfDownloadRequested = false,
  onPdfDownloadComplete,
}) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    if (!active || !focusSection) return;
    const target = document.getElementById(focusSection);
    if (target) {
      const top = window.scrollY + target.getBoundingClientRect().top - 24;
      window.scrollTo({ top, behavior: "instant" });
    }
  }, [active, focusSection]);

  useEffect(() => {
    if (pdfDownloadRequested) void downloadPdfReport();
  }, [pdfDownloadRequested]);
  const resumeSuggestions = getResumeSuggestions(candidateSkills, resumeProfile, gapReport);
  const improvementTips = getImprovementTips(confidenceReport, evaluation);
  const analysisData = [
    { name: "Resume Fit", score: scoreOrNull(gapReport?.score) },
    { name: "Interview", score: scoreOrNull(evaluation?.average_score) },
    { name: "Confidence Estimate", score: scoreOrNull(confidenceReport?.confidenceScore) },
    { name: "Eye Contact Estimate", score: scoreOrNull(confidenceReport?.eyeContactScore) },
    { name: "Communication Estimate", score: scoreOrNull(confidenceReport?.communicationScore) },
  ].filter((item) => item.score !== null);
  const radarData = [
    ...analysisData,
    ...(gapReport ? [{
      name: "Skill Coverage",
      score: clampScore(
        (gapReport.matched_skills.length /
          Math.max(1, gapReport.required_skills.length)) *
          100,
      ),
    }] : []),
  ];
  const skillPie = gapReport
    ? [
        { name: "Matched", value: gapReport.matched_skills.length },
        { name: "Missing", value: gapReport.missing_skills.length },
      ]
    : [];

  async function downloadPdfReport() {
    if (!evaluation || pdfLoading) {
      onPdfDownloadComplete?.(false);
      return;
    }
    setPdfLoading(true);
    setPdfError("");
    let success = false;
    try {
      await createAssessmentPdf({
        user,
        targetRole,
        evaluationDate,
        candidateSkills,
        gapReport,
        evaluation,
        confidenceReport,
        roadmap,
      });
      success = true;
    } catch {
      setPdfError("The PDF report could not be generated. Please try again.");
    } finally {
      setPdfLoading(false);
      onPdfDownloadComplete?.(success);
    }
  }

  if (!evaluation) {
    return (
      <section className="panel p-8">
        <h2 className="section-title">Analysis report is not ready</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Complete and submit an interview to view scored results and download the assessment report.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div id="report-summary" className="panel p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-8 rounded-md bg-ink p-8 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-md bg-ocean text-xl font-black">
              SB
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-emerald-200">
                SkillBridge AI
              </p>
              <h1 className="text-2xl font-black">Candidate Intelligence Report</h1>
            </div>
          </div>
          <div className="text-right text-sm font-bold text-slate-200">
            <p>AI Interview Intelligence</p>
            <p>Interview and skill assessment</p>
          </div>
        </div>

        <div className="mb-8 grid gap-3 rounded-md bg-slate-50 p-4 text-sm md:grid-cols-2">
          <p><span className="font-bold text-slate-500">Candidate:</span> <span className="font-semibold text-ink">{user?.name || "Not provided"}</span></p>
          <p><span className="font-bold text-slate-500">Candidate ID:</span> <span className="font-semibold text-ink">{user?.id || "Not provided"}</span></p>
          <p><span className="font-bold text-slate-500">Role:</span> <span className="font-semibold text-ink">{targetRole || "Not recorded"}</span></p>
          <p><span className="font-bold text-slate-500">Completed:</span> <span className="font-semibold text-ink">{formatAssessmentDate(evaluationDate)}</span></p>
        </div>
        {evaluation.evaluation_method === "keyword_heuristic" ? (
          <p className="mb-8 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            Interview scoring uses the deterministic keyword and answer-length fallback, not Gemini semantic evaluation.
          </p>
        ) : null}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-ocean" />
            <h2 className="section-title">Analysis Report</h2>
          </div>
          <button
            onClick={downloadPdfReport}
            disabled={pdfLoading}
            className="inline-flex items-center gap-2 rounded-md bg-ink px-6 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {pdfLoading ? "Preparing PDF..." : "Download PDF Report"}
          </button>
        </div>
        {pdfError ? <p role="alert" className="mb-5 text-sm font-semibold text-rose">{pdfError}</p> : null}

        <div className="grid gap-8 md:grid-cols-5">
          {analysisData.map((item) => (
            <div key={item.name} className="rounded-md bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase text-slate-500">{item.name}</p>
              <p className="mt-2 text-3xl font-black text-ink">{item.score}%</p>
            </div>
          ))}
        </div>

        {active ? (
        <div className="mt-5 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="h-72 rounded-md bg-white p-3 ring-1 ring-slate-200">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip
    cursor={{ fill: "#EFF6FF" }}
    contentStyle={{
        borderRadius:12,
        border:"none",
        boxShadow:"0 8px 20px rgba(0,0,0,.15)"
    }}
/>
                <Bar dataKey="score" name="Candidate Score" radius={[6, 6, 0, 0]}>
                  {analysisData.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-72 rounded-md bg-white p-3 ring-1 ring-slate-200">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Candidate"
                  dataKey="score"
                  stroke="#0f766e"
                  fill="#2563EB"
                  fillOpacity={0.32}
                />
                <Legend />
                <Tooltip
    cursor={{ fill: "#EFF6FF" }}
    contentStyle={{
        borderRadius:12,
        border:"none",
        boxShadow:"0 8px 20px rgba(0,0,0,.15)"
    }}
/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        ) : null}

        {active && skillPie.length ? (
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="h-72 rounded-md bg-white p-3 ring-1 ring-slate-200">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={skillPie} dataKey="value" nameKey="name" outerRadius={82} label>
                    <Cell fill="#2563EB"/>

<Cell fill="#EF4444"/>
                  </Pie>
                  <Tooltip
    cursor={{ fill: "#EFF6FF" }}
    contentStyle={{
        borderRadius:12,
        border:"none",
        boxShadow:"0 8px 20px rgba(0,0,0,.15)"
    }}
/>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-md bg-slate-50 p-4 ring-1 ring-slate-200">
              <h3 className="mb-3 text-sm font-black uppercase text-slate-500">
                Assessment Interpretation
              </h3>
              <p className="text-sm font-semibold leading-6 text-slate-700">
                The charts show scores returned by the assessment and skill analysis.
                Confidence, eye contact, and communication are estimates derived from
                the recorded webcam and speech session, when available.
              </p>
            </div>
          </div>
        ) : null}
      </div>
      <div id="report-feedback" className="grid gap-8 lg:grid-cols-2">
        <div className="panel p-8">
          <div className="mb-3 flex items-center gap-2">
            <FileWarning size={20} className="text-amber" />
            <h2 className="section-title">Resume Feedback</h2>
          </div>
          <ul className="space-y-3">
            {resumeSuggestions.map((item) => (
              <li key={item} className="rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-8">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb size={20} className="text-ocean" />
            <h2 className="section-title">Interview Improvement Suggestions</h2>
          </div>
          <ul className="space-y-3">
            {improvementTips.map((item) => (
              <li key={item} className="rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
