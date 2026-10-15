import React, { useState, useEffect } from 'react';
import { AppNotification, User } from '../types';
import { storageService } from '../services/storageService';

interface NotificationsViewProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  currentUser,
  onNavigate
}) => {
  const activeUser = currentUser || storageService.getCurrentUser();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadData = () => {
    if (!activeUser?.id) return;
    setNotifications(storageService.getNotifications(activeUser.id));
  };

  useEffect(() => {
    loadData();
    if (activeUser?.id) {
      storageService.markAllNotificationsRead(activeUser.id);
    }
  }, [activeUser?.id]);

  const handleNotificationClick = (notif: AppNotification) => {
    if (notif.outageId) {
      onNavigate(`/outage/${notif.outageId}`);
    }
  };

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-8 py-6 pb-24 md:pb-12 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#191c1e] tracking-tight">
            Notifications & Broadcasts
          </h1>
          <p className="text-xs sm:text-sm text-[#737782] mt-0.5">
            Emergency alerts, verification results, and restoration updates
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#c2c6d3] shadow-2xs divide-y divide-[#e0e3e5] overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#737782]">
            <span className="material-symbols-outlined text-[40px] text-[#c2c6d3]">
              notifications_off
            </span>
            <p className="mt-2 font-medium">No alerts received yet.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer hover:bg-[#f2f4f6] ${
                !notif.read ? 'bg-[#d7e3ff]/20' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  notif.type === 'outage_verified' || notif.type === 'outage_reported'
                    ? 'bg-[#ffdad6] text-[#e41e25]'
                    : notif.type === 'outage_restored'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-[#d7e3ff] text-[#00346e]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] icon-fill">
                  {notif.type === 'outage_restored'
                    ? 'check_circle'
                    : notif.type === 'official_update'
                    ? 'campaign'
                    : 'bolt'}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#191c1e] truncate">{notif.title}</h3>
                  <span className="text-[10px] text-[#737782] shrink-0">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-[#424751] mt-1 leading-relaxed">{notif.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
};
