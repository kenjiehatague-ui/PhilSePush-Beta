import React, { useState } from 'react';
import { User, OfficialUpdate } from '../types';
import { storageService } from '../services/storageService';
import { firestoreService } from '../services/firestoreService';

interface AddOfficialUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  outageId: string;
  currentUser: User;
  onUpdateAdded?: () => void;
}

export const AddOfficialUpdateModal: React.FC<AddOfficialUpdateModalProps> = ({
  isOpen,
  onClose,
  outageId,
  currentUser,
  onUpdateAdded
}) => {
  const defaultOrg =
    currentUser.organization ||
    (currentUser.role === 'utility_provider'
      ? 'Davao Light and Power Company (DLPC)'
      : currentUser.role === 'lgu'
      ? 'Davao City Disaster Risk Reduction & Management Office (CDRRMO)'
      : 'National Grid & LGU Command Center');

  const [organization, setOrganization] = useState(defaultOrg);
  const [message, setMessage] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please provide an official message or status bulletin.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const orgType: OfficialUpdate['organizationType'] =
        currentUser.role === 'utility_provider' ? 'utility' : currentUser.role === 'lgu' ? 'lgu' : 'agency';

      const updateData: OfficialUpdate = {
        id: `off-${Date.now()}`,
        outageId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        organization: organization.trim() || defaultOrg,
        organizationType: orgType,
        message: message.trim(),
        actionTaken: actionTaken.trim() || undefined,
        createdAt: new Date().toISOString(),
        verified: true
      };

      storageService.addOfficialUpdate(updateData);
      await firestoreService.addOfficialUpdate(updateData).catch(() => {});

      setMessage('');
      setActionTaken('');
      onUpdateAdded?.();
      onClose();
    } catch (err: any) {
      console.error('Error posting official update:', err);
      setError('Failed to post update. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#c2c6d3] animate-slide-up relative flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e0e3e5] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#191c1e]">
                Post Official Dispatch Log
              </h2>
              <p className="text-[11px] text-[#737782]">
                Authorized Utility Provider & LGU Response Bulletin
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

        {error && (
          <div className="p-3 bg-[#ffdad6] border border-[#ffb4ac] rounded-xl text-[#93000d] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Organization / Agency */}
          <div>
            <label className="block text-xs font-bold text-[#424751] mb-1">
              Issuing Agency / Entity
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs sm:text-sm font-semibold text-[#191c1e] focus:outline-none focus:border-[#004a98] focus:bg-white"
              placeholder="e.g. Davao Light Operations, Davao City DRRMO"
              required
            />
          </div>

          {/* Official Bulletin Message */}
          <div>
            <label className="block text-xs font-bold text-[#424751] mb-1">
              Official Bulletin / Restoration Status *
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs sm:text-sm text-[#191c1e] focus:outline-none focus:border-[#004a98] focus:bg-white resize-none"
              placeholder="e.g. Crew Bravo is currently isolating the tripped feeder at Substation 4. Estimated partial restoration in 45 minutes."
              required
            ></textarea>
          </div>

          {/* Specific Technical Action Taken */}
          <div>
            <label className="block text-xs font-bold text-[#424751] mb-1">
              Technical Action Taken (Optional)
            </label>
            <input
              type="text"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs sm:text-sm text-[#191c1e] focus:outline-none focus:border-[#004a98] focus:bg-white"
              placeholder="e.g. 2 line bucket trucks dispatched; transformer inspected"
            />
          </div>

          {/* Quick presets for common field actions */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[#737782]">Quick Templates:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setMessage('Line patrol crew dispatched to isolate faulty lateral tap and clear fallen tree branches.');
                  setActionTaken('2 Bucket trucks en route to site');
                }}
                className="text-[10px] bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#424751] px-2.5 py-1 rounded-lg border border-[#c2c6d3]"
              >
                + Crew Dispatched
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessage('Substation breaker reset successfully. Phased energization in progress across affected barangays.');
                  setActionTaken('Phased recloser switching');
                }}
                className="text-[10px] bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#424751] px-2.5 py-1 rounded-lg border border-[#c2c6d3]"
              >
                + Phased Energization
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessage('Critical hospital emergency generator inspected by CDRRMO disaster response team. Backup fuel is secured.');
                  setActionTaken('Emergency generator power verified');
                }}
                className="text-[10px] bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#424751] px-2.5 py-1 rounded-lg border border-[#c2c6d3]"
              >
                + Hospital Generator Secured
              </button>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e0e3e5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#424751] text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#004a98] hover:bg-[#00346e] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>{isSubmitting ? 'Publishing...' : 'Publish Official Bulletin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
