import { useState } from "react";
import Shell from "../components/Shell";
import { listInvoices, listSubscriptions } from "../api/subscriptions";

export default function AdminSubscriptionMonitorPage() {
  const [recruiterId, setRecruiterId] = useState("");
  const [subs, setSubs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const rid = Number(recruiterId);
      const [s, i] = await Promise.all([listSubscriptions(rid), listInvoices(rid)]);
      setSubs(s);
      setInvoices(i);
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load");
    }
  }

  return (
    <Shell>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Admin: Subscription monitoring
        </h2>
        <p className="text-sm text-slate-400">
          Inspect subscriptions/invoices by User ID.
        </p>
      </div>

      <div className="mt-6 hc-card p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="w-full">
            <label className="text-xs text-slate-300">User ID</label>
            <input
              className="hc-input mt-1"
              value={recruiterId}
              onChange={(e) => setRecruiterId(e.target.value)}
              placeholder="e.g. 2"
            />
          </div>
          <button className="hc-btn-primary" type="button" onClick={load}>
            Load
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="hc-card p-5">
          <div className="text-sm font-semibold text-white">Subscriptions</div>
          <div className="mt-4 grid gap-2">
            {subs.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <div className="text-slate-300">
                  #{s.id} • {s.plan}
                </div>
                <span className="hc-badge">{s.status}</span>
              </div>
            ))}
            {subs.length === 0 && (
              <div className="text-sm text-slate-400">No subscriptions loaded.</div>
            )}
          </div>
        </div>
        <div className="hc-card p-5">
          <div className="text-sm font-semibold text-white">Invoices</div>
          <div className="mt-4 grid gap-2">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <div className="text-slate-300">
                  #{inv.id} • {inv.plan}
                </div>
                <span className="hc-badge">₹{(inv.amountCents / 100).toFixed(2)}</span>
              </div>
            ))}
            {invoices.length === 0 && (
              <div className="text-sm text-slate-400">No invoices loaded.</div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

