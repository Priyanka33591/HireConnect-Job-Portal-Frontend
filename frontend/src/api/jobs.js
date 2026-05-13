import { http } from "./http";

export async function listJobs(params) {
  const { data } = await http.get("/jobs", { params });
  return data;
}

export async function searchJobs(params) {
  const { data } = await http.get("/jobs/search", { params });
  return data;
}

export async function getJobById(id) {
  const { data } = await http.get(`/jobs/${id}`);
  return data;
}

