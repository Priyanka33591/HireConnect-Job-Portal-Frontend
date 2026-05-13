import { http } from "./http";

export async function recruiterAnalytics(recruiterId) {
  const { data } = await http.get(`/analytics/recruiter/${recruiterId}`);
  return data;
}

export async function adminAnalytics() {
  const { data } = await http.get(`/analytics/admin`);
  return data;
}

export async function getSystemHealth() {
  const { data } = await http.get(`/analytics/admin/health`);
  return data;
}


