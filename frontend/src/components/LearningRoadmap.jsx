import { PlayCircle, Route } from "lucide-react";

export default function LearningRoadmap({ roadmap }) {
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
        <Route size={20} className="text-rose" />
        <h2 className="section-title">Learning Roadmap</h2>
      </div>

      {!roadmap.length ? (
        <p className="text-sm leading-6 text-slate-600">
          Analyze a skill gap to generate a personalized weekly roadmap.
        </p>
      ) : (
        <div className="space-y-4">
          {roadmap.map((item) => (
            <div key={`${item.week}-${item.skill}`} className="rounded-md border border-slate-200 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-ink">
                  Week {item.week}: {item.skill}
                </h3>
              </div>
              <p className="mb-3 text-sm font-semibold text-slate-700">{item.goal}</p>
              <ul className="space-y-2">
                {item.tasks.map((task) => (
                  <li key={task} className="text-sm text-slate-600">
                    - {task}
                  </li>
                ))}
              </ul>
              {item.videos?.length ? (
                <div className="mt-8 rounded-md bg-slate-50 p-3">
                  <p className="mb-2 flex items-center gap-2 text-sm font-black text-ink">
                    <PlayCircle size={16} className="text-rose" />
                    Suggested Videos
                  </p>
                  <div className="space-y-2">
                    {item.videos.map((video) => (
                      <a
                        key={video.url}
                        href={video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm font-bold text-ocean underline-offset-2 hover:underline"
                      >
                        {video.title}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
