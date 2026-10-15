import React from 'react';
import { Area } from '../types';
import { PhilSePushLogo } from '../components/PhilSePushLogo';
import { storageService } from '../services/storageService';

interface LandingViewProps {
  onOpenLocationModal: () => void;
  onSelectArea: (area: Area) => void;
  onNavigate: (route: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onOpenLocationModal,
  onSelectArea,
  onNavigate
}) => {
  const supportedAreas = storageService.getSupportedAreas();

  const handleSuggestedClick = (barangayName: string) => {
    const matched = supportedAreas.find((a) => (a?.barangay || '').toLowerCase().includes(barangayName.toLowerCase()));
    if (matched) {
      onSelectArea(matched);
      onNavigate('/home');
    } else {
      onOpenLocationModal();
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#f8f9fb]">
      {/* Background Subtle Utility Grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40"
      >
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#d7e3ff]/30 via-[#f8f9fb] to-[#f8f9fb]"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(#c2c6d3 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        ></div>
      </div>

      <div className="flex flex-col items-center max-w-sm w-full mx-auto text-center gap-8 relative z-10 animate-fade-in">
        {/* Branding & Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-28 h-28 flex items-center justify-center bg-white rounded-3xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-[#e0e3e5] p-3 mb-2">
            <PhilSePushLogo size="xl" showText={false} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#00346e] tracking-tight">
            PhilSe<span className="text-[#004a98]">Push</span>
          </h1>
          <p className="text-base text-[#424751] font-medium max-w-[280px] leading-relaxed">
            Power Monitoring Platform
          </p>
        </div>

        {/* Central Action CTA Button */}
        <div className="flex flex-col items-center gap-3 w-full">
          <button
            onClick={onOpenLocationModal}
            className="w-full bg-[#004a98] hover:bg-[#00346e] text-white rounded-xl py-4 px-6 flex items-center justify-center gap-3 shadow-[0_8px_24px_rgba(0,74,152,0.25)] transition-all active:scale-95 animate-pulse-soft font-semibold text-lg"
          >
            <span className="material-symbols-outlined text-[24px] icon-fill">
              location_on
            </span>
            <span>Add your area</span>
          </button>
          <p className="text-sm text-[#737782] px-4 font-normal">
            Get real-time outage updates and report power interruptions for your community.
          </p>
        </div>

        {/* Suggested Locations */}
        <div className="w-full pt-4 border-t border-[#e0e3e5]/70">
          <p className="text-xs font-bold text-[#737782] uppercase tracking-wider mb-3">
            Suggested Philippine Areas
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => handleSuggestedClick('Barangay 1-A')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#c2c6d3] bg-white text-[#424751] hover:bg-[#f2f4f6] hover:border-[#004a98] hover:text-[#00346e] transition-all text-xs font-medium shadow-2xs"
            >
              <span className="material-symbols-outlined text-[15px] text-[#004a98]">
                push_pin
              </span>
              <span>Barangay 1-A, Davao City</span>
            </button>

            <button
              onClick={() => handleSuggestedClick('Bel-Air')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#c2c6d3] bg-white text-[#424751] hover:bg-[#f2f4f6] hover:border-[#004a98] hover:text-[#00346e] transition-all text-xs font-medium shadow-2xs"
            >
              <span className="material-symbols-outlined text-[15px] text-[#004a98]">
                push_pin
              </span>
              <span>Makati City</span>
            </button>

            <button
              onClick={() => handleSuggestedClick('Lahug')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#c2c6d3] bg-white text-[#424751] hover:bg-[#f2f4f6] hover:border-[#004a98] hover:text-[#00346e] transition-all text-xs font-medium shadow-2xs"
            >
              <span className="material-symbols-outlined text-[15px] text-[#004a98]">
                push_pin
              </span>
              <span>Cebu City</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
