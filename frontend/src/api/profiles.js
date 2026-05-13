import { http } from "./http";

export async function getProfile(id) {
  const { data } = await http.get(`/profiles/${id}`);
  return data;
}

export async function createCandidateProfile(payload) {
  const { data } = await http.post(`/profiles/candidate`, payload);
  return data;
}

export async function updateCandidateProfile(id, payload) {
  const { data } = await http.put(`/profiles/${id}/candidate`, payload);
  return data;
}

export async function createRecruiterProfile(payload) {
  const { data } = await http.post(`/profiles/recruiter`, payload);
  return data;
}

export async function updateRecruiterProfile(id, payload) {
  const { data } = await http.put(`/profiles/${id}/recruiter`, payload);
  return data;
}

export async function uploadResume({ userId, file }) {
  const form = new FormData();
  form.append("userId", String(userId));
  form.append("file", file);
  const { data } = await http.post(`/profiles/resume/upload`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data; // { url, fileName, userId }
}

export async function getProfileByUserId(userId) {
  const { data } = await http.get(`/profiles/user/${userId}`);
  return data;
}

