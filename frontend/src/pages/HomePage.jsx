import { Link } from "react-router-dom";
import Shell from "../components/Shell";

const highlights = [
  { title: "Smart Job Discovery", desc: "Search by title, location, and salary in seconds." },
  { title: "Application Tracking", desc: "Track every stage from applied to final decision." },
  { title: "Recruiter Workspace", desc: "Post jobs, review applicants, and manage hiring flow." },
];

const metrics = [
  { label: "Active jobs", value: "50+" },
  { label: "Hiring companies", value: "50+" },
  { label: "Interviews scheduled", value: "100+" },
  { label: "Success rate", value: "92%" },
];

export default function HomePage() {
  const token = localStorage.getItem("hc_access_token");
  const isAuthenticated = Boolean(token);

  return (
    <Shell>
      <section className="grid gap-6 lg:grid-cols-2 lg:items-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            HireConnect job portal for candidates and recruiters
          </h1>
          <p className="text-slate-300">
            Browse live jobs without login. Sign in only when you want to apply, manage applications,
            and view personalized hiring status updates.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="hc-btn-primary" to="/jobs">
              Browse jobs
            </Link>
            {!isAuthenticated && (
              <Link className="hc-btn-ghost" to="/login">
                Login / Register
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-soft backdrop-blur sm:p-6">
          <h2 className="text-lg font-semibold text-white">About HireConnect</h2>
          <p className="mt-2 text-sm text-slate-300">
            HireConnect is a full hiring platform where candidates discover opportunities and recruiters
            manage talent pipelines. It is designed for quick job search, transparent status tracking, and
            efficient recruitment workflows.
          </p>
          <div className="mt-4 grid gap-3">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm font-medium text-white">{item.title}</div>
                <div className="mt-1 text-xs text-slate-300">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/15 to-white/5 p-4"
          >
            <div className="text-xs text-slate-300">{item.label}</div>
            <div className="mt-2 text-2xl font-semibold text-white">{item.value}</div>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-5">
          <div className="text-sm font-semibold text-emerald-100">Candidate Hub</div>
          <div className="mt-2 text-sm text-slate-200">
            Complete profile with projects, academics, and preferred locations for better
            recruiter visibility.
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-5">
          <div className="text-sm font-semibold text-cyan-100">Recruiter Pipeline</div>
          <div className="mt-2 text-sm text-slate-200">
            Review full applicant profiles, shortlist talent, and schedule interviews quickly.
          </div>
        </div>
        <div className="rounded-2xl border border-violet-300/30 bg-violet-500/10 p-5">
          <div className="text-sm font-semibold text-violet-100">Insight Dashboard</div>
          <div className="mt-2 text-sm text-slate-200">
            Real-time hiring insights and smooth workflow cards inspired by modern job portals.
          </div>
        </div>
      </section>
    </Shell>
  );
}

