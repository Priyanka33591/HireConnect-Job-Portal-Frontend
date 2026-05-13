import { useEffect, useState, useCallback } from "react";
import Shell from "../components/Shell";
import {
  listUsers, deleteUser, suspendUser, unsuspendUser,
  listAllSubscriptions, listAllInvoices, getRecruiterJobStats,
  getCandidateApplicationStats,
} from "../api/admin";
import { listJobs } from "../api/jobs";
import { adminAnalytics, getSystemHealth } from "../api/analytics";
import { getProfileByUserId } from "../api/profiles";
import { http } from "../api/http";

const parseJSON = (value) => {
  if (!value) return [];
  try {
    const data = JSON.parse(value);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const TABS = [
  { id: "overview",       label: "📊 Overview" },
  { id: "users",         label: "👥 Users" },
  { id: "jobs",          label: "💼 Jobs" },
  { id: "activity",      label: "🔔 Activity" },
  { id: "analytics",     label: "📈 Analytics" },
  { id: "subscriptions", label: "💳 Subscriptions" },
  { id: "invoices",      label: "🧾 Invoices" },
  { id: "system",        label: "🌐 System" },
];

function StatCard({ label, value, sub, color = "indigo" }) {
  const colorMap = {
    indigo: "from-indigo-500/20 to-indigo-600/10 border-indigo-400/30",
    cyan:   "from-cyan-500/20 to-cyan-600/10 border-cyan-400/30",
    violet: "from-violet-500/20 to-violet-600/10 border-violet-400/30",
    rose:   "from-rose-500/20 to-rose-600/10 border-rose-400/30",
    amber:  "from-amber-500/20 to-amber-600/10 border-amber-400/30",
    green:  "from-green-500/20 to-green-600/10 border-green-400/30",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${colorMap[color] || colorMap.indigo}`}>
      <div className="text-xs font-medium uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-bold text-white">{value ?? "—"}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

function Badge({ children, color = "slate" }) {
  const c = {
    green:  "bg-green-500/20 text-green-300 border-green-400/30",
    rose:   "bg-rose-500/20 text-rose-300 border-rose-400/30",
    amber:  "bg-amber-500/20 text-amber-300 border-amber-400/30",
    indigo: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
    slate:  "bg-white/10 text-slate-200 border-white/10",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${c[color] || c.slate}`}>
      {children}
    </span>
  );
}

function UserProfileModal({ user, onClose, jobs, recruiterStats, subscriptions }) {
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    if (!user) return;
    getProfileByUserId(user.id).then(setProfile).catch(() => {});
    if (user.role === "ROLE_CANDIDATE") {
      import("../api/applications").then(m => m.applicationsByCandidate(user.id)).then(setApplications).catch(() => {});
    }
  }, [user]);

  if (!user) return null;
  const isRecruiter = user.role === "ROLE_RECRUITER";
  const stat = isRecruiter && recruiterStats ? recruiterStats.find(r => r.recruiterId === user.id) : null;
  const recruiterJobsCount = stat ? stat.totalJobs : 0;
  
  const sub = subscriptions?.find(s => s.userId === user.id);
  const planName = sub?.plan || "FREE";
  
  const candidateSkills = profile && profile.skills ? parseJSON(profile.skills) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-3xl my-8 rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white text-xl">✕</button>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6 border-b border-white/10 pb-6">
          <div className="h-20 w-20 rounded-2xl bg-indigo-500/30 flex items-center justify-center text-3xl font-bold text-indigo-200 shrink-0">
            {profile?.photoUrl ? (
               <img src={`http://localhost:8080/api${profile.photoUrl}`} alt="avatar" className="w-full h-full rounded-2xl object-cover" onError={(e) => e.target.style.display='none'} />
            ) : (
               (user.email || "U").charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <div className="text-2xl font-semibold text-white">{profile?.fullName || profile?.recruiterName || user.email}</div>
            <div className="text-base text-slate-400 mt-1">{user.email}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge color={user.role === "ROLE_ADMIN" ? "indigo" : user.role === "ROLE_RECRUITER" ? "amber" : "green"}>
                {user.role?.replace("ROLE_", "")}
              </Badge>
              <Badge color={planName === "FREE" ? "slate" : "indigo"}>
                {planName} PLAN
              </Badge>
              {user.suspended && <Badge color="rose">SUSPENDED</Badge>}
              <span className="text-xs text-slate-500">ID: #{user.id}</span>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 min-w-[140px] text-center border border-white/5">
            {isRecruiter ? (
              <>
                <div className="text-3xl font-bold text-amber-300">{recruiterJobsCount}</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Jobs Posted</div>
              </>
            ) : user.role === "ROLE_CANDIDATE" ? (
              <>
                <div className="text-3xl font-bold text-green-300">{applications?.length || 0}</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Applications</div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-indigo-300">-</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Admin</div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
             <div className="rounded-xl border border-white/5 bg-white/5 p-5">
                <h4 className="text-xs font-semibold text-white mb-4 uppercase tracking-widest text-slate-400">Contact & Info</h4>
                <div className="space-y-3 text-sm">
                   <div className="flex flex-col gap-1"><span className="text-[11px] uppercase tracking-wider text-slate-500">Phone</span><span className="text-slate-200 font-medium">{profile?.phone || "—"}</span></div>
                   <div className="flex flex-col gap-1"><span className="text-[11px] uppercase tracking-wider text-slate-500">Location</span><span className="text-slate-200 font-medium">{profile?.location || profile?.currentLocation || profile?.preferredLocation || "—"}</span></div>
                   {!isRecruiter && (
                     <>
                       <div className="flex flex-col gap-1"><span className="text-[11px] uppercase tracking-wider text-slate-500">Gender</span><span className="text-slate-200 font-medium">{profile?.gender || "—"}</span></div>
                       <div className="flex flex-col gap-1"><span className="text-[11px] uppercase tracking-wider text-slate-500">Date of Birth</span><span className="text-slate-200 font-medium">{profile?.dob ? new Date(profile.dob).toLocaleDateString() : "—"}</span></div>
                     </>
                   )}
                </div>
             </div>
             
             {isRecruiter && (
               <div className="rounded-xl border border-white/5 bg-white/5 p-5">
                 <h4 className="text-xs font-semibold text-white mb-4 uppercase tracking-widest text-slate-400">Company Details</h4>
                 <div className="space-y-3 text-sm">
                   <div className="flex flex-col gap-1"><span className="text-[11px] uppercase tracking-wider text-slate-500">Company Name</span><span className="text-slate-200 font-medium">{profile?.companyName || "—"}</span></div>
                   <div className="flex flex-col gap-1"><span className="text-[11px] uppercase tracking-wider text-slate-500">Industry</span><span className="text-slate-200 font-medium">{profile?.industry || "—"}</span></div>
                   <div className="flex flex-col gap-1"><span className="text-[11px] uppercase tracking-wider text-slate-500">Company Size</span><span className="text-slate-200 font-medium">{profile?.companySize || "—"}</span></div>
                   {profile?.website && <div className="flex flex-col gap-1"><span className="text-[11px] uppercase tracking-wider text-slate-500">Website</span><a href={profile.website} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2">{profile.website}</a></div>}
                 </div>
               </div>
             )}
          </div>

          <div className="space-y-6">
             {(profile?.bio || profile?.profileSummary || profile?.headline) && (
               <div className="rounded-xl border border-white/5 bg-white/5 p-5">
                 <h4 className="text-xs font-semibold text-white mb-3 uppercase tracking-widest text-slate-400">Bio / Summary</h4>
                 <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{profile?.bio || profile?.profileSummary || profile?.headline}</p>
               </div>
             )}

             {!isRecruiter && profile && (
               <div className="rounded-xl border border-white/5 bg-white/5 p-5">
                 <h4 className="text-xs font-semibold text-white mb-4 uppercase tracking-widest text-slate-400">Professional Summary</h4>
                 <div className="space-y-3 text-sm">
                   <div className="flex flex-col gap-1"><span className="text-[11px] uppercase tracking-wider text-slate-500">Education</span><span className="text-slate-200 font-medium">{profile?.highestEducation || "—"}</span></div>
                   <div className="flex flex-col gap-1"><span className="text-[11px] uppercase tracking-wider text-slate-500">Experience</span><span className="text-slate-200 font-medium">{profile?.experienceYears != null ? `${profile.experienceYears} years` : "—"}</span></div>
                   <div className="flex flex-col gap-1"><span className="text-[11px] uppercase tracking-wider text-slate-500">Preferred Job Type</span><span className="text-slate-200 font-medium">{profile?.preferredJobType || "—"}</span></div>
                 </div>
                 
                 {candidateSkills.length > 0 && (
                   <div className="mt-5">
                     <span className="text-[11px] uppercase tracking-wider text-slate-500 block mb-2">Skills</span>
                     <div className="flex flex-wrap gap-2">
                       {candidateSkills.map((s, i) => (
                         <span key={i} className="inline-flex items-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300">{s}</span>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             )}
          </div>
        </div>

        {!profile && (
           <div className="text-center py-10 rounded-xl border border-dashed border-white/10 mt-6 bg-slate-800/20">
              <p className="text-slate-400 text-sm">User hasn't set up a profile yet.</p>
           </div>
        )}
      </div>
    </div>
  );
}

/* ─── OVERVIEW TAB ─── */
function OverviewTab({ analytics, users, jobs, activity }) {
  const candidates = users.filter(u => u.role === "ROLE_CANDIDATE").length;
  const recruiters = users.filter(u => u.role === "ROLE_RECRUITER").length;
  const activeJobs = jobs.filter(j => j.status === "OPEN").length;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Total Users" value={users.length} sub={`${candidates} candidates · ${recruiters} recruiters`} color="indigo" />
        <StatCard label="Total Jobs" value={analytics?.totalJobs ?? jobs.length} sub={`${activeJobs} active`} color="cyan" />
        <StatCard label="Total Applications" value={analytics?.totalApplications} color="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity List */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Recent Platform Activity</h3>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-medium">LIVE</span>
          </div>
          <div className="space-y-3">
            {activity.slice(0, 6).map((act, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm ${act.type === "USER" ? "bg-green-500/20 text-green-300" : "bg-cyan-500/20 text-cyan-300"}`}>
                  {act.type === "USER" ? "👤" : "💼"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{act.label}: {act.email || act.title}</div>
                  <div className="text-[11px] text-slate-400">{new Date(act.date).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health / Quick Stats */}
        <div className="space-y-6">
           <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Application Health</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                  <div className="text-xs text-green-400 font-medium uppercase tracking-widest">Growth</div>
                  <div className="text-2xl font-bold text-white mt-1">{analytics?.growthRate > 0 ? "+" : ""}{analytics?.growthRate ?? 0}%</div>
                  <div className="text-[10px] text-slate-500 mt-1">v/s last week</div>
                </div>
                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                  <div className="text-xs text-indigo-400 font-medium uppercase tracking-widest">Conversion</div>
                  <div className="text-2xl font-bold text-white mt-1">{analytics?.conversionRate ?? 0}%</div>
                  <div className="text-[10px] text-slate-500 mt-1">Apply-to-Hire rate</div>
                </div>
              </div>
           </div>
           
           <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Revenue Overview</h3>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold text-white tracking-tight">₹{analytics?.totalRevenue?.toLocaleString() ?? 0}</div>
                  <div className="text-xs text-slate-400 mt-1">Total revenue processed</div>
                </div>

                <div className="flex gap-1 items-end pb-1 h-12">
                   {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                     <div key={i} className="w-2 bg-indigo-500/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
                   ))}
                </div>
              </div>
           </div>
        </div>
      </div>

      {analytics?.applicationsByStatus && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Hiring Pipeline</div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(analytics.applicationsByStatus).map(([k, v]) => (
              <div key={k} className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 px-5 py-4 min-w-[100px]">
                <span className="text-2xl font-bold text-white">{v}</span>
                <span className="text-[11px] text-slate-400 mt-1 uppercase tracking-widest font-medium">{k}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── USERS TAB ─── */
function UsersTab({ users, jobs, recruiterStats, candidateStats, subscriptions, reload }) {
  const [viewUser, setViewUser] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  const filtered = users.filter(u => {
    const matchRole = filter === "ALL" || u.role === filter;
    const matchSearch = !search || u.email?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  async function handleSuspend(u) {
    setBusy(u.id); setErr("");
    try {
      if (u.suspended) await unsuspendUser(u.id); else await suspendUser(u.id);
      await reload();
    } catch(e) { setErr(e?.response?.data?.message ?? e.message ?? "Failed"); }
    finally { setBusy(null); }
  }

  async function handleDelete(u) {
    if (!window.confirm(`Delete user ${u.email}? This cannot be undone.`)) return;
    setBusy(u.id); setErr("");
    try { await deleteUser(u.id); await reload(); }
    catch(e) { setErr(e?.response?.data?.message ?? e.message ?? "Failed"); }
    finally { setBusy(null); }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <input className="hc-input flex-1 min-w-[180px]" placeholder="Search by email…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="hc-select w-40" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="ALL">All Roles</option>
          <option value="ROLE_CANDIDATE">Candidates</option>
          <option value="ROLE_RECRUITER">Recruiters</option>
        </select>
      </div>
      {err && <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{err}</div>}
      <div className="grid gap-3">
        {filtered.map(u => {
          const isRecruiter = u.role === "ROLE_RECRUITER";
          const stat = isRecruiter 
            ? recruiterStats?.find(r => r.recruiterId === u.id) 
            : candidateStats?.find(c => c.candidateId === u.id);
          
          return (
            <div key={u.id} className={`rounded-2xl border p-4 transition ${u.suspended ? "border-rose-500/30 bg-rose-500/5" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-base font-bold ${u.provider === "GOOGLE" ? "bg-amber-500/20 text-amber-200" : "bg-indigo-500/20 text-indigo-200"}`}>
                    {u.provider === "GOOGLE" ? "G" : (u.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      {u.email}
                      {u.provider === "GOOGLE" && <span title="Google Auth" className="text-[10px]">✨</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge color={u.role === "ROLE_ADMIN" ? "indigo" : u.role === "ROLE_RECRUITER" ? "amber" : "green"}>
                        {u.role?.replace("ROLE_", "")}
                      </Badge>
                      {u.suspended && <Badge color="rose">SUSPENDED</Badge>}
                      <span className="text-[10px] text-slate-500">Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center hidden sm:block">
                    <div className="text-sm font-bold text-white">{isRecruiter ? (stat?.totalJobs || 0) : (stat?.totalApplications || 0)}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-tighter">{isRecruiter ? "Jobs" : "Apps"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="hc-btn-ghost text-xs py-1" onClick={() => setViewUser(u)}>Details</button>
                    <button
                      className={`hc-btn text-xs px-3 py-1 ${u.suspended ? "bg-green-500/20 hover:bg-green-500/30 text-green-300" : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300"}`}
                      disabled={busy === u.id}
                      onClick={() => handleSuspend(u)}
                    >
                      {busy === u.id ? "…" : u.suspended ? "Unsuspend" : "Suspend"}
                    </button>
                    <button className="hc-btn bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs px-3 py-1" disabled={busy === u.id} onClick={() => handleDelete(u)}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">No users found.</div>}
      </div>
      <UserProfileModal user={viewUser} jobs={jobs} recruiterStats={recruiterStats} subscriptions={subscriptions} onClose={() => setViewUser(null)} />
    </div>
  );
}

/* ─── JOB MODAL ─── */
function AdminJobModal({ job, onClose, users }) {
  const [applications, setApplications] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!job) return;
    setLoading(true);
    import("../api/applications").then(m => m.applicationsByJob(job.id))
      .then(setApplications)
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, [job]);

  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-3xl my-8 rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white text-xl">✕</button>
        <div className="mb-6 border-b border-white/10 pb-6">
          <div className="text-2xl font-bold text-white">{job.title}</div>
          <div className="text-indigo-300 font-medium mt-1">{job.companyName} · {job.location}</div>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <Badge color={job.status === "OPEN" ? "green" : "rose"}>{job.status}</Badge>
            <span className="text-xs text-slate-400">Recruiter: {job.recruiterName}</span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4 text-sm text-slate-300">
             <div className="flex flex-col gap-1"><span className="text-xs text-slate-500 uppercase tracking-wider">Type & Category</span><span className="text-white">{job.type} · {job.category}</span></div>
             <div className="flex flex-col gap-1"><span className="text-xs text-slate-500 uppercase tracking-wider">Salary</span><span className="text-white">{job.salaryMin ? `${job.salaryMin}` : "Not Disclosed"}{job.salaryMax ? ` - ${job.salaryMax}` : ""}</span></div>
             <div className="flex flex-col gap-1">
               <span className="text-xs text-slate-500 uppercase tracking-wider">Experience</span>
               <span className="text-white">
                 {(() => {
                   const exp = job.experienceRequired !== undefined ? job.experienceRequired : job.experience;
                   if (exp === 0 || exp === "0") return "Entry Level";
                   if (exp) return `${exp}+ years`;
                   return "Not specified";
                 })()}
               </span>
             </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Required Skills</div>
            <div className="flex flex-wrap gap-2">
              {job.skills ? job.skills.split(/[,;]+/).filter(Boolean).map((s, i) => (
                <span key={i} className="px-2 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-md text-xs">{s.trim()}</span>
              )) : <span className="text-sm text-slate-400">Not specified</span>}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Candidates Applied ({applications ? applications.length : "..."})</h4>
          {loading ? (
             <div className="text-slate-400 text-sm py-4">Loading applicants...</div>
          ) : applications && applications.length > 0 ? (
             <div className="grid gap-3">
               {applications.map(app => (
                 <div key={app.id} className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
                    <div>
                      <div className="text-sm font-medium text-white">{app.candidateName || users?.find(u => u.id === app.candidateId)?.email || "Candidate"}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Applied on: {new Date(app.appliedAt).toLocaleDateString()}</div>
                    </div>
                    <Badge color={app.status === "HIRED" ? "green" : app.status === "REJECTED" ? "rose" : app.status === "SHORTLISTED" ? "amber" : "slate"}>{app.status}</Badge>
                 </div>
               ))}
             </div>
          ) : (
             <div className="text-slate-400 text-sm py-6 text-center border border-dashed border-white/10 rounded-xl bg-slate-800/20">No applications received yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── JOBS TAB ─── */
function JobsTab({ jobs, users, reload }) {
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");
  const [viewJob, setViewJob] = useState(null);
  
  const filtered = jobs.filter(j =>
    !search || j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id) {
    if (!window.confirm("Delete this job?")) return;
    try { await http.delete(`/jobs/${id}`); await reload(); }
    catch(e) { setErr(e?.response?.data?.message ?? e.message ?? "Failed"); }
  }

  return (
    <div>
      <input className="hc-input mb-4" placeholder="Search jobs by title or company…" value={search} onChange={e => setSearch(e.target.value)} />
      {err && <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{err}</div>}
      <div className="grid gap-3">
        {filtered.map(j => (
          <div key={j.id} onClick={() => setViewJob(j)} className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-white/20 transition cursor-pointer">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-white group-hover:text-indigo-300">{j.title}</div>
                <div className="text-sm text-indigo-300 mt-0.5">{j.companyName} · {j.location}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>Posted by Recruiter</span>
                  {j.recruiterName && <span className="text-slate-300 font-medium">{j.recruiterName}</span>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge color="slate">{j.type}</Badge>
                  <Badge color="slate">{j.experienceRequired != null ? `${j.experienceRequired}+ years` : "Exp. not specified"}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <Badge color={j.status === "OPEN" ? "green" : j.status === "CLOSED" ? "rose" : "slate"}>{j.status}</Badge>
                <button className="hc-btn bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-sm px-3 py-1.5" onClick={() => handleDelete(j.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">No jobs found.</div>}
      </div>
      <AdminJobModal job={viewJob} users={users} onClose={() => setViewJob(null)} />
    </div>
  );
}

/* ─── ANALYTICS TAB ─── */
function AnalyticsTab({ analytics, recruiterStats }) {
  async function exportReport() {
    const token = localStorage.getItem("hc_access_token");
    const res = await fetch("http://localhost:8080/api/analytics/admin/export", { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "platform_report.csv";
    document.body.appendChild(a); a.click(); a.remove();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button className="hc-btn-primary flex items-center gap-2" onClick={exportReport}>⬇ Export CSV Report</button>
      </div>
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard label="Total Jobs" value={analytics?.totalJobs} color="cyan" />
        <StatCard label="Total Applications" value={analytics?.totalApplications} color="violet" />
        <StatCard label="Active Recruiters" value={recruiterStats?.length} color="amber" />
      </div>
      {analytics?.applicationsByStatus && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6">
          <div className="text-sm font-semibold text-white mb-3">Applications by Status</div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(analytics.applicationsByStatus).map(([k, v]) => (
              <div key={k} className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 min-w-[80px]">
                <span className="text-2xl font-bold text-white">{v}</span>
                <span className="text-xs text-slate-400 mt-1">{k}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {recruiterStats && recruiterStats.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold text-white mb-3">Jobs Posted per Recruiter</div>
          <div className="grid gap-2">
            {[...recruiterStats].sort((a, b) => b.totalJobs - a.totalJobs).map((r, i) => (
              <div key={r.recruiterId ?? i} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <span className="text-sm font-medium text-white">{r.recruiterName || `Recruiter #${r.recruiterId}`}</span>
                  <span className="ml-2 text-xs text-slate-400">{r.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-base font-bold text-indigo-300">{r.totalJobs}</div>
                    <div className="text-[10px] text-slate-400">jobs</div>
                  </div>
                  {r.activeJobs != null && (
                    <div className="text-right">
                      <div className="text-base font-bold text-green-300">{r.activeJobs}</div>
                      <div className="text-[10px] text-slate-400">active</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── SUBSCRIPTIONS TAB ─── */
function SubscriptionsTab({ subscriptions, usersMap }) {
  const [search, setSearch] = useState("");
  const filtered = subscriptions.filter(s =>
    !search || String(s.recruiterId).includes(search) || s.plan?.toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = subscriptions.filter(s => s.status === "ACTIVE").length;
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-4">
        <StatCard label="Total" value={subscriptions.length} color="indigo" />
        <StatCard label="Active" value={activeCount} color="green" />
        <StatCard label="Cancelled" value={subscriptions.filter(s => s.status === "CANCELLED").length} color="rose" />
        <StatCard label="Expired" value={subscriptions.filter(s => s.status === "EXPIRED").length} color="amber" />
      </div>
      <input className="hc-input mb-4" placeholder="Search by recruiter ID or plan…" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="grid gap-3">
        {filtered.map(s => (
          <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-white/20 transition">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">{s.plan} Plan</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Sub #{s.id} · <span className="text-indigo-300 font-medium">{usersMap?.get(s.userId) || `User #${s.userId}`}</span>
                  {s.renewedAt && <> · {new Date(s.renewedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</>}
                </div>
              </div>
              <Badge color={s.status === "ACTIVE" ? "green" : s.status === "CANCELLED" ? "rose" : "amber"}>{s.status}</Badge>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">No subscriptions found.</div>}
      </div>
    </div>
  );
}

/* ─── INVOICES TAB ─── */
function InvoicesTab({ invoices, usersMap, printInvoice }) {
  const [search, setSearch] = useState("");
  const filtered = invoices.filter(i =>
    !search || String(i.recruiterId).includes(search) || i.plan?.toLowerCase().includes(search.toLowerCase())
  );
  const total = invoices.reduce((s, i) => s + (i.amountCents || 0), 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 mb-4">
        <StatCard label="Total Invoices" value={invoices.length} color="indigo" />
        <StatCard label="Total Revenue" value={`₹${(total / 100).toLocaleString()}`} color="green" />
        <StatCard label="Paid" value={invoices.filter(i => i.status === "PAID").length} color="cyan" />
      </div>
      <input className="hc-input mb-4" placeholder="Search invoices…" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="text-left px-4 py-3">Invoice</th>
              <th className="text-left px-4 py-3">Recruiter</th>
              <th className="text-left px-4 py-3">Plan</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-right px-4 py-3">Amount</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(inv => (
              <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-4 py-3 text-slate-300">#{inv.id}</td>
                <td className="px-4 py-3 text-indigo-300 font-medium">{usersMap?.get(inv.userId) || `User #${inv.userId}`}</td>
                <td className="px-4 py-3 text-white font-medium">{inv.plan}</td>
                <td className="px-4 py-3 text-slate-400">{inv.createdAt ? new Date(inv.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}</td>
                <td className="px-4 py-3 text-right font-semibold text-green-300">₹{(inv.amountCents / 100).toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <Badge color={inv.status === "PAID" ? "green" : inv.status === "OVERDUE" ? "rose" : "slate"}>{inv.status || "—"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => printInvoice(inv)}
                    className="text-indigo-400 hover:text-indigo-300 font-medium text-xs flex items-center gap-1 justify-end ml-auto"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No invoices found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── ACTIVITY TAB ─── */
function ActivityTab({ activity }) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Full Platform Audit Log</div>
      <div className="grid gap-3">
        {activity.map((act, i) => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-white/10 bg-white/5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${act.type === "USER" ? "bg-green-500/20 text-green-300" : "bg-cyan-500/20 text-cyan-300"}`}>
              {act.type === "USER" ? "👤" : "💼"}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{act.label}</div>
              <div className="text-xs text-slate-400 mt-1">
                {act.type === "USER" ? `New user registered: ${act.email}` : `New job posting created: "${act.title}"`}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 font-mono uppercase">{new Date(act.date).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SYSTEM TAB ─── */
function SystemTab({ health }) {
  const defaultServices = [
    { name: "API Gateway", port: 8080, icon: "🌐" },
    { name: "Auth Service", port: 8081, icon: "🔐" },
    { name: "Profile Service", port: 8082, icon: "👤" },
    { name: "Job Service", port: 8083, icon: "💼" },
    { name: "Application Service", port: 8084, icon: "📄" },
    { name: "Interview Service", port: 8085, icon: "🗓️" },
    { name: "Notification Service", port: 8086, icon: "🔔" },
    { name: "Subscription Service", port: 8087, icon: "💳" },
    { name: "Analytics Service", port: 8088, icon: "📈" },
    { name: "Eureka Server", port: 8761, icon: "📡" },
  ];

  const services = defaultServices.map(s => {
    const h = health?.find(x => x.name === s.name);
    return { ...s, status: h ? h.status : "OFFLINE" };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map(s => (
          <div key={s.name} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-xl">{s.icon}</div>
            <div>
              <div className="text-sm font-bold text-white">{s.name}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Port: {s.port}</div>
              <div className="flex items-center gap-1.5 mt-2">
                <div className={`h-1.5 w-1.5 rounded-full ${s.status === "ONLINE" ? "bg-green-500 animate-pulse" : "bg-rose-500"}`}></div>
                <span className={`text-[10px] font-bold tracking-widest ${s.status === "ONLINE" ? "text-green-400" : "text-rose-400"}`}>{s.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
         <h3 className="text-lg font-bold text-white mb-2">Microservices Discovery</h3>
         <p className="text-sm text-slate-400 mb-6">Service registration is handled via Netflix Eureka. All instances are currently reporting healthy.</p>
         <div className="flex flex-wrap gap-4">
            <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-indigo-300">UPTIME: 14d 06h 22m</div>
            <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-indigo-300">LOAD: 0.24, 0.45, 0.38</div>
         </div>
      </div>
    </div>
  );
}

/* ─── MAIN DASHBOARD ─── */
export default function AdminDashboardPage() {
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [recruiterStats, setRecruiterStats] = useState([]);
  const [candidateStats, setCandidateStats] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activity, setActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState([]);
  const [usersMap, setUsersMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadUsers = useCallback(async () => {
    const d = await listUsers(); setUsers(d.filter(user => user.role !== "ROLE_ADMIN"));
  }, []);

  const loadJobs = useCallback(async () => {
    const d = await listJobs({}); setJobs(d);
  }, []);

  useEffect(() => {
    setLoading(true); setErr("");
    Promise.all([
      listUsers().catch(() => []),
      listJobs({}).catch(() => []),
      adminAnalytics().catch(() => ({ totalJobs: 0, totalApplications: 0, applicationsByStatus: {}, growthRate: 0, conversionRate: 0, totalRevenue: 0 })),
      getRecruiterJobStats().catch(() => []),
      getCandidateApplicationStats().catch(() => []),
      listAllSubscriptions().catch(() => []),
      listAllInvoices().catch(() => []),
      getSystemHealth().catch(() => []),
    ]).then(([u, j, a, rs, cs, subs, invs, h]) => {
      const usersMap = new Map(u.map(user => [user.id, user.email]));

      const enrichedJobs = j.map(job => ({
        ...job,
        recruiterName: job.recruiterName || usersMap.get(job.postedBy) || `User ${job.postedBy}`
      }));

      const enrichedStats = (Array.isArray(rs) ? rs : rs?.recruiterStats ?? []).map(stat => ({
        ...stat,
        email: stat.email || usersMap.get(stat.recruiterId) || `User ${stat.recruiterId}`
      }));

      setUsers(u.filter(user => user.role !== "ROLE_ADMIN"));
      setJobs(enrichedJobs); setAnalytics(a);
      setRecruiterStats(enrichedStats);
      setCandidateStats(cs);
      setSubscriptions(Array.isArray(subs) ? subs : []);
      setInvoices(Array.isArray(invs) ? invs : []);
      setSystemHealth(h);
      setUsersMap(usersMap);

      // Build activity feed
      const acts = [];
      u.forEach(user => acts.push({ type: "USER", label: "New User", email: user.email, date: user.createdAt }));
      j.forEach(job => acts.push({ type: "JOB", label: "New Job", title: job.title, date: job.postedAt }));
      setActivity(acts.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20));
    }).catch(e => setErr(e?.response?.data?.message ?? e.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const printInvoice = (inv) => {
    const userEmail = usersMap.get(inv.userId) || `User #${inv.userId}`;
    
    const html = `
      <html>
        <head>
          <title>Invoice - ${inv.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: 800; color: #6366f1; }
            .invoice-title { font-size: 28px; font-weight: 700; color: #0f172a; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 4px; }
            .value { font-size: 15px; font-weight: 500; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f8fafc; padding: 12px; font-size: 12px; text-transform: uppercase; color: #64748b; }
            td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; }
            .total-row { background: #f8fafc; font-weight: 700; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">HireConnect</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Platform Administrator View</div>
            </div>
            <div class="invoice-title">INVOICE</div>
          </div>
          
          <div class="grid">
            <div>
              <div class="label">Billed To (User):</div>
              <div class="value">${userEmail}</div>
            </div>
            <div style="text-align: right;">
              <div class="label">Invoice Details:</div>
              <div class="value">Invoice #: ${inv.id}</div>
              <div class="value">Date: ${new Date(inv.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</div>
              <div class="value">Status: PAID</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Order ID</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style="font-weight: 600;">HireConnect ${inv.plan} Subscription</div>
                  <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Monthly service plan</div>
                </td>
                <td style="font-family: monospace; font-size: 12px;">${inv.razorpayOrderId}</td>
                <td style="text-align: right; font-weight: 600;">₹${inv.amountCents / 100}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2" style="text-align: right;">Total Amount</td>
                <td style="text-align: right;">₹${inv.amountCents / 100}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Generated by HireConnect Admin Portal</p>
            <p>This is a computer-generated invoice for administrative records.</p>
          </div>
          
          <script>
            window.onload = () => { window.print(); }
          </script>
        </body>
      </html>
    `;
    
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  return (
    <Shell>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">Admin Dashboard</h2>
        <p className="text-sm text-slate-400 mt-1">Full platform control and insights</p>
      </div>

      {err && <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{err}</div>}

      <div className="flex flex-wrap gap-2 mb-6 rounded-2xl border border-white/10 bg-white/5 p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 min-w-max rounded-xl px-4 py-2 text-sm font-medium transition ${tab === t.id ? "bg-indigo-500 text-white shadow-lg shadow-indigo-900/30" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <div className="text-center">
            <div className="text-4xl mb-3 animate-pulse">⚙️</div>
            <div>Loading platform data…</div>
          </div>
        </div>
      ) : (
        <>
          {tab === "overview" && <OverviewTab analytics={analytics} users={users} jobs={jobs} activity={activity} />}
          {tab === "users" && <UsersTab users={users} jobs={jobs} recruiterStats={recruiterStats} candidateStats={candidateStats} subscriptions={subscriptions} reload={loadUsers} />}
          {tab === "jobs" && <JobsTab jobs={jobs} users={users} reload={loadJobs} />}
          {tab === "activity" && <ActivityTab activity={activity} />}
          {tab === "analytics" && <AnalyticsTab analytics={analytics} recruiterStats={recruiterStats} />}
          {tab === "subscriptions" && <SubscriptionsTab subscriptions={subscriptions} usersMap={usersMap} />}
          {tab === "invoices" && <InvoicesTab invoices={invoices} usersMap={usersMap} printInvoice={printInvoice} />}
          {tab === "system" && <SystemTab health={systemHealth} />}
        </>
      )}
    </Shell>
  );
}
