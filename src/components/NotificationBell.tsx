import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Trash2, X, Gift, Sparkles, Clock } from "lucide-react";
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications
} from "../firebase/db";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToNotifications(setNotifications);
    return () => unsub();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const now = new Date();
      const date = new Date(isoString);
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return "Vừa xong";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ngày trước`;
    } catch {
      return "";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
        title="Thông báo quay thưởng & hoạt động"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-rose-500 text-white font-black text-[11px] min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shadow-md animate-bounce ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:mt-3 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-sky-500" /> Thông báo
              </h3>
              {unreadCount > 0 && (
                <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllNotificationsAsRead()}
                  className="text-xs text-sky-600 hover:text-sky-700 font-semibold p-1.5 hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-1"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Đã đọc hết
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm("Xóa tất cả thông báo?")) {
                      clearAllNotifications();
                    }
                  }}
                  className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Xóa tất cả"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium">Chưa có thông báo nào</p>
                <p className="text-xs text-slate-400 mt-1">Khi học sinh quay thưởng sẽ xuất hiện tại đây</p>
              </div>
            ) : (
              notifications.map((item) => {
                const isWheel = item.type === "wheel_prize";
                return (
                  <div
                    key={item.id}
                    onClick={() => !item.read && markNotificationAsRead(item.id)}
                    className={`p-4 transition-colors flex items-start gap-3 cursor-pointer hover:bg-slate-50 ${
                      !item.read ? "bg-sky-50/40" : ""
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {isWheel ? (
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg shadow-sm border border-amber-200">
                          🎡
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center">
                          <Sparkles className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {item.studentName ? `Học sinh: ${item.studentName}` : item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      {item.prize ? (
                        <div className="mt-1">
                          <p className="text-xs text-slate-600">Quay trúng phần thưởng:</p>
                          <span className="inline-block mt-1 font-black text-xs text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full shadow-xs">
                            🎁 {item.prize}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600">{item.message}</p>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.id);
                      }}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded-lg transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                      title="Xóa thông báo này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
