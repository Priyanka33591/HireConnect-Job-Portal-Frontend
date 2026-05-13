import { http } from "./http";

export async function createJob(payload) {
  const { data } = await http.post("/jobs", payload);
  return data;
}

export async function updateJob(id, payload) {
  const { data } = await http.put(`/jobs/${id}`, payload);
  return data;
}

export async function deleteJob(id) {
  await http.delete(`/jobs/${id}`);
}

