import {
  CheckCircle,
} from "lucide-react";

const activities = [
  "Resume uploaded successfully",
  "Skills extracted",
  "Skill gap generated",
  "Interview questions created",
];

export default function RecentActivity() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">

      <h2 className="mb-6 text-xl font-bold">
        Recent Activity
      </h2>

      <div className="space-y-4">

        {activities.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3"
          >
            <CheckCircle
              className="text-green-500"
              size={18}
            />

            <p className="text-slate-700">
              {item}
            </p>
          </div>
        ))}

      </div>
    </div>
  );
}