import axios from "axios";

const API_URL = "http://localhost:8080/api/notifications";

const getHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("hc_access_token")}`,
  },
});

export async function getNotifications(userId) {
  const res = await axios.get(`${API_URL}/${userId}`, getHeader());
  return res.data;
}

export async function markAsRead(id) {
  const res = await axios.put(`${API_URL}/read/${id}`, {}, getHeader());
  return res.data;
}
