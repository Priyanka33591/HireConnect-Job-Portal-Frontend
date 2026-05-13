import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import { adminAnalytics } from "../api/analytics";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setError("");
      try {
        const res = await adminAnalytics();
        setData(res);
      } catch (e) {
        setError(e?.response?.data?.message ?? e?.message ?? "Failed to load");
      }
    })();
  }, []);

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Admin: Platform analytics
          </h2>
          <p className="text-sm text-slate-400">Overall jobs and applications.</p>
        </div>
        <button 
          className="hc-btn-primary" 
          onClick={async () => {
            const token = localStorage.getItem("hc_access_token");
            const res = await fetch("http://localhost:8080/api/analytics/admin/export", {
              headers: { Authorization: `Bearer ${token}` }
            });
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "platform_report.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
          }}
        >
          Export Report
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      {data && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="hc-card p-5">
            <div className="text-sm text-slate-400">Total jobs</div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {data.totalJobs}
            </div>
          </div>
          <div className="hc-card p-5">
            <div className="text-sm text-slate-400">Total applications</div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {data.totalApplications}
            </div>
          </div>
          <div className="hc-card p-5">
            <div className="text-sm text-slate-400">By status</div>
            <div className="mt-3 grid gap-2 text-sm">
              {Object.entries(data.applicationsByStatus ?? {}).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-slate-200">{k}</span>
                  <span className="hc-badge">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

