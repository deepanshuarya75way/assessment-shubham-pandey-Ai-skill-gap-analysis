import { useState } from "react";
import { BrainCircuit, Loader2, LockKeyhole, UserPlus } from "lucide-react";
import { loginUser, signupUser } from "../api.js";

export default function AuthScreen({ onAuth, initialError = "" }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result =
        mode === "signup"
          ? await signupUser(name, email, password)
          : await loginUser(email, password);
      localStorage.setItem("ai_interview_auth", JSON.stringify(result));
      onAuth(result.user);
    } catch (apiError) {
      const message = apiError.message || "Authentication failed. Please try again.";
      setError(
        mode === "login" && message === "Invalid email or password"
          ? "Invalid email or password. If this account was created before account persistence was added, sign up once more; older accounts were stored only in memory."
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fb] px-5">
      <section className="panel w-full max-w-md p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-ink text-white">
            <BrainCircuit size={24} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-ocean">
              AI Interview Platform
            </p>
            <h1 className="text-2xl font-black text-ink">
              {mode === "login" ? "Sign In" : "Create Account"}
            </h1>
          </div>
        </div>

        {error ? (
          <div className="mb-8 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose">
            {error}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">Name</span>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-ocean"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-700">Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-ocean"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-700">Password</span>
            <input
              required
              type="password"
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-ocean"
            />
          </label>

          <button
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ocean px-6 py-3 text-sm font-black text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : mode === "login" ? (
              <LockKeyhole size={17} />
            ) : (
              <UserPlus size={17} />
            )}
            {mode === "login" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          type="button"
          className="mt-8 w-full rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          {mode === "login" ? "Need an account? Sign Up" : "Already registered? Sign In"}
        </button>
      </section>
    </main>
  );
}
