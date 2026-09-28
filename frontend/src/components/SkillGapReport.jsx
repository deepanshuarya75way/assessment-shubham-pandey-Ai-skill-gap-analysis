import { BrainCircuit, CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function SkillGapReport({ report, onGenerateInterview, loading }) {
  if (!report) {
    return null;
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
          <BrainCircuit size={20} className="text-purple-700" />
          <h2 className="section-title">3. Skill Gap Report</h2>
        </div>
        <div className="rounded-md bg-ocean px-3 py-1.5 text-sm font-black text-white">
          {report.score}% Match
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-3 flex items-center gap-2 font-black text-emerald-800">
            <CheckCircle2 size={18} />
            Matched Skills
          </div>
          <div className="flex flex-wrap gap-2">
            {report.matched_skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-rose-200 bg-rose-50 p-4">
          <div className="mb-3 flex items-center gap-2 font-black text-rose">
            <XCircle size={18} />
            Missing Skills
          </div>
          <div className="flex flex-wrap gap-2">
            {report.missing_skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-rose ring-1 ring-rose-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onGenerateInterview}
        disabled={loading}
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        Generate 10-12 Resume-Based Webcam Questions
      </button>
    </section>
  );
}
