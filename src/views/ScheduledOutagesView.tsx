import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Area, User, ScheduledOutage } from '../types';
import { storageService } from '../services/storageService';
import { firestoreService } from '../services/firestoreService';

interface ScheduledOutagesViewProps {
  currentArea: Area | null;
  currentUser: User;
  onNavigate: (route: string) => void;
}

export const ScheduledOutagesView: React.FC<ScheduledOutagesViewProps> = ({
  currentArea,
  currentUser,
  onNavigate
}) => {
  const [scheduled, setScheduled] = useState<ScheduledOutage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Upcoming' | 'In Progress' | 'Completed'>('all');
  const [providerFilter, setProviderFilter] = useState('ALL');

  // Service Provider & Admin actions state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ScheduledOutage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Advisory Form State
  const defaultProvider = currentUser.organization || (currentArea?.utilityProvider || 'Davao Light and Power Company (DLPC)');
  const [formProvider, setFormProvider] = useState(defaultProvider);
  const [formAreaName, setFormAreaName] = useState(
    currentArea ? `${currentArea.barangay}, ${currentArea.cityMunicipality}` : 'All Philippine Regions'
  );
  const [formAffectedBarangays, setFormAffectedBarangays] = useState(currentArea?.barangay || 'Multiple Barangays');
  const [formReason, setFormReason] = useState('Preventive Substation Maintenance and Primary Line Reconductoring');
  const [formStartAt, setFormStartAt] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [formEndAt, setFormEndAt] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [formStatus, setFormStatus] = useState<'Upcoming' | 'In Progress' | 'Completed'>('Upcoming');

  const isServiceProvider =
    currentUser.role === 'utility_provider' ||
    currentUser.role === 'admin' ||
    (currentUser.role as string) === 'service_provider';

  const loadData = () => {
    setScheduled(storageService.getScheduledOutages());
  };

  useEffect(() => {
    loadData();
    const unsub = storageService.subscribe(loadData);
    return unsub;
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAreaName.trim() || !formReason.trim()) return;

    setIsProcessing(true);
    const affectedList = formAffectedBarangays
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);

    if (affectedList.length === 0) {
      affectedList.push(formAreaName.split(',')[0].trim());
    }

    const newAdvisory: ScheduledOutage = {
      id: `sched-${Date.now()}`,
      areaId: currentArea.id,
      areaName: formAreaName.trim(),
      provider: formProvider.trim(),
      reason: formReason.trim(),
      startAt: new Date(formStartAt).toISOString(),
      endAt: new Date(formEndAt).toISOString(),
      status: formStatus,
      affectedBarangays: affectedList,
      createdAt: new Date().toISOString()
    };

    storageService.addScheduledOutage(newAdvisory);

    firestoreService.saveScheduledOutage(newAdvisory).catch((err) => {
      console.warn('Could not sync scheduled outage to Firestore:', err);
    });

    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch {}

    loadData();
    setIsProcessing(false);
    setShowAddModal(false);
    triggerToast(`Maintenance advisory successfully posted for ${newAdvisory.areaName}.`);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsProcessing(true);
    const targetId = itemToDelete.id;

    storageService.deleteScheduledOutage(targetId);
    firestoreService.deleteScheduledOutage(targetId).catch((err) => {
      console.warn('Could not delete scheduled outage from Firestore:', err);
    });

    loadData();
    setIsProcessing(false);
    setShowDeleteModal(false);
    triggerToast(`Scheduled maintenance advisory #${targetId.slice(-8)} removed.`);
    setItemToDelete(null);
  };

  // Filtered maintenance list
  const filteredScheduled = scheduled.filter((item) => {
    // 1. Status Filter
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;

    // 2. Provider Filter
    if (providerFilter !== 'ALL' && !item.provider.toLowerCase().includes(providerFilter.toLowerCase())) {
      return false;
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.areaName && item.areaName.toLowerCase().includes(q);
      const matchReason = item.reason && item.reason.toLowerCase().includes(q);
      const matchProvider = item.provider && item.provider.toLowerCase().includes(q);
      const matchBarangay = item.affectedBarangays && item.affectedBarangays.some((b) => b.toLowerCase().includes(q));
      if (!matchName && !matchReason && !matchProvider && !matchBarangay) return false;
    }

    return true;
  });

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 pb-24 md:pb-12 flex flex-col gap-6 animate-fade-in">
      {/* Header Bar & Service Provider Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00346e] text-[28px]">
              event_available
            </span>
            <h1 className="text-2xl font-extrabold text-[#191c1e] tracking-tight">
              Scheduled Power Maintenance Advisories
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#737782] mt-1">
            Official planned grid maintenance advisories, feeder upgrades, and scheduled power interruptions across the Philippines.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isServiceProvider && (
            <button
              onClick={() => {
                setFormProvider(currentUser.organization || currentArea?.utilityProvider || 'Davao Light and Power Company (DLPC)');
                setFormAreaName(currentArea ? `${currentArea.barangay}, ${currentArea.cityMunicipality}` : 'Davao City');
                setFormAffectedBarangays(currentArea?.barangay || 'Multiple Barangays');
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#004a98] hover:bg-[#00346e] text-white text-xs font-bold shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Post Maintenance Advisory</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Badge if Service Provider or Admin */}
      {isServiceProvider && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-[#00346e]">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-[#004a98]">verified_user</span>
            <span>
              Authorized as <strong>{currentUser.name}</strong> ({currentUser.role.replace('_', ' ')})
              {currentUser.organization && ` — ${currentUser.organization}`}
            </span>
          </div>
          <span className="font-bold text-[11px] bg-blue-100 px-2 py-0.5 rounded-md">
            Publish & Remove Privileges Enabled
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#c2c6d3] shadow-2xs flex flex-col sm:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737782] text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Barangay, City, Feeder, Reason, or Utility..."
            className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-[#191c1e] placeholder-[#737782] focus:ring-2 focus:ring-[#004a98] outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-[#f2f4f6] p-1 rounded-xl border border-[#c2c6d3] w-full sm:w-auto overflow-x-auto">
          {(['all', 'Upcoming', 'In Progress', 'Completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-white text-[#00346e] shadow-2xs'
                  : 'text-[#424751] hover:text-[#191c1e]'
              }`}
            >
              {st === 'all' ? 'All Advisories' : st}
            </button>
          ))}
        </div>

        {/* Provider Filter */}
        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl px-3 py-2 text-xs font-medium text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none w-full sm:w-auto cursor-pointer"
        >
          <option value="ALL">All Providers</option>
          <option value="Davao Light">Davao Light (DLPC)</option>
          <option value="Meralco">Meralco</option>
          <option value="VECO">VECO</option>
          <option value="CEPALCO">CEPALCO</option>
          <option value="MORE Power">MORE Power</option>
        </select>
      </div>

      {/* Advisories List */}
      <div className="flex flex-col gap-4">
        {filteredScheduled.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-[#c2c6d3] text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#737782]">
              <span className="material-symbols-outlined text-[26px]">event_busy</span>
            </div>
            <p className="text-sm font-semibold text-[#191c1e]">
              No scheduled maintenance notices match your search criteria.
            </p>
            <p className="text-xs text-[#737782] max-w-sm">
              All distribution lines in this sector are currently operating under normal grid scheduling.
            </p>
            {isServiceProvider && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-2 text-xs font-bold text-[#004a98] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Post a new maintenance advisory</span>
              </button>
            )}
          </div>
        ) : (
          filteredScheduled.map((item) => {
            const isUpcoming = item.status === 'Upcoming';
            const isInProgress = item.status === 'In Progress';
            const isCompleted = item.status === 'Completed';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border-l-4 p-5 shadow-2xs border-y border-r border-[#c2c6d3] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isInProgress
                    ? 'border-l-rose-500'
                    : isCompleted
                    ? 'border-l-emerald-500'
                    : 'border-l-amber-500'
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isInProgress
                        ? 'bg-rose-100 text-rose-700'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[26px]">
                      {isInProgress ? 'build_circle' : isCompleted ? 'task_alt' : 'calendar_clock'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-[#191c1e]">
                        {item.areaName || 'Designated Grid Sector'}
                      </h3>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#d7e3ff] text-[#00346e]">
                        {item.provider}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isInProgress
                            ? 'bg-rose-100 text-rose-800'
                            : isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {item.status || 'Upcoming'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-[#191c1e] mt-1.5 leading-relaxed">
                      {item.reason}
                    </p>

                    {item.affectedBarangays && item.affectedBarangays.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[11px] font-bold text-[#737782]">Affected Sectors:</span>
                        {item.affectedBarangays.map((bg, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium bg-[#f2f4f6] text-[#424751] px-2 py-0.5 rounded-md border border-[#c2c6d3]/60"
                          >
                            {bg}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#737782] mt-2.5">
                      <span className="flex items-center gap-1 font-medium text-[#424751]">
                        <span className="material-symbols-outlined text-[15px] text-[#004a98]">schedule</span>
                        <span>
                          From: <strong>{new Date(item.startAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong>
                        </span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-[#424751]">
                        <span className="material-symbols-outlined text-[15px] text-[#004a98]">update</span>
                        <span>
                          To: <strong>{new Date(item.endAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong>
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Service Provider / Admin Action Controls */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#e0e3e5] w-full md:w-auto justify-end">
                  {isServiceProvider && (
                    <button
                      onClick={() => {
                        setItemToDelete(item);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 rounded-xl text-red-600 hover:text-white hover:bg-red-600 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-98"
                      title="Remove or cancel this scheduled maintenance advisory"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      <span>Remove Advisory</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add Maintenance Report / Advisory */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#c2c6d3] max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-[#e0e3e5] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#004a98] text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[24px]">add_task</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#191c1e]">Post Scheduled Maintenance Report</h3>
                  <p className="text-xs text-[#737782]">Service Provider & Utility Dispatch Advisory</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-[#737782] hover:text-[#191c1e] rounded-full hover:bg-gray-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 text-xs sm:text-sm">
              <div>
                <label className="text-xs font-bold text-[#424751] uppercase tracking-wider block mb-1">
                  Distribution Utility / Electric Cooperative
                </label>
                <input
                  type="text"
                  required
                  value={formProvider}
                  onChange={(e) => setFormProvider(e.target.value)}
                  placeholder="e.g. Davao Light, Meralco, VECO, MORE Power"
                  className="w-full p-3 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs sm:text-sm text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#424751] uppercase tracking-wider block mb-1">
                  Primary Area / Location
                </label>
                <input
                  type="text"
                  required
                  value={formAreaName}
                  onChange={(e) => setFormAreaName(e.target.value)}
                  placeholder="e.g. Barangay 1-A, Davao City"
                  className="w-full p-3 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs sm:text-sm text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#424751] uppercase tracking-wider block mb-1">
                  Affected Barangays / Feeders (comma-separated)
                </label>
                <input
                  type="text"
                  value={formAffectedBarangays}
                  onChange={(e) => setFormAffectedBarangays(e.target.value)}
                  placeholder="e.g. Carmen, Kauswagan, Patag, Zone 1 to Zone 7"
                  className="w-full p-3 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs sm:text-sm text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#424751] uppercase tracking-wider block mb-1">
                  Maintenance Reason & Scope of Work
                </label>
                <textarea
                  rows={3}
                  required
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Describe maintenance scope (e.g. Substation transformer preventive maintenance, line clearing, replacement of aged cross-arms)..."
                  className="w-full p-3 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs sm:text-sm text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#424751] uppercase tracking-wider block mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formStartAt}
                    onChange={(e) => setFormStartAt(e.target.value)}
                    className="w-full p-3 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#424751] uppercase tracking-wider block mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formEndAt}
                    onChange={(e) => setFormEndAt(e.target.value)}
                    className="w-full p-3 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#424751] uppercase tracking-wider block mb-1">
                  Advisory Initial Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Upcoming', 'In Progress', 'Completed'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFormStatus(st)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        formStatus === st
                          ? 'bg-[#004a98] text-white border-[#004a98]'
                          : 'bg-[#f8f9fb] border-[#c2c6d3] text-[#424751] hover:bg-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e0e3e5] mt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#191c1e] text-xs font-bold rounded-xl border border-[#c2c6d3] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-[#004a98] hover:bg-[#00346e] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-98 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">publish</span>
                  <span>{isProcessing ? 'Publishing...' : 'Publish Maintenance Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-red-200 animate-slide-up">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">delete_forever</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#191c1e]">Remove Maintenance Advisory?</h3>
                <p className="text-xs text-[#737782]">ID #{itemToDelete.id.slice(-8)}</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#424751] mb-5 leading-relaxed">
              Are you sure you want to remove the scheduled maintenance advisory for <strong className="text-[#191c1e]">{itemToDelete.areaName}</strong>? This action will remove the notice from public views and synchronize with Firestore.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2.5 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#191c1e] text-xs font-bold rounded-xl border border-[#c2c6d3] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-98 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>{isProcessing ? 'Removing...' : 'Confirm Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-60 bg-[#191c1e] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-white/10 flex items-center gap-3 animate-slide-up">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </main>
  );
};
