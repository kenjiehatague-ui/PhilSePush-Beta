import React, { useState } from 'react';
import { ImpactTag, User } from '../types';
import { storageService } from '../services/storageService';
import { firestoreService } from '../services/firestoreService';

interface AddCommunityUpdateModalProps {
  outageId: string;
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddCommunityUpdateModal: React.FC<AddCommunityUpdateModalProps> = ({
  outageId,
  currentUser,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [contactNumber, setContactNumber] = useState(currentUser.phoneNumber || '');
  const [impactCategory, setImpactCategory] = useState<ImpactTag>('Home');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const categories: ImpactTag[] = ['Home', 'Business', 'Hospital', 'School', 'Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setIsSubmitting(true);

    try {
      const newUpdate = storageService.addCommunityUpdate({
        outageId,
        userId: currentUser.id,
        name: name.trim(),
        contactNumber: contactNumber.trim() || undefined,
        message: message.trim(),
        impactTag: impactCategory
      });

      await firestoreService.addCommunityUpdate(newUpdate).catch((err) => {
        console.warn('Firestore community update sync error:', err);
      });

      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err) {
      console.error('Error adding community update:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#c2c6d3] max-h-[88vh] overflow-y-auto relative animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e0e3e5] mb-6">
          <button
            onClick={onClose}
            className="p-2 text-[#00346e] hover:bg-[#eceef0] rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h2 className="text-xl font-bold text-[#00346e] flex-1 text-center pr-8">
            Add Community Update
          </h2>
        </div>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[36px] icon-fill">
                check_circle
              </span>
            </div>
            <h3 className="text-xl font-bold text-[#191c1e]">
              Successfully left an update
            </h3>
            <p className="text-xs sm:text-sm text-[#737782] max-w-xs">
              Thank you for providing real-time situation feedback for your neighborhood.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-8 sm:pb-12">
            {/* Name Field */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#191c1e]" htmlFor="name">
                Name <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name or nickname"
                className="w-full bg-[#f2f4f6] border border-[#c2c6d3] rounded-xl px-4 py-3 text-sm text-[#191c1e] placeholder-[#737782] focus:ring-2 focus:ring-[#004a98] focus:bg-white transition-all outline-none"
              />
            </div>

            {/* Contact Number Field (Optional & Private) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#191c1e]" htmlFor="contact">
                Contact Number <span className="text-[#737782] font-normal">(Optional)</span>
              </label>
              <input
                id="contact"
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. 0912 345 6789"
                className="w-full bg-[#f2f4f6] border border-[#c2c6d3] rounded-xl px-4 py-3 text-sm text-[#191c1e] placeholder-[#737782] focus:ring-2 focus:ring-[#004a98] focus:bg-white transition-all outline-none"
              />
              <p className="text-[11px] text-[#737782] flex items-center gap-1.5 mt-0.5">
                <span className="material-symbols-outlined text-[15px] text-[#004a98]">
                  shield_lock
                </span>
                <span>
                  Your contact number will only be used for verification and will <strong>NOT</strong> be shown publicly.
                </span>
              </p>
            </div>

            {/* Impact Category Section */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#191c1e]">
                Impact Category
              </span>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isChecked = impactCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setImpactCategory(cat)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                        isChecked
                          ? 'bg-[#004a98] text-white border-[#004a98] shadow-xs scale-102'
                          : 'bg-white text-[#424751] border-[#c2c6d3] hover:bg-[#f2f4f6]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Update Text */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#191c1e]" htmlFor="update">
                Your Update <span className="text-[#ba1a1a]">*</span>
              </label>
              <textarea
                id="update"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the current situation, impact, or any relevant details (e.g. traffic lights down, generator noise, estimated street affected)..."
                className="w-full bg-[#f2f4f6] border border-[#c2c6d3] rounded-xl p-3.5 text-sm text-[#191c1e] placeholder-[#737782] focus:ring-2 focus:ring-[#004a98] focus:bg-white transition-all outline-none resize-none"
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !message.trim()}
              className="w-full bg-[#00346e] hover:bg-[#004a98] text-white font-bold text-sm py-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                  <span>Posting Update...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>Post Update</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
