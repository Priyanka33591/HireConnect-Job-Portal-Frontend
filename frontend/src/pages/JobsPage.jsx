import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listJobs, searchJobs } from "../api/jobs";
import Shell from "../components/Shell";
import { JobDetailPanel, JobRowCard, pickColor, initials } from "../components/JobShared";
import { addBookmark, listBookmarks, removeBookmark } from "../api/bookmarks";
import { applicationsByCandidate, applyToJob } from "../api/applications";

export default function JobsPage() {
  const nav = useNavigate();
  const token    = localStorage.getItem("hc_access_token");
  const userId   = Number(localStorage.getItem("hc_user_id"));
  const role     = localStorage.getItem("hc_role");
  const isLoggedIn  = Boolean(token);
  const isCandidate = role === "ROLE_CANDIDATE";

  const [jobs, setJobs]               = useState([]);
  const [title, setTitle]             = useState("");
  const [location, setLocation]       = useState("");
  const [salary, setSalary]           = useState("");
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [message, setMessage]         = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetail, setShowDetail]   = useState(false);
  const [bookmarkSet, setBookmarkSet] = useState(new Set());
  const [appliedIds, setAppliedIds]   = useState(new Set());
  const [applyingId, setApplyingId]   = useState(null);

  async function load() {
    setError(""); setMessage(""); setLoading(true);
    try {
      const data = await listJobs();
      setJobs(data);
      if (data.length > 0) setSelectedJob((prev) => prev ?? data[0]);
      if (isLoggedIn && isCandidate) {
        const [bm, apps] = await Promise.all([listBookmarks(userId), applicationsByCandidate(userId)]);
        setBookmarkSet(new Set((bm ?? []).map((b) => b.jobId)));
        setAppliedIds(new Set((apps ?? []).map((a) => a.jobId)));
      }
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  async function onSearch(e) {
    e.preventDefault(); setError("");
    try {
      const data = await searchJobs({
        title: title || undefined,
        location: location || undefined,
        salary: salary ? Number(salary) : undefined,
      });
      setJobs(data);
      setSelectedJob(data[0] ?? null);
    } catch (e2) {
      setError(e2?.response?.data?.message ?? e2?.message ?? "Search failed");
    }
  }

  async function handleApply() {
    if (!selectedJob) return;
    setError(""); setMessage(""); setApplyingId(selectedJob.id);
    try {
      await applyToJob({ jobId: selectedJob.id, candidateId: userId, coverLetter: "", resumeUrl: null });
      setAppliedIds((prev) => new Set([...prev, selectedJob.id]));
      setMessage(`Applied successfully for "${selectedJob.title}"!`);
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Apply failed");
    } finally {
      setApplyingId(null);
    }
  }

  async function handleBookmark(job) {
    if (!isLoggedIn) { nav("/login"); return; }
    const has = bookmarkSet.has(job.id);
    try {
      if (has) {
        await removeBookmark({ userId, jobId: job.id });
        setBookmarkSet((prev) => { const n = new Set(prev); n.delete(job.id); return n; });
      } else {
        await addBookmark({ userId, jobId: job.id });
        setBookmarkSet((prev) => new Set([...prev, job.id]));
      }
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Bookmark failed");
    }
  }

  useEffect(() => { load(); }, []);

  const isOpen = selectedJob?.status === "OPEN";
  const applied = selectedJob ? appliedIds.has(selectedJob.id) : false;
  const bookmarked = selectedJob ? bookmarkSet.has(selectedJob.id) : false;

  return (
    <Shell>
      <div className="flex flex-col gap-4 h-full">
        {/* page header */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Explore Jobs</h1>
            <p className="text-sm text-slate-400 mt-0.5">{jobs.length} opportunities found</p>
          </div>
          {!isLoggedIn && (
            <button className="hc-btn-primary text-sm" onClick={() => nav("/login")}>
              Login to Apply
            </button>
          )}
        </div>

        {/* search bar */}
        <form
          onSubmit={onSearch}
          className="flex flex-wrap gap-2 items-end rounded-2xl border border-white/10 bg-white/5 p-3"
        >
          <div className="flex-1 min-w-36">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 pl-1">Job Title</label>
            <input className="hc-input mt-1 text-sm" placeholder="e.g. Backend Engineer" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex-1 min-w-32">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 pl-1">Location</label>
            <input className="hc-input mt-1 text-sm" placeholder="e.g. Bengaluru" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="flex-1 min-w-28">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 pl-1">Min Salary</label>
            <input className="hc-input mt-1 text-sm" placeholder="e.g. 500000" value={salary} onChange={(e) => setSalary(e.target.value)} />
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="submit" className="hc-btn-primary text-sm px-5">Search</button>
            <button type="button" className="hc-btn-ghost text-sm px-4" onClick={() => { setTitle(""); setLocation(""); setSalary(""); load(); }}>Clear</button>
          </div>
        </form>

        {/* banners */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
            {error.toLowerCase().includes("free trail is over") && (
              <button
                onClick={() => nav("/subscription")}
                className="ml-4 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-100 border border-rose-500/30 hover:bg-rose-500/30 transition-all active:scale-95"
              >
                Go to Subscriptions
              </button>
            )}
          </div>
        )}
        {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</div>}

        {/* split layout */}
        <div className="flex flex-1 gap-4 items-start">

          {/* LEFT — job list */}
          <div className={`flex flex-col gap-2 lg:w-[380px] xl:w-[420px] shrink-0 ${showDetail ? "hidden lg:flex" : "flex w-full"}`}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="h-11 w-11 rounded-xl bg-white/10 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 w-3/4 rounded bg-white/10 animate-pulse" />
                      <div className="h-3 w-1/2 rounded bg-white/10 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-3 w-full rounded bg-white/10 animate-pulse" />
                </div>
              ))
            ) : jobs.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">
                <p className="text-sm">No jobs found. Try different filters.</p>
              </div>
            ) : (
              jobs.map((j) => (
                <JobRowCard
                  key={j.id}
                  job={j}
                  selected={selectedJob?.id === j.id}
                  onClick={() => { setSelectedJob(j); setShowDetail(true); }}
                  rightSlot={
                    isLoggedIn && isCandidate ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleBookmark(j); }}
                        className="ml-1 shrink-0 text-slate-400 hover:text-amber-400 transition-colors"
                      >
                        {bookmarkSet.has(j.id) ? (
                          <svg className="h-4 w-4 fill-amber-400 text-amber-400" viewBox="0 0 24 24">
                            <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17l-7-3-7 3V4z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17l-7-3-7 3V4z" />
                          </svg>
                        )}
                      </button>
                    ) : null
                  }
                />
              ))
            )}
          </div>

          {/* RIGHT — detail */}
          <div className={`flex-1 sticky top-[104px] z-10 ${showDetail || "hidden lg:block"}`}>
            <JobDetailPanel
              job={selectedJob}
              onClose={() => setShowDetail(false)}
              extraBadge={applied ? (
                <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-medium text-violet-300">
                  ✓ Applied
                </span>
              ) : null}
              footerSlot={
                <div className="flex gap-3">
                  {!isLoggedIn ? (
                    <button className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 transition" onClick={() => nav("/login")}>
                      Login to Apply
                    </button>
                  ) : isCandidate && isOpen ? (
                    <button
                      disabled={applied || applyingId === selectedJob?.id}
                      onClick={handleApply}
                      className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                        applied
                          ? "bg-emerald-600/30 text-emerald-300 cursor-default"
                          : "bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-60"
                      }`}
                    >
                      {applied ? "✓ Applied" : applyingId === selectedJob?.id ? "Applying…" : "Apply Now"}
                    </button>
                  ) : !isOpen ? (
                    <button disabled className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm text-slate-400 cursor-not-allowed">
                      Position Closed
                    </button>
                  ) : null}

                  {isLoggedIn && isCandidate && (
                    <button
                      onClick={() => handleBookmark(selectedJob)}
                      className={`rounded-xl px-4 py-2.5 text-sm font-medium transition border ${
                        bookmarked
                          ? "border-amber-400/40 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {bookmarked ? "★ Saved" : "☆ Save"}
                    </button>
                  )}
                </div>
              }
            />
          </div>
        </div>
      </div>
    </Shell>
  );
}
