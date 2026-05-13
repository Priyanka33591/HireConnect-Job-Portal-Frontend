import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import {
  createRecruiterProfile,
  getProfileByUserId,
  updateRecruiterProfile,
} from "../api/profiles";

const parse = (value) => {
  if (!value) return [];
  try {
    const data = JSON.parse(value);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export default function RecruiterProfilePage() {
  const role = localStorage.getItem("hc_role");
  const userId = Number(localStorage.getItem("hc_user_id"));

  const [profileId, setProfileId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const emailFromSession = localStorage.getItem("hc_email") ?? "";

  const [recruiterName, setRecruiterName] = useState("");
  const [email, setEmail] = useState(emailFromSession);
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLocations, setCompanyLocations] = useState([]);
  const [locationInput, setLocationInput] = useState("");

  function loadFromProfile(p) {
    setProfileId(p?.id ?? null);
    setRecruiterName(p?.recruiterName ?? p?.fullName ?? "");
    setEmail(p?.email ?? emailFromSession);
    setPhone(p?.phone ?? "");
    setGender(p?.gender ?? "");
    setDob(p?.dob ?? "");
    setCompanyName(p?.companyName ?? "");
    setCompanyLocations(parse(p?.companyLocations));
  }

  async function reload() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await getProfileByUserId(userId);
      loadFromProfile(data);
      setEditing(false);
    } catch {
      setEditing(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setError("");
    setMessage("");
    try {
      const payload = {
        userId,
        recruiterName,
        email: email || null,
        phone: phone || null,
        gender: gender || null,
        dob: dob || null,
        companyName,
        companyLocations: JSON.stringify(companyLocations),
      };
      const saved = profileId
        ? await updateRecruiterProfile(profileId, payload)
        : await createRecruiterProfile(payload);
      loadFromProfile(saved);
      setEditing(false);
      setMessage("Profile saved successfully.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err?.response?.data?.message ?? err?.message ?? "Save failed");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const cancelEdit = () => {
    reload();
    setEditing(false);
  };

  if (role !== "ROLE_RECRUITER" && role !== "ROLE_ADMIN") {
    return (
      <Shell>
        <div className="hc-card p-10 text-center text-slate-300">
          Profile management is currently available for Recruiter accounts.
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Recruiter Profile</h2>
            <p className="text-sm text-slate-400">Manage your details and company locations.</p>
          </div>
          <div className="flex gap-3">
            {editing ? (
              <>
                <button type="button" className="hc-btn-ghost" onClick={cancelEdit}>
                  Cancel
                </button>
                <button type="button" className="hc-btn-primary" onClick={handleSave}>
                  Save Profile
                </button>
              </>
            ) : (
              <button type="button" className="hc-btn-primary" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="h-48 animate-pulse rounded-2xl bg-white/5 border border-white/10" />
          </div>
        ) : (
          <form className="flex flex-col gap-6" onSubmit={handleSave}>
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Name</label>
                  {editing ? (
                    <input className="hc-input" placeholder="Name" value={recruiterName} onChange={(e) => setRecruiterName(e.target.value)} required />
                  ) : (
                    <p className="text-sm text-slate-200">{recruiterName || "Not provided"}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Email</label>
                  {editing ? (
                    <input type="email" className="hc-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  ) : (
                    <p className="text-sm text-slate-200">{email || "Not provided"}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Phone</label>
                  {editing ? (
                    <input type="tel" className="hc-input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  ) : (
                    <p className="text-sm text-slate-200">{phone || "Not provided"}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Gender</label>
                  {editing ? (
                    <select className="hc-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="">Select Gender</option>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  ) : (
                    <p className="text-sm text-slate-200">{gender || "Not provided"}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Date of Birth</label>
                  {editing ? (
                    <input type="date" className="hc-input" value={dob} onChange={(e) => setDob(e.target.value)} />
                  ) : (
                    <p className="text-sm text-slate-200">{dob ? new Date(dob).toLocaleDateString() : "Not provided"}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Company Details</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Company Name</label>
                  {editing ? (
                    <input className="hc-input" placeholder="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                  ) : (
                    <p className="text-sm text-slate-200">{companyName || "Not provided"}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Company Locations</label>
                  {editing && (
                    <div className="flex gap-2 mb-3">
                      <input
                        className="hc-input flex-1"
                        placeholder="e.g. New York, Bengaluru, Remote"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const next = locationInput.trim();
                            if (next && !companyLocations.includes(next)) {
                              setCompanyLocations([...companyLocations, next]);
                              setLocationInput("");
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="hc-btn-primary"
                        disabled={!locationInput.trim()}
                        onClick={() => {
                          const next = locationInput.trim();
                          if (next && !companyLocations.includes(next)) {
                            setCompanyLocations([...companyLocations, next]);
                            setLocationInput("");
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                  )}

                  {companyLocations.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {companyLocations.map((loc) => (
                        <span key={loc} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 text-sm text-indigo-200">
                          {loc}
                          {editing && (
                            <button
                              type="button"
                              className="text-indigo-400 hover:text-indigo-200"
                              onClick={() => setCompanyLocations(companyLocations.filter((x) => x !== loc))}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No locations added yet.</p>
                  )}
                </div>
              </div>
            </section>
          </form>
        )}
      </div>
    </Shell>
  );
}
