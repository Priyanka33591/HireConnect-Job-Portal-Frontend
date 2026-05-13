import { http } from "./http";

export async function listBookmarks(userId) {
  const { data } = await http.get(`/jobs/bookmarks/user/${userId}`);
  return data;
}

export async function addBookmark({ userId, jobId }) {
  const { data } = await http.post(`/jobs/bookmarks`, { userId, jobId });
  return data;
}

export async function removeBookmark({ userId, jobId }) {
  await http.delete(`/jobs/bookmarks/user/${userId}/job/${jobId}`);
}

