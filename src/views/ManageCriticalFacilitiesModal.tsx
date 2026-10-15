import React, { useState } from 'react';
import { CriticalFacility, User } from '../types';
import { storageService } from '../services/storageService';
import { firestoreService } from '../services/firestoreService';

interface ManageCriticalFacilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  outageId: string;
  facilities: CriticalFacility[];
  currentUser: User;
  onUpdated?: () => void;
}

export const ManageCriticalFacilitiesModal: React.FC<ManageCriticalFacilitiesModalProps> = ({
  isOpen,
  onClose,
  outageId,
  facilities,
  currentUser,
  onUpdated
}) => {
  const [tab, setTab] = useState<'list' | 'add'>('list');
  const [name, setName] = useState('');
  const [type, setType] = useState<CriticalFacility['type']>('Hospital');
  const [status, setStatus] = useState<CriticalFacility['backupPowerStatus']>('Generator Active');
  const [latitude, setLatitude] = useState(8.4822);
  const [longitude, setLongitude] = useState(124.6472);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStatusChange = async (facilityId: string, newStatus: CriticalFacility['backupPowerStatus']) => {
    storageService.updateCriticalFacilityStatus(outageId, facilityId, newStatus);
    const updatedOutage = storageService.getOutageById(outageId);
    if (updatedOutage?.criticalFacilitiesNearby) {
      await firestoreService.updateCriticalFacilities(outageId, updatedOutage.criticalFacilitiesNearby).catch(() => {});
    }
    onUpdated?.();
  };

  const handleAddFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const currentOutage = storageService.getOutageById(outageId);
      const newFacility = storageService.addCriticalFacilityToOutage(outageId, {
        name: name.trim(),
        type,
        latitude,
        longitude,
        backupPowerStatus: status,
        barangay: currentOutage?.barangay || 'Local District'
      });

      const updatedOutage = storageService.getOutageById(outageId);
      if (updatedOutage?.criticalFacilitiesNearby) {
        await firestoreService.updateCriticalFacilities(outageId, updatedOutage.criticalFacilitiesNearby).catch(() => {});
      }

      setName('');
      setTab('list');
      onUpdated?.();
    } catch (err) {
      console.error('Error adding facility:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#c2c6d3] animate-slide-up relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e0e3e5] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">local_hospital</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#191c1e]">
                Critical Infrastructure Monitoring
              </h2>
              <p className="text-[11px] text-[#737782]">
                Utility Provider & LGU Disaster Management Access
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f2f4f6] text-[#737782] hover:text-[#191c1e] hover:bg-[#e0e3e5] flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-[#f2f4f6] p-1 rounded-xl">
          <button
            onClick={() => setTab('list')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              tab === 'list'
                ? 'bg-white text-[#00346e] shadow-2xs'
                : 'text-[#5b6068] hover:text-[#191c1e]'
            }`}
          >
            Manage Existing ({facilities.length})
          </button>
          <button
            onClick={() => setTab('add')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              tab === 'add'
                ? 'bg-white text-[#00346e] shadow-2xs'
                : 'text-[#5b6068] hover:text-[#191c1e]'
            }`}
          >
            + Register New Facility
          </button>
        </div>

        {tab === 'list' ? (
          <div className="flex flex-col gap-3">
            {facilities.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#737782] bg-[#f8f9fb] rounded-2xl border border-dashed border-[#c2c6d3]">
                <p>No critical facilities registered for this outage area yet.</p>
                <button
                  onClick={() => setTab('add')}
                  className="mt-3 px-3 py-1.5 bg-[#004a98] text-white rounded-lg font-bold text-xs"
                >
                  + Add Hospital or Water Station
                </button>
              </div>
            ) : (
              facilities.map((facility) => (
                <div
                  key={facility.id}
                  className="bg-[#f8f9fb] p-3.5 rounded-2xl border border-[#c2c6d3] flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#191c1e]">{facility.name}</h4>
                      <span className="text-[10px] text-[#737782] font-semibold">{facility.type}</span>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
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

                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#e0e3e5] overflow-x-auto">
                    <span className="text-[10px] font-bold text-[#737782] shrink-0">Set Status:</span>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(facility.id, 'Generator Active')}
                      className={`text-[10px] px-2 py-1 rounded-lg border font-semibold ${
                        facility.backupPowerStatus === 'Generator Active'
                          ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                          : 'bg-white border-[#c2c6d3] text-[#424751] hover:bg-[#e0e3e5]'
                      }`}
                    >
                      Generator Active
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(facility.id, 'Running Low on Fuel')}
                      className={`text-[10px] px-2 py-1 rounded-lg border font-semibold ${
                        facility.backupPowerStatus === 'Running Low on Fuel'
                          ? 'bg-red-100 border-red-400 text-red-900 font-bold'
                          : 'bg-white border-[#c2c6d3] text-[#424751] hover:bg-[#e0e3e5]'
                      }`}
                    >
                      Low Fuel Alert
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(facility.id, 'No Generator')}
                      className={`text-[10px] px-2 py-1 rounded-lg border font-semibold ${
                        facility.backupPowerStatus === 'No Generator'
                          ? 'bg-red-100 border-red-400 text-red-900 font-bold'
                          : 'bg-white border-[#c2c6d3] text-[#424751] hover:bg-[#e0e3e5]'
                      }`}
                    >
                      No Generator
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <form onSubmit={handleAddFacility} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#424751] mb-1">
                Facility Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs sm:text-sm font-semibold text-[#191c1e] focus:outline-none focus:border-[#004a98] focus:bg-white"
                placeholder="e.g. Northern Mindanao Medical Center (NMMC)"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#424751] mb-1">
                Facility Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CriticalFacility['type'])}
                className="w-full px-3.5 py-2 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs sm:text-sm text-[#191c1e] focus:outline-none focus:border-[#004a98] focus:bg-white"
              >
                <option value="Hospital">Hospital / Trauma Center</option>
                <option value="Dialysis Center">Dialysis Center</option>
                <option value="Water Pumping Station">Water Pumping Station</option>
                <option value="Emergency Services">Emergency Services / Fire Station</option>
                <option value="School">School / Evacuation Center</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#424751] mb-1">
                Initial Backup Power State
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CriticalFacility['backupPowerStatus'])}
                className="w-full px-3.5 py-2 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs sm:text-sm text-[#191c1e] focus:outline-none focus:border-[#004a98] focus:bg-white"
              >
                <option value="Generator Active">Generator Active (Normal Fuel)</option>
                <option value="Running Low on Fuel">Running Low on Fuel (Needs Resupply)</option>
                <option value="No Generator">No Generator (On Battery / Blackout)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e0e3e5]">
              <button
                type="button"
                onClick={() => setTab('list')}
                className="px-4 py-2 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#424751] text-xs font-bold rounded-xl"
              >
                Back to List
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#004a98] hover:bg-[#00346e] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {isSubmitting ? 'Registering...' : 'Register Facility'}
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-end pt-2 border-t border-[#e0e3e5]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#191c1e] text-xs font-bold rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
