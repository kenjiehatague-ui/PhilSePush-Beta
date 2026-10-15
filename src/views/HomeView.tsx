import React, { useState, useEffect } from 'react';
import { Area, Outage, User } from '../types';
import { storageService } from '../services/storageService';
import { ShareModal } from '../components/ShareModal';
import confetti from 'canvas-confetti';

interface HomeViewProps {
  currentArea: Area | null;
  currentUser: User;
  onNavigate: (route: string) => void;
  onOpenLocationModal: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentArea,
  currentUser,
  onNavigate,
  onOpenLocationModal
}) => {
  const activeArea = currentArea || storageService.getSelectedArea();
  const activeUser = currentUser || storageService.getCurrentUser();

  const [activeOutage, setActiveOutage] = useState<Outage | undefined>(undefined);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [scheduledOutages, setScheduledOutages] = useState<any[]>([]);

  const loadData = () => {
    if (!activeArea?.id) return;
    const outage = storageService.getActiveOutageForArea(activeArea.id);
    setActiveOutage(outage);

    if (outage && activeUser?.id) {
      const confirmed = storageService.hasUserConfirmed(outage.id, activeUser.id);
      setHasConfirmed(confirmed);
    } else {
      setHasConfirmed(false);
    }

    const sched = storageService.getScheduledOutages().filter((s) => s.areaId === activeArea.id);
    setScheduledOutages(sched);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = storageService.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, [activeArea?.id, activeUser?.id]);

  const handleMeTooClick = () => {
    if (!activeOutage || hasConfirmed || !activeUser?.id) return;

    const success = storageService.confirmOutage(activeOutage.id, activeUser.id);
    if (success) {
      setHasConfirmed(true);
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 }
        });
      } catch {}
    }
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 pt-6 pb-28 md:pb-12 flex flex-col gap-6">
      {/* Top Location Summary Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-[#eceef0] p-3.5 rounded-2xl border border-[#c2c6d3]">
        <div className="flex items-center gap-2 text-[#00346e]">
          <span className="material-symbols-outlined text-[22px] icon-fill">
            location_on
          </span>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#737782] block">
              Monitoring Service Area
            </span>
            <span className="text-sm font-bold text-[#191c1e]">
              {currentArea
                ? `${currentArea.barangay}, ${currentArea.cityMunicipality}`
                : 'No Area Selected'}
            </span>
          </div>
        </div>

        <button
          onClick={onOpenLocationModal}
          className="text-xs font-bold text-[#004a98] hover:text-[#00346e] hover:underline px-2 py-1"
        >
          {currentArea ? 'Switch Area' : 'Select Location'}
        </button>
      </div>

      {/* Prompt Card when no area is chosen */}
      {!currentArea && (
        <div className="bg-[#d7e3ff]/40 border-2 border-[#004a98]/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#004a98] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <span className="material-symbols-outlined text-[28px]">add_location_alt</span>
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#00346e]">Please Select Your Area</h3>
              <p className="text-sm text-[#424751] mt-1 max-w-xl">
                Select your Philippine Barangay or City to view real-time power outages, utility service advisories, and report electrical grid issues in your community.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenLocationModal}
            className="w-full md:w-auto px-6 py-3 bg-[#004a98] hover:bg-[#00346e] text-white font-bold rounded-xl text-sm shadow-2xs transition-all shrink-0 active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">location_on</span>
            <span>Select Location Now</span>
          </button>
        </div>
      )}

      {/* Scheduled Maintenance Alert Banner if any */}
      {scheduledOutages.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-2xs flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 shrink-0 mt-0.5">
            calendar_clock
          </span>
          <div className="flex-1 text-xs sm:text-sm">
            <h4 className="font-bold text-amber-900">
              Scheduled Power Interruption Notice ({scheduledOutages[0].provider})
            </h4>
            <p className="text-amber-800 mt-0.5">{scheduledOutages[0].reason}</p>
            <p className="text-amber-700 text-xs mt-1 font-medium">
              Scheduled: {new Date(scheduledOutages[0].startAt).toLocaleDateString()} • 8:00 AM - 5:00 PM
            </p>
          </div>
        </div>
      )}

      {/* Active Outage Card OR All-Clear State */}
      {activeOutage ? (
        <section className="relative overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#c2c6d3]/60 transition-all">
          {/* Status Indicator Left Strip (Secondary Red Container #e41e25) */}
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#e41e25] rounded-l-2xl"></div>

          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10 pl-7 md:pl-8">
            {/* Alert Icon & Info */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2.5 text-[#e41e25] mb-1">
                <div className={`relative w-9 h-9 flex items-center justify-center rounded-full ${
                  activeOutage.verified ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-amber-100 text-amber-800'
                } animate-pulse-ring`}>
                  <span className="material-symbols-outlined text-[20px] icon-fill">
                    {activeOutage.verified ? 'warning' : 'report'}
                  </span>
                </div>
                <span className={`text-xs font-extrabold uppercase tracking-wider ${
                  activeOutage.verified ? 'text-[#e41e25]' : 'text-amber-800'
                }`}>
                  Active Alert
                </span>
                {activeOutage.verified ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    <span>VERIFIED</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-amber-700">pending</span>
                    <span>UNVERIFIED</span>
                  </span>
                )}
                {activeOutage.disputed && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-amber-700">warning</span>
                    <span>A community member flagged this as inaccurate</span>
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] tracking-tight">
                Power outage reported
              </h2>

              <p className="text-sm text-[#424751] font-medium">
                {activeOutage.communityReportedCause}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs sm:text-sm text-[#424751]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#737782]">
                    schedule
                  </span>
                  <span>Started {new Date(activeOutage.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>

                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#737782]">
                    info
                  </span>
                  <span>
                    Status: <strong className="text-[#191c1e] font-bold">{activeOutage.status}</strong>
                  </span>
                </span>

                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#737782]">
                    group
                  </span>
                  <span className="font-bold text-[#e41e25]">
                    {activeOutage.peopleAffected} people affected
                  </span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0">
              <button
                onClick={() => onNavigate(`/outage/${activeOutage.id}`)}
                className="px-6 py-3 rounded-xl border-2 border-[#00346e] text-[#00346e] hover:bg-[#d7e3ff] font-bold text-sm text-center transition-colors shadow-2xs cursor-pointer"
              >
                View details
              </button>

              <button
                onClick={handleMeTooClick}
                disabled={hasConfirmed}
                className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
                  hasConfirmed
                    ? 'bg-emerald-600 text-white cursor-default opacity-90'
                    : 'bg-[#e41e25] hover:bg-[#bb0014] text-white active:scale-95 cursor-pointer'
                }`}
                title={hasConfirmed ? 'You have already confirmed this outage' : 'Confirm outage in your area'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {hasConfirmed ? 'check_circle' : 'add_reaction'}
                </span>
                <span>{hasConfirmed ? '✓ Me Too' : 'Me Too'}</span>
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="p-3 rounded-xl border border-[#c2c6d3] text-[#424751] hover:bg-[#f2f4f6] hover:text-[#191c1e] transition-colors flex items-center justify-center"
                title="Share this alert"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        /* All Normal / No Outage State */
        <section className="bg-white rounded-2xl p-8 shadow-[0_4px_16px_rgba(0,0,0,0.05)] border border-[#c2c6d3]/60 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[36px] icon-fill">
              check_circle
            </span>
          </div>

          <div className="max-w-md">
            <h3 className="text-xl font-bold text-[#191c1e]">
              No active outages reported in {currentArea?.barangay || 'your monitored area'}
            </h3>
            <p className="text-sm text-[#737782] mt-1">
              Electrical grid operational through {currentArea?.utilityProvider || 'your local utility'}. If you are currently experiencing a power loss, please file a community report below.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/report')}
            className="mt-2 bg-[#004a98] hover:bg-[#00346e] text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">report_problem</span>
            <span>Report Power Interruption</span>
          </button>
        </section>
      )}

      {/* Spatial Map Canvas Preview Container matching Stitch Screen */}
      <section className="w-full rounded-2xl bg-white border border-[#c2c6d3] overflow-hidden shadow-xs relative">
        <div className="p-4 border-b border-[#e0e3e5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00346e]">explore</span>
            <h3 className="text-sm font-bold text-[#191c1e]">
              Spatial Outage Context: {currentArea.cityMunicipality}
            </h3>
          </div>
          <button
            onClick={() => onNavigate('/map')}
            className="text-xs font-bold text-[#004a98] hover:underline flex items-center gap-1"
          >
            <span>Open Full Interactive Map</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        <div className="w-full h-64 sm:h-80 relative bg-[#eceef0] flex items-center justify-center overflow-hidden">
          {/* Subtle map tiles representation */}
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage: `radial-gradient(#c2c6d3 1.5px, transparent 1.5px), linear-gradient(to right, #f2f4f6 1px, transparent 1px), linear-gradient(to bottom, #f2f4f6 1px, transparent 1px)`,
              backgroundSize: '32px 32px, 64px 64px, 64px 64px'
            }}
          ></div>

          {/* Road / River Graphic Layout for Map Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
            <path d="M 0,200 Q 250,150 400,280 T 800,100" fill="none" stroke="#9abdff" strokeWidth="18" />
            <path d="M 100,0 L 500,400" fill="none" stroke="#ffffff" strokeWidth="6" />
            <path d="M 0,120 L 800,180" fill="none" stroke="#ffffff" strokeWidth="8" />
            <path d="M 300,0 L 250,400" fill="none" stroke="#ffffff" strokeWidth="5" />
          </svg>

          {/* Active Marker Pin in center */}
          {activeOutage && (
            <div
              onClick={() => onNavigate(`/outage/${activeOutage.id}`)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
            >
              <div className="bg-white/95 rounded-xl shadow-lg px-3 py-1.5 mb-2 border border-[#c2c6d3] text-center whitespace-nowrap transform -translate-x-1/2 left-1/2 relative group-hover:scale-105 transition-transform">
                <p className="text-xs font-bold text-[#191c1e]">{activeOutage?.barangay || 'Affected Barangay'}</p>
                <p className="text-[10px] font-semibold text-[#e41e25]">
                  {activeOutage.peopleAffected} confirmed reports
                </p>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="w-10 h-10 bg-[#e41e25] border-2 border-white rounded-full shadow-md flex items-center justify-center text-white font-bold">
                  <span className="material-symbols-outlined text-[20px] icon-fill">
                    bolt
                  </span>
                </div>
                <div className="absolute w-16 h-16 bg-[#e41e25]/30 rounded-full animate-ping pointer-events-none"></div>
              </div>
            </div>
          )}

          {/* Map Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-20">
            <button
              onClick={() => onNavigate('/map')}
              className="w-9 h-9 bg-white rounded-lg shadow-sm border border-[#c2c6d3] flex items-center justify-center text-[#424751] hover:text-[#191c1e] transition-colors"
              title="Full map view"
            >
              <span className="material-symbols-outlined text-[20px]">fullscreen</span>
            </button>
          </div>
        </div>
      </section>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigate('/report')}
          className="bg-white p-5 rounded-2xl border border-[#c2c6d3]/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#ffdad6] text-[#e41e25] flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[26px]">
              add_alert
            </span>
          </div>
          <div>
            <h4 className="text-base font-bold text-[#191c1e] group-hover:text-[#00346e]">
              Report a Power Outage
            </h4>
            <p className="text-xs text-[#737782] mt-0.5">
              Submit crowdsourced report with location & photo evidence
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('/history')}
          className="bg-white p-5 rounded-2xl border border-[#c2c6d3]/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#d7e3ff] text-[#00346e] flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[26px]">
              history
            </span>
          </div>
          <div>
            <h4 className="text-base font-bold text-[#191c1e] group-hover:text-[#00346e]">
              View Outage History
            </h4>
            <p className="text-xs text-[#737782] mt-0.5">
              Search verified past brownouts, durations, and provider logs
            </p>
          </div>
        </div>
      </div>

      {/* Share Modal Dialog */}
      {showShareModal && activeOutage && (
        <ShareModal outage={activeOutage} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
};
