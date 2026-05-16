import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { getNotifications, markAsRead } from "../api/notifications";

const NotificationContext = createContext();

// WebSocket goes through API Gateway (port 8080) → notification-service
// This works from both local dev and Docker since port 8080 is always exposed
const WS_URL = "http://localhost:8080/ws-notifications";

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const stompRef = useRef(null);

  const userId = localStorage.getItem("hc_user_id");
  const token  = localStorage.getItem("hc_access_token");

  // Fetch notification history via REST (goes through gateway on :8080)
  const fetchHistory = useCallback(async () => {
    if (!userId || !token) return;
    try {
      const data = await getNotifications(userId);
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.read).length);
    } catch (err) {
      console.warn("[Notifications] Could not fetch history:", err?.message);
    }
  }, [userId, token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Connect to WebSocket directly on port 8086
  useEffect(() => {
    if (!userId || !token) return;

    let stompClient = null;
    let active = true;

    const socket = new SockJS(WS_URL);
    stompClient  = Stomp.over(socket);
    stompClient.debug = () => {}; // silence noisy logs

    stompClient.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        if (!active) return;
        console.log("[Notifications] WebSocket connected ✓");
        stompRef.current = stompClient;

        stompClient.subscribe(`/topic/notifications/${userId}`, (frame) => {
          try {
            const notif = JSON.parse(frame.body);
            console.log("[Notifications] Received push:", notif);
            setNotifications((prev) => [notif, ...prev]);
            setUnreadCount((prev) => prev + 1);
          } catch (e) {
            console.error("[Notifications] Parse error:", e);
          }
        });
      },
      (err) => {
        console.warn("[Notifications] WebSocket error:", err);
      }
    );

    return () => {
      active = false;
      try {
        if (stompClient && stompClient.connected) {
          stompClient.disconnect(() => {});
        }
      } catch (_) {}
      stompRef.current = null;
    };
  }, [userId, token]);

  const markRead = useCallback(async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("[Notifications] markRead error:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markRead(n.id)));
  }, [notifications, markRead]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markRead, markAllAsRead, refresh: fetchHistory }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);

