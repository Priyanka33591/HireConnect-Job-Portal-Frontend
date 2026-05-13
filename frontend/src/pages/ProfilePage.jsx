import { useEffect, useMemo, useState } from "react";
import Shell from "../components/Shell";
import {
  createCandidateProfile,
  getProfileByUserId,
  updateCandidateProfile,
  uploadResume,
  uploadAvatar,
} from "../api/profiles";
import { pickColor, initials } from "../components/JobShared";

const preferredLocationOptions = [
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Mumbai",
  "Delhi NCR",
  "Remote",
];

const levels = ["Beginner", "Intermediate", "Fluent", "Native"];

const parse = (value) => {
  if (!value) return [];
  try {
    const data = JSON.parse(value);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export default function ProfilePage() {
  const role = localStorage.getItem("hc_role");
  const emailFromSession = localStorage.getItem("hc_email") ?? "";
  const userId = Number(localStorage.getItem("hc_user_id"));

  const [profileId, setProfileId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [fullName, setFullName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [email, setEmail] = useState(emailFromSession);
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [graduation, setGraduation] = useState("");
  const [class12, setClass12] = useState("");
  const [class10, setClass10] = useState("");
  const [profileSummary, setProfileSummary] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Social Links
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [leetcodeUrl, setLeetcodeUrl] = useState("");

  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [languages, setLanguages] = useState([]);
  const [internships, setInternships] = useState([]);
  const [projects, setProjects] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [achievementInput, setAchievementInput] = useState("");
  const [preferredLocations, setPreferredLocations] = useState([]);
  const [preferredLocationInput, setPreferredLocationInput] = useState("");

  const completion = useMemo(() => {
    const checks = [
      fullName,
      photoUrl,
      email,
      phone,
      dob,
      gender,
      currentLocation,
      graduation,
      class12,
      class10,
      profileSummary,
      resumeUrl,
      skills.length,
      languages.length,
      internships.length,
      projects.length,
      achievements.length,
      preferredLocations.length,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [
    fullName,
    photoUrl,
    email,
    phone,
    dob,
    gender,
    currentLocation,
    graduation,
    class12,
    class10,
    profileSummary,
    resumeUrl,
    skills,
    languages,
    internships,
    projects,
    achievements,
    preferredLocations,
  ]);

  function loadFromProfile(p) {
    setProfileId(p?.id ?? null);
    setFullName(p?.fullName ?? "");
    setPhotoUrl(p?.photoUrl ?? "");
    setEmail(p?.email ?? emailFromSession);
    setPhone(p?.phone ?? "");
    setDob(p?.dob ?? "");
    setGender(p?.gender ?? "");
    setCurrentLocation(p?.currentLocation ?? p?.preferredLocation ?? "");
    setGraduation(p?.highestEducation ?? "");
    setClass12(p?.twelfthPercentage != null ? String(p.twelfthPercentage) : "");
    setClass10(p?.tenthPercentage != null ? String(p.tenthPercentage) : "");
    setProfileSummary(p?.profileSummary ?? p?.headline ?? "");
    setResumeUrl(p?.resumeUrl ?? "");
    setSkills(parse(p?.skills));
    setLanguages(parse(p?.languages));
    setInternships(parse(p?.internships));
    setProjects(parse(p?.projects));
    setAchievements(parse(p?.achievements));
    setPreferredLocations(parse(p?.preferredLocations));

    setPortfolioUrl(p?.portfolioUrl ?? "");
    setGithubUrl(p?.githubUrl ?? "");
    setLinkedInUrl(p?.linkedInUrl ?? "");
    setLeetcodeUrl(p?.leetcodeUrl ?? "");
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
      setEditing(true); // Auto-edit if not found
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
        fullName,
        photoUrl: photoUrl || null,
        email: email || null,
        phone: phone || null,
        dob: dob || null,
        gender: gender || null,
        currentLocation: currentLocation || null,
        highestEducation: graduation || null,
        twelfthPercentage: class12 ? Number(class12) : null,
        tenthPercentage: class10 ? Number(class10) : null,
        profileSummary: profileSummary || null,
        headline: profileSummary || null,
        resumeUrl: resumeUrl || null,
        preferredLocation: preferredLocations[0] ?? currentLocation ?? null,
        preferredLocations: JSON.stringify(preferredLocations),
        skills: JSON.stringify(skills),
        languages: JSON.stringify(languages),
        internships: JSON.stringify(internships),
        projects: JSON.stringify(projects),
        achievements: JSON.stringify(achievements),
        experienceYears: null,
        linkedInUrl: linkedInUrl || null,
        portfolioUrl: portfolioUrl || null,
        githubUrl: githubUrl || null,
        leetcodeUrl: leetcodeUrl || null,
        currentCompany: null,
        currentRole: null,
        universityName: null,
        graduationPercentage: null,
        preferredJobType: null,
        expectedSalary: null,
        certifications: null,
        address: null,
      };
      const saved = profileId
        ? await updateCandidateProfile(profileId, payload)
        : await createCandidateProfile(payload);
      loadFromProfile(saved);
      setEditing(false);
      setMessage("Profile saved successfully.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err?.response?.data?.message ?? err?.message ?? "Save failed");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const cancelEdit = () => {
    reload();
    setEditing(false);
  };

  if (role !== "ROLE_CANDIDATE" && role !== "ROLE_ADMIN") {
    return (
      <Shell>
        <div className="hc-card p-10 text-center text-slate-300">
          Profile management is currently available for Candidate accounts.
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">My Profile</h2>
            <p className="text-sm text-slate-400">Manage your personal and professional details.</p>
          </div>
          <div className="flex gap-3">
            {editing ? (
              <>
                <button type="button" className="hc-btn-ghost" onClick={cancelEdit}>Cancel</button>
                <button type="button" className="hc-btn-primary" onClick={handleSave}>Save Profile</button>
              </>
            ) : (
              <button type="button" className="hc-btn-primary" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-white">Profile Completion</span>
              <span className="text-sm font-medium text-indigo-400">{completion}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${completion}%` }}></div>
            </div>
          </div>
          <div className="text-xs text-slate-400 w-48 hidden sm:block">
            {completion < 100 ? "Complete your profile to stand out to recruiters." : "Great job! Your profile is complete."}
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
            <div className="h-48 animate-pulse rounded-2xl bg-white/5 border border-white/10" />
            <div className="h-48 animate-pulse rounded-2xl bg-white/5 border border-white/10" />
          </div>
        ) : (
          <form className="flex flex-col gap-6" onSubmit={handleSave}>
            
            {/* --- Hero Section: Basic Info --- */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 pointer-events-none"></div>
              
              <div className="relative flex flex-col sm:flex-row gap-6 items-start mt-6">
                
                {/* Profile Photo Area */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-slate-800 bg-slate-900 shadow-xl" />
                    ) : (
                      <div className={`w-28 h-28 rounded-full border-4 border-slate-800 flex items-center justify-center text-3xl font-bold text-white shadow-xl bg-gradient-to-br ${pickColor(userId)}`}>
                        {initials(fullName || email || "User")}
                      </div>
                    )}
                    
                    {editing && (
                      <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <span className="text-xs font-medium text-white text-center px-2">
                          {uploadingAvatar ? "Uploading..." : "Change Photo"}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          disabled={uploadingAvatar}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingAvatar(true);
                            try {
                              const res = await uploadAvatar({ userId, file });
                              setPhotoUrl(`http://localhost:8082/api${res.url}`);
                              setMessage("Avatar uploaded. Click Save Profile to apply.");
                            } catch (err) {
                              setError("Failed to upload avatar");
                            } finally {
                              setUploadingAvatar(false);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Core Details */}
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    {editing ? (
                      <input className="hc-input text-xl font-bold px-4 py-2" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    ) : (
                      <h3 className="text-2xl font-bold text-white">{fullName || "Your Name"}</h3>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Email</label>
                    {editing ? (
                      <input className="hc-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    ) : (
                      <p className="text-sm text-slate-200">{email || "Not provided"}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Phone</label>
                    {editing ? (
                      <input className="hc-input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    ) : (
                      <p className="text-sm text-slate-200">{phone || "Not provided"}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Location</label>
                    {editing ? (
                      <input className="hc-input" placeholder="City, State" value={currentLocation} onChange={(e) => setCurrentLocation(e.target.value)} />
                    ) : (
                      <p className="text-sm text-slate-200">{currentLocation || "Not provided"}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Gender</label>
                    {editing ? (
                      <select className="hc-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="">Select Gender</option><option>Female</option><option>Male</option><option>Other</option>
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
              </div>
            </section>

            {/* --- Resume Section --- */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Resume</h3>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800/50 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{resumeUrl ? "Resume Uploaded" : "No Resume"}</p>
                    <p className="text-xs text-slate-400">PDF, DOC, DOCX format</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {resumeUrl && (
                    <a href={resumeUrl} target="_blank" rel="noreferrer" className="hc-btn-ghost text-sm">
                      View Resume
                    </a>
                  )}
                  {editing && (
                    <label className="hc-btn-primary cursor-pointer text-sm">
                      {uploadingResume ? "Uploading..." : "Upload Resume"}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingResume(true);
                          try {
                            const res = await uploadResume({ userId, file });
                            setResumeUrl(`http://localhost:8082/api${res.url}`);
                            setMessage("Resume uploaded.");
                          } catch (err) {
                            setError("Resume upload failed");
                          } finally {
                            setUploadingResume(false);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </section>

            {/* --- Profile Summary --- */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Profile Summary</h3>
              {editing ? (
                <textarea
                  className="hc-input min-h-[120px] resize-y"
                  placeholder="Tell recruiters about your background, goals, and expertise..."
                  value={profileSummary}
                  onChange={(e) => setProfileSummary(e.target.value)}
                />
              ) : (
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {profileSummary || "Add a summary to highlight your key skills and professional background."}
                </p>
              )}
            </section>

            {/* --- Links --- */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Links & Social Profiles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">LinkedIn URL</label>
                  {editing ? <input className="hc-input" placeholder="https://linkedin.com/in/..." value={linkedInUrl} onChange={e => setLinkedInUrl(e.target.value)} /> 
                           : <a href={linkedInUrl || "#"} target="_blank" rel="noreferrer" className="block text-sm text-indigo-400 truncate">{linkedInUrl || "Not provided"}</a>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">GitHub URL</label>
                  {editing ? <input className="hc-input" placeholder="https://github.com/..." value={githubUrl} onChange={e => setGithubUrl(e.target.value)} /> 
                           : <a href={githubUrl || "#"} target="_blank" rel="noreferrer" className="block text-sm text-indigo-400 truncate">{githubUrl || "Not provided"}</a>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Portfolio Website</label>
                  {editing ? <input className="hc-input" placeholder="https://myportfolio.com" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} /> 
                           : <a href={portfolioUrl || "#"} target="_blank" rel="noreferrer" className="block text-sm text-indigo-400 truncate">{portfolioUrl || "Not provided"}</a>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">LeetCode / Coding Profile</label>
                  {editing ? <input className="hc-input" placeholder="https://leetcode.com/..." value={leetcodeUrl} onChange={e => setLeetcodeUrl(e.target.value)} /> 
                           : <a href={leetcodeUrl || "#"} target="_blank" rel="noreferrer" className="block text-sm text-indigo-400 truncate">{leetcodeUrl || "Not provided"}</a>}
                </div>
              </div>
            </section>

            {/* --- Skills --- */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Key Skills</h3>
              {editing && (
                <div className="flex gap-2 mb-4">
                  <input
                    className="hc-input flex-1"
                    placeholder="e.g. React, Java, Python"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const next = skillInput.trim();
                        if (next && !skills.includes(next)) {
                          setSkills([...skills, next]);
                          setSkillInput("");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="hc-btn-primary"
                    disabled={!skillInput.trim()}
                    onClick={() => {
                      const next = skillInput.trim();
                      if (next && !skills.includes(next)) {
                        setSkills([...skills, next]);
                        setSkillInput("");
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              )}
              
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <span key={skill} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 text-sm text-indigo-200">
                      {skill}
                      {editing && (
                        <button type="button" className="text-indigo-400 hover:text-indigo-200" onClick={() => setSkills(skills.filter(s => s !== skill))}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No skills added yet.</p>
              )}
            </section>

            {/* --- Experience / Internships --- */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Experience & Internships</h3>
              
              <div className="space-y-4">
                {internships.map((item, idx) => (
                  <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border border-white/5 relative">
                    {editing && (
                      <button type="button" className="absolute top-4 right-4 text-slate-400 hover:text-rose-400 transition" onClick={() => setInternships(internships.filter((_, i) => i !== idx))}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-6">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">Company / Organization</label>
                        {editing ? <input className="hc-input text-sm" placeholder="e.g. Google" value={item.company ?? ""} onChange={e => { const next = [...internships]; next[idx].company = e.target.value; setInternships(next); }} />
                                 : <p className="text-sm text-white font-medium">{item.company || "Not provided"}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">Duration</label>
                        {editing ? <input className="hc-input text-sm" placeholder="e.g. 6 Months, Jan 2023 - Jun 2023" value={item.duration ?? ""} onChange={e => { const next = [...internships]; next[idx].duration = e.target.value; setInternships(next); }} />
                                 : <p className="text-sm text-slate-300">{item.duration || "Not provided"}</p>}
                      </div>
                    </div>
                  </div>
                ))}

                {internships.length === 0 && !editing && (
                  <p className="text-sm text-slate-400">No experience added yet.</p>
                )}

                {editing && (
                  <button type="button" className="hc-btn-ghost text-sm w-full border border-dashed border-slate-600 hover:border-slate-400" onClick={() => setInternships([...internships, { company: "", duration: "" }])}>
                    + Add Experience
                  </button>
                )}
              </div>
            </section>

            {/* --- Projects --- */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Projects</h3>
              
              <div className="space-y-4">
                {projects.map((item, idx) => (
                  <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border border-white/5 relative">
                    {editing && (
                      <button type="button" className="absolute top-4 right-4 text-slate-400 hover:text-rose-400 transition" onClick={() => setProjects(projects.filter((_, i) => i !== idx))}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-6">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">Project Name</label>
                        {editing ? <input className="hc-input text-sm" placeholder="e.g. E-Commerce Backend" value={item.name ?? ""} onChange={e => { const next = [...projects]; next[idx].name = e.target.value; setProjects(next); }} />
                                 : <p className="text-sm text-white font-medium">{item.name || "Not provided"}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">Duration / Tech Stack</label>
                        {editing ? <input className="hc-input text-sm" placeholder="e.g. 2 Months (React, Node.js)" value={item.duration ?? ""} onChange={e => { const next = [...projects]; next[idx].duration = e.target.value; setProjects(next); }} />
                                 : <p className="text-sm text-slate-300">{item.duration || "Not provided"}</p>}
                      </div>
                    </div>
                  </div>
                ))}

                {projects.length === 0 && !editing && (
                  <p className="text-sm text-slate-400">No projects added yet.</p>
                )}

                {editing && (
                  <button type="button" className="hc-btn-ghost text-sm w-full border border-dashed border-slate-600 hover:border-slate-400" onClick={() => setProjects([...projects, { name: "", duration: "" }])}>
                    + Add Project
                  </button>
                )}
              </div>
            </section>

            {/* --- Education --- */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Education</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Graduation */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-indigo-300">Highest Education / Graduation</div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Course / Degree</label>
                    {editing ? <input className="hc-input text-sm" placeholder="e.g. B.Tech Computer Science" value={graduation} onChange={e => setGraduation(e.target.value)} />
                             : <p className="text-sm text-white">{graduation || "Not provided"}</p>}
                  </div>
                </div>

                {/* Class 12 */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-indigo-300">Class 12th</div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Percentage / CGPA</label>
                    {editing ? <input className="hc-input text-sm" placeholder="e.g. 85%" value={class12} onChange={e => setClass12(e.target.value)} />
                             : <p className="text-sm text-white">{class12 || "Not provided"}</p>}
                  </div>
                </div>

                {/* Class 10 */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-indigo-300">Class 10th</div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Percentage / CGPA</label>
                    {editing ? <input className="hc-input text-sm" placeholder="e.g. 90%" value={class10} onChange={e => setClass10(e.target.value)} />
                             : <p className="text-sm text-white">{class10 || "Not provided"}</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* --- Achievements --- */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Achievements</h3>
              {editing && (
                <div className="flex gap-2 mb-4">
                  <input
                    className="hc-input flex-1"
                    placeholder="e.g. 1st Place in Hackathon 2024"
                    value={achievementInput}
                    onChange={(e) => setAchievementInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const next = achievementInput.trim();
                        if (next) {
                          setAchievements([...achievements, next]);
                          setAchievementInput("");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="hc-btn-primary"
                    disabled={!achievementInput.trim()}
                    onClick={() => {
                      const next = achievementInput.trim();
                      if (next) {
                        setAchievements([...achievements, next]);
                        setAchievementInput("");
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              )}
              
              {achievements.length > 0 ? (
                <ul className="list-disc list-inside space-y-2">
                  {achievements.map((ach, idx) => (
                    <li key={idx} className="text-sm text-slate-300 group">
                      <span className="inline-block align-top max-w-[90%]">{ach}</span>
                      {editing && (
                        <button type="button" className="ml-3 text-rose-400 opacity-0 group-hover:opacity-100 transition" onClick={() => setAchievements(achievements.filter((_, i) => i !== idx))}>
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No achievements added yet.</p>
              )}
            </section>

            {/* --- Languages & Preferences --- */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Languages */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Languages</h3>
                  <div className="space-y-3">
                    {languages.map((lang, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-slate-800/50 p-2 rounded-lg border border-white/5">
                        {editing ? (
                          <>
                            <input className="hc-input text-sm flex-1" placeholder="Language" value={lang.name ?? ""} onChange={e => { const next = [...languages]; next[idx].name = e.target.value; setLanguages(next); }} />
                            <select className="hc-select text-sm w-32" value={lang.level ?? "Intermediate"} onChange={e => { const next = [...languages]; next[idx].level = e.target.value; setLanguages(next); }}>
                              {levels.map(l => <option key={l}>{l}</option>)}
                            </select>
                            <button type="button" className="text-slate-400 hover:text-rose-400 p-2" onClick={() => setLanguages(languages.filter((_, i) => i !== idx))}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </>
                        ) : (
                          <div className="flex-1 flex justify-between px-2">
                            <span className="text-sm text-white">{lang.name || "Unknown"}</span>
                            <span className="text-xs text-slate-400 px-2 py-1 bg-white/5 rounded-md">{lang.level || "Intermediate"}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {languages.length === 0 && !editing && (
                      <p className="text-sm text-slate-400">No languages added yet.</p>
                    )}

                    {editing && (
                      <button type="button" className="hc-btn-ghost text-xs mt-2" onClick={() => setLanguages([...languages, { name: "", level: "Intermediate" }])}>
                        + Add Language
                      </button>
                    )}
                  </div>
                </div>

                {/* Preferred Locations */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Preferred Locations</h3>
                  {editing && (
                    <div className="flex gap-2 mb-3">
                      <select 
                        className="hc-select flex-1" 
                        value={preferredLocationInput}
                        onChange={(e) => setPreferredLocationInput(e.target.value)}
                      >
                        <option value="">Select location</option>
                        {preferredLocationOptions.map(l => <option key={l}>{l}</option>)}
                      </select>
                      <button 
                        type="button" 
                        className="hc-btn-primary" 
                        disabled={!preferredLocationInput}
                        onClick={() => {
                          if (preferredLocationInput && !preferredLocations.includes(preferredLocationInput)) {
                            setPreferredLocations([...preferredLocations, preferredLocationInput]);
                            setPreferredLocationInput("");
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                  )}
                  
                  {preferredLocations.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {preferredLocations.map(loc => (
                        <span key={loc} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 text-sm text-sky-200">
                          {loc}
                          {editing && (
                            <button type="button" className="text-sky-400 hover:text-sky-200" onClick={() => setPreferredLocations(preferredLocations.filter(x => x !== loc))}>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No preferred locations added.</p>
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
