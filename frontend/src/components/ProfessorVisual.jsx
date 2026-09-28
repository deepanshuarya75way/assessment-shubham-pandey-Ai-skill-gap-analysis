import { Image } from "lucide-react";

export default function ProfessorVisual() {
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
        <Image size={20} className="text-indigo-700" />
        <h2 className="section-title">Professor Roadmap Visual</h2>
      </div>
      <img
        src="/roadmap-features-professor.svg"
        alt="AI interview intelligence roadmap and features"
        className="w-full rounded-md border border-slate-200"
      />
      <img
        src="/chat-summary-professor.svg"
        alt="Professor explanation chat summary"
        className="mt-8 w-full rounded-md border border-slate-200"
      />
    </section>
  );
}
