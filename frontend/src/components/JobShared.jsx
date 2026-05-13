/**
 * Shared job detail panel + compact job card used across
 * JobsPage, BookmarksPage, and ApplicationsPage.
 */

// ── helpers ────────────────────────────────────────────────────────────────
export function fmtSalary(n) {
  if (!n) return null;
  return Number(n).toLocaleString("en-IN");
}

export function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export function initials(title = "") {
  return title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const PALETTE = [
  "from-indigo-500 to-violet-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-sky-600",
];
export function pickColor(id) {
  return PALETTE[(id ?? 0) % PALETTE.length];
}

export function fmtPhotoUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  // Handle leading slash
  const path = url.startsWith("/") ? url : `/${url}`;
  return `http://localhost:8080/api${path}`;
}

// ── JobDetailPanel ─────────────────────────────────────────────────────────
/**
 * Right-side detail panel. Shows full job info + contextual actions.
 *
 * Props:
 *   job            – job object or null
 *   onClose        – () => void  (mobile back button)
 *   extraBadge     – optional JSX rendered next to status badge (e.g. application status)
 *   footerSlot     – optional JSX rendered in the sticky footer (e.g. Apply / Remove bookmark)
 */
export function JobDetailPanel({ job, onClose, extraBadge, footerSlot }) {
  if (!job) {
    return (
      <div className="hidden lg:flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-10">
        <div className="text-center text-slate-500">
          <svg
            className="mx-auto h-12 w-12 mb-3 opacity-30"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
          <p className="text-sm">Select a job to view details</p>
        </div>
      </div>
    );
  }

  const isOpen = job.status === "OPEN";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/5 backdrop-blur">
      {/* ── header ── */}
      <div className="border-b border-white/10 p-5">
        <div className="flex items-start gap-4">
          {/* logo */}
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white font-bold text-lg ${pickColor(job.id)}`}
          >
            {initials(job.title)}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white leading-tight">{job.title}</h2>
            {job.companyName && (
              <p className="mt-1 text-sm font-medium text-indigo-300">{job.companyName}</p>
            )}
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
              <svg
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                />
                <circle cx="12" cy="11" r="3" />
              </svg>
              {job.location || "Remote"}
            </p>
          </div>

          {/* mobile close */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          {job.type && (
            <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-300">
              {job.type}
            </span>
          )}
          {job.category && (
            <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-medium text-sky-300">
              {job.category}
            </span>
          )}
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              isOpen ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
            }`}
          >
            {isOpen ? "● Open" : "● Closed"}
          </span>
          {job.experienceRequired != null && (
            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-slate-300">
              {job.experienceRequired}+ yrs exp
            </span>
          )}
          {extraBadge}
        </div>

        {/* salary card */}
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <svg
            className="h-5 w-5 text-emerald-400 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-xs text-slate-400">Annual CTC</p>
            <p className="text-sm font-semibold text-white">
              {fmtSalary(job.salaryMin) && fmtSalary(job.salaryMax)
                ? `₹${fmtSalary(job.salaryMin)} – ₹${fmtSalary(job.salaryMax)}`
                : "Not disclosed"}
            </p>
          </div>
        </div>
      </div>

      {/* ── scrollable body ── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {job.skills && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.split(/[,;]+/).map((s, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-white/8 border border-white/10 px-2.5 py-1 text-xs text-slate-200"
                >
                  {s.trim()}
                </span>
              ))}
            </div>
          </section>
        )}

        {job.description && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Job Description
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </section>
        )}

        {job.postedDate && (
          <p className="text-xs text-slate-500">Posted {timeAgo(job.postedDate)}</p>
        )}
      </div>

      {/* ── sticky footer ── */}
      {footerSlot && (
        <div className="border-t border-white/10 p-4">{footerSlot}</div>
      )}
    </div>
  );
}

// ── Compact job row card (reusable) ────────────────────────────────────────
export function JobRowCard({ job, selected, onClick, rightSlot }) {
  if (!job) return null;
  const isOpen = job.status === "OPEN";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 hover:border-indigo-400/60 hover:shadow-lg hover:shadow-indigo-900/20 hover:-translate-y-0.5 active:translate-y-0 ${
        selected
          ? "border-indigo-400/80 bg-indigo-500/10 shadow-lg shadow-indigo-900/20"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* logo */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white font-bold text-sm ${pickColor(job.id)}`}
        >
          {initials(job.title)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-white leading-tight">
              {job.title}
            </p>
            {rightSlot}
          </div>
          {job.companyName && (
            <p className="truncate text-xs font-medium text-indigo-300 mt-0.5">
              {job.companyName}
            </p>
          )}
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
            <svg
              className="h-3 w-3 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
              />
              <circle cx="12" cy="11" r="3" />
            </svg>
            {job.location || "Remote"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.type && (
          <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
            {job.type}
          </span>
        )}
        {job.category && (
          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-300">
            {job.category}
          </span>
        )}
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            isOpen ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
          }`}
        >
          {job.status}
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <p className="text-xs font-medium text-white">
          {fmtSalary(job.salaryMin) && fmtSalary(job.salaryMax)
            ? `₹${fmtSalary(job.salaryMin)} – ₹${fmtSalary(job.salaryMax)}`
            : "Salary not disclosed"}
        </p>
        {job.postedDate && (
          <p className="text-[10px] text-slate-500">{timeAgo(job.postedDate)}</p>
        )}
      </div>
    </button>
  );
}
