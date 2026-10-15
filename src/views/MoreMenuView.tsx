import React from 'react';
import { User } from '../types';
import { PhilSePushLogo } from '../components/PhilSePushLogo';
import { storageService } from '../services/storageService';

interface MoreMenuViewProps {
  currentUser: User;
  onNavigate: (route: string) => void;
  onOpenLocationModal: () => void;
}

export const MoreMenuView: React.FC<MoreMenuViewProps> = ({
  currentUser,
  onNavigate,
  onOpenLocationModal
}) => {
  const activeUser = currentUser || storageService.getCurrentUser();
  const isSuperAdmin = storageService.isAdmin(activeUser);
  const isVerifier =
    activeUser?.role === 'verification_team' ||
    activeUser?.role === 'utility_provider' ||
    activeUser?.role === 'lgu' ||
    isSuperAdmin;

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 pb-24 flex flex-col gap-6">
      {/* User Profile Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#c2c6d3] shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[#004a98] text-white flex items-center justify-center font-bold text-lg shadow-2xs">
            {(activeUser?.name || 'U').charAt(0)}
          </div>
          <div>
            <h2 className="text-base font-bold text-[#191c1e]">{activeUser?.name || 'User Profile'}</h2>
            <p className="text-xs text-[#737782]">{activeUser?.email || ''}</p>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#d7e3ff] text-[#00346e] mt-1 inline-block">
              {(activeUser?.role || 'citizen').replace('_', ' ')}
            </span>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/settings')}
          className="p-2 text-[#737782] hover:text-[#00346e] hover:bg-[#f2f4f6] rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">settings</span>
        </button>
      </div>

      {/* Navigation Hub Links */}
      <div className="bg-white rounded-2xl border border-[#c2c6d3] shadow-2xs divide-y divide-[#e0e3e5] overflow-hidden">
        <button
          onClick={onOpenLocationModal}
          className="w-full p-4 flex items-center justify-between hover:bg-[#f2f4f6] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#004a98] text-[22px]">
              location_on
            </span>
            <div>
              <p className="text-sm font-bold text-[#191c1e]">Change Active Area</p>
              <p className="text-xs text-[#737782]">Switch current monitored Barangay or City</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#737782]">chevron_right</span>
        </button>

        <button
          onClick={() => onNavigate('/scheduled')}
          className="w-full p-4 flex items-center justify-between hover:bg-[#f2f4f6] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#004a98] text-[22px]">
              calendar_month
            </span>
            <div>
              <p className="text-sm font-bold text-[#191c1e]">Scheduled Maintenance</p>
              <p className="text-xs text-[#737782]">Planned power interruptions calendar</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#737782]">chevron_right</span>
        </button>

        <button
          onClick={() => onNavigate('/notifications')}
          className="w-full p-4 flex items-center justify-between hover:bg-[#f2f4f6] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#004a98] text-[22px]">
              notifications
            </span>
            <div>
              <p className="text-sm font-bold text-[#191c1e]">Broadcasts & Alerts</p>
              <p className="text-xs text-[#737782]">Emergency notifications & status changes</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#737782]">chevron_right</span>
        </button>

        {isVerifier && (
          <button
            onClick={() => onNavigate('/verification')}
            className="w-full p-4 flex items-center justify-between hover:bg-[#f2f4f6] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-700 text-[22px]">
                verified_user
              </span>
              <div>
                <p className="text-sm font-bold text-[#191c1e]">Verification Team Portal</p>
                <p className="text-xs text-[#737782]">Inspect incoming crowdsourced reports</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#737782]">chevron_right</span>
          </button>
        )}

        {isSuperAdmin && (
          <button
            onClick={() => onNavigate('/admin')}
            className="w-full p-4 flex items-center justify-between hover:bg-purple-50 transition-colors text-left border-t border-purple-100"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-purple-700 text-[22px]">
                admin_panel_settings
              </span>
              <div>
                <p className="text-sm font-bold text-[#191c1e]">Admin Master Console</p>
                <p className="text-xs text-[#737782]">Coverage management, outage lifecycle, roles</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-purple-700">chevron_right</span>
          </button>
        )}
      </div>

      {/* About & Branding Footer */}
      <div className="flex flex-col items-center text-center gap-2 pt-4">
        <PhilSePushLogo size="md" />
        <p className="text-xs text-[#737782] max-w-xs">
          Philippine community-driven power outage monitoring and reporting platform.
        </p>
        <p className="text-[10px] text-[#737782]">v1.0.0 • Multi-Role Production Scaffolding</p>
      </div>
    </main>
  );
};
