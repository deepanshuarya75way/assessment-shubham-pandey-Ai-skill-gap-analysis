import { Sparkles, TrendingUp } from "lucide-react";

export default function AIInsights({
  gapReport,
  evaluation,
  confidenceReport,
}) {
  const insights = [];

  if ((gapReport?.score || 0) < 70)
    insights.push("Improve your resume ATS score.");

  if ((evaluation?.average_score || 0) < 75)
    insights.push("Practice technical interview questions.");

  if ((confidenceReport?.eyeContactScore || 0) < 70)
    insights.push("Maintain better eye contact during interviews.");

  if ((confidenceReport?.confidenceScore || 0) < 70)
    insights.push("Improve confidence by speaking slowly and clearly.");

  if (!insights.length) {
    insights.push("Excellent work! Your profile is interview-ready.");
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
      <div className="mb-5 flex items-center gap-3">
        <Sparkles className="text-yellow-500" />

        <h2 className="text-xl font-bold">
          AI Insights
        </h2>
      </div>

      <div className="space-y-4">
        {insights.map((item, index) => (
          <div
            key={index}
            className="flex gap-3 rounded-xl bg-yellow-50 p-4"
          >
            <TrendingUp
              className="mt-1 text-yellow-600"
              size={18}
            />

            <p>{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}