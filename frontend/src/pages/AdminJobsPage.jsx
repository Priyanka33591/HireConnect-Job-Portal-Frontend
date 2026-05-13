import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import { listJobs } from "../api/jobs";
import { http } from "../api/http";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const data = await listJobs({});
      setJobs(data);
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load jobs");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteJob(id) {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await http.delete(`/jobs/${id}`);
      load();
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to delete job");
    }
  }

  return (
    <Shell>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Admin: Jobs
        </h2>
        <p className="text-sm text-slate-400">Manage all jobs on the platform.</p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-3">
        {jobs.map((job) => (
          <div key={job.id} className="hc-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm text-slate-400">Job #{job.id} • Recruiter {job.recruiterId}</div>
                <div className="text-base font-semibold text-white">{job.title}</div>
                <div className="text-sm text-indigo-400">{job.companyName} • {job.location}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hc-badge">{job.status}</span>
                <button
                  className="hc-btn-ghost"
                  type="button"
                  onClick={() => deleteJob(job.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="hc-card p-10 text-center text-slate-300">
            No jobs found.
          </div>
        )}
      </div>
    </Shell>
  );
}
