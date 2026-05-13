import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import { applicationsByCandidate } from "../api/applications";
import { interviewsByApplication } from "../api/interviews";
import { getJobById } from "../api/jobs";

export default function InterviewsPage() {
  const userId = Number(localStorage.getItem("hc_user_id"));
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setError("");
      try {
        const apps = await applicationsByCandidate(userId);
        const all = [];
        const jobsCache = {};

        for (const a of apps) {
          // Skip if application is REJECTED or OFFERED
          if (a.status === "REJECTED" || a.status === "OFFERED") continue;

          const ints = await interviewsByApplication(a.id);
          if (ints && ints.length > 0) {
            if (!jobsCache[a.jobId]) {
              jobsCache[a.jobId] = await getJobById(a.jobId);
            }
            const job = jobsCache[a.jobId];
            ints.forEach((i) => all.push({ application: a, interview: i, job }));
          }
        }
        all.sort(
          (x, y) =>
            new Date(y.interview.scheduledAt).getTime() -
            new Date(x.interview.scheduledAt).getTime()
        );
        setItems(all);
      } catch (e) {
        setError(e?.response?.data?.message ?? e?.message ?? "Failed to load");
      }
    })();
  }, [userId]);

  return (
    <Shell>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          My interviews
        </h2>
        <p className="text-sm text-slate-400">Interviews across your applications.</p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-3">
        {items.map(({ application, interview, job }) => (
          <div key={interview.id} className="hc-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-base font-bold text-white">
                  {job?.title || "Interview"}
                </div>
                {job?.companyName && (
                  <div className="text-sm font-medium text-indigo-300 mt-1">
                    {job.companyName}
                  </div>
                )}
              </div>
              <span className="hc-badge">{interview.status}</span>
            </div>
            <div className="mt-3 text-sm text-slate-300">
              Scheduled:{" "}
              <span className="text-white">
                {new Date(interview.scheduledAt).toLocaleString()}
              </span>
            </div>
            <div className="mt-2 text-sm text-slate-400">
              Mode: <span className="text-slate-200">{interview.mode}</span>
            </div>
            {interview.mode === "OFFLINE" && interview.location && (
              <div className="mt-2 text-sm text-slate-400">
                Location: <span className="text-indigo-300">{interview.location}</span>
              </div>
            )}
            {interview.meetLink && (
              <div className="mt-2 text-sm">
                <a
                  className="text-indigo-300 hover:text-indigo-200 underline underline-offset-4"
                  href={interview.meetLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Join meeting
                </a>
              </div>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="hc-card p-10 text-center text-slate-300">
            No interviews scheduled yet.
          </div>
        )}
      </div>
    </Shell>
  );
}

