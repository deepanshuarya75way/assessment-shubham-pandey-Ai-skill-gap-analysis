import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FileText, Gauge, Upload, Video } from "lucide-react";

const skillColors = ["#0f766e", "#d97706"];

export default function Dashboard({
  user,
  candidateSkills,
  gapReport,
  evaluation,
  confidenceReport,
  setActivePage,
  active = true,
}) {
  const interviewLabel = evaluation?.evaluation_method === "keyword_heuristic"
    ? "Interview (heuristic)"
    : "Interview";
  const scoreData = [
    { name: "Resume fit", score: gapReport ? Number(gapReport.score) : null },
    { name: interviewLabel, score: evaluation ? Number(evaluation.average_score) : null },
    {
      name: "Confidence",
      score: confidenceReport ? Number(confidenceReport.confidenceScore) : null,
    },
    {
      name: "Communication",
      score: confidenceReport ? Number(confidenceReport.communicationScore) : null,
    },
  ].filter((item) => Number.isFinite(item.score));

  const skillData = gapReport
    ? [
        { name: "Matched", value: gapReport.matched_skills.length },
        { name: "Missing", value: gapReport.missing_skills.length },
      ]
    : [];

  const activities = [
    candidateSkills.length ? `${candidateSkills.length} resume skills analyzed` : null,
    gapReport ? `Skill gap analyzed for ${gapReport.target_role}` : null,
    evaluation ? `${evaluation.feedback.length} interview answers evaluated` : null,
  ].filter(Boolean);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-ocean">Candidate overview</p>
          <h1 className="mt-1 text-2xl font-black text-ink">Welcome, {user?.name || "Candidate"}</h1>
          <p className="mt-1 text-sm text-slate-600">Your interview preparation, in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton icon={Upload} onClick={() => setActivePage("resume")}>Resume & skills</ActionButton>
          <ActionButton icon={Video} onClick={() => setActivePage("interview")}>Interview</ActionButton>
          <ActionButton
            icon={FileText}
            onClick={() => setActivePage("report")}
            disabled={!evaluation}
          >
            Analysis report
          </ActionButton>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Resume skills" value={candidateSkills.length || "Not analyzed"} icon={FileText} />
        <Metric label="Role match" value={gapReport ? `${Math.round(gapReport.score)}%` : "Not analyzed"} icon={Gauge} />
        <Metric label={interviewLabel === "Interview" ? "Interview score" : "Interview score (heuristic)"} value={evaluation ? `${Math.round(evaluation.average_score)}%` : "Not completed"} icon={Video} />
        <Metric label="Confidence estimate" value={confidenceReport ? `${confidenceReport.confidenceScore}%` : "Not measured"} icon={Gauge} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-md border border-slate-200 bg-white p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-ink">Assessment performance</h2>
            <p className="mt-1 text-sm text-slate-500">Only completed analysis results are plotted.</p>
          </div>
          {active && scoreData.length ? (
            <div className="h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreData} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [`${value}%`, "Score"]} />
                  <Bar dataKey="score" fill="#0f766e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : active ? (
            <EmptyState>Complete a resume or interview assessment to see scores here.</EmptyState>
          ) : null}
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-ink">Role skill coverage</h2>
            <p className="mt-1 text-sm text-slate-500">Matched skills compared with role requirements.</p>
          </div>
          {active && skillData.length ? (
            <div className="grid min-h-56 grid-cols-[1fr_1fr] items-center gap-2">
              <div className="h-52 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={skillData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={2}>
                      {skillData.map((item, index) => (
                        <Cell key={item.name} fill={skillColors[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-3 text-sm">
                {skillData.map((item, index) => (
                  <li key={item.name} className="flex items-center gap-2 text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: skillColors[index] }} />
                    <span>{item.name}</span>
                    <strong className="ml-auto text-ink">{item.value}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ) : active ? (
            <EmptyState>Analyze your skills against a target role to see coverage.</EmptyState>
          ) : null}
          {gapReport?.missing_skills?.length ? (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-xs font-bold uppercase text-slate-500">Priority gaps</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{gapReport.missing_skills.slice(0, 6).join(", ")}</p>
            </div>
          ) : null}
        </section>
      </div>

      <section className="border-t border-slate-200 pt-5">
        <h2 className="text-base font-bold text-ink">Recent activity</h2>
        {activities.length ? (
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            {activities.map((activity) => <li key={activity}>{activity}</li>)}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Your completed assessment steps will appear here.</p>
        )}
      </section>
    </section>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
        <Icon size={16} className="shrink-0 text-ocean" />
      </div>
      <p className="mt-3 text-xl font-black text-ink">{value}</p>
    </div>
  );
}

function ActionButton({ icon: Icon, children, disabled = false, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-ink hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon size={16} />
      {children}
    </button>
  );
}

function EmptyState({ children }) {
  return <p className="grid min-h-56 place-items-center text-center text-sm text-slate-500">{children}</p>;
}