import { useEffect, useMemo, useState } from "react";
import Shell from "../components/Shell";
import { JobDetailPanel, JobRowCard } from "../components/JobShared";
import { listJobs } from "../api/jobs";
import { listBookmarks, removeBookmark } from "../api/bookmarks";

export default function BookmarksPage() {
  const userId = Number(localStorage.getItem("hc_user_id"));

  const [bookmarks, setBookmarks] = useState([]);
  const [jobs, setJobs]           = useState([]);
  const [selected, setSelected]   = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [removing, setRemoving]   = useState(null);

  async function load() {
    setError(""); setLoading(true);
    try {
      const [b, j] = await Promise.all([listBookmarks(userId), listJobs()]);
      setBookmarks(b ?? []);
      setJobs(j ?? []);
      // auto-select first
      if ((b ?? []).length > 0) {
        const firstJob = (j ?? []).find((jj) => jj.id === b[0].jobId) ?? null;
        setSelected({ bookmark: b[0], job: firstJob });
      } else {
        setSelected(null);
      }
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  const jobsById = useMemo(() => {
    const m = new Map();
    jobs.forEach((j) => m.set(j.id, j));
    return m;
  }, [jobs]);

  async function handleRemove(bookmark) {
    setRemoving(bookmark.jobId);
    try {
      await removeBookmark({ userId, jobId: bookmark.jobId });
      const next = bookmarks.filter((b) => b.jobId !== bookmark.jobId);
      setBookmarks(next);
      if (selected?.bookmark?.jobId === bookmark.jobId) {
        const first = next[0] ?? null;
        setSelected(first ? { bookmark: first, job: jobsById.get(first.jobId) ?? null } : null);
        setShowDetail(false);
      }
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Remove failed");
    } finally {
      setRemoving(null);
    }
  }

  const selectedJob = selected?.job ?? null;
  const selectedBm  = selected?.bookmark ?? null;

  return (
    <Shell>
      <div className="flex flex-col gap-4" style={{ minHeight: "75vh" }}>
        {/* header */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Saved Jobs</h1>
            <p className="text-sm text-slate-400 mt-0.5">{bookmarks.length} job{bookmarks.length !== 1 ? "s" : ""} bookmarked</p>
          </div>
          <button className="hc-btn-ghost text-sm px-4" onClick={load}>Refresh</button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}

        {/* split layout */}
        <div className="flex flex-1 gap-4 min-h-0" style={{ minHeight: "60vh" }}>

          {/* LEFT — bookmark list */}
          <div className={`flex flex-col gap-2 overflow-y-auto lg:w-[380px] xl:w-[420px] shrink-0 ${showDetail ? "hidden lg:flex" : "flex w-full"}`}>
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
            ) : bookmarks.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                <div className="text-4xl mb-3">🔖</div>
                <p className="text-slate-400 text-sm">No saved jobs yet.</p>
                <p className="text-slate-500 text-xs mt-1">Bookmark jobs from the Jobs page to find them here.</p>
              </div>
            ) : (
              bookmarks.map((b) => {
                const j = jobsById.get(b.jobId);
                const isSel = selected?.bookmark?.jobId === b.jobId;
                return (
                  <JobRowCard
                    key={b.id}
                    job={j ?? { id: b.jobId, title: "Job #" + b.jobId, status: "UNKNOWN" }}
                    selected={isSel}
                    onClick={() => { setSelected({ bookmark: b, job: j ?? null }); setShowDetail(true); }}
                    rightSlot={
                      <span className="shrink-0 text-[10px] text-slate-500 whitespace-nowrap">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                      </span>
                    }
                  />
                );
              })
            )}
          </div>

          {/* RIGHT — detail panel */}
          <div className={`flex-1 min-h-0 ${showDetail || "hidden lg:block"}`}>
            <JobDetailPanel
              job={selectedJob}
              onClose={() => setShowDetail(false)}
              extraBadge={
                selectedBm?.createdAt ? (
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
                    ★ Saved {new Date(selectedBm.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                ) : null
              }
              footerSlot={
                selectedBm ? (
                  <div className="flex gap-3">
                    <button
                      disabled={removing === selectedBm.jobId}
                      onClick={() => handleRemove(selectedBm)}
                      className="flex-1 rounded-xl border border-rose-500/40 bg-rose-500/10 py-2.5 text-sm font-medium text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-60"
                    >
                      {removing === selectedBm.jobId ? "Removing…" : "✕ Remove Bookmark"}
                    </button>
                  </div>
                ) : null
              }
            />
          </div>
        </div>
      </div>
    </Shell>
  );
}
