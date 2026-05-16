import { useState, useRef, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";

export default function NotificationCenter() {
  const { notifications, unreadCount, markRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + 
           date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
        title="Notifications"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-slate-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-white/10 bg-slate-900/95 p-1 shadow-2xl backdrop-blur-xl ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-slate-500">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400">All caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`group relative flex cursor-pointer gap-3 px-4 py-3 transition hover:bg-white/5 ${!notif.read ? 'bg-indigo-500/5' : ''}`}
                    onClick={() => !notif.read && markRead(notif.id)}
                  >
                    <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      notif.type === 'INTERVIEW' ? 'bg-amber-500/20 text-amber-500' :
                      notif.type === 'APPLICATION' ? 'bg-emerald-500/20 text-emerald-500' :
                      'bg-indigo-500/20 text-indigo-500'
                    }`}>
                      {notif.type === 'INTERVIEW' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className={`text-sm leading-snug ${!notif.read ? 'font-semibold text-white' : 'text-slate-300'}`}>
                        {notif.message}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {formatDate(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="mt-2 h-2 w-2 rounded-full bg-indigo-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="border-t border-white/5 p-2">
            <button 
              className="w-full rounded-xl py-2 text-center text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white transition"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
