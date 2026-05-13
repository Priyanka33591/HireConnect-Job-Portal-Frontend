import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import { deleteUser, listUsers } from "../api/admin";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load users");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Shell>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Admin: Users
        </h2>
        <p className="text-sm text-slate-400">Manage platform users.</p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-3">
        {users.map((u) => (
          <div key={u.id} className="hc-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm text-slate-400">User #{u.id}</div>
                <div className="text-base font-semibold text-white">{u.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hc-badge">{u.role}</span>
                <button
                  className="hc-btn-ghost"
                  type="button"
                  onClick={async () => {
                    await deleteUser(u.id);
                    load();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="hc-card p-10 text-center text-slate-300">
            No users found.
          </div>
        )}
      </div>
    </Shell>
  );
}

