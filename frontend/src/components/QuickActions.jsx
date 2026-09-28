import {
  Upload,
  Video,
  PieChart,
  MessageCircle,
} from "lucide-react";

const actions = [
  {
    title: "Upload Resume",
    icon: Upload,
    page: "resume",
    color: "bg-blue-500",
  },
  {
    title: "Start Interview",
    icon: Video,
    page: "interview",
    color: "bg-violet-500",
  },
  {
    title: "View Report",
    icon: PieChart,
    page: "report",
    color: "bg-green-500",
  },
  {
    title: "AI Chatbot",
    icon: MessageCircle,
    page: "chatbot",
    color: "bg-orange-500",
  },
];

export default function QuickActions({
  setActivePage,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">

      <h2 className="mb-6 text-xl font-bold">
        Quick Actions
      </h2>

      <div className="grid gap-8 sm:grid-cols-2">

        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              onClick={() => setActivePage(action.page)}
              className="flex items-center gap-8 rounded-2xl border border-slate-200 p-8 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${action.color}`}
              >
                <Icon size={22} />
              </div>

              <div className="text-left">
                <h3 className="font-bold">
                  {action.title}
                </h3>

                <p className="text-sm text-slate-500">
                  Open
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}