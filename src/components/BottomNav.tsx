import React from 'react';

interface BottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPath,
  onNavigate
}) => {
  const isHome = currentPath === '/home' || currentPath === '/';
  const isMap = currentPath === '/map';
  const isReport = currentPath.startsWith('/report');
  const isHistory = currentPath === '/history' || currentPath.startsWith('/history/');
  const isMore =
    currentPath === '/more' ||
    currentPath === '/settings' ||
    currentPath === '/notifications' ||
    currentPath === '/admin' ||
    currentPath === '/verification' ||
    currentPath === '/scheduled';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#f8f9fb] border-t border-[#e0e3e5] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-2 pt-2 pb-safe flex justify-around items-center">
      {/* Home Tab */}
      <button
        onClick={() => onNavigate('/home')}
        className={`flex flex-col items-center justify-center px-3 py-1 rounded-2xl transition-all ${
          isHome
            ? 'bg-[#004a98] text-white shadow-xs scale-100'
            : 'text-[#424751] hover:bg-[#e6e8ea]'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[24px] ${isHome ? 'icon-fill' : ''}`}
        >
          home
        </span>
        <span className="text-[11px] font-semibold tracking-tight mt-0.5">Home</span>
      </button>

      {/* Map Tab */}
      <button
        onClick={() => onNavigate('/map')}
        className={`flex flex-col items-center justify-center px-3 py-1 rounded-2xl transition-all ${
          isMap
            ? 'bg-[#004a98] text-white shadow-xs scale-100'
            : 'text-[#424751] hover:bg-[#e6e8ea]'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[24px] ${isMap ? 'icon-fill' : ''}`}
        >
          map
        </span>
        <span className="text-[11px] font-semibold tracking-tight mt-0.5">Map</span>
      </button>

      {/* Report Tab */}
      <button
        onClick={() => onNavigate('/report')}
        className={`flex flex-col items-center justify-center px-3 py-1 rounded-2xl relative transition-all ${
          isReport
            ? 'bg-[#004a98] text-white shadow-xs scale-100'
            : 'text-[#424751] hover:bg-[#e6e8ea]'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[24px] ${
            isReport ? 'icon-fill text-white' : 'text-[#e41e25]'
          }`}
        >
          report_problem
        </span>
        <span className="text-[11px] font-semibold tracking-tight mt-0.5">Report</span>
      </button>

      {/* History Tab */}
      <button
        onClick={() => onNavigate('/history')}
        className={`flex flex-col items-center justify-center px-3 py-1 rounded-2xl transition-all ${
          isHistory
            ? 'bg-[#004a98] text-white shadow-xs scale-100'
            : 'text-[#424751] hover:bg-[#e6e8ea]'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[24px] ${
            isHistory ? 'icon-fill' : ''
          }`}
        >
          history
        </span>
        <span className="text-[11px] font-semibold tracking-tight mt-0.5">History</span>
      </button>

      {/* More Tab */}
      <button
        onClick={() => onNavigate('/more')}
        className={`flex flex-col items-center justify-center px-3 py-1 rounded-2xl transition-all ${
          isMore
            ? 'bg-[#004a98] text-white shadow-xs scale-100'
            : 'text-[#424751] hover:bg-[#e6e8ea]'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[24px] ${isMore ? 'icon-fill' : ''}`}
        >
          menu
        </span>
        <span className="text-[11px] font-semibold tracking-tight mt-0.5">More</span>
      </button>
    </nav>
  );
};
