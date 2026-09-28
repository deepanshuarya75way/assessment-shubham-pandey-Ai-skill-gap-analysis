import { Bot, LogOut, User } from "lucide-react";
import { motion } from "framer-motion";

const pages = [
  {
    id: "dashboard",
    label: "Dashboard",
  },
  {
    id: "resume",
    label: "Resume",
  },
  {
    id: "interview",
    label: "Interview",
  },
  {
    id: "report",
    label: "Analysis",
  },
  {
    id: "roadmap",
    label: "Roadmap",
  },
  {
    id: "chatbot",
    label: "Chatbot",
  },
];

export default function Header({
  activePage,
  setActivePage,
  user,
  onLogout,
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap">
        {/* Logo */}

        <motion.div
          initial={{ opacity: 0, x: -25 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-white sm:h-12 sm:w-12">
            <Bot size={26} />
          </div>

          <div>
            <h1 className="text-lg font-black text-slate-900 sm:text-xl">
              AI Interview
            </h1>

            <p className="hidden text-sm text-slate-500 sm:block">
              Intelligence Platform
            </p>
          </div>
        </motion.div>

        {/* Navigation */}

        <nav aria-label="Main navigation" className="order-3 flex w-full gap-1 overflow-x-auto rounded-md bg-slate-100 p-1 lg:order-none lg:w-auto">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => setActivePage(page.id)}
              className={`relative shrink-0 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                activePage === page.id
                  ? "text-white"
                  : "text-slate-600 hover:bg-white hover:text-ink"
              }`}
            >
              {activePage === page.id && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 rounded-md bg-ink"
                />
              )}

              <span className="relative z-10">{page.label}</span>
            </button>
          ))}
        </nav>

        {/* Right */}

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm md:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <User className="text-blue-600" size={18} />
            </div>

            <div>
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-slate-500">
                Welcome Back
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            aria-label="Log out"
            className="flex min-h-10 items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-700 hover:text-white"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}