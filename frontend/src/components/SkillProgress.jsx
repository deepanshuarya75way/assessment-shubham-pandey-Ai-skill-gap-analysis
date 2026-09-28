export default function SkillProgress({
  candidateSkills = [],
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-xl font-bold">
        Extracted Skills
      </h2>

      <div className="space-y-4">
        {candidateSkills.length ? (
          candidateSkills.map((skill) => (
            <div key={skill}>
              <div className="mb-1 flex justify-between">
                <span>{skill}</span>

                <span>100%</span>
              </div>

              <div className="h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-500">
            Upload your resume to see extracted skills.
          </p>
        )}
      </div>
    </div>
  );
}
