import React, { useState, useEffect } from 'react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between sticky top-0 z-50 shadow-sm animate-fade-in">
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        <span className="material-symbols-outlined text-[18px]">wifi_off</span>
        <span>
          <strong>Offline Mode Active:</strong> You are browsing cached outage records. Reports submitted will be queued locally.
        </span>
      </div>
    </div>
  );
};
