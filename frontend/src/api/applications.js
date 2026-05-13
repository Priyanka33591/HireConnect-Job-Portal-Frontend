import { http } from "./http";

export async function applyToJob({ jobId, candidateId, coverLetter, resumeUrl }) {
  const { data } = await http.post("/applications", {
    jobId,
    candidateId,
    coverLetter,
    resumeUrl,
  });
  return data;
}

export async function applicationsByCandidate(candidateId) {
  const { data } = await http.get(`/applications/candidate/${candidateId}`);
  return data;
}

export async function applicationsByJob(jobId) {
  const { data } = await http.get(`/applications/job/${jobId}`);
  return data;
}

export async function updateApplicationStatus(id, status) {
  const { data } = await http.put(`/applications/${id}/status`, { status });
  return data;
}

