import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import { recruiterAnalytics } from "../api/analytics";
import { listJobs } from "../api/jobs";
import { http } from "../api/http";
import { applicationsByJob } from "../api/applications";
import { getProfileByUserId } from "../api/profiles";

export default function RecruiterAnalyticsPage() {
  const recruiterId = Number(localStorage.getItem("hc_user_id"));
  const [data, setData] = useState(null);
  const [details, setDetails] = useState([]);
  const [cumulativeStats, setCumulativeStats] = useState({ shortlisted: 0, interviewed: 0, offered: 0, rejected: 0 });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setError("");
      setLoadingDetails(true);
      try {
        const res = await recruiterAnalytics(recruiterId);
        setData(res);

        // Fetch detailed data
        const jobs = await listJobs();
        const myJobs = jobs.filter(j => j.postedBy === recruiterId);
        
        // Fetch all interviews to check history for rejected ones
        let allInterviews = [];
        try {
          const intRes = await http.get("/interviews").then(r => r.data);
          allInterviews = intRes.filter(i => myJobs.some(mj => mj.id === i.jobId));
        } catch {
          allInterviews = [];
        }

        const allDetailedApps = [];
        const profileCache = {};
        let totalShortlisted = 0;
        let totalInterviewed = 0;
        let totalOffered = 0;
        let totalRejected = 0;

        for (const job of myJobs) {
          const apps = await applicationsByJob(job.id);
          for (const app of apps) {
            if (!profileCache[app.candidateId]) {
              try {
                profileCache[app.candidateId] = await getProfileByUserId(app.candidateId);
              } catch {
                profileCache[app.candidateId] = { fullName: "Candidate" };
              }
            }
            
            const hasInterview = allInterviews.some(i => i.applicationId === app.id);
            const journey = app.statusHistory || (
              app.status === "OFFERED" ? "APPLIED -> SHORTLISTED -> INTERVIEW -> OFFERED" :
              app.status === "REJECTED" ? (hasInterview ? "APPLIED -> SHORTLISTED -> INTERVIEW -> REJECTED" : "APPLIED -> REJECTED") :
              app.status === "INTERVIEW" ? "APPLIED -> SHORTLISTED -> INTERVIEW" :
              app.status === "SHORTLISTED" ? "APPLIED -> SHORTLISTED" :
              "APPLIED"
            );

            if (journey.includes("SHORTLISTED")) totalShortlisted++;
            if (journey.includes("INTERVIEW")) totalInterviewed++;
            if (app.status === "OFFERED") totalOffered++;
            if (app.status === "REJECTED") totalRejected++;

            allDetailedApps.push({
              id: app.id,
              jobTitle: job.title,
              candidateName: profileCache[app.candidateId]?.fullName || "Candidate",
              status: app.status,
              journey: journey,
              appliedAt: app.appliedAt
            });
          }
        }
        
        setCumulativeStats({
          shortlisted: totalShortlisted,
          interviewed: totalInterviewed,
          offered: totalOffered,
          rejected: totalRejected
        });

        allDetailedApps.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
        setDetails(allDetailedApps);
      } catch (e) {
        setError(e?.response?.data?.message ?? e?.message ?? "Failed to load");
      } finally {
        setLoadingDetails(false);
      }
    })();
  }, [recruiterId]);

  return (
    <Shell>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Recruiter analytics
        </h2>
        <p className="text-sm text-slate-400">
          Jobs posted and application metrics.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      {data && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="hc-card p-5">
            <div className="text-sm text-slate-400">Jobs posted</div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {data.jobsPosted}
            </div>
          </div>
          <div className="hc-card p-5">
            <div className="text-sm text-slate-400">Total applications</div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {data.totalApplications}
            </div>
          </div>
          <div className="hc-card p-5">
            <div className="text-sm text-slate-400">Application funnel</div>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-200">Total Shortlisted</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">{cumulativeStats.shortlisted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-200">Total Interviewed</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/10 text-amber-400 border-amber-500/20">{cumulativeStats.interviewed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-200">Total Offered</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{cumulativeStats.offered}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-200">Total Rejected</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose-500/10 text-rose-400 border-rose-500/20">{cumulativeStats.rejected}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Detailed Application History</h3>
        <div className="hc-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Job Title</th>
                  <th className="px-6 py-4 font-medium">Candidate</th>
                  <th className="px-6 py-4 font-medium">Applied Date</th>
                  <th className="px-6 py-4 font-medium">Application Journey</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {details.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{item.jobTitle}</td>
                    <td className="px-6 py-4 text-slate-300">{item.candidateName}</td>
                    <td className="px-6 py-4 text-slate-400">{new Date(item.appliedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs">
                        {item.journey.split(" -> ").map((step, idx, arr) => (
                          <span key={idx} className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-md font-medium border ${
                              step === "OFFERED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                              step === "REJECTED" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                              step === "INTERVIEW" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              step === "SHORTLISTED" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                              "bg-slate-500/10 text-slate-400 border-slate-500/20"
                            }`}>
                              {step}
                            </span>
                            {idx < arr.length - 1 && (
                              <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loadingDetails && details.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">
                      No application history found yet.
                    </td>
                  </tr>
                )}
                {loadingDetails && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-indigo-400 animate-pulse">
                      Loading detailed history...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}

