import { useEffect, useMemo, useState } from "react";
import Shell from "../components/Shell";
import { searchJobs } from "../api/jobs";
import { createJob, deleteJob, updateJob } from "../api/recruiter";

const empty = {
  title: "",
  category: "",
  type: "Full-time",
  location: "",
  salaryMin: "",
  salaryMax: "",
  skills: "",
  description: "",
  experienceRequired: "",
  status: "OPEN",
};

export default function RecruiterJobsPage() {
  const recruiterId = Number(localStorage.getItem("hc_user_id"));
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [profile, setProfile] = useState(null);
  const [companyLocations, setCompanyLocations] = useState([]);

  function toPayload(source) {
    return {
      ...source,
      postedBy: recruiterId,
      salaryMin: source.salaryMin !== "" ? Number(source.salaryMin) : null,
      salaryMax: source.salaryMax !== "" ? Number(source.salaryMax) : null,
      experienceRequired: source.experienceRequired !== ""
        ? Number(source.experienceRequired)
        : null,
    };
  }

  async function load() {
    setError("");
    try {
      const [data, profileData] = await Promise.all([
        searchJobs({ postedBy: recruiterId }),
        import("../api/profiles").then((m) => m.getProfileByUserId(recruiterId)).catch(() => null)
      ]);
      setJobs(data);
      if (profileData) {
        setProfile(profileData);
        try {
          const locs = JSON.parse(profileData.companyLocations);
          setCompanyLocations(Array.isArray(locs) ? locs : []);
        } catch {
          setCompanyLocations([]);
        }
      }
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load jobs");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const myJobs = useMemo(() => jobs, [jobs]);

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Recruiter: My jobs
          </h2>
          <p className="text-sm text-slate-400">
            Post jobs and manage listings.
          </p>
        </div>

        <div className="hc-card p-5">
          <div className="text-sm font-semibold text-white">
            {editingId ? "Edit job" : "Post a job"}
          </div>
          <form
            className="mt-4 grid gap-3 md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setCreating(true);
              setError("");
              try {
                const payload = toPayload(form);
                if (profile && profile.companyName) {
                  payload.companyName = profile.companyName;
                }
                if (editingId) {
                  await updateJob(editingId, payload);
                } else {
                  await createJob(payload);
                }
                setForm(empty);
                setEditingId(null);
                load();
              } catch (ce) {
                setError(
                  ce?.response?.data?.message ??
                    ce?.message ??
                    (editingId ? "Update failed" : "Create failed")
                );
              } finally {
                setCreating(false);
              }
            }}
          >
            <div>
              <label className="text-xs text-slate-300">Title</label>
              <input
                className="hc-input mt-1"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-300">Location</label>
              {companyLocations.length > 0 ? (
                <select
                  className="hc-select mt-1"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                >
                  <option value="">Select a saved location</option>
                  {companyLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="hc-input mt-1"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Enter location or save locations in Profile"
                />
              )}
            </div>
            <div>
              <label className="text-xs text-slate-300">Category</label>
              <input
                className="hc-input mt-1"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-300">Type</label>
              <input
                className="hc-input mt-1"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-300">Salary min</label>
              <input
                className="hc-input mt-1"
                value={form.salaryMin}
                onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-300">Salary max</label>
              <input
                className="hc-input mt-1"
                value={form.salaryMax}
                onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-300">Skills</label>
              <input
                className="hc-input mt-1"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                placeholder="e.g. Java, Spring, MySQL"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-300">Job description</label>
              <textarea
                className="hc-input mt-1 min-h-24"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe role responsibilities and requirements"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300">Experience (years)</label>
              <input
                className="hc-input mt-1"
                value={form.experienceRequired}
                onChange={(e) =>
                  setForm({ ...form, experienceRequired: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-slate-300">Status</label>
              <select
                className="hc-select mt-1"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button className="hc-btn-primary" type="submit" disabled={creating}>
                {creating
                  ? editingId
                    ? "Updating..."
                    : "Posting..."
                  : editingId
                  ? "Update job"
                  : "Post job"}
              </button>
              <button
                className="hc-btn-ghost"
                type="button"
                onClick={() => {
                  setForm(empty);
                  setEditingId(null);
                }}
              >
                {editingId ? "Cancel edit" : "Clear"}
              </button>
              <button className="hc-btn-ghost ml-auto" type="button" onClick={load}>
                Refresh
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
              {error.toLowerCase().includes("free trail is over") && (
                <button
                  type="button"
                  onClick={() => (window.location.href = "/recruiter/subscription")}
                  className="ml-4 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-100 border border-rose-500/30 hover:bg-rose-500/30 transition-all active:scale-95 shrink-0"
                >
                  Upgrade Now
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {myJobs.map((j) => (
            <div key={j.id} className="hc-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-white">{j.title}</div>
                  <div className="mt-1 text-sm text-slate-400">{j.location}</div>
                </div>
                <span className="hc-badge">{j.status}</span>
              </div>
              {j.description && (
                <p className="mt-3 line-clamp-3 text-sm text-slate-300">{j.description}</p>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  className="hc-btn-primary"
                  type="button"
                  onClick={() => {
                    setEditingId(j.id);
                    setForm({
                      title: j.title ?? "",
                      category: j.category ?? "",
                      type: j.type ?? "Full-time",
                      location: j.location ?? "",
                      salaryMin: j.salaryMin ?? "",
                      salaryMax: j.salaryMax ?? "",
                      skills: j.skills ?? "",
                      description: j.description ?? "",
                      experienceRequired: j.experienceRequired ?? "",
                      status: j.status ?? "OPEN",
                    });
                  }}
                >
                  Edit
                </button>
                {j.status !== "CLOSED" && (
                  <button
                    className="hc-btn-ghost"
                    type="button"
                    onClick={async () => {
                      await updateJob(j.id, {
                        title: j.title,
                        category: j.category,
                        type: j.type,
                        location: j.location,
                        salaryMin: j.salaryMin,
                        salaryMax: j.salaryMax,
                        skills: j.skills,
                        description: j.description,
                        experienceRequired: j.experienceRequired,
                        postedBy: j.postedBy,
                        status: "CLOSED",
                      });
                      load();
                    }}
                  >
                    Mark unavailable
                  </button>
                )}
                <button
                  className="hc-btn-ghost"
                  type="button"
                  onClick={async () => {
                    await deleteJob(j.id);
                    load();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {myJobs.length === 0 && (
          <div className="hc-card p-10 text-center text-slate-300">
            You haven’t posted any jobs yet.
          </div>
        )}
      </div>
    </Shell>
  );
}

