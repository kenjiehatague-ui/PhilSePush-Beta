import React, { useState, useEffect } from 'react';
import { User, Area } from '../types';
import { storageService } from '../services/storageService';

interface SettingsViewProps {
  currentUser: User;
  currentArea: Area | null;
  onSelectArea: (area: Area) => void;
  onOpenLocationModal: () => void;
  onNavigate: (route: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  currentArea,
  onSelectArea,
  onOpenLocationModal,
  onNavigate
}) => {
  const activeUser = currentUser || storageService.getCurrentUser();
  const activeArea = currentArea || storageService.getSelectedArea();

  const [name, setName] = useState(activeUser?.name || 'Juan Dela Cruz');
  const [phoneNumber, setPhoneNumber] = useState(activeUser?.phoneNumber || '');
  const [isSaved, setIsSaved] = useState(false);

  // Dynamic monitored areas state
  const [monitoredAreas, setMonitoredAreas] = useState<Area[]>(() =>
    storageService.getMonitoredAreas()
  );

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setMonitoredAreas(storageService.getMonitoredAreas());
    });
    return () => unsub();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateUser({
      name: name.trim(),
      phoneNumber: phoneNumber.trim() || undefined
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleRemoveArea = (areaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.removeSavedArea(areaId);
    setMonitoredAreas(storageService.getMonitoredAreas());
  };

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 pb-24 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('/more')}
          className="p-1.5 text-[#737782] hover:text-[#191c1e] rounded-lg"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-extrabold text-[#191c1e] tracking-tight">
          User Settings & Preferences
        </h1>
      </div>

      {/* Profile Info Card */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-[#c2c6d3] shadow-2xs flex flex-col gap-4">
        <h2 className="text-sm font-bold text-[#191c1e] uppercase tracking-wider">
          Profile Information
        </h2>

        <div>
          <label className="text-xs font-bold text-[#424751] block mb-1" htmlFor="displayName">
            Full Name
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl p-3 text-xs sm:text-sm text-[#191c1e] outline-none focus:ring-2 focus:ring-[#004a98]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[#424751] block mb-1" htmlFor="settingsPhone">
            Default Contact Number (Private)
          </label>
          <input
            id="settingsPhone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+63 912 345 6789"
            className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl p-3 text-xs sm:text-sm text-[#191c1e] outline-none focus:ring-2 focus:ring-[#004a98]"
          />
        </div>

        <div className="pt-2 flex items-center justify-between">
          {isSaved && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Settings saved</span>
            </span>
          )}
          <button
            type="submit"
            className="ml-auto px-6 py-2.5 bg-[#004a98] hover:bg-[#00346e] text-white font-bold text-xs rounded-xl shadow-2xs transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* Monitored Areas Manager */}
      <div className="bg-white rounded-2xl p-6 border border-[#c2c6d3] shadow-2xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#191c1e] uppercase tracking-wider">
              Monitored Areas ({monitoredAreas.length})
            </h2>
            <p className="text-xs text-[#737782]">Fast switch between your saved Philippine locations</p>
          </div>

          <button
            onClick={onOpenLocationModal}
            className="text-xs font-bold bg-[#e8f0fe] hover:bg-[#d7e3ff] text-[#004a98] px-3.5 py-2 rounded-xl border border-[#004a98]/30 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
            <span>+ Add Area</span>
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {monitoredAreas.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#737782] bg-[#f8f9fb] rounded-xl border border-dashed border-[#c2c6d3]">
              No monitored areas saved yet. Click &quot;+ Add Area&quot; above to add your location.
            </div>
          ) : (
            monitoredAreas.map((area) => {
              const isCurrent = area.id === activeArea?.id;
              return (
                <div
                  key={area.id}
                  onClick={() => onSelectArea(area)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-[#d7e3ff] border-[#004a98]/40 font-bold text-[#00346e] shadow-2xs'
                      : 'bg-[#f8f9fb] border-[#e0e3e5] hover:bg-[#f2f4f6]'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className={`material-symbols-outlined text-[20px] mt-0.5 ${
                        isCurrent ? 'text-[#004a98] icon-fill' : 'text-[#737782]'
                      }`}
                    >
                      location_on
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#191c1e] truncate">
                        {area.barangay}
                      </p>
                      <p className="text-[11px] text-[#737782] truncate">
                        {area.cityMunicipality}, {area.province}
                      </p>
                      <p className="text-[10px] text-[#004a98] font-semibold mt-0.5 truncate">
                        Grid: {area.utilityProvider}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isCurrent ? (
                      <span className="text-[10px] bg-[#004a98] text-white px-2.5 py-1 rounded-md font-bold">
                        Active Area
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectArea(area);
                        }}
                        className="text-xs text-[#004a98] hover:bg-[#d7e3ff] px-2.5 py-1 rounded-md font-semibold border border-[#004a98]/20 transition-colors"
                      >
                        Switch To
                      </button>
                    )}

                    {/* Remove Area Button (Only allow removal if more than 1 monitored area exists) */}
                    {monitoredAreas.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveArea(area.id, e)}
                        title="Remove from monitored areas"
                        className="p-1.5 text-[#737782] hover:text-[#ba1a1a] hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Firebase Cloud Infrastructure Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#c2c6d3] shadow-2xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#fef7e0] border border-[#f9ab00]/30 flex items-center justify-center text-[#b06000]">
              <span className="material-symbols-outlined text-[20px]">database</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#191c1e] uppercase tracking-wider">
                Firebase Firestore Backend
              </h2>
              <p className="text-xs text-[#737782]">Cloud database & authentication state</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Connected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[#f8f9fb] rounded-xl border border-[#e0e3e5]">
            <p className="text-[10px] text-[#737782] font-semibold uppercase">Project ID</p>
            <p className="font-mono font-bold text-[#191c1e] truncate mt-0.5">gen-lang-client-0628593094</p>
          </div>
          <div className="p-3 bg-[#f8f9fb] rounded-xl border border-[#e0e3e5]">
            <p className="text-[10px] text-[#737782] font-semibold uppercase">Region</p>
            <p className="font-semibold text-[#191c1e] mt-0.5">asia-southeast1 (Singapore)</p>
          </div>
          <div className="p-3 bg-[#f8f9fb] rounded-xl border border-[#e0e3e5]">
            <p className="text-[10px] text-[#737782] font-semibold uppercase">Firestore Database ID</p>
            <p className="font-mono text-[11px] text-[#191c1e] truncate mt-0.5">ai-studio-philsepush-1e6115ab-57ed-4c8c-ac44-1ad496d89697</p>
          </div>
          <div className="p-3 bg-[#f8f9fb] rounded-xl border border-[#e0e3e5]">
            <p className="text-[10px] text-[#737782] font-semibold uppercase">Real-Time Sync</p>
            <p className="font-semibold text-emerald-700 mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">sync</span>
              Live Grid & Outages Listener Active
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
