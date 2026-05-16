import { useEffect, useMemo, useState } from "react";
import Shell from "../components/Shell";
import { JobDetailPanel, JobRowCard, pickColor, initials } from "../components/JobShared";
import { applicationsByCandidate } from "../api/applications";
import { http } from "../api/http";
import { listJobs } from "../api/jobs";

// ── Status pill ────────────────────────────────────────────────────────────
const STATUS_MAP = {
  APPLIED:     { bg: "bg-sky-500/15",     text: "text-sky-300",     border: "border-sky-500/30",     dot: "bg-sky-400"     },
  SHORTLISTED: { bg: "bg-amber-500/15",   text: "text-amber-300",   border: "border-amber-500/30",   dot: "bg-amber-400"   },
  INTERVIEW:   { bg: "bg-indigo-500/15",  text: "text-indigo-300",  border: "border-indigo-500/30",  dot: "bg-indigo-400"  },
  OFFERED:     { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  REJECTED:    { bg: "bg-rose-500/15",    text: "text-rose-300",    border: "border-rose-500/30",    dot: "bg-rose-400"    },
};

function StatusPill({ status }) {
  const s = STATUS_MAP[status] ?? { bg: "bg-white/5", text: "text-slate-300", border: "border-white/10", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text} ${s.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

// ── Progress tracker ───────────────────────────────────────────────────────
const STAGES = [
  { key: "APPLIED",     label: "Applied",     icon: "📝" },
  { key: "SHORTLISTED", label: "Shortlisted", icon: "✅" },
  { key: "INTERVIEW",   label: "Interview",   icon: "🎙️" },
  { key: "OFFERED",     label: "Offered",     icon: "🎉" },
];

function ProgressTracker({ app, hasInterview }) {
  const journey = app.statusHistory || (
    app.status === "OFFERED" ? "APPLIED -> SHORTLISTED -> INTERVIEW -> OFFERED" :
    app.status === "REJECTED" ? (hasInterview ? "APPLIED -> SHORTLISTED -> INTERVIEW -> REJECTED" : "APPLIED -> REJECTED") :
    app.status === "INTERVIEW" ? "APPLIED -> SHORTLISTED -> INTERVIEW" :
    app.status === "SHORTLISTED" ? "APPLIED -> SHORTLISTED" :
    "APPLIED"
  );

  const steps = journey.split(" -> ");
  const allStages = [
    { key: "APPLIED", label: "Applied", icon: "📝" },
    { key: "SHORTLISTED", label: "Shortlisted", icon: "✅" },
    { key: "INTERVIEW", label: "Interview", icon: "🎙️" },
    { key: "OFFERED", label: "Offered", icon: "🎉" },
    { key: "REJECTED", label: "Rejected", icon: "✕" }
  ];

  // Filter stages that are part of this journey
  const visibleStages = allStages.filter(s => steps.includes(s.key) || (s.key === "APPLIED"));
  
  // Ensure we always show at least the standard path up to current status if not rejected
  if (app.status !== "REJECTED") {
    const standard = ["APPLIED", "SHORTLISTED", "INTERVIEW", "OFFERED"];
    const currentIdx = standard.indexOf(app.status);
    standard.slice(0, currentIdx + 1).forEach(k => {
      if (!visibleStages.find(vs => vs.key === k)) {
        visibleStages.push(allStages.find(as => as.key === k));
      }
    });
  }
  
  // Final sort to maintain logical order
  const order = ["APPLIED", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED"];
  visibleStages.sort((a, b) => {
    return order.indexOf(a.key) - order.indexOf(b.key);
  });

  const currentStatusIdx = order.indexOf(app.status);

  return (
    <div className="relative flex items-start gap-0 mt-2">
      {visibleStages.map((stage, i) => {
        const stageIdx = order.indexOf(stage.key);
        const isLastReached = stage.key === app.status;
        const isPast = steps.includes(stage.key) || (stageIdx < currentStatusIdx && app.status !== "REJECTED");
        const isLast = i === visibleStages.length - 1;
        const isRejected = stage.key === "REJECTED";

        return (
          <div key={stage.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div className={`h-0.5 flex-1 ${i === 0 ? "invisible" : (isPast || isLastReached) ? (isRejected ? "bg-rose-500/50" : "bg-indigo-500") : "bg-white/10"}`} />
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm border-2 transition-all ${
                  isLastReached
                    ? isRejected ? "border-rose-500 bg-rose-500/20 text-rose-100 shadow-lg shadow-rose-900/30" : "border-indigo-400 bg-indigo-500/30 text-indigo-100 shadow-lg shadow-indigo-900/30"
                    : isPast
                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-100"
                    : "border-white/15 bg-white/5 text-slate-500"
                }`}
              >
                {(isPast || (isLastReached && !isRejected)) ? stage.icon : <span className="text-xs">{i + 1}</span>}
              </div>
              <div className={`h-0.5 flex-1 ${isLast ? "invisible" : (isPast && !isLastReached) ? "bg-indigo-500" : "bg-white/10"}`} />
            </div>
            <p className={`mt-2 text-center text-[10px] font-bold uppercase tracking-tight ${isLastReached ? (isRejected ? "text-rose-400" : "text-indigo-300") : isPast ? "text-emerald-400" : "text-slate-500"}`}>
              {stage.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── ApplicationsPage ───────────────────────────────────────────────────────
export default function ApplicationsPage() {
  const userId = Number(localStorage.getItem("hc_user_id"));

  const [apps, setApps]           = useState([]);
  const [jobs, setJobs]           = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    (async () => {
      setError(""); setLoading(true);
      try {
        const [appData, jobData, interviewData] = await Promise.all([
          applicationsByCandidate(userId),
          listJobs(),
          http.get("/interviews").then(r => r.data).catch(() => [])
        ]);
        setApps(appData ?? []);
        setJobs(jobData ?? []);
        setInterviews((Array.isArray(interviewData) ? interviewData : []).filter(i => i.candidateId === userId));
        
        if ((appData ?? []).length > 0) {
          const firstJob = (jobData ?? []).find((j) => j.id === appData[0].jobId) ?? null;
          setSelected({ app: appData[0], job: firstJob });
        }
      } catch (e) {
        setError(e?.response?.data?.message ?? e?.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const jobsById = useMemo(() => {
    const m = new Map();
    jobs.forEach((j) => m.set(j.id, j));
    return m;
  }, [jobs]);

  const selectedJob = selected?.job ?? null;
  const selectedApp = selected?.app ?? null;
  const [showJobDetail, setShowJobDetail] = useState(false);

  // reset toggle when selection changes
  useEffect(() => { setShowJobDetail(false); }, [selected?.app?.id]);

  return (
    <Shell>
      <div className="flex flex-col gap-4" style={{ minHeight: "75vh" }}>

        {/* header */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">My Applications</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {apps.length} application{apps.length !== 1 ? "s" : ""} · Track your hiring journey
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}

        {/* split layout */}
        <div className="flex flex-1 gap-4 items-start">

          {/* LEFT — application list */}
          <div className={`flex flex-col gap-2 lg:w-[380px] xl:w-[420px] shrink-0 ${showDetail ? "hidden lg:flex" : "flex w-full"}`}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="h-11 w-11 rounded-xl bg-white/10 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 w-3/4 rounded bg-white/10 animate-pulse" />
                      <div className="h-3 w-1/2 rounded bg-white/10 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))
            ) : apps.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-slate-400 text-sm">No applications yet.</p>
                <p className="text-slate-500 text-xs mt-1">Apply to jobs from the Jobs page.</p>
              </div>
            ) : (
              apps.map((a) => {
                const j   = jobsById.get(a.jobId);
                const isSel = selected?.app?.id === a.id;
                return (
                  <JobRowCard
                    key={a.id}
                    job={j ?? { id: a.jobId, title: "Job #" + a.jobId, status: "UNKNOWN" }}
                    selected={isSel}
                    onClick={() => { setSelected({ app: a, job: j ?? null }); setShowDetail(true); }}
                    rightSlot={<StatusPill status={a.status} />}
                  />
                );
              })
            )}
          </div>

          {/* RIGHT — detail panel */}
          <div className={`flex-1 sticky top-[104px] z-10 ${showDetail || "hidden lg:block"}`}>
            {selectedApp ? (
              <div className="flex flex-col gap-4">

                {/* ── Application status card (always visible) ── */}
                <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-5 space-y-4">

                  {/* mobile back */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowDetail(false)}
                      className="lg:hidden flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                    <span className="text-xs text-slate-500">App #{selectedApp.id}</span>
                  </div>

                  {/* job title summary */}
                  {selectedJob && (
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white font-bold text-sm ${pickColor(selectedJob.id)}`}>
                        {initials(selectedJob.title)}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm leading-tight">{selectedJob.title}</p>
                        {selectedJob.companyName && (
                          <p className="text-xs font-medium text-indigo-300 mt-0.5">{selectedJob.companyName}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-0.5">{selectedJob.location || "Remote"}</p>
                      </div>
                    </div>
                  )}

                  {/* current status highlight */}
                  <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3">
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 mb-1">Application Status</p>
                      <StatusPill status={selectedApp.status} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-0.5">Applied on</p>
                      <p className="text-xs text-white font-medium">
                        {selectedApp.appliedAt
                          ? new Date(selectedApp.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* journey tracker */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                      Hiring Journey
                    </p>
                    <ProgressTracker 
                      app={selectedApp} 
                      hasInterview={interviews.some(i => i.applicationId === selectedApp.id)} 
                    />
                  </div>
                </div>

                {/* ── Show more / job details accordion ── */}
                <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowJobDetail((v) => !v)}
                    className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-slate-200 hover:bg-white/5 transition"
                  >
                    <span>{showJobDetail ? "Hide job details" : "Show job details"}</span>
                    <svg
                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showJobDetail ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showJobDetail && (
                    <div className="border-t border-white/10">
                      <JobDetailPanel
                        job={selectedJob}
                        onClose={null}
                        extraBadge={null}
                        footerSlot={null}
                      />
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="hidden lg:flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-10">
                <div className="text-center text-slate-500">
                  <div className="text-4xl mb-3 opacity-50">📋</div>
                  <p className="text-sm">Select an application to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
