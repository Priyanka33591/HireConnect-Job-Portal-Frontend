import { useEffect, useMemo, useState } from "react";
import Shell from "../components/Shell";
import { listJobs } from "../api/jobs";
import { applicationsByJob, updateApplicationStatus } from "../api/applications";
import { scheduleInterview } from "../api/interviews";
import { getProfileByUserId } from "../api/profiles";

const parse = (value) => {
  if (!value) return [];
  try {
    const data = JSON.parse(value);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export default function RecruiterApplicantsPage() {
  const recruiterId = Number(localStorage.getItem("hc_user_id"));
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [apps, setApps] = useState([]);
  const [profilesByUserId, setProfilesByUserId] = useState({});
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [schedulingAppId, setSchedulingAppId] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [scheduleMode, setScheduleMode] = useState("ONLINE");
  const [scheduleMeetLink, setScheduleMeetLink] = useState("");
  const [scheduleLocation, setScheduleLocation] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [error, setError] = useState("");

  function openScheduleModal(app) {
    const dt = new Date();
    dt.setDate(dt.getDate() + 2);
    dt.setHours(11, 0, 0, 0);
    const localDateTime = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setScheduleModal(app);
    setScheduleDateTime(localDateTime);
    setScheduleMode("ONLINE");
    setScheduleMeetLink("https://meet.google.com/demo-link");
    setScheduleLocation("");
    setScheduleNotes("Scheduled from recruiter dashboard");
  }

  useEffect(() => {
    (async () => {
      setError("");
      try {
        const data = await listJobs();
        setJobs(data);
      } catch (e) {
        setError(e?.response?.data?.message ?? e?.message ?? "Failed to load jobs");
      }
    })();
  }, []);

  const myJobs = useMemo(
    () => jobs.filter((j) => j.postedBy === recruiterId),
    [jobs, recruiterId]
  );

  async function loadApps(jobId) {
    setError("");
    setActionMessage("");
    try {
      const data = await applicationsByJob(jobId);
      setApps(data);
      const uniqueCandidateIds = [...new Set((data ?? []).map((a) => a.candidateId))];
      const profilePairs = await Promise.all(
        uniqueCandidateIds.map(async (candidateId) => {
          try {
            const profile = await getProfileByUserId(candidateId);
            return [candidateId, profile];
          } catch {
            return [candidateId, null];
          }
        })
      );
      setProfilesByUserId(Object.fromEntries(profilePairs));
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load applicants");
    }
  }

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Recruiter: Applicants
          </h2>
          <p className="text-sm text-slate-400">
            View applicants, shortlist/reject, schedule interviews.
          </p>
        </div>

        <div className="hc-card p-5">
          <label className="text-xs text-slate-300">Select a job</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <select
              className="hc-select"
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                if (e.target.value) loadApps(Number(e.target.value));
              }}
            >
              <option value="">Choose Job</option>
              {myJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
            <button
              className="hc-btn-ghost"
              type="button"
              disabled={!selectedJobId}
              onClick={() => loadApps(Number(selectedJobId))}
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </div>
          )}
        </div>

        <div className="grid gap-3">
          {apps.map((a) => (
            <div key={a.id} className="hc-card p-5">
              {(() => {
                const profile = profilesByUserId[a.candidateId];
                return (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-300">
                  {profile?.fullName ? (
                    <span className="font-medium text-white">{profile.fullName}</span>
                  ) : (
                    <span>Applicant</span>
                  )}
                </div>
                <span className="hc-badge">{a.status}</span>
              </div>
                );
              })()}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="hc-btn-ghost"
                  type="button"
                  onClick={() =>
                    setExpandedAppId((prev) => (prev === a.id ? null : a.id))
                  }
                >
                  {expandedAppId === a.id ? "Hide full profile" : "View full profile"}
                </button>
                {a.status === "APPLIED" && (
                  <button
                    className="hc-btn-primary"
                    type="button"
                    onClick={async () => {
                      setError("");
                      setActionMessage("");
                      try {
                        await updateApplicationStatus(a.id, "SHORTLISTED");
                        setActionMessage("Applicant shortlisted successfully.");
                        loadApps(Number(selectedJobId));
                      } catch (actionErr) {
                        setError(
                          actionErr?.response?.data?.message ??
                            actionErr?.message ??
                            "Failed to shortlist applicant"
                        );
                      }
                    }}
                  >
                    Shortlist
                  </button>
                )}

                {a.status === "INTERVIEW" && (
                  <button
                    className="hc-btn-primary"
                    type="button"
                    onClick={async () => {
                      setError("");
                      setActionMessage("");
                      try {
                        await updateApplicationStatus(a.id, "OFFERED");
                        setActionMessage("Job offer sent to applicant.");
                        loadApps(Number(selectedJobId));
                      } catch (actionErr) {
                        setError(
                          actionErr?.response?.data?.message ??
                            actionErr?.message ??
                            "Failed to send offer"
                        );
                      }
                    }}
                  >
                    Offer job
                  </button>
                )}

                {(a.status === "APPLIED" || a.status === "SHORTLISTED" || a.status === "INTERVIEW") && (
                  <button
                    className="hc-btn-ghost"
                    type="button"
                    onClick={async () => {
                      setError("");
                      setActionMessage("");
                      try {
                        await updateApplicationStatus(a.id, "REJECTED");
                        setActionMessage("Applicant rejected.");
                        loadApps(Number(selectedJobId));
                      } catch (actionErr) {
                        setError(
                          actionErr?.response?.data?.message ??
                            actionErr?.message ??
                            "Failed to reject applicant"
                        );
                      }
                    }}
                  >
                    Reject
                  </button>
                )}

                {(a.status === "SHORTLISTED" || a.status === "INTERVIEW") && (
                  <button
                    className="hc-btn-ghost"
                    type="button"
                    onClick={() => openScheduleModal(a)}
                  >
                    {a.status === "INTERVIEW" ? "Reschedule interview" : "Schedule interview"}
                  </button>
                )}
              </div>

              {expandedAppId === a.id && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  {profilesByUserId[a.candidateId] ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-slate-400">
                          Personal
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-slate-200">
                          <div>Name: {profilesByUserId[a.candidateId]?.fullName || "-"}</div>
                          <div>Phone: {profilesByUserId[a.candidateId]?.phone || "-"}</div>
                          <div>
                            Headline: {profilesByUserId[a.candidateId]?.headline || "-"}
                          </div>
                          <div>
                            Experience:{" "}
                            {profilesByUserId[a.candidateId]?.experienceYears ?? "-"} years
                          </div>
                          <div>
                            Preferred location:{" "}
                            {profilesByUserId[a.candidateId]?.preferredLocation || "-"}
                          </div>
                          <div>
                            Preferred job type:{" "}
                            {profilesByUserId[a.candidateId]?.preferredJobType || "-"}
                          </div>
                          <div>
                            Expected salary:{" "}
                            {profilesByUserId[a.candidateId]?.expectedSalary ?? "-"}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-slate-400">
                          Education
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-slate-200">
                          <div>
                            Highest education:{" "}
                            {profilesByUserId[a.candidateId]?.highestEducation || "-"}
                          </div>
                          <div>
                            University: {profilesByUserId[a.candidateId]?.universityName || "-"}
                          </div>
                          <div>
                            Graduation %:{" "}
                            {profilesByUserId[a.candidateId]?.graduationPercentage ?? "-"}
                          </div>
                          <div>
                            12th %: {profilesByUserId[a.candidateId]?.twelfthPercentage ?? "-"}
                          </div>
                          <div>
                            10th %: {profilesByUserId[a.candidateId]?.tenthPercentage ?? "-"}
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                          Skills
                        </div>
                        {(() => {
                          const parsedSkills = parse(profilesByUserId[a.candidateId]?.skills);
                          return parsedSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {parsedSkills.map((s, i) => (
                                <span key={i} className="inline-flex items-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-sm text-indigo-200">
                                  {s}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-200">-</div>
                          );
                        })()}
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                          Projects
                        </div>
                        {(() => {
                          const parsedProjects = parse(profilesByUserId[a.candidateId]?.projects);
                          return parsedProjects.length > 0 ? (
                            <div className="space-y-3">
                              {parsedProjects.map((p, i) => (
                                <div key={i} className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                  <div className="font-medium text-white">{p.name || "-"}</div>
                                  <div className="text-xs text-slate-400 mt-0.5">{p.duration || "-"}</div>
                                  <div className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">{p.summary || "-"}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-200">-</div>
                          );
                        })()}
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                          Certifications
                        </div>
                        {(() => {
                          const parsedCertifications = parse(profilesByUserId[a.candidateId]?.certifications);
                          return parsedCertifications.length > 0 ? (
                            <div className="space-y-2">
                              {parsedCertifications.map((c, i) => (
                                <div key={i} className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                  {typeof c === "string" ? (
                                    <div className="text-sm text-slate-300">{c}</div>
                                  ) : (
                                    <>
                                      <div className="font-medium text-white">{c.name || c.title || "-"}</div>
                                      <div className="text-xs text-slate-400">{c.issuer || c.organization || "-"}</div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-200">-</div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-300">
                      Candidate profile is not available yet.
                    </div>
                  )}
                </div>
              )}

              {a.resumeUrl && (
                <div className="mt-3 text-sm">
                  <a
                    className="text-indigo-300 hover:text-indigo-200 underline underline-offset-4"
                    href={a.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View resume
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        {actionMessage && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {actionMessage}
          </div>
        )}

        {selectedJobId && apps.length === 0 && (
          <div className="hc-card p-10 text-center text-slate-300">
            No applicants for this job yet.
          </div>
        )}
      </div>

      {scheduleModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-slate-900 p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Schedule interview</h3>
                <p className="text-sm text-slate-400">
                  Application #{scheduleModal.id} • Candidate {scheduleModal.candidateId}
                </p>
              </div>
              <button
                type="button"
                className="hc-btn-ghost"
                onClick={() => setScheduleModal(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-slate-300">Date & time</label>
                <input
                  type="datetime-local"
                  className="hc-input mt-1"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-300">Mode</label>
                <select
                  className="hc-select mt-1"
                  value={scheduleMode}
                  onChange={(e) => setScheduleMode(e.target.value)}
                >
                  <option value="ONLINE">ONLINE</option>
                  <option value="OFFLINE">OFFLINE</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-300">Meeting link</label>
                <input
                  className="hc-input mt-1"
                  value={scheduleMeetLink}
                  onChange={(e) => setScheduleMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-300">Location</label>
                <input
                  className="hc-input mt-1"
                  value={scheduleLocation}
                  onChange={(e) => setScheduleLocation(e.target.value)}
                  placeholder="Office address for offline interviews"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-300">Notes</label>
                <textarea
                  className="hc-input mt-1 min-h-20"
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                className="hc-btn-primary"
                type="button"
                disabled={schedulingAppId === scheduleModal.id || !scheduleDateTime}
                onClick={async () => {
                  setError("");
                  setActionMessage("");
                  setSchedulingAppId(scheduleModal.id);
                  try {
                    await scheduleInterview({
                      applicationId: scheduleModal.id,
                      candidateId: scheduleModal.candidateId,
                      scheduledAt: new Date(scheduleDateTime).toISOString(),
                      mode: scheduleMode,
                      meetLink: scheduleMeetLink || null,
                      location: scheduleLocation || null,
                      notes: scheduleNotes || null,
                    });
                    await updateApplicationStatus(scheduleModal.id, "INTERVIEW");
                    setActionMessage("Interview scheduled successfully.");
                    setScheduleModal(null);
                    loadApps(Number(selectedJobId));
                  } catch (actionErr) {
                    setError(
                      actionErr?.response?.data?.message ??
                        actionErr?.message ??
                        "Failed to schedule interview"
                    );
                  } finally {
                    setSchedulingAppId(null);
                  }
                }}
              >
                {schedulingAppId === scheduleModal.id ? "Scheduling..." : "Confirm schedule"}
              </button>
              <button
                className="hc-btn-ghost"
                type="button"
                onClick={() => setScheduleModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

