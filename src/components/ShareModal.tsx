import React, { useState } from 'react';
import { Outage } from '../types';

interface ShareModalProps {
  outage: Outage;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ outage, onClose }) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/#/outage/${outage.id}`;
  const shareTitle = `Power Outage Alert: ${outage.barangay}, ${outage.cityMunicipality}`;
  const shareText = `Active power outage reported in ${outage.barangay}, ${outage.cityMunicipality} affecting ${outage.peopleAffected} residents. Check status and updates on PhilSePush.`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        onClose();
      } catch (err) {
        console.warn('Native share error or dismissed:', err);
      }
    } else {
      handleCopy();
    }
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle + ' - ' + shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#c2c6d3] relative animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e0e3e5] mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00346e]">share</span>
            <h3 className="text-lg font-bold text-[#191c1e]">Share Outage Alert</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#737782] hover:text-[#191c1e] hover:bg-[#eceef0] rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Snippet */}
        <div className="bg-[#f2f4f6] rounded-xl p-3.5 mb-5 border border-[#c2c6d3]/60">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#e41e25] animate-pulse"></span>
            <span className="text-xs font-bold text-[#e41e25] uppercase tracking-wider">
              {outage.status} Outage
            </span>
          </div>
          <p className="text-sm font-bold text-[#191c1e]">{outage.barangay}</p>
          <p className="text-xs text-[#424751] mt-0.5">{outage.subdivisionVillage}</p>
          <p className="text-xs text-[#737782] mt-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">group</span>
            <span>{outage.peopleAffected} confirmed affected</span>
          </p>
        </div>

        {/* Share buttons grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#d7e3ff] text-[#00346e] hover:bg-[#abc7ff] transition-colors gap-1.5 font-semibold text-xs"
            >
              <span className="material-symbols-outlined text-[24px]">send_to_mobile</span>
              <span>Quick Share</span>
            </button>
          )}

          <button
            onClick={handleFacebookShare}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#1877f2]/10 text-[#1877f2] hover:bg-[#1877f2]/20 transition-colors gap-1.5 font-semibold text-xs"
          >
            <span className="material-symbols-outlined text-[24px]">public</span>
            <span>Facebook</span>
          </button>

          <button
            onClick={handleTwitterShare}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors gap-1.5 font-semibold text-xs"
          >
            <span className="material-symbols-outlined text-[24px]">tag</span>
            <span>X / Twitter</span>
          </button>
        </div>

        {/* Copy Link Field */}
        <div className="flex items-center gap-2 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl p-2 pl-3">
          <span className="material-symbols-outlined text-[#737782] text-[18px]">link</span>
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="bg-transparent text-xs text-[#424751] w-full focus:outline-none truncate"
          />
          <button
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-[#004a98] text-white hover:bg-[#00346e]'
            }`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};
