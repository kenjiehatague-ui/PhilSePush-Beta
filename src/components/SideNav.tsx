import React from 'react';
import { User } from '../types';
import { PhilSePushLogo } from './PhilSePushLogo';
import { storageService } from '../services/storageService';

interface SideNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  currentUser?: User;
}

export const SideNav: React.FC<SideNavProps> = ({
  currentPath,
  onNavigate,
  currentUser
}) => {
  const activeUser = currentUser || storageService.getCurrentUser();
  const pendingCount = storageService.getPendingReports().length;
  const unreadNotifs = activeUser?.id
    ? storageService.getNotifications(activeUser.id).filter((n) => !n.read).length
    : 0;

  const isSuperAdmin = storageService.isAdmin(activeUser);
  const isVerifier =
    activeUser?.role === 'verification_team' ||
    activeUser?.role === 'utility_provider' ||
    activeUser?.role === 'lgu' ||
    isSuperAdmin;

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#eceef0] border-r border-[#c2c6d3] h-screen sticky top-0 p-4 z-30">
      {/* Brand Header */}
      <div className="mb-6 px-3 pt-2 cursor-pointer" onClick={() => onNavigate('/home')}>
        <PhilSePushLogo size="md" showText={true} showTagline={true} />
      </div>

      {/* Main Navigation links */}
      <nav className="flex flex-col gap-1.5 flex-1">
        <button
          onClick={() => onNavigate('/home')}
          className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
            currentPath === '/home' || currentPath === '/'
              ? 'bg-[#d7e3ff] text-[#00346e] shadow-xs translate-x-1'
              : 'text-[#424751] hover:bg-[#e0e3e5] hover:text-[#191c1e]'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[22px] ${
              currentPath === '/home' || currentPath === '/' ? 'icon-fill' : ''
            }`}
          >
            home
          </span>
          <span>Home</span>
        </button>

        <button
          onClick={() => onNavigate('/map')}
          className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
            currentPath === '/map'
              ? 'bg-[#d7e3ff] text-[#00346e] shadow-xs translate-x-1'
              : 'text-[#424751] hover:bg-[#e0e3e5] hover:text-[#191c1e]'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[22px] ${
              currentPath === '/map' ? 'icon-fill' : ''
            }`}
          >
            map
          </span>
          <span>Map</span>
        </button>

        <button
          onClick={() => onNavigate('/report')}
          className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
            currentPath.startsWith('/report')
              ? 'bg-[#d7e3ff] text-[#00346e] shadow-xs translate-x-1'
              : 'text-[#424751] hover:bg-[#e0e3e5] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px] text-[#e41e25]">
            report_problem
          </span>
          <span>Report Outage</span>
        </button>

        <button
          onClick={() => onNavigate('/history')}
          className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
            currentPath === '/history'
              ? 'bg-[#d7e3ff] text-[#00346e] shadow-xs translate-x-1'
              : 'text-[#424751] hover:bg-[#e0e3e5] hover:text-[#191c1e]'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[22px] ${
              currentPath === '/history' ? 'icon-fill' : ''
            }`}
          >
            history
          </span>
          <span>Outage History</span>
        </button>

        <button
          onClick={() => onNavigate('/scheduled')}
          className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
            currentPath === '/scheduled'
              ? 'bg-[#d7e3ff] text-[#00346e] shadow-xs translate-x-1'
              : 'text-[#424751] hover:bg-[#e0e3e5] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">calendar_clock</span>
          <span>Scheduled Maintenance</span>
        </button>

        <button
          onClick={() => onNavigate('/notifications')}
          className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
            currentPath === '/notifications'
              ? 'bg-[#d7e3ff] text-[#00346e] shadow-xs translate-x-1'
              : 'text-[#424751] hover:bg-[#e0e3e5] hover:text-[#191c1e]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span>Notifications</span>
          </div>
          {unreadNotifs > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-[#e41e25] text-white rounded-full">
              {unreadNotifs}
            </span>
          )}
        </button>

        <div className="my-2 border-t border-[#c2c6d3]"></div>

        {/* Role-Specific Workflows & Administrative Dashboards */}
        {isVerifier && (
          <button
            onClick={() => onNavigate('/verification')}
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
              currentPath === '/verification'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                : 'text-amber-900 hover:bg-amber-50'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span className="material-symbols-outlined text-[22px] text-amber-600">
                verified_user
              </span>
              <span>Verification Queue</span>
            </div>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-600 text-white rounded-full animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
        )}

        {isSuperAdmin && (
          <button
            onClick={() => onNavigate('/admin')}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
              currentPath === '/admin'
                ? 'bg-[#00346e] text-white shadow-xs'
                : 'text-purple-900 hover:bg-purple-50 border border-purple-200'
            }`}
          >
            <span className="material-symbols-outlined text-[22px] text-purple-700">
              admin_panel_settings
            </span>
            <span>Super Admin Portal</span>
          </button>
        )}
      </nav>

      {/* Footer Area with Settings and Quick Info */}
      <div className="pt-3 border-t border-[#c2c6d3] flex flex-col gap-1">
        <button
          onClick={() => onNavigate('/settings')}
          className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
            currentPath === '/settings'
              ? 'bg-[#d7e3ff] text-[#00346e]'
              : 'text-[#424751] hover:bg-[#e0e3e5]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span>Settings & Areas</span>
        </button>

        <div className="px-4 py-2 text-[11px] text-[#737782] flex items-center justify-between">
          <span>PhilSePush v1.0</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live Civic
          </span>
        </div>
      </div>
    </aside>
  );
};
