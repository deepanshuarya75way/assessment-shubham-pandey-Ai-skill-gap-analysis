import { BriefcaseBusiness, Loader2 } from "lucide-react";

export default function RoleSelector({
  roles,
  selectedRole,
  onRoleChange,
  selectedRoleData,
  onAnalyzeGap,
  loading,
  candidateSkills,
}) {
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
      <div className="mb-8 flex items-center gap-2">
        <BriefcaseBusiness size={20} className="text-indigo-700" />
        <h2 className="section-title">2. Role Selection</h2>
      </div>

      <div className="grid gap-8 md:grid-cols-[0.7fr_1.3fr_auto] md:items-start">
        <select
          value={selectedRole}
          onChange={(event) => onRoleChange(event.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-ocean"
        >
          {roles.map((role) => (
            <option key={role.name} value={role.name}>
              {role.name}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-2">
          {selectedRoleData?.required_skills.map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200"
            >
              {skill}
            </span>
          ))}
        </div>

        <button
          onClick={onAnalyzeGap}
          disabled={loading || !candidateSkills.length}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          Analyze Skill Gap
        </button>
      </div>
    </section>
  );
}

