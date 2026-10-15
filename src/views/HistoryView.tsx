import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { HistoricalIncident, User } from '../types';
import { storageService } from '../services/storageService';
import { firestoreService } from '../services/firestoreService';

interface HistoryViewProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

type TabFilter = 'all' | 'reports' | 'restored' | 'active';

export const HistoryView: React.FC<HistoryViewProps> = ({
  currentUser,
  onNavigate
}) => {
  const [incidents, setIncidents] = useState<HistoricalIncident[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('ALL');
  const [selectedIncident, setSelectedIncident] = useState<HistoricalIncident | null>(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

  // Admin delete states
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showDeleteSingleModal, setShowDeleteSingleModal] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<HistoricalIncident | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    setIncidents(storageService.getHistoricalIncidents());
  };

  useEffect(() => {
    loadData();
    const unsub = storageService.subscribe(loadData);
    return unsub;
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleConfirmClearAll = async () => {
    const count = storageService.clearAllHistoricalIncidents();
    firestoreService.clearAllHistoricalIncidents().catch(() => {});
    loadData();
    setShowClearAllModal(false);
    setSelectedIncident(null);
    triggerToast(`Successfully deleted all ${count} outage cases and records from history.`);
  };

  const handleConfirmDeleteSingle = async () => {
    if (!incidentToDelete) return;
    const targetId = incidentToDelete.id;
    storageService.deleteHistoricalIncident(targetId);
    firestoreService.deleteHistoricalIncident(targetId).catch(() => {});
    loadData();
    setShowDeleteSingleModal(false);
    if (selectedIncident?.id === targetId) {
      setSelectedIncident(null);
    }
    triggerToast(`Case #${targetId.slice(-8)} successfully deleted from outage history.`);
    setIncidentToDelete(null);
  };

  // Filter based on tab, search, and provider
  const filteredIncidents = incidents.filter((inc) => {
    // 1. Tab filter
    if (activeTab === 'reports' && inc.category !== 'report') return false;
    if (activeTab === 'restored' && inc.category !== 'restored') return false;
    if (activeTab === 'active' && inc.category !== 'active') return false;

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        (inc.id || '').toLowerCase().includes(q) ||
        (inc.barangay || '').toLowerCase().includes(q) ||
        (inc.cityMunicipality || '').toLowerCase().includes(q) ||
        (inc.province || '').toLowerCase().includes(q) ||
        (inc.subdivisionVillage && inc.subdivisionVillage.toLowerCase().includes(q)) ||
        (inc.cause || '').toLowerCase().includes(q) ||
        (inc.reporterName && inc.reporterName.toLowerCase().includes(q)) ||
        (inc.additionalNotes && inc.additionalNotes.toLowerCase().includes(q));

      if (!matches) return false;
    }

    // 3. Provider filter
    if (selectedProvider !== 'ALL') {
      if (!inc.provider.toLowerCase().includes(selectedProvider.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  // Calculate statistics across records
  const totalCount = incidents.length;
  const reportsCount = incidents.filter((i) => i.category === 'report').length;
  const restoredCount = incidents.filter((i) => i.category === 'restored').length;
  const activeCount = incidents.filter((i) => i.category === 'active').length;

  const restoredIncidents = incidents.filter((i) => i.category === 'restored' && typeof i.durationMinutes === 'number');
  const avgDuration =
    restoredIncidents.length > 0
      ? Math.round(
          restoredIncidents.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0) /
            restoredIncidents.length
        )
      : 120;

  const totalPeopleAffected = incidents.reduce((acc, curr) => acc + curr.affectedCount, 0);

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-6 pb-24 md:pb-12 flex flex-col gap-6 animate-fade-in">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00346e] text-[28px]">
              history_edu
            </span>
            <h1 className="text-2xl font-extrabold text-[#191c1e] tracking-tight">
              Outage History & Case Logs
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#737782] mt-1">
            Publicly transparent record of citizen-reported cases, active grid incidents, and verified historical restorations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setShowClearAllModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold shadow-2xs transition-all active:scale-98 cursor-pointer"
              title="Permanently remove all outage cases and historical incident records"
            >
              <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
              <span>Delete All Case History</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('/report')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#004a98] hover:bg-[#00346e] text-white text-xs font-bold shadow-xs transition-all active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Report Power Outage</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#c2c6d3]/80 shadow-2xs">
          <div className="flex items-center justify-between text-[#737782] mb-1">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              Total Logged Records
            </span>
            <span className="material-symbols-outlined text-[18px]">folder</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#00346e]">{totalCount}</p>
          <span className="text-[11px] text-[#737782] mt-1 block">
            Across all regional areas
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#c2c6d3]/80 shadow-2xs">
          <div className="flex items-center justify-between text-[#737782] mb-1">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              Citizen Case Reports
            </span>
            <span className="material-symbols-outlined text-[18px] text-amber-600">assignment</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-700">{reportsCount}</p>
          <span className="text-[11px] text-amber-800 font-medium mt-1 block">
            Crowdsourced submissions
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#c2c6d3]/80 shadow-2xs">
          <div className="flex items-center justify-between text-[#737782] mb-1">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              Restored & Verified
            </span>
            <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{restoredCount}</p>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            100% Post-incident Verified
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#c2c6d3]/80 shadow-2xs">
          <div className="flex items-center justify-between text-[#737782] mb-1">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              Avg. Restoration Time
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#004a98]">timer</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
            {Math.floor(avgDuration / 60)}h {avgDuration % 60}m
          </p>
          <span className="text-[11px] text-[#737782] mt-1 block">
            Average across grid feeders
          </span>
        </div>
      </div>

      {/* Category Segmented Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#eceef0] rounded-2xl border border-[#c2c6d3]/70 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'all'
              ? 'bg-white text-[#00346e] shadow-2xs'
              : 'text-[#424751] hover:text-[#191c1e] hover:bg-white/50'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">layers</span>
          <span>All Records & Cases</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#d7e3ff] text-[#00346e]">
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-white text-amber-900 shadow-2xs'
              : 'text-[#424751] hover:text-[#191c1e] hover:bg-white/50'
          }`}
        >
          <span className="material-symbols-outlined text-[17px] text-amber-600">campaign</span>
          <span>Citizen Case Reports</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900">
            {reportsCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('restored')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'restored'
              ? 'bg-white text-emerald-900 shadow-2xs'
              : 'text-[#424751] hover:text-[#191c1e] hover:bg-white/50'
          }`}
        >
          <span className="material-symbols-outlined text-[17px] text-emerald-600">check_circle</span>
          <span>Restored & Resolved</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-900">
            {restoredCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'active'
              ? 'bg-white text-rose-900 shadow-2xs'
              : 'text-[#424751] hover:text-[#191c1e] hover:bg-white/50'
          }`}
        >
          <span className="material-symbols-outlined text-[17px] text-rose-600">warning</span>
          <span>Active / In Progress</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-900">
            {activeCount}
          </span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#c2c6d3] shadow-2xs flex flex-col sm:flex-row gap-3 items-center">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737782] text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Case ID, Barangay, City, Cause, or Reporter..."
            className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#191c1e] placeholder-[#737782] focus:ring-2 focus:ring-[#004a98] outline-none"
          />
        </div>

        {/* Utility Provider Filter */}
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl px-4 py-2.5 text-xs font-medium text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none w-full sm:w-auto"
        >
          <option value="ALL">All Utility Providers</option>
          <option value="Davao Light">Davao Light and Power Co. (DLPC)</option>
          <option value="Meralco">Meralco (Metro Manila)</option>
          <option value="VECO">VECO (Visayan Electric)</option>
          <option value="MORE Power">MORE Power (Iloilo)</option>
          <option value="CEPALCO">CEPALCO (Cagayan de Oro)</option>
        </select>
      </div>

      {/* Incidents Records Table / Card List */}
      <div className="bg-white rounded-2xl border border-[#c2c6d3] shadow-2xs overflow-hidden">
        <div className="p-4 bg-[#f8f9fb] border-b border-[#e0e3e5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-[#424751] uppercase tracking-wider">
              {activeTab === 'all'
                ? 'All Outage Incident Logs & Case Reports'
                : activeTab === 'reports'
                ? 'Citizen-Reported Cases'
                : activeTab === 'restored'
                ? 'Restored Historical Incidents'
                : 'Active Grid Interruptions'}
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#d7e3ff] text-[#00346e]">
              {filteredIncidents.length}
            </span>
          </div>
          <span className="text-xs text-[#737782] hidden sm:inline">Click any record for full case dossier</span>
        </div>

        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-[#737782]">
            <div className="w-12 h-12 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#737782]">
              <span className="material-symbols-outlined text-[26px]">search_off</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#191c1e]">
              No outage records match your criteria.
            </p>
            <p className="text-xs text-[#737782] max-w-sm">
              Try adjusting your search query, selecting another category tab, or submit a new case report.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedProvider('ALL');
                setActiveTab('all');
              }}
              className="mt-2 text-xs font-bold text-[#004a98] hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#e0e3e5]">
            {filteredIncidents.map((incident) => {
              const isReport = incident.category === 'report';
              const isRestored = incident.category === 'restored';
              const isActive = incident.category === 'active';

              return (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className="p-4 sm:p-5 hover:bg-[#f2f4f6] transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5 w-full sm:w-auto flex-1">
                    {/* Icon Badge */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform ${
                        isRestored
                          ? 'bg-emerald-100 text-emerald-700'
                          : isReport
                          ? incident.status === 'Verified'
                            ? 'bg-blue-100 text-blue-700'
                            : incident.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px] icon-fill">
                        {isRestored
                          ? 'check_circle'
                          : isReport
                          ? 'campaign'
                          : 'warning'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Location & Tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-[#191c1e] group-hover:text-[#00346e] truncate">
                          {incident.barangay}, {incident.cityMunicipality}
                        </h3>

                        {incident.subdivisionVillage && (
                          <span className="text-[10px] text-[#737782] font-medium hidden md:inline">
                            • {incident.subdivisionVillage}
                          </span>
                        )}

                        {/* Category & Status Badges */}
                        {isReport && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                            Citizen Report
                          </span>
                        )}

                        {isReport && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              incident.status === 'Verified' || incident.verificationStatus === 'verified'
                                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                : incident.status === 'Rejected' || incident.verificationStatus === 'rejected'
                                ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                : 'bg-yellow-100 text-yellow-900 border border-yellow-200'
                            }`}
                          >
                            {incident.status === 'Verified' || incident.verificationStatus === 'verified'
                              ? 'Verified'
                              : incident.status === 'Rejected' || incident.verificationStatus === 'rejected'
                              ? 'Rejected'
                              : 'Pending Verification'}
                          </span>
                        )}

                        {isRestored && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                            Restored
                          </span>
                        )}

                        {isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-900">
                            {incident.status || 'Active'}
                          </span>
                        )}

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#d7e3ff] text-[#00346e]">
                          {incident.provider}
                        </span>

                        {incident.attachments && incident.attachments.length > 0 && (
                          <span className="text-[10px] font-medium text-[#737782] flex items-center gap-0.5 bg-gray-100 px-1.5 py-0.5 rounded">
                            <span className="material-symbols-outlined text-[13px]">image</span>
                            <span>{incident.attachments.length} Photo</span>
                          </span>
                        )}
                      </div>

                      {/* Cause & Notes */}
                      <p className="text-xs text-[#424751] mt-1 line-clamp-1">
                        Cause: <strong className="font-semibold text-[#191c1e]">{incident.cause}</strong>
                        {incident.additionalNotes && (
                          <span className="text-[#737782] font-normal ml-1">
                            — "{incident.additionalNotes}"
                          </span>
                        )}
                      </p>

                      {/* Metadata Timestamp & Reporter */}
                      <div className="text-[11px] text-[#737782] mt-1 flex flex-wrap items-center gap-2">
                        <span>Case #{incident.id.slice(0, 18)}</span>
                        <span>•</span>
                        <span>Occurred: {new Date(incident.startedAt).toLocaleString()}</span>

                        {incident.disputed && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-amber-700">warning</span>
                              <span>A community member flagged this as inaccurate</span>
                            </span>
                          </>
                        )}

                        {incident.resolvedAt && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-medium">
                              Restored: {new Date(incident.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}

                        {incident.reporterName && (
                          <>
                            <span>•</span>
                            <span className="text-[#424751]">Reported by {incident.reporterName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Duration or Impacted */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e0e3e5]">
                    {isRestored && typeof incident.durationMinutes === 'number' ? (
                      <span className="text-xs font-bold text-[#00346e] bg-[#eceef0] px-3 py-1 rounded-lg">
                        Duration: {Math.floor(incident.durationMinutes / 60)}h {incident.durationMinutes % 60}m
                      </span>
                    ) : isActive ? (
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg">
                        Active Outage
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-lg ${
                          incident.status === 'Verified' || incident.verificationStatus === 'verified'
                            ? 'text-blue-800 bg-blue-50 border border-blue-200'
                            : incident.status === 'Rejected' || incident.verificationStatus === 'rejected'
                            ? 'text-rose-800 bg-rose-50 border border-rose-200'
                            : 'text-amber-800 bg-amber-50 border border-amber-200'
                        }`}
                      >
                        {incident.status === 'Verified' || incident.verificationStatus === 'verified'
                          ? 'Case Verified'
                          : incident.status === 'Rejected' || incident.verificationStatus === 'rejected'
                          ? 'Rejected'
                          : 'In Review'}
                      </span>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-[#737782] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">group</span>
                        <span>{incident.affectedCount} {incident.affectedCount === 1 ? 'confirmation' : 'impacted'}</span>
                      </span>

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIncidentToDelete(incident);
                            setShowDeleteSingleModal(true);
                          }}
                          className="p-1.5 rounded-lg text-red-600 hover:text-white hover:bg-red-600 border border-red-200 transition-all cursor-pointer shadow-2xs"
                          title="Admin: Permanently delete this case record"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Case Info Dossier Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#c2c6d3] max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Modal Top Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#e0e3e5] mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00346e]">folder_open</span>
                <div>
                  <h3 className="text-lg font-bold text-[#191c1e]">Case Dossier #{selectedIncident.id}</h3>
                  <span className="text-[10px] text-[#737782]">Official Outage Record Archive</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 text-[#737782] hover:text-[#191c1e] rounded-full hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs sm:text-sm">
              {/* Inaccurate Flag Warning Banner */}
              {selectedIncident.disputed && (
                <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-2xl flex items-start gap-3 text-amber-950 shadow-xs animate-fade-in">
                  <div className="w-8 h-8 rounded-lg bg-amber-200/90 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">warning</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-extrabold text-amber-950">
                        A community member flagged this as inaccurate
                      </h4>
                      {(currentUser.role === 'admin' ||
                        currentUser.role === 'verification_team' ||
                        currentUser.role === 'utility_provider' ||
                        currentUser.role === 'lgu') && (
                        <button
                          onClick={() => {
                            const targetId = selectedIncident.outageId || selectedIncident.id;
                            storageService.clearDispute(targetId);
                            firestoreService.clearDispute(targetId).catch(() => {});
                            loadData();
                            setSelectedIncident((prev) =>
                              prev ? { ...prev, disputed: false, disputeReason: undefined } : null
                            );
                          }}
                          className="text-[11px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                          <span>Clear Flag</span>
                        </button>
                      )}
                    </div>
                    {selectedIncident.disputeReason && (
                      <p className="text-xs text-amber-900 italic mt-1.5 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                        &ldquo;{selectedIncident.disputeReason}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Location & Provider Banner */}
              <div className="bg-[#f2f4f6] p-4 rounded-xl border border-[#c2c6d3]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase text-[#737782] tracking-wider block">
                    Location & Grid Feeder
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#d7e3ff] text-[#00346e]">
                    {selectedIncident.provider}
                  </span>
                </div>
                <p className="text-base font-bold text-[#191c1e]">
                  {selectedIncident.barangay}, {selectedIncident.cityMunicipality}
                </p>
                <p className="text-xs text-[#424751]">
                  {selectedIncident.province} {selectedIncident.subdivisionVillage && `• ${selectedIncident.subdivisionVillage}`}
                </p>
              </div>

              {/* Status & Timing Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f8f9fb] p-3 rounded-xl border border-[#e0e3e5]">
                  <span className="text-[10px] font-bold text-[#737782] uppercase block">Occurred / Reported</span>
                  <span className="font-semibold text-[#191c1e] text-xs">
                    {new Date(selectedIncident.startedAt).toLocaleString()}
                  </span>
                </div>

                <div className="bg-[#f8f9fb] p-3 rounded-xl border border-[#e0e3e5]">
                  <span className="text-[10px] font-bold text-[#737782] uppercase block">Resolution Status</span>
                  {selectedIncident.resolvedAt || selectedIncident.status === 'Restored' || selectedIncident.category === 'restored' ? (
                    <span className="font-semibold text-emerald-700 text-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">check_circle</span>
                      <span>
                        Restored {selectedIncident.resolvedAt ? `(${new Date(selectedIncident.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}
                      </span>
                    </span>
                  ) : selectedIncident.verificationStatus === 'rejected' || selectedIncident.status === 'Rejected' ? (
                    <span className="font-semibold text-rose-700 text-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">cancel</span>
                      <span>Rejected / Invalid Report</span>
                    </span>
                  ) : selectedIncident.verificationStatus === 'verified' || selectedIncident.status === 'Verified' || selectedIncident.status === 'Repairing' || selectedIncident.status === 'Investigating' || selectedIncident.status === 'Restoring' ? (
                    <span className="font-semibold text-blue-700 text-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">verified</span>
                      <span>
                        {selectedIncident.status === 'Repairing'
                          ? 'Verified • Crew Repairing'
                          : selectedIncident.status === 'Investigating'
                          ? 'Verified • Under Investigation'
                          : selectedIncident.status === 'Restoring'
                          ? 'Verified • Restoring Feeders'
                          : 'Verified Incident (Active)'}
                      </span>
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-700 text-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">pending</span>
                      <span>Pending Verification</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Cause Analysis */}
              <div className="bg-[#f8f9fb] p-3.5 rounded-xl border border-[#e0e3e5]">
                <span className="text-[10px] font-bold text-[#737782] uppercase block mb-1">
                  Root Cause / Reported Interruption
                </span>
                <p className="font-semibold text-[#191c1e] leading-relaxed">
                  {selectedIncident.cause}
                </p>
                {selectedIncident.additionalNotes && (
                  <p className="text-xs text-[#5b6068] mt-1.5 italic bg-white p-2.5 rounded-lg border border-[#e0e3e5]">
                    "{selectedIncident.additionalNotes}"
                  </p>
                )}
              </div>

              {/* Citizen Reporter Info (if applicable) */}
              {selectedIncident.reporterName && (
                <div className="bg-[#f8f9fb] p-3 rounded-xl border border-[#e0e3e5] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#737782] uppercase block">Reported By</span>
                    <span className="font-semibold text-[#191c1e]">{selectedIncident.reporterName}</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    Contact Confidential & Protected
                  </span>
                </div>
              )}

              {/* Attached Photos (if any) */}
              {selectedIncident.attachments && selectedIncident.attachments.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-[#191c1e] uppercase tracking-wider block mb-2">
                    Evidence Photos ({selectedIncident.attachments.length})
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selectedIncident.attachments.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt="Outage report evidence"
                        onClick={() => setEnlargedPhoto(photo)}
                        className="w-20 h-20 object-cover rounded-xl border border-[#c2c6d3] cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Milestones */}
              <div>
                <span className="text-xs font-bold text-[#191c1e] uppercase tracking-wider block mb-2">
                  Incident Lifecycle Log
                </span>
                <div className="flex flex-col gap-2.5 border-l-2 border-[#004a98] ml-2 pl-4">
                  <div>
                    <span className="text-[11px] font-bold text-[#00346e]">
                      1. Case Logged in Central System
                    </span>
                    <p className="text-xs text-[#737782]">
                      Incident registered at {new Date(selectedIncident.startedAt).toLocaleString()}.
                    </p>
                  </div>

                  <div>
                    <span
                      className={`text-[11px] font-bold ${
                        selectedIncident.verificationStatus === 'verified' || selectedIncident.category === 'restored'
                          ? 'text-emerald-700'
                          : 'text-[#737782]'
                      }`}
                    >
                      2. Public Corroboration & Verification
                    </span>
                    <p className="text-xs text-[#737782]">
                      {selectedIncident.verificationStatus === 'verified' || selectedIncident.category === 'restored'
                        ? 'Corroborated by community reports and verified by monitoring team.'
                        : 'Currently queued for verification team review.'}
                    </p>
                  </div>

                  <div>
                    <span
                      className={`text-[11px] font-bold ${
                        selectedIncident.resolvedAt ? 'text-emerald-700' : 'text-[#737782]'
                      }`}
                    >
                      3. Feeder Energization & Restoration
                    </span>
                    <p className="text-xs text-[#737782]">
                      {selectedIncident.resolvedAt
                        ? `Power successfully restored on ${new Date(selectedIncident.resolvedAt).toLocaleString()}.`
                        : 'Resolution in progress by local utility line crews.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-2">
              {/* Quick Status / Resolve Actions for LGU, Utility Provider, Verification Team, Admin */}
              {(currentUser.role === 'utility_provider' ||
                currentUser.role === 'lgu' ||
                currentUser.role === 'verification_team' ||
                currentUser.role === 'admin') &&
                selectedIncident.outageId &&
                selectedIncident.category !== 'restored' && (
                  <>
                    <button
                      onClick={() => {
                        const oId = selectedIncident.outageId!;
                        const org = currentUser.organization || (currentUser.role === 'lgu' ? 'LGU Emergency Ops' : selectedIncident.provider);
                        storageService.updateOutageStatus(
                          oId,
                          'Repairing',
                          undefined,
                          `Marked as Fixing & In Progress by ${currentUser.name} (${currentUser.role})`,
                          org,
                          currentUser.name
                        );
                        loadData();
                        setSelectedIncident((prev) =>
                          prev ? { ...prev, status: 'Repairing' } : null
                        );
                      }}
                      className="py-2.5 px-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">build</span>
                      <span>Update to "Fixing"</span>
                    </button>

                    <button
                      onClick={() => {
                        const oId = selectedIncident.outageId!;
                        const org = currentUser.organization || (currentUser.role === 'lgu' ? 'LGU Emergency Ops' : selectedIncident.provider);
                        storageService.updateOutageStatus(
                          oId,
                          'Restored',
                          undefined,
                          `Case Resolved: Power 100% restored by ${currentUser.name} (${currentUser.role})`,
                          org,
                          currentUser.name
                        );
                        try {
                          confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
                        } catch {}
                        loadData();
                        setSelectedIncident((prev) =>
                          prev
                            ? {
                                ...prev,
                                status: 'Restored',
                                category: 'restored',
                                resolvedAt: new Date().toISOString()
                              }
                            : null
                        );
                      }}
                      className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">task_alt</span>
                      <span>Resolve Case (Restored)</span>
                    </button>
                  </>
                )}

              {selectedIncident.outageId && (
                <button
                  onClick={() => {
                    const oId = selectedIncident.outageId;
                    setSelectedIncident(null);
                    onNavigate('/outage/' + oId);
                  }}
                  className="flex-1 py-2.5 px-4 bg-[#004a98] hover:bg-[#00346e] text-white font-bold text-xs rounded-xl shadow-xs transition-colors text-center flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>View Full Details</span>
                </button>
              )}

              {(currentUser.role === 'admin' ||
                currentUser.role === 'verification_team' ||
                currentUser.role === 'utility_provider' ||
                currentUser.role === 'lgu') &&
                selectedIncident.category === 'report' && (
                  <button
                    onClick={() => {
                      setSelectedIncident(null);
                      onNavigate('/verification');
                    }}
                    className="flex-1 py-2.5 px-4 bg-purple-100 hover:bg-purple-200 text-purple-950 font-bold text-xs rounded-xl transition-colors text-center flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">fact_check</span>
                    <span>Review in Dispatch Queue</span>
                  </button>
                )}

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => {
                    const inc = selectedIncident;
                    setSelectedIncident(null);
                    setIncidentToDelete(inc);
                    setShowDeleteSingleModal(true);
                  }}
                  className="py-2.5 px-3.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>Delete Case</span>
                </button>
              )}

              <button
                onClick={() => setSelectedIncident(null)}
                className="py-2.5 px-5 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#191c1e] font-bold text-xs rounded-xl border border-[#c2c6d3] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Single Case */}
      {showDeleteSingleModal && incidentToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 animate-slide-up">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">delete_forever</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#191c1e]">Delete Case Record?</h3>
                <p className="text-xs text-[#737782]">Incident #{incidentToDelete.id.slice(-8)}</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#424751] mb-5 leading-relaxed">
              Are you sure you want to permanently delete this outage case from <strong className="text-[#191c1e]">{incidentToDelete.barangay}, {incidentToDelete.cityMunicipality}</strong>? This action will remove the record from history and synchronize across all devices.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  setShowDeleteSingleModal(false);
                  setIncidentToDelete(null);
                }}
                className="px-4 py-2.5 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#191c1e] text-xs font-bold rounded-xl border border-[#c2c6d3] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteSingle}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete ALL Cases History */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-red-400 animate-slide-up">
            <div className="flex items-center gap-3.5 text-red-600 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[30px]">delete_sweep</span>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#191c1e]">Purge All Outage History?</h3>
                <p className="text-xs text-red-600 font-semibold uppercase tracking-wider">Permanent Admin Action</p>
              </div>
            </div>

            <div className="p-4 bg-red-50 rounded-2xl border border-red-200 mb-5 text-xs text-red-950 leading-relaxed space-y-2">
              <p>
                <strong>Warning:</strong> You are about to permanently delete <strong>{totalCount} outage cases and reports</strong> from the entire history log.
              </p>
              <p className="text-red-800">
                This will wipe all active grid outages, historical restoration records, citizen reports, and community updates from local storage and the synchronized Firestore database.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
              <button
                onClick={() => setShowClearAllModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#191c1e] text-xs font-bold rounded-xl border border-[#c2c6d3] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearAll}
                className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                <span>Confirm Purge All ({totalCount} Cases)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-60 bg-[#191c1e] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-white/10 flex items-center gap-3 animate-slide-up">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Photo Lightbox */}
      {enlargedPhoto && (
        <div
          onClick={() => setEnlargedPhoto(null)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer animate-fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh]">
            <img
              src={enlargedPhoto}
              alt="Enlarged evidence"
              className="rounded-2xl max-h-[85vh] w-auto object-contain shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setEnlargedPhoto(null)}
              className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

