import React, { useState } from 'react';
import { Area, User, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { firestoreService } from '../services/firestoreService';
import { PhilSePushLogo } from './PhilSePushLogo';
import { AuthModal } from './AuthModal';

interface HeaderProps {
  currentArea: Area | null;
  onOpenLocationModal: () => void;
  onNavigate: (route: string) => void;
  currentUser?: User;
  onUserChange?: (user: User) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentArea,
  onOpenLocationModal,
  onNavigate,
  currentUser,
  onUserChange
}) => {
  const activeUser = currentUser || storageService.getCurrentUser();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const unreadCount = activeUser?.id
    ? storageService.getNotifications(activeUser.id).filter((n) => !n.read).length
    : 0;

  const handleRoleSelect = (role: UserRole) => {
    storageService.switchUserRole(role);
    const updated = storageService.getCurrentUser();
    onUserChange?.(updated);
    setShowRoleDropdown(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      const user = await firestoreService.loginWithGoogle();
      onUserChange?.(user);
      setShowRoleDropdown(false);
    } catch (err) {
      console.error('Firebase Auth sign in failed:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await firestoreService.logout();
    } catch (err) {
      console.warn('Sign out warning:', err);
      storageService.resetToGuest();
    }
    const updated = storageService.getCurrentUser();
    onUserChange?.(updated);
    setShowRoleDropdown(false);
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Super Admin', color: 'bg-purple-100 text-purple-900 border-purple-300 font-bold', icon: 'admin_panel_settings' };
      case 'verification_team':
        return { label: 'Verifier', color: 'bg-amber-100 text-amber-900 border-amber-300 font-bold', icon: 'verified_user' };
      case 'utility_provider':
        return { label: 'Utility (Davao Light)', color: 'bg-blue-100 text-blue-900 border-blue-300 font-bold', icon: 'bolt' };
      case 'lgu':
        return { label: 'LGU Officer', color: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold', icon: 'location_city' };
      default:
        return { label: 'Citizen', color: 'bg-gray-100 text-gray-800 border-gray-300 font-medium', icon: 'person' };
    }
  };

  const roleInfo = getRoleBadge(activeUser?.role);
  const isSuperAdmin = storageService.isAdmin(activeUser);
  const isGuest = activeUser.id === 'user-guest' || (!activeUser.email && activeUser.role === 'citizen' && !isSuperAdmin);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#f8f9fb] border-b border-[#e0e3e5] shadow-xs px-4 md:px-8 py-3.5 flex items-center justify-between">
        {/* Brand logo & mobile context */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/home')}>
          <PhilSePushLogo size="sm" showText={true} />
          <span className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Cloud Sync
          </span>
        </div>

        {/* Center / Right Location selector and Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          {/* Location Selector Pill */}
          <button
            onClick={onOpenLocationModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f2f4f6] hover:bg-[#e6e8ea] border border-[#c2c6d3] rounded-full text-xs sm:text-sm font-semibold text-[#191c1e] transition-all max-w-[190px] sm:max-w-xs truncate shadow-2xs hover:shadow-xs active:scale-98"
            title="Change location"
          >
            <span className="material-symbols-outlined text-[18px] text-[#00346e] icon-fill">
              location_on
            </span>
            <span className="truncate">
              {currentArea
                ? `${currentArea.barangay}, ${currentArea.cityMunicipality.split(' ')[0]}`
                : 'Select Location'}
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#737782]">
              expand_more
            </span>
          </button>

          {/* Notifications Icon Button */}
          <button
            onClick={() => onNavigate('/notifications')}
            className="relative p-2 text-[#424751] hover:text-[#00346e] hover:bg-[#eceef0] rounded-full transition-colors"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#e41e25] rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {/* Optional Sign In CTA for Guests */}
          {isGuest && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#c2c6d3] hover:bg-[#eceef0] text-[#00346e] text-xs font-bold rounded-full shadow-2xs transition-colors"
              title="Sign in with an account (Optional for Citizens, required for Officials)"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>Sign In</span>
            </button>
          )}

          {/* Role Pill & Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs border transition-all ${roleInfo.color} hover:opacity-90 shadow-2xs`}
              title={isSuperAdmin ? "Super Admin Role Switcher (Switch role at any time)" : "User Account & Role Profile"}
            >
              <span className="material-symbols-outlined text-[16px]">{roleInfo.icon}</span>
              <span className="hidden sm:inline">{roleInfo.label}</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>

            {/* Dropdown Menu for Roles & Firebase Auth */}
            {showRoleDropdown && (
              <>
                <div
                  className="fixed inset-0 z-50"
                  onClick={() => setShowRoleDropdown(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#c2c6d3] p-3 z-50 animate-fade-in text-left">
                  {/* Account Status */}
                  <div className="p-2.5 bg-[#f8f9fb] border border-[#e0e3e5] rounded-xl mb-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#00346e]">
                        Current Session
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${activeUser.role !== 'citizen' ? 'bg-purple-100 text-purple-800' : 'bg-gray-200 text-gray-700'}`}>
                        {activeUser.role.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#191c1e] truncate">
                      {activeUser.name}
                    </p>
                    <p className="text-[11px] text-[#737782] truncate">
                      {activeUser.email || (isGuest ? 'Guest Citizen (No account required)' : 'Active Session')}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-[#e0e3e5] flex gap-2">
                      <button
                        onClick={() => {
                          setShowRoleDropdown(false);
                          setShowAuthModal(true);
                        }}
                        className="flex-1 py-1.5 px-2 bg-white border border-[#c2c6d3] hover:bg-[#f2f4f6] text-[#00346e] text-[11px] font-bold rounded-lg text-center"
                      >
                        Account Dialog
                      </button>
                      <button
                        onClick={handleGoogleSignIn}
                        disabled={isSigningIn}
                        className="flex-1 py-1.5 px-2 bg-[#004a98] text-white hover:bg-[#00346e] text-[11px] font-bold rounded-lg text-center truncate"
                      >
                        {isSigningIn ? 'Connecting...' : 'Google Sign In'}
                      </button>
                    </div>
                  </div>

                  {/* Super Admin Notice / Role Switcher Header (ONLY for Super Admin) */}
                  {isSuperAdmin ? (
                    <>
                      <div className="px-2 py-1 mb-1 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-[#737782] uppercase tracking-wider">
                          ⚡ Super Admin Role Switcher
                        </p>
                        <span className="text-[9px] font-extrabold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                          Master Access
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleRoleSelect('citizen')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                            activeUser.role === 'citizen' ? 'bg-[#d7e3ff] text-[#001b3f] font-bold' : 'hover:bg-[#f2f4f6]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[17px]">person</span>
                            <span>Citizen (Power Consumer)</span>
                          </div>
                          {activeUser.role === 'citizen' && (
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          )}
                        </button>

                        <button
                          onClick={() => handleRoleSelect('utility_provider')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                            activeUser.role === 'utility_provider' ? 'bg-blue-100 text-blue-950 font-bold' : 'hover:bg-[#f2f4f6]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[17px] text-[#004a98]">bolt</span>
                            <span>Utility Provider (Davao Light)</span>
                          </div>
                          {activeUser.role === 'utility_provider' && (
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          )}
                        </button>

                        <button
                          onClick={() => handleRoleSelect('lgu')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                            activeUser.role === 'lgu' ? 'bg-emerald-100 text-emerald-950 font-bold' : 'hover:bg-[#f2f4f6]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[17px] text-emerald-700">location_city</span>
                            <span>LGU Officer (Davao City)</span>
                          </div>
                          {activeUser.role === 'lgu' && (
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          )}
                        </button>

                        <button
                          onClick={() => handleRoleSelect('verification_team')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                            activeUser.role === 'verification_team' ? 'bg-amber-100 text-amber-950 font-bold' : 'hover:bg-[#f2f4f6]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[17px] text-amber-700">verified_user</span>
                            <span>Verification Team</span>
                          </div>
                          {activeUser.role === 'verification_team' && (
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          )}
                        </button>

                        <button
                          onClick={() => handleRoleSelect('admin')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                            activeUser.role === 'admin' ? 'bg-purple-100 text-purple-950 font-bold' : 'hover:bg-[#f2f4f6]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[17px] text-purple-700">admin_panel_settings</span>
                            <span>System Super Admin</span>
                          </div>
                          {activeUser.role === 'admin' && (
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-600">
                      <div className="flex items-center gap-1.5 font-bold text-gray-800 mb-1">
                        <span className="material-symbols-outlined text-[16px] text-purple-700">lock</span>
                        <span>Role Management Notice</span>
                      </div>
                      <p>
                        Role switching is restricted exclusively to the authorized Super Admin account.
                      </p>
                    </div>
                  )}

                  {/* Sign Out / Switch to Guest Button (Always available when signed in or non-guest) */}
                  {!isGuest && (
                    <div className="mt-2.5 pt-2 border-t border-[#e0e3e5]">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-center text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl font-bold py-1.5 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">logout</span>
                        <span>Sign Out (Switch to Guest)</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal for Login / Account Selection */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={activeUser}
        onUserChange={(user) => {
          onUserChange?.(user);
          setShowAuthModal(false);
        }}
      />
    </>
  );
};

