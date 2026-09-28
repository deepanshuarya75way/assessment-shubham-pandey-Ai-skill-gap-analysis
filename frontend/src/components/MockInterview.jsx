import { useState } from "react";
import { ClipboardCheck, Loader2, Mic } from "lucide-react";
import { evaluateInterview } from "../api.js";

export default function MockInterview({
  questions,
  onEvaluation,
  evaluation,
  targetRole,
  candidateSkills,
  resumeProfile,
}) {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!questions.length) {
    return null;
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const payload = questions.map((question) => ({
        question_id: question.id,
        question: question.question,
        skill: question.skill,
        answer: answers[question.id] || "",
      }));
      const result = await evaluateInterview(payload, {
        targetRole,
        candidateSkills,
        resumeText: resumeProfile?.text || "",
      });
      onEvaluation(result);
    } catch (apiError) {
      setError(apiError.message || "Could not evaluate these answers. Please try again.");
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
      <div className="mb-8 flex items-center gap-2">
        <Mic size={20} className="text-amber" />
        <h2 className="section-title">Optional Typed Interview Practice</h2>
      </div>

      <div className="space-y-4">
        {questions.map((question) => (
          <div key={question.id} className="rounded-md border border-slate-200 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">
                {question.skill}
              </span>
              <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-black text-amber ring-1 ring-amber-200">
                {question.difficulty}
              </span>
            </div>

            <p className="mb-3 text-sm font-bold text-ink">{question.question}</p>

            <textarea
              value={answers[question.id] || ""}
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  [question.id]: event.target.value,
                }))
              }
              className="min-h-24 w-full rounded-md border border-slate-300 p-3 text-sm leading-6 outline-none focus:border-ocean"
              placeholder="Type your answer here..."
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !Object.values(answers).some((answer) => answer.trim())}
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />}
        Evaluate Answers
      </button>

      {error ? <p role="alert" className="mt-3 text-sm font-semibold text-rose">{error}</p> : null}

      {evaluation ? (
        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-3 text-sm font-black text-ink">
            Average Interview Score: {evaluation.average_score}%
          </h3>
          <div className="space-y-2">
            {evaluation.feedback.map((item) => (
              <div key={item.question_id} className="text-sm text-slate-700">
                <p>
                  <span className="font-black">{item.skill}: </span>
                  {item.score}% - {item.feedback}
                </p>
                {item.strengths?.length ? (
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    Strengths: {item.strengths.join(", ")}
                  </p>
                ) : null}
                {item.improvements?.length ? (
                  <p className="mt-1 text-xs font-semibold text-rose">
                    Improve: {item.improvements.join(", ")}
                  </p>
                ) : null}
                {item.ideal_answer ? (
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Ideal outline: {item.ideal_answer}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
