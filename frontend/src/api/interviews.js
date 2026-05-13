import { http } from "./http";

export async function interviewsByApplication(applicationId) {
  const { data } = await http.get(`/interviews/application/${applicationId}`);
  return data;
}

export async function scheduleInterview(payload) {
  const { data } = await http.post(`/interviews`, payload);
  return data;
}

export async function confirmInterview(id) {
  const { data } = await http.put(`/interviews/${id}/confirm`);
  return data;
}

export async function rescheduleInterview(id, payload) {
  const { data } = await http.put(`/interviews/${id}/reschedule`, payload);
  return data;
}

