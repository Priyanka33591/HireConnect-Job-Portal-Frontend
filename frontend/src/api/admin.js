import { http } from "./http";

export async function listUsers() {
  const { data } = await http.get(`/auth/users`);
  return data;
}

export async function deleteUser(id) {
  await http.delete(`/auth/users/${id}`);
}

export async function suspendUser(id) {
  const { data } = await http.put(`/auth/users/${id}/suspend`);
  return data;
}

export async function unsuspendUser(id) {
  const { data } = await http.put(`/auth/users/${id}/unsuspend`);
  return data;
}

export async function listAllSubscriptions() {
  const { data } = await http.get(`/subscriptions/admin/all`);
  return data;
}

export async function listAllInvoices() {
  const { data } = await http.get(`/invoices/admin/all`);
  return data;
}

export async function getRecruiterJobStats() {
  const { data } = await http.get(`/analytics/admin/recruiter-stats`);
  return data;
}

export async function getCandidateApplicationStats() {
  const { data } = await http.get(`/analytics/admin/candidate-stats`);
  return data;
}


