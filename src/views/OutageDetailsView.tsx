import React, { useState, useEffect } from 'react';
import { Outage, User, CommunityUpdate, OfficialUpdate } from '../types';
import { storageService } from '../services/storageService';
import { firestoreService } from '../services/firestoreService';
import { ShareModal } from '../components/ShareModal';
import { AddCommunityUpdateModal } from './AddCommunityUpdateModal';
import { AddOfficialUpdateModal } from './AddOfficialUpdateModal';
import { ManageCriticalFacilitiesModal } from './ManageCriticalFacilitiesModal';
import { AuthModal } from '../components/AuthModal';
import confetti from 'canvas-confetti';

interface OutageDetailsViewProps {
  outageId: string;
  currentUser: User;
  onNavigate: (route: string) => void;
  onBack: () => void;
}

export const OutageDetailsView: React.FC<OutageDetailsViewProps> = ({
  outageId,
  currentUser,
  onNavigate,
  onBack
}) => {
  const [outage, setOutage] = useState<Outage | undefined>(undefined);
  const [communityUpdates, setCommunityUpdates] = useState<CommunityUpdate[]>([]);
  const [officialUpdates, setOfficialUpdates] = useState<OfficialUpdate[]>([]);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddUpdateModal, setShowAddUpdateModal] = useState(false);
  const [showOfficialUpdateModal, setShowOfficialUpdateModal] = useState(false);
  const [showCriticalFacilityModal, setShowCriticalFacilityModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalContext, setAuthModalContext] = useState<string>('');
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flagSuccess, setFlagSuccess] = useState(false);

  // Status transition & case resolution state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<Outage['status']>('Repairing');
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Admin delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManageOfficialAndCritical =
    currentUser.role === 'utility_provider' ||
    currentUser.role === 'lgu' ||
    currentUser.role === 'verification_team' ||
    currentUser.role === 'admin';

  const loadData = () => {
    const foundOutage = storageService.getOutageById(outageId);
    setOutage(foundOutage);

    const targetId = foundOutage?.id || outageId;
    setHasConfirmed(storageService.hasUserConfirmed(targetId, currentUser.id));
    setCommunityUpdates(storageService.getCommunityUpdates(targetId));
    setOfficialUpdates(storageService.getOfficialUpdates(targetId));
  };

  const handleConfirmDelete = async () => {
    if (!outage) return;
    setIsDeleting(true);
    const targetId = outage.id;
    storageService.deleteOutage(targetId);
    storageService.deleteReport(targetId);
    firestoreService.deleteOutage(targetId).catch(() => {});
    firestoreService.deleteHistoricalIncident(targetId).catch(() => {});
    setStatusToast(`Outage / Report record #${targetId.slice(-8)} successfully deleted.`);
    setTimeout(() => {
      setIsDeleting(false);
      setShowDeleteModal(false);
      onNavigate('/history');
    }, 1000);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = storageService.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, [outageId, currentUser.id]);

  const handleOpenStatusModal = (status: Outage['status']) => {
    if (!canManageOfficialAndCritical) {
      setAuthModalContext('Updating outage lifecycle status or resolving cases requires signing in as an authorized Utility Provider, LGU Officer, or System Admin.');
      setShowAuthModal(true);
      return;
    }
    setSelectedNewStatus(status);
    if (status === 'Restored') {
      setStatusUpdateNote('All primary feeders re-energized. Voltage levels stabilized across all affected barangay sectors.');
    } else if (status === 'Repairing') {
      setStatusUpdateNote('Line crew arrived on-site. Replacement of damaged line hardware and transformer servicing underway.');
    } else if (status === 'Restoring') {
      setStatusUpdateNote('Phase 1 re-energization initiated. Substations gradually picking up community load.');
    } else {
      setStatusUpdateNote('Technical dispatch team performing field inspection.');
    }
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outage) return;

    const org =
      currentUser.organization ||
      (currentUser.role === 'lgu'
        ? `${outage.cityMunicipality} LGU Disaster Response`
        : outage.provider);

    storageService.updateOutageStatus(
      outage.id,
      selectedNewStatus,
      outage.officialConfirmedCause,
      statusUpdateNote.trim() || undefined,
      org,
      currentUser.name
    );

    firestoreService.updateOutageStatus(outage.id, selectedNewStatus).catch(() => {});
    loadData();

    if (selectedNewStatus === 'Restored') {
      try {
        confetti({
          particleCount: 65,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}
      setStatusToast(`Case Resolved! Power marked as fully restored in ${outage.barangay}.`);
    } else if (selectedNewStatus === 'Repairing') {
      setStatusToast(`Case updated to "Fixing" (Repairing in Progress).`);
    } else {
      setStatusToast(`Outage status updated to "${selectedNewStatus}".`);
    }

    setTimeout(() => setStatusToast(null), 4000);
    setShowStatusModal(false);
    setStatusUpdateNote('');
  };

  const handleCriticalFacilityClick = () => {
    if (canManageOfficialAndCritical) {
      setShowCriticalFacilityModal(true);
    } else {
      setAuthModalContext('Updating critical hospital/water infrastructure status requires signing in as an authorized Utility Provider or LGU Officer.');
      setShowAuthModal(true);
    }
  };

  const handleOfficialUpdateClick = () => {
    if (canManageOfficialAndCritical) {
      setShowOfficialUpdateModal(true);
    } else {
      setAuthModalContext('Posting official dispatch bulletins requires signing in as an authorized Utility Provider or LGU Officer.');
      setShowAuthModal(true);
    }
  };

  const handleMeTooClick = () => {
    if (!outage || hasConfirmed) return;

    const success = storageService.confirmOutage(outage.id, currentUser.id);
    if (success) {
      setHasConfirmed(true);
      loadData();
      try {
        confetti({
          particleCount: 45,
          spread: 70,
          origin: { y: 0.7 }
        });
      } catch {}
    }
  };

  const handleFlagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outage || !flagReason.trim()) return;

    storageService.flagOutage(outage.id, currentUser.id, flagReason);
    firestoreService.flagOutage(outage.id, flagReason).catch(() => {});
    setFlagSuccess(true);
    loadData();
    setTimeout(() => {
      setShowFlagModal(false);
      setFlagSuccess(false);
      setFlagReason('');
    }, 1800);
  };

  if (!outage) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <span className="material-symbols-outlined text-[48px] text-[#737782]">
          power_off
        </span>
        <h2 className="text-xl font-bold text-[#191c1e] mt-3">Outage Record Not Found</h2>
        <p className="text-sm text-[#737782] mt-1 mb-4">
          The requested power interruption report may have been archived or restored.
        </p>
        <button
          onClick={onBack}
          className="bg-[#004a98] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#00346e]"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const getStatusColor = (status: Outage['status']) => {
    switch (status) {
      case 'Investigating':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Repairing':
        return 'bg-[#ffdad6] text-[#93000d] border-[#ffb4ac]';
      case 'Restoring':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Restored':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    }
  };

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 py-6 pb-24 md:pb-12 flex flex-col gap-6">
      {/* Top Header Navigation & Admin Actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-[#424751] hover:text-[#00346e] transition-colors w-max cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span>Back to Dashboard</span>
        </button>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98"
            title="Admin: Permanently delete this outage / report record"
          >
            <span className="material-symbols-outlined text-[17px]">delete_forever</span>
            <span>Delete Report / Outage</span>
          </button>
        )}
      </div>

      {/* Success Status Toast Notification */}
      {statusToast && (
        <div className="fixed top-20 right-4 z-50 bg-[#00346e] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#abc7ff] flex items-center gap-3 animate-fade-in text-xs font-bold">
          <span className="material-symbols-outlined text-[22px] text-emerald-400">check_circle</span>
          <span>{statusToast}</span>
        </div>
      )}

      {/* Incident Status & Dispatch Response Control Center - Only shown to Admin, LGU, Verification Team, and Utility Provider */}
      {canManageOfficialAndCritical && (
        <section className="bg-white rounded-2xl shadow-xs border border-[#c2c6d3] p-5 sm:p-6 overflow-hidden relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e0e3e5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#004a98] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[24px]">engineering</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#191c1e]">
                    Technical Operations & Lifecycle Control
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-[#00346e]">
                    Authorized Dispatch Desk
                  </span>
                </div>
                <p className="text-xs text-[#737782]">
                  Active Grid Status: <strong className="text-[#191c1e]">{outage.status}</strong>
                  {outage.status === 'Repairing' && ' — Field crews fixing line faults'}
                  {outage.status === 'Restoring' && ' — Substation re-energization underway'}
                  {outage.status === 'Restored' && ' — Case Resolved & 100% Power Restored'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-[#737782] font-medium hidden sm:inline">Role:</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#f2f4f6] text-[#00346e] border border-[#c2c6d3]">
                {currentUser.name} ({currentUser.role.replace('_', ' ')})
              </span>
            </div>
          </div>

          {/* 4-Stage Stepper Progression */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
            <div
              className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                outage.status === 'Investigating'
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300/60 shadow-xs'
                  : 'bg-[#f8f9fb] border-[#e0e3e5] opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                  1. Triage
                </span>
                <span className="material-symbols-outlined text-[16px] text-amber-700">search</span>
              </div>
              <span className="text-xs font-bold text-[#191c1e]">Investigating</span>
            </div>

            <div
              className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                outage.status === 'Repairing'
                  ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300/60 shadow-xs'
                  : 'bg-[#f8f9fb] border-[#e0e3e5] opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900">
                  2. Field Work
                </span>
                <span className="material-symbols-outlined text-[16px] text-rose-700">build</span>
              </div>
              <span className="text-xs font-bold text-[#191c1e]">Fixing / Repairing</span>
            </div>

            <div
              className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                outage.status === 'Restoring'
                  ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300/60 shadow-xs'
                  : 'bg-[#f8f9fb] border-[#e0e3e5] opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
                  3. Energization
                </span>
                <span className="material-symbols-outlined text-[16px] text-blue-700">bolt</span>
              </div>
              <span className="text-xs font-bold text-[#191c1e]">Restoring</span>
            </div>

            <div
              className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                outage.status === 'Restored'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300/60 shadow-xs'
                  : 'bg-[#f8f9fb] border-[#e0e3e5] opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                  4. Resolved
                </span>
                <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span>
              </div>
              <span className="text-xs font-bold text-[#191c1e]">Restored & Resolved</span>
            </div>
          </div>

          {/* Action Controls for LGU Officer, Utility Provider, Verification Team, and Admin */}
          <div className="pt-2">
            <span className="text-xs font-bold text-[#424751] uppercase tracking-wider block mb-2">
              Update Incident Lifecycle Status (Utility Provider / LGU / Admin):
            </span>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handleOpenStatusModal('Repairing')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-2xs ${
                  outage.status === 'Repairing'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 cursor-pointer active:scale-98'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">build</span>
                <span>{outage.status === 'Repairing' ? '✓ Currently "Fixing"' : 'Update to "Fixing"'}</span>
              </button>

              <button
                onClick={() => handleOpenStatusModal('Restoring')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-2xs ${
                  outage.status === 'Restoring'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 cursor-pointer active:scale-98'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>{outage.status === 'Restoring' ? '✓ Currently "Restoring"' : 'Update to "Restoring"'}</span>
              </button>

              <button
                onClick={() => handleOpenStatusModal('Restored')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-2xs ${
                  outage.status === 'Restored'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>{outage.status === 'Restored' ? '✓ Case Resolved (Restored)' : 'Resolve Case (Mark Restored)'}</span>
              </button>

              <button
                onClick={() => handleOpenStatusModal('Investigating')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-2xs ${
                  outage.status === 'Investigating'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 cursor-pointer active:scale-98'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                <span>{outage.status === 'Investigating' ? '✓ Under Investigation' : 'Mark as "Investigating"'}</span>
              </button>

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 transition-all shadow-2xs cursor-pointer active:scale-98 sm:ml-auto"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                  <span>Delete Outage / Report</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Community Inaccuracy Flag Banner */}
      {outage.disputed && (
        <div className="bg-amber-50 border-2 border-amber-400 p-4 sm:p-5 rounded-2xl flex items-start gap-3.5 shadow-xs animate-fade-in text-amber-950">
          <div className="w-10 h-10 rounded-xl bg-amber-200/90 flex items-center justify-center text-amber-800 shrink-0 shadow-2xs">
            <span className="material-symbols-outlined text-[24px]">warning</span>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-amber-950 flex items-center gap-2">
                <span>A community member flagged this as inaccurate</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                  Flagged
                </span>
              </h3>

              {canManageOfficialAndCritical && (
                <button
                  onClick={() => {
                    storageService.clearDispute(outage.id);
                    firestoreService.clearDispute(outage.id).catch(() => {});
                    loadData();
                    setStatusToast('Inaccurate flag reviewed & cleared by verification authority.');
                    setTimeout(() => setStatusToast(null), 3500);
                  }}
                  className="text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Verify & Clear Flag</span>
                </button>
              )}
            </div>

            {outage.disputeReason && (
              <div className="mt-2 bg-white/85 p-3 rounded-xl border border-amber-200/80 text-xs font-medium text-amber-950">
                <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider block mb-0.5">
                  Reported Inaccuracy Reason:
                </span>
                <p className="italic">&ldquo;{outage.disputeReason}&rdquo;</p>
              </div>
            )}

            <p className="text-[11px] text-amber-800 mt-2 font-medium">
              Verification teams and utility dispatchers cross-reference feeder telemetry and smart-meter readings. Verifying this case will clear the flag.
            </p>
          </div>
        </div>
      )}

      {/* Main Status Header Card with Map Banner */}
      <section className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#c2c6d3]/60 overflow-hidden">
        {/* Map Header graphic snippet */}
        <div className="w-full h-44 sm:h-52 bg-[#eceef0] relative overflow-hidden flex items-center justify-center">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: `radial-gradient(#c2c6d3 1.5px, transparent 1.5px), linear-gradient(to right, #e0e3e5 1px, transparent 1px), linear-gradient(to bottom, #e0e3e5 1px, transparent 1px)`,
              backgroundSize: '24px 24px, 48px 48px, 48px 48px'
            }}
          ></div>

          {/* Road vector paths */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
            <path d="M 0,150 Q 200,90 350,220 T 900,80" fill="none" stroke="#9abdff" strokeWidth="22" />
            <path d="M 120,0 L 450,350" fill="none" stroke="#ffffff" strokeWidth="8" />
            <path d="M 0,90 L 900,120" fill="none" stroke="#ffffff" strokeWidth="8" />
          </svg>

          {/* Centered Pulsing Marker */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-9 h-9 bg-[#e41e25] rounded-full border-2 border-white shadow-md flex items-center justify-center animate-pulse-ring">
              <span className="material-symbols-outlined text-white text-[18px] icon-fill">
                bolt
              </span>
            </div>
            <span className="mt-1 px-2.5 py-0.5 bg-white/95 text-[#191c1e] text-[11px] font-bold rounded-md shadow-xs border border-[#c2c6d3]">
              {outage.barangay}
            </span>
          </div>

          <button
            onClick={() => onNavigate('/map')}
            className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-[#00346e] border border-[#c2c6d3] text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">map</span>
            <span>View on Map</span>
          </button>
        </div>

        {/* Header Info Block */}
        <div className="p-6 md:p-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              {/* Status and Time badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider border ${getStatusColor(
                    outage.status
                  )}`}
                >
                  {outage.status}
                </span>

                {outage.verified ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">pending</span>
                    <span>Unverified</span>
                  </span>
                )}

                <span className="text-xs text-[#737782] font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span>
                    Started {new Date(outage.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                    {new Date(outage.startedAt).toLocaleDateString()}
                  </span>
                </span>

                {outage.disputed && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">flag</span>
                    <span>Disputed Report</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] tracking-tight">
                {outage.barangay}
              </h1>
              <p className="text-sm font-medium text-[#424751] mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-[#00346e] icon-fill">
                  location_on
                </span>
                <span>{outage.subdivisionVillage || `${outage.cityMunicipality}, ${outage.province}`}</span>
              </p>
              <p className="text-xs text-[#737782] mt-1">
                Electric Provider: <strong>{outage.provider}</strong>
              </p>
            </div>

            {/* People Affected Counter Card */}
            <div className="bg-[#f2f4f6] px-5 py-3 rounded-2xl flex sm:flex-col items-center justify-between sm:justify-center border border-[#c2c6d3] shadow-2xs shrink-0">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#e41e25]">
                {outage.peopleAffected}
              </span>
              <span className="text-[11px] font-bold text-[#424751] uppercase tracking-wider text-center">
                People<br className="hidden sm:inline" /> Affected
              </span>
            </div>
          </div>

          {/* Causes Comparison: Community vs Official (Concept Paper Requirement) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="bg-[#f8f9fb] p-3.5 rounded-xl border border-[#c2c6d3]/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#737782] block mb-1">
                Community-Reported Cause
              </span>
              <p className="text-xs sm:text-sm font-semibold text-[#191c1e]">
                {outage.communityReportedCause}
              </p>
            </div>

            <div className="bg-[#d7e3ff]/40 p-3.5 rounded-xl border border-[#abc7ff]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00346e] block mb-1">
                LGU / Provider Confirmed Cause
              </span>
              <p className="text-xs sm:text-sm font-semibold text-[#00346e]">
                {outage.officialConfirmedCause || 'Under technical evaluation by dispatch crews.'}
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-[#e0e3e5]">
            <button
              onClick={handleMeTooClick}
              disabled={hasConfirmed}
              className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
                hasConfirmed
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-[#004a98] hover:bg-[#00346e] text-white active:scale-98 cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] icon-fill">
                {hasConfirmed ? 'check_circle' : 'campaign'}
              </span>
              <span>{hasConfirmed ? '✓ Confirmed via "Me Too"' : '"Me Too" — I Lost Power Here'}</span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="p-3.5 bg-white border border-[#c2c6d3] text-[#424751] hover:bg-[#f2f4f6] hover:text-[#191c1e] rounded-xl transition-colors flex items-center justify-center"
              title="Share Outage"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>

            <button
              onClick={() => setShowFlagModal(true)}
              className="p-3.5 bg-white border border-[#c2c6d3] text-[#737782] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-xl transition-colors flex items-center justify-center"
              title="Flag as Not Accurate"
            >
              <span className="material-symbols-outlined text-[20px]">flag</span>
            </button>
          </div>
        </div>
      </section>

      {/* Critical Facilities Alert Section */}
      <section className="bg-white rounded-2xl shadow-xs border border-[#c2c6d3] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-[#e41e25]">
            <span className="material-symbols-outlined text-[22px] icon-fill">
              local_hospital
            </span>
            <h3 className="text-sm font-bold text-[#191c1e] uppercase tracking-wider">
              Critical Infrastructure Monitoring in Area
            </h3>
          </div>

          {/* Action button for Utility Provider, LGU Officer, and Admin */}
          <button
            onClick={handleCriticalFacilityClick}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors self-start sm:self-auto ${
              canManageOfficialAndCritical
                ? 'bg-red-50 hover:bg-red-100 text-red-800 border-red-200'
                : 'bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#424751] border-[#c2c6d3]'
            }`}
            title="Utility Providers & LGU Officers can update generator and backup power states"
          >
            <span className="material-symbols-outlined text-[16px]">
              {canManageOfficialAndCritical ? 'edit_note' : 'lock'}
            </span>
            <span>
              {canManageOfficialAndCritical ? '+ Update Facilities Status' : 'Official Monitoring'}
            </span>
          </button>
        </div>

        {outage.criticalFacilitiesNearby && outage.criticalFacilitiesNearby.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {outage.criticalFacilitiesNearby.map((facility) => (
              <div
                key={facility.id}
                className="bg-[#f8f9fb] p-3.5 rounded-xl border border-[#c2c6d3] flex items-start justify-between gap-2"
              >
                <div>
                  <h4 className="text-xs font-bold text-[#191c1e]">{facility.name}</h4>
                  <p className="text-[11px] text-[#737782]">{facility.type}</p>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md whitespace-nowrap ${
                    facility.backupPowerStatus === 'Generator Active'
                      ? 'bg-amber-100 text-amber-800'
                      : facility.backupPowerStatus === 'Running Low on Fuel'
                      ? 'bg-[#ffdad6] text-[#93000d]'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {facility.backupPowerStatus}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-[#f8f9fb] rounded-xl text-xs text-[#737782] flex items-center justify-between">
            <span>No critical facilities logged in this zone yet.</span>
            {canManageOfficialAndCritical && (
              <button
                onClick={handleCriticalFacilityClick}
                className="text-xs text-[#004a98] font-bold underline"
              >
                + Register Facility
              </button>
            )}
          </div>
        )}
      </section>

      {/* Official Updates Section (Verified Provider & LGU) */}
      <section className="bg-white rounded-2xl shadow-xs border-l-4 border-[#00346e] border-y border-r border-[#c2c6d3] p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#d7e3ff] rounded-full flex items-center justify-center text-[#00346e]">
              <span className="material-symbols-outlined text-[24px] icon-fill">
                verified_user
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#191c1e]">
                Verified Electric Utility & LGU Response
              </h3>
              <p className="text-xs text-[#737782]">
                Official dispatch and restoration timeline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-[#d7e3ff] text-[#001b3f] px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider">
              Official
            </span>

            {/* Post Official Dispatch Log CTA */}
            <button
              onClick={handleOfficialUpdateClick}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors ${
                canManageOfficialAndCritical
                  ? 'bg-[#004a98] hover:bg-[#00346e] text-white border-[#00346e] shadow-2xs'
                  : 'bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#424751] border-[#c2c6d3]'
              }`}
              title="Utility Providers & LGU Officers can post official updates"
            >
              <span className="material-symbols-outlined text-[16px]">
                {canManageOfficialAndCritical ? 'post_add' : 'lock'}
              </span>
              <span>
                {canManageOfficialAndCritical ? '+ Post Dispatch Log' : 'Official Log'}
              </span>
            </button>
          </div>
        </div>

        {officialUpdates.length === 0 ? (
          <div className="p-4 bg-[#f2f4f6] rounded-xl text-xs text-[#737782] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Awaiting official restoration dispatch log from electric provider or LGU.</span>
            {canManageOfficialAndCritical && (
              <button
                onClick={handleOfficialUpdateClick}
                className="text-xs text-[#004a98] font-bold hover:underline"
              >
                + Post Initial Dispatch Log
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {officialUpdates.map((update) => (
              <div
                key={update.id}
                className="bg-[#f8f9fb] p-4 rounded-xl border border-[#c2c6d3]/60 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#00346e] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">
                      verified
                    </span>
                    <span>{update.organization}</span>
                  </span>
                  <span className="text-[11px] text-[#737782]">
                    {new Date(update.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#191c1e] leading-relaxed">
                  {update.message}
                </p>
                {update.actionTaken && (
                  <p className="text-[11px] text-[#424751] font-medium mt-1 bg-white p-2 rounded-lg border border-[#e0e3e5]">
                    <strong>Action:</strong> {update.actionTaken}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Community Impact & Updates Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#c2c6d3] pb-3">
          <div>
            <h3 className="text-lg font-bold text-[#191c1e]">
              Community Impact Updates ({communityUpdates.length})
            </h3>
            <p className="text-xs text-[#737782]">
              Real-world observations from affected local residents
            </p>
          </div>

          <button
            onClick={() => setShowAddUpdateModal(true)}
            className="bg-[#004a98] hover:bg-[#00346e] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px]">add_comment</span>
            <span>Add Update</span>
          </button>
        </div>

        {communityUpdates.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-[#c2c6d3] text-center text-xs text-[#737782]">
            No community comments yet. Be the first neighbor to post a situation update!
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {communityUpdates.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl shadow-2xs border border-[#c2c6d3]/80 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#e6e8ea] flex items-center justify-center text-[#424751]">
                      <span className="material-symbols-outlined text-[18px]">person</span>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-[#191c1e]">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-[#737782] ml-2">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Impact Tag Badge */}
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#eceef0] text-[#424751] border border-[#c2c6d3] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      {item.impactTag === 'Home'
                        ? 'home'
                        : item.impactTag === 'Business'
                        ? 'storefront'
                        : item.impactTag === 'Hospital'
                        ? 'local_hospital'
                        : item.impactTag === 'School'
                        ? 'school'
                        : 'category'}
                    </span>
                    <span>{item.impactTag}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#191c1e] pl-10 leading-relaxed">
                  {item.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Flag Report Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#c2c6d3] animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#e0e3e5] mb-4">
              <h3 className="text-base font-bold text-[#191c1e]">Flag Report as Not Accurate</h3>
              <button
                onClick={() => setShowFlagModal(false)}
                className="text-[#737782] hover:text-[#191c1e]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {flagSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-center text-xs font-semibold">
                Thank you. Your flag and reason have been forwarded to the Verification Team for review.
              </div>
            ) : (
              <form onSubmit={handleFlagSubmit} className="flex flex-col gap-3">
                <p className="text-xs text-[#737782]">
                  Please state why you believe this outage report is inaccurate or already restored:
                </p>
                <textarea
                  required
                  rows={3}
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="e.g. Power has already been restored on our block since 2:00 PM..."
                  className="w-full p-3 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs text-[#191c1e] focus:ring-2 focus:ring-[#004a98]"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowFlagModal(false)}
                    className="px-4 py-2 text-xs font-bold text-[#424751] hover:bg-[#eceef0] rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-[#ba1a1a] text-white hover:bg-[#93000a] rounded-lg"
                  >
                    Submit Flag
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Status Transition & Case Resolution Modal Dialog */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#c2c6d3] animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-[#e0e3e5] mb-5">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                    selectedNewStatus === 'Restored'
                      ? 'bg-emerald-600'
                      : selectedNewStatus === 'Repairing'
                      ? 'bg-rose-600'
                      : selectedNewStatus === 'Restoring'
                      ? 'bg-blue-600'
                      : 'bg-amber-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {selectedNewStatus === 'Restored'
                      ? 'task_alt'
                      : selectedNewStatus === 'Repairing'
                      ? 'build'
                      : selectedNewStatus === 'Restoring'
                      ? 'bolt'
                      : 'search'}
                  </span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#191c1e]">
                    {selectedNewStatus === 'Restored'
                      ? 'Resolve Case & Confirm Restoration'
                      : selectedNewStatus === 'Repairing'
                      ? 'Update Status to "Fixing" (Repairing)'
                      : `Update Status to "${selectedNewStatus}"`}
                  </h3>
                  <span className="text-xs text-[#737782]">
                    Barangay {outage.barangay}, {outage.cityMunicipality}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1.5 text-[#737782] hover:text-[#191c1e] rounded-full hover:bg-gray-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmStatusChange} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[#424751] uppercase tracking-wider block mb-1.5">
                  Select Target Lifecycle Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNewStatus('Repairing');
                      setStatusUpdateNote('Line crews arrived on-site. Replacement of hardware and transformer servicing underway.');
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      selectedNewStatus === 'Repairing'
                        ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold ring-2 ring-rose-400/40'
                        : 'bg-[#f8f9fb] border-[#c2c6d3] text-[#424751] hover:bg-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px] text-rose-600">build</span>
                    <div>
                      <p className="text-xs font-bold leading-tight">Fixing (Repairing)</p>
                      <span className="text-[10px] text-[#737782]">Crews active</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNewStatus('Restoring');
                      setStatusUpdateNote('Substation circuit breakers closed. Power gradually returning to sectors.');
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      selectedNewStatus === 'Restoring'
                        ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold ring-2 ring-blue-400/40'
                        : 'bg-[#f8f9fb] border-[#c2c6d3] text-[#424751] hover:bg-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px] text-blue-600">bolt</span>
                    <div>
                      <p className="text-xs font-bold leading-tight">Restoring</p>
                      <span className="text-[10px] text-[#737782]">Re-energizing</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNewStatus('Restored');
                      setStatusUpdateNote('All primary feeders re-energized. Voltage levels stabilized across all affected barangay sectors.');
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      selectedNewStatus === 'Restored'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-400/40'
                        : 'bg-[#f8f9fb] border-[#c2c6d3] text-[#424751] hover:bg-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px] text-emerald-600">task_alt</span>
                    <div>
                      <p className="text-xs font-bold leading-tight">Resolved (Restored)</p>
                      <span className="text-[10px] text-[#737782]">100% Restored</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNewStatus('Investigating');
                      setStatusUpdateNote('Technical dispatch team performing initial field inspection.');
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      selectedNewStatus === 'Investigating'
                        ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-2 ring-amber-400/40'
                        : 'bg-[#f8f9fb] border-[#c2c6d3] text-[#424751] hover:bg-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px] text-amber-600">search</span>
                    <div>
                      <p className="text-xs font-bold leading-tight">Investigating</p>
                      <span className="text-[10px] text-[#737782]">Triage / Assessment</span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#424751] uppercase tracking-wider block mb-1.5">
                  Official Dispatch Bulletin / Public Technical Note
                </label>
                <textarea
                  rows={3}
                  value={statusUpdateNote}
                  onChange={(e) => setStatusUpdateNote(e.target.value)}
                  placeholder="Provide technical progress details for citizen and LGU feeds..."
                  className="w-full p-3 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs sm:text-sm text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none"
                />
              </div>

              <div className="bg-[#f2f4f6] p-3 rounded-xl text-[11px] text-[#5b6068] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#00346e]">verified</span>
                <span>
                  Will be recorded under authorized officer: <strong>{currentUser.name}</strong> ({currentUser.role.replace('_', ' ')})
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-[#e0e3e5]">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-[#424751] hover:bg-[#eceef0] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all active:scale-98 ${
                    selectedNewStatus === 'Restored'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : selectedNewStatus === 'Repairing'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : selectedNewStatus === 'Restoring'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {selectedNewStatus === 'Restored'
                    ? 'Confirm & Resolve Case'
                    : `Update to ${selectedNewStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal Dialog */}
      {showShareModal && (
        <ShareModal outage={outage} onClose={() => setShowShareModal(false)} />
      )}

      {/* Add Community Update Modal Form */}
      {showAddUpdateModal && (
        <AddCommunityUpdateModal
          outageId={outage.id}
          currentUser={currentUser}
          onClose={() => setShowAddUpdateModal(false)}
          onSuccess={() => {
            setShowAddUpdateModal(false);
            loadData();
          }}
        />
      )}

      {/* Add Official Dispatch Log Modal (Utility & LGU Privilege) */}
      {showOfficialUpdateModal && (
        <AddOfficialUpdateModal
          isOpen={showOfficialUpdateModal}
          outageId={outage.id}
          currentUser={currentUser}
          onClose={() => setShowOfficialUpdateModal(false)}
          onUpdateAdded={() => {
            loadData();
          }}
        />
      )}

      {/* Manage Critical Facilities Modal (Utility & LGU Privilege) */}
      {showCriticalFacilityModal && (
        <ManageCriticalFacilitiesModal
          isOpen={showCriticalFacilityModal}
          outageId={outage.id}
          facilities={outage.criticalFacilitiesNearby || []}
          currentUser={currentUser}
          onClose={() => setShowCriticalFacilityModal(false)}
          onUpdated={() => {
            loadData();
          }}
        />
      )}

      {/* Delete Outage / Report Confirmation Modal (Admin only) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-red-200 animate-slide-up">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">delete_forever</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#191c1e]">Delete Outage / Report?</h3>
                <p className="text-xs text-[#737782]">Incident Record #{outage.id.slice(-8)}</p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200 mb-5 text-xs text-red-950 space-y-1.5">
              <p>
                <strong>Warning:</strong> You are about to permanently delete this outage incident from <strong>{outage.barangay}, {outage.cityMunicipality}</strong>.
              </p>
              <p className="text-red-800">
                This will delete the outage and associated reports, dispatch logs, and community updates from local storage and the synchronized Firestore database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#191c1e] text-xs font-bold rounded-xl border border-[#c2c6d3] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-98 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isDeleting ? 'sync' : 'delete'}
                </span>
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete Record'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal for Unauthenticated / Citizen attempting privileged actions */}
      <AuthModal
        isOpen={showAuthModal}
        currentUser={currentUser}
        onClose={() => setShowAuthModal(false)}
        actionContext={authModalContext}
        onUserChange={(user) => {
          setShowAuthModal(false);
          loadData();
        }}
      />
    </main>
  );
};
