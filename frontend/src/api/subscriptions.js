import { http } from "./http";

export async function createRazorpayOrder(userId, userRole, plan) {
  const { data } = await http.post(`/subscriptions/razorpay-order`, null, {
    params: { userId, userRole, plan }
  });
  return data;
}

export async function createSubscription(payload) {
  const { data } = await http.post(`/subscriptions`, payload);
  return data;
}

export async function listSubscriptions(userId) {
  const { data } = await http.get(`/subscriptions/user/${userId}`);
  return data;
}

export async function getCurrentSubscription(userId, userRole) {
  const { data } = await http.get(`/subscriptions/current`, {
    params: { userId, userRole }
  });
  return data;
}

export async function listInvoices(userId) {
  const { data } = await http.get(`/invoices/user/${userId}`);
  return data;
}

export async function cancelSubscription(id) {
  const { data } = await http.put(`/subscriptions/cancel/${id}`);
  return data;
}

