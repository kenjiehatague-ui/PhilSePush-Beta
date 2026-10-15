import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { firestoreService } from '../services/firestoreService';
import { PhilSePushLogo } from './PhilSePushLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserChange: (user: User) => void;
  requiredRole?: UserRole | 'privileged';
  actionContext?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  requiredRole,
  actionContext
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedDemoRole, setSelectedDemoRole] = useState<UserRole>('citizen');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setErrorMsg(null);
      const user = await firestoreService.loginWithGoogle();
      onUserChange(user);
      onClose();
    } catch (err: any) {
      console.error('Firebase Auth sign in failed:', err);
      setErrorMsg('Google Sign-In was cancelled or encountered a network error. You can also select a role profile below for instant testing.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSelectRoleProfile = (role: UserRole) => {
    storageService.switchUserRole(role);
    const updated = storageService.getCurrentUser();
    onUserChange(updated);
    onClose();
  };

  const handleContinueAsCitizenGuest = async () => {
    try {
      await firestoreService.logout();
    } catch (err) {
      console.warn('Logout error:', err);
      storageService.resetToGuest();
    }
    const updated = storageService.getCurrentUser();
    onUserChange(updated);
    onClose();
  };

  const isSuperAdmin = storageService.isAdmin(currentUser);

  const getRoleTitle = (role?: UserRole | 'privileged') => {
    switch (role) {
      case 'utility_provider':
        return 'Utility Provider (Davao Light / DLPC)';
      case 'lgu':
        return 'LGU Disaster Officer';
      case 'verification_team':
        return 'Verification Team Officer';
      case 'admin':
        return 'System Super Admin';
      case 'privileged':
        return 'Authorized Official / Officer';
      default:
        return 'Account Sign-In';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#c2c6d3] animate-slide-up relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f2f4f6] text-[#737782] hover:text-[#191c1e] hover:bg-[#e0e3e5] flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center">
          <PhilSePushLogo size="md" showText={true} />
          
          {actionContext ? (
            <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs w-full text-left flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-amber-700 shrink-0">lock</span>
              <div>
                <span className="font-bold block">Sign-In Required for this Action</span>
                <span>{actionContext}</span>
              </div>
            </div>
          ) : (
            <h2 className="text-lg font-bold text-[#191c1e] mt-3">
              Sign In or Select Role Profile
            </h2>
          )}

          <p className="text-xs text-[#5b6068] mt-1.5 leading-relaxed">
            Citizens can freely browse and submit reports without an account. Official roles (Utility, LGU, Verification Team, and Admin) require authorized sign-in.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#ffdad6] border border-[#ffb4ac] rounded-xl text-[#93000d] text-xs">
            {errorMsg}
          </div>
        )}

        {/* Option A: Cloud Google Authentication */}
        <div className="flex flex-col gap-2.5 p-4 bg-[#f8f9fb] rounded-2xl border border-[#e0e3e5]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#00346e] uppercase tracking-wider">
              Google Account Sign-In
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Firebase Cloud Sync
            </span>
          </div>
          <p className="text-xs text-[#737782]">
            Sign in with your Google account to sync your profile and access assigned role privileges.
          </p>

          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-[#c2c6d3] hover:bg-[#f2f4f6] text-[#191c1e] text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-[0.99]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.76-2.1-6.71-4.94H1.27v3.15C3.25 21.28 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.29 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.41l4.02-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.72 1.27 6.59l4.02 3.15c.95-2.84 3.59-4.99 6.71-4.99z"/>
            </svg>
            <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
          </button>
        </div>

        {/* Option B: Role Profile Switcher (Super Admin Only) */}
        {isSuperAdmin ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-purple-700">admin_panel_settings</span>
                Super Admin Role Switcher
              </span>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Master Control
              </span>
            </div>
            <p className="text-xs text-[#737782]">
              Select a system role to simulate the experience and test permissions across portals.
            </p>

            <div className="flex flex-col gap-1.5">
              {/* Citizen */}
              <button
                onClick={() => handleSelectRoleProfile('citizen')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  currentUser.role === 'citizen'
                    ? 'bg-[#d7e3ff] border-[#004a98] text-[#001b3f] font-bold'
                    : 'bg-white border-[#e0e3e5] hover:bg-[#f8f9fb] text-[#191c1e]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#424751]">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Citizen (Consumer)</span>
                    <span className="text-[11px] text-[#737782] font-normal">
                      Public browsing, reporting & Me-Too
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Select
                </span>
              </button>

              {/* Utility Provider */}
              <button
                onClick={() => handleSelectRoleProfile('utility_provider')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  currentUser.role === 'utility_provider'
                    ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold'
                    : 'bg-white border-[#e0e3e5] hover:bg-[#f8f9fb] text-[#191c1e]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Utility Provider (Davao Light Dispatch)</span>
                    <span className="text-[11px] text-[#737782] font-normal">
                      Post official bulletins & monitor grid
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Select
                </span>
              </button>

              {/* LGU Officer */}
              <button
                onClick={() => handleSelectRoleProfile('lgu')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  currentUser.role === 'lgu'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold'
                    : 'bg-white border-[#e0e3e5] hover:bg-[#f8f9fb] text-[#191c1e]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">location_city</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold block">LGU Officer (Davao City Disaster Office)</span>
                    <span className="text-[11px] text-[#737782] font-normal">
                      Post emergency bulletins & manage shelters
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Select
                </span>
              </button>

              {/* Verification Team */}
              <button
                onClick={() => handleSelectRoleProfile('verification_team')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  currentUser.role === 'verification_team'
                    ? 'bg-amber-50 border-amber-600 text-amber-950 font-bold'
                    : 'bg-white border-[#e0e3e5] hover:bg-[#f8f9fb] text-[#191c1e]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Verification Team Officer</span>
                    <span className="text-[11px] text-[#737782] font-normal">
                      Triage reports & verify field cases
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Select
                </span>
              </button>

              {/* System Super Admin */}
              <button
                onClick={() => handleSelectRoleProfile('admin')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-50 border-purple-600 text-purple-950 font-bold'
                    : 'bg-white border-[#e0e3e5] hover:bg-[#f8f9fb] text-[#191c1e]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold block">System Super Admin</span>
                    <span className="text-[11px] text-[#737782] font-normal">
                      Full master authority ({currentUser.email || 'Admin'})
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  Master
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
              <span className="material-symbols-outlined text-[18px] text-purple-700">lock</span>
              <span>Role Permissions & Access Control</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Official roles (Utility Dispatchers, LGU Officers, Verification Team) and System Super Admin access are tied to authorized accounts. Sign in with your Google account above to access assigned administrative features.
            </p>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#e0e3e5]">
          <button
            onClick={handleContinueAsCitizenGuest}
            className="text-xs font-semibold text-[#424751] hover:text-[#00346e]"
          >
            Continue as Guest Citizen
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#191c1e] text-xs font-bold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
