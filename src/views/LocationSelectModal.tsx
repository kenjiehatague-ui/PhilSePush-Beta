import React, { useState, useEffect, useRef } from 'react';
import { Area } from '../types';
import { storageService } from '../services/storageService';
import { locationService, GeoLocationResult } from '../services/locationService';
import L from 'leaflet';

interface LocationSelectModalProps {
  onClose: () => void;
  onSelectArea: (area: Area) => void;
  currentArea?: Area;
}

export const LocationSelectModal: React.FC<LocationSelectModalProps> = ({
  onClose,
  onSelectArea,
  currentArea
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<GeoLocationResult | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quick' | 'map' | 'manual'>('quick');

  // Interactive Map State
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [mapSelectedArea, setMapSelectedArea] = useState<Area | null>(currentArea || null);

  // Manual 5-level selection state
  const hierarchy = locationService.getHierarchyOptions();
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');

  const supportedAreas = storageService.getSupportedAreas();

  // Highlighted Quick Select Areas (Major Hubs - Davao City Focus)
  const quickSelectIds = [
    'area-davao-poblacion-1a',
    'area-davao-buhangin-poblacion',
    'area-davao-talomo-proper',
    'area-davao-matina-crossing',
    'area-davao-calinan-proper',
    'area-makati-belair',
    'area-cebu-lahug'
  ];

  const quickAreas = supportedAreas.filter(
    (a) =>
      a?.cityMunicipality?.toLowerCase().includes('davao') ||
      a?.barangay?.toLowerCase().includes('poblacion') ||
      a?.barangay?.toLowerCase().includes('buhangin') ||
      a?.barangay?.toLowerCase().includes('talomo') ||
      a?.barangay?.toLowerCase().includes('matina') ||
      a?.barangay?.toLowerCase().includes('calinan') ||
      a?.barangay?.toLowerCase().includes('agdao') ||
      a?.barangay?.toLowerCase().includes('mintal')
  ).slice(0, 8);

  const handleUseCurrentLocation = async () => {
    setIsDetecting(true);
    setLocationError(null);
    setDetectedLocation(null);
    try {
      const result = await locationService.getCurrentPosition();
      setDetectedLocation(result);
      setMapSelectedArea(result.nearestArea);
    } catch (err: any) {
      setLocationError(
        err?.message ||
          "Could not detect your exact GPS position. Please pick your Barangay from the quick list or map below."
      );
    } finally {
      setIsDetecting(false);
    }
  };

  const handleConfirmDetectedArea = () => {
    if (detectedLocation) {
      onSelectArea(detectedLocation.nearestArea);
      onClose();
    }
  };

  // Initialize interactive Leaflet map when 'map' tab is active
  useEffect(() => {
    if (activeTab !== 'map' || !mapContainerRef.current) return;

    const initialLat = mapSelectedArea?.latitude || currentArea?.latitude || 7.0731; // Default Davao City
    const initialLng = mapSelectedArea?.longitude || currentArea?.longitude || 125.6128;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      // Draggable marker for picking location on map
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background-color: #004a98; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
                 <span class="material-symbols-outlined text-[18px]">location_on</span>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: customIcon
      }).addTo(map);

      markerRef.current = marker;

      const updateAreaFromCoords = async (lat: number, lng: number) => {
        try {
          const matched = await locationService.reverseGeocode(lat, lng);
          if (matched) {
            setMapSelectedArea(matched);
            return;
          }
        } catch (err) {
          console.warn('Map pin drop reverse geocode error:', err);
        }
        const closest = storageService.getNearestArea(lat, lng);
        if (closest) {
          setMapSelectedArea(closest);
        }
      };

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        updateAreaFromCoords(pos.lat, pos.lng);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        updateAreaFromCoords(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([initialLat, initialLng], 13);
      if (markerRef.current) {
        markerRef.current.setLatLng([initialLat, initialLng]);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [activeTab]);

  // Filter supported areas by search input
  const filteredAreas = supportedAreas.filter((area) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (area?.barangay || '').toLowerCase().includes(q) ||
      (area?.cityMunicipality || '').toLowerCase().includes(q) ||
      (area?.province || '').toLowerCase().includes(q) ||
      (area?.region || '').toLowerCase().includes(q) ||
      (area?.subdivisionVillage && area.subdivisionVillage.toLowerCase().includes(q))
    );
  });

  const handleManualHierarchySubmit = () => {
    if (selectedBarangay && selectedCity) {
      const matched = supportedAreas.find(
        (a) => a.barangay === selectedBarangay && a.cityMunicipality === selectedCity
      );
      if (matched) {
        onSelectArea(matched);
        onClose();
      } else {
        const created = storageService.addArea({
          region: selectedRegion || 'Region XI (Davao Region)',
          province: selectedProvince || 'Davao del Sur',
          cityMunicipality: selectedCity,
          district: 'District 1',
          barangay: selectedBarangay,
          latitude: 7.0731,
          longitude: 125.6128,
          supported: true,
          utilityProvider: 'Davao Light & Power Co. (DLPC)',
          lguName: `City Government of ${selectedCity}`
        });
        onSelectArea(created);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      {/* Click outside to close backdrop */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Modal / Bottom Sheet Container */}
      <div className="relative z-10 w-full md:max-w-xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl border border-[#c2c6d3] max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Mobile Grabber Handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1.5 bg-[#c2c6d3] rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-6 pt-4 pb-3 flex items-start justify-between border-b border-[#e0e3e5]">
          <div>
            <h2 className="text-xl font-bold text-[#191c1e] tracking-tight">
              Select Your Barangay & Location
            </h2>
            <p className="text-xs sm:text-sm text-[#424751] mt-0.5">
              Choose your coverage area to view live power status and advisories.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#737782] hover:text-[#191c1e] hover:bg-[#eceef0] rounded-full transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* OPTION A: GPS DETECT */}
          <section className="flex flex-col gap-3">
            <button
              onClick={handleUseCurrentLocation}
              disabled={isDetecting}
              className="w-full flex items-center justify-center gap-2.5 bg-[#004a98] hover:bg-[#00346e] text-white font-semibold text-sm py-3.5 px-4 rounded-xl shadow-xs transition-all active:scale-98 disabled:opacity-75"
            >
              {isDetecting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                  <span>Detecting GPS Coordinates...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px] icon-fill">
                    my_location
                  </span>
                  <span>Use my current GPS location</span>
                </>
              )}
            </button>

            {locationError && (
              <div className="text-xs text-[#ba1a1a] bg-[#ffdad6] p-3 rounded-xl flex items-start gap-2.5 border border-[#ffb4ab]">
                <span className="material-symbols-outlined text-[18px] mt-0.5 text-[#ba1a1a]">info</span>
                <span className="leading-relaxed">{locationError}</span>
              </div>
            )}

            {detectedLocation && (
              <div className="bg-[#e8f0fe] border border-[#004a98]/30 rounded-xl p-4 flex flex-col gap-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#004a98] text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                    GPS Matched ({detectedLocation.source.toUpperCase()})
                  </span>
                  {detectedLocation.accuracy && (
                    <span className="text-[11px] text-[#424751] font-medium">
                      Accuracy: &plusmn;{Math.round(detectedLocation.accuracy)}m
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-2.5 text-[#00346e]">
                  <span className="material-symbols-outlined text-[22px] text-[#004a98] mt-0.5 icon-fill">
                    location_on
                  </span>
                  <div>
                    <p className="text-base font-bold text-[#191c1e]">
                      {detectedLocation.nearestArea.barangay}, {detectedLocation.nearestArea.cityMunicipality}
                    </p>
                    <p className="text-xs text-[#424751]">
                      {detectedLocation.nearestArea.province}, {detectedLocation.nearestArea.region}
                    </p>
                    <p className="text-[11px] text-[#004a98] font-semibold mt-1">
                      Grid Provider: {detectedLocation.nearestArea.utilityProvider}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleConfirmDetectedArea}
                  className="w-full bg-[#004a98] hover:bg-[#00346e] text-white font-bold text-xs py-2.5 px-4 rounded-lg transition-colors shadow-2xs"
                >
                  Confirm & Use This Barangay
                </button>
              </div>
            )}
          </section>

          {/* DIVIDER */}
          <div className="flex items-center gap-4">
            <hr className="flex-1 border-[#c2c6d3]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#737782]">or select area</span>
            <hr className="flex-1 border-[#c2c6d3]" />
          </div>

          {/* MODE SELECTOR TABS */}
          <div className="flex bg-[#eceef0] p-1 rounded-xl gap-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('quick')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all ${
                activeTab === 'quick'
                  ? 'bg-white text-[#004a98] shadow-xs'
                  : 'text-[#424751] hover:text-[#191c1e]'
              }`}
            >
              Quick Search
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === 'map'
                  ? 'bg-white text-[#004a98] shadow-xs'
                  : 'text-[#424751] hover:text-[#191c1e]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">map</span>
              Map Pin Drop
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all ${
                activeTab === 'manual'
                  ? 'bg-white text-[#004a98] shadow-xs'
                  : 'text-[#424751] hover:text-[#191c1e]'
              }`}
            >
              5-Level Form
            </button>
          </div>

          {/* TAB 1: QUICK SEARCH & CHIPS */}
          {activeTab === 'quick' && (
            <div className="flex flex-col gap-4">
              {/* Quick Select Chips */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#737782] mb-2">
                  Popular Service Hubs
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {quickAreas.map((area) => (
                    <button
                      key={area.id}
                      onClick={() => {
                        onSelectArea(area);
                        onClose();
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#f2f4f6] hover:bg-[#d7e3ff] hover:text-[#00346e] border border-[#c2c6d3] text-[#191c1e] transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px] text-[#004a98]">place</span>
                      <span>{(area?.barangay || '').replace('Barangay ', '')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar Input */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737782] text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search barangay, city, or district..."
                  className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-[#191c1e] placeholder-[#737782] focus:outline-none focus:ring-2 focus:ring-[#004a98] focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737782] hover:text-[#191c1e]"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                  </button>
                )}
              </div>

              {/* Search Matches List */}
              <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#737782] px-1">
                  Supported Coverage ({filteredAreas.length})
                </p>

                {filteredAreas.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#737782] bg-[#f2f4f6] rounded-xl">
                    No matching barangay found for &quot;{searchQuery}&quot;. Try selecting from the 5-Level form or Map.
                  </div>
                ) : (
                  filteredAreas.map((area) => {
                    const isSelected = currentArea?.id === area.id;
                    return (
                      <button
                        key={area.id}
                        onClick={() => {
                          onSelectArea(area);
                          onClose();
                        }}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left group border ${
                          isSelected
                            ? 'bg-[#d7e3ff] border-[#004a98]/30 shadow-2xs'
                            : 'bg-white border-transparent hover:bg-[#f2f4f6] hover:border-[#c2c6d3]'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[20px] mt-0.5 ${
                            isSelected ? 'text-[#00346e] icon-fill' : 'text-[#737782] group-hover:text-[#004a98]'
                          }`}
                        >
                          location_on
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-[#191c1e] truncate">
                              {area.barangay}
                            </p>
                            {isSelected && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#004a98] text-white">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#424751] truncate">
                            {area.cityMunicipality}, {area.province}
                          </p>
                          <p className="text-[10px] text-[#737782] mt-0.5 truncate">
                            Provider: {area.utilityProvider}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MAP PIN DROP */}
          {activeTab === 'map' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-[#424751]">
                Tap anywhere on the map or drag the marker to pinpoint your Barangay:
              </p>

              <div
                ref={mapContainerRef}
                className="w-full h-56 rounded-2xl border border-[#c2c6d3] overflow-hidden shadow-inner relative z-0"
              />

              {mapSelectedArea ? (
                <div className="bg-[#f8f9fb] border border-[#c2c6d3] p-3 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#191c1e] truncate">
                      {mapSelectedArea.barangay}, {mapSelectedArea.cityMunicipality}
                    </p>
                    <p className="text-[11px] text-[#424751] truncate">
                      {mapSelectedArea.province} &bull; {mapSelectedArea.utilityProvider}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onSelectArea(mapSelectedArea);
                      onClose();
                    }}
                    className="shrink-0 bg-[#004a98] hover:bg-[#00346e] text-white text-xs font-bold py-2 px-3.5 rounded-lg transition-colors shadow-2xs"
                  >
                    Set Location
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[#737782] text-center italic">
                  Tap on the map above to select an area.
                </p>
              )}
            </div>
          )}

          {/* TAB 3: 5-LEVEL MANUAL FORM */}
          {activeTab === 'manual' && (
            <div className="flex flex-col gap-3 bg-[#f8f9fb] p-4 rounded-xl border border-[#c2c6d3]">
              <div>
                <label className="text-xs font-semibold text-[#191c1e] mb-1 block">
                  1. Region
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setSelectedProvince('');
                    setSelectedCity('');
                    setSelectedBarangay('');
                  }}
                  className="w-full bg-white border border-[#c2c6d3] rounded-lg px-3 py-2 text-xs text-[#191c1e] focus:ring-2 focus:ring-[#004a98]"
                >
                  <option value="">Select Region</option>
                  {hierarchy.regions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#191c1e] mb-1 block">
                  2. Province
                </label>
                <select
                  value={selectedProvince}
                  disabled={!selectedRegion}
                  onChange={(e) => {
                    setSelectedProvince(e.target.value);
                    setSelectedCity('');
                    setSelectedBarangay('');
                  }}
                  className="w-full bg-white border border-[#c2c6d3] rounded-lg px-3 py-2 text-xs text-[#191c1e] disabled:opacity-50"
                >
                  <option value="">Select Province</option>
                  {selectedRegion &&
                    hierarchy.getProvinces(selectedRegion).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#191c1e] mb-1 block">
                  3. City / Municipality
                </label>
                <select
                  value={selectedCity}
                  disabled={!selectedProvince}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setSelectedBarangay('');
                  }}
                  className="w-full bg-white border border-[#c2c6d3] rounded-lg px-3 py-2 text-xs text-[#191c1e] disabled:opacity-50"
                >
                  <option value="">Select City</option>
                  {selectedProvince &&
                    hierarchy.getCities(selectedProvince).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#191c1e] mb-1 block">
                  4. Barangay
                </label>
                <select
                  value={selectedBarangay}
                  disabled={!selectedCity}
                  onChange={(e) => setSelectedBarangay(e.target.value)}
                  className="w-full bg-white border border-[#c2c6d3] rounded-lg px-3 py-2 text-xs text-[#191c1e] disabled:opacity-50"
                >
                  <option value="">Select Barangay</option>
                  {selectedCity &&
                    hierarchy.getBarangays(selectedCity).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                </select>
              </div>

              <button
                onClick={handleManualHierarchySubmit}
                disabled={!selectedBarangay}
                className="w-full mt-2 bg-[#004a98] hover:bg-[#00346e] text-white text-xs font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                Set Selected Barangay
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

