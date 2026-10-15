import React, { useState, useEffect, useRef } from 'react';
import { Area, Outage, User, CriticalFacility } from '../types';
import { storageService } from '../services/storageService';
import { locationService } from '../services/locationService';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import L from 'leaflet';

interface MapViewProps {
  currentArea: Area | null;
  currentUser: User;
  onNavigate: (route: string) => void;
}

// Camera controller component for Google Maps
const MapCameraController: React.FC<{
  target: { lat: number; lng: number };
  zoom?: number;
  triggerKey?: string | number;
}> = ({ target, zoom = 14, triggerKey }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo(target);
      if (zoom) {
        map.setZoom(zoom);
      }
    }
  }, [map, target.lat, target.lng, zoom, triggerKey]);
  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  currentArea,
  currentUser: _currentUser,
  onNavigate
}) => {
  const activeArea = currentArea || storageService.getSelectedArea();

  const [activeOutages, setActiveOutages] = useState<Outage[]>([]);
  const [selectedOutage, setSelectedOutage] = useState<Outage | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<CriticalFacility | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const defaultAreaId = activeArea?.id || storageService.getSupportedAreas()[0]?.id || 'area-davao-poblacion-1a';
  const [reliability, setReliability] = useState(storageService.getReliabilityMetrics(defaultAreaId));
  const [_pendingCount, setPendingCount] = useState(0);
  const [isLocatingMap, setIsLocatingMap] = useState(false);

  // Target coordinates for camera centering
  const [cameraTarget, setCameraTarget] = useState<{ lat: number; lng: number }>({
    lat: activeArea?.latitude || 7.0731,
    lng: activeArea?.longitude || 125.6128
  });
  const [cameraTrigger, setCameraTrigger] = useState(0);

  // Fallback Leaflet map refs when Google Maps API key is not present
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const googleMapsApiKey =
    (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  const loadData = () => {
    const outages = storageService.getActiveOutages();
    setActiveOutages(outages);
    const targetAreaId = activeArea?.id || storageService.getSupportedAreas()[0]?.id || 'area-davao-poblacion-1a';
    setReliability(storageService.getReliabilityMetrics(targetAreaId));
    setPendingCount(storageService.getPendingReports().length);

    if (outages.length > 0 && !selectedOutage) {
      const match = outages.find((o) => o.areaId === activeArea?.id) || outages[0];
      setSelectedOutage(match);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = storageService.subscribe(loadData);
    return unsub;
  }, [activeArea?.id]);

  // Keep camera synced when area changes
  useEffect(() => {
    if (activeArea) {
      setCameraTarget({ lat: activeArea.latitude, lng: activeArea.longitude });
      setCameraTrigger((prev) => prev + 1);
    }
  }, [activeArea?.id, activeArea?.latitude, activeArea?.longitude]);

  // Leaflet fallback only if Google Maps API key is absent
  useEffect(() => {
    if (googleMapsApiKey || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = activeArea?.latitude || 7.0731;
      const initialLng = activeArea?.longitude || 125.6128;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: false
      });

      // High-contrast clean OpenStreetMap tiles (standard OSM, NO CARTO, avoids API KEY REQUIRED watermark)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    if (mapInstanceRef.current && markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      activeOutages.forEach((outage) => {
        const isVerified = outage.verified && outage.verificationStatus !== 'pending';
        const markerBg = isVerified ? '#e41e25' : '#d97706';
        const pulseBg = isVerified ? 'rgba(228,30,37,0.25)' : 'rgba(217,119,6,0.25)';
        const unverifiedBadge = !isVerified
          ? `<div style="position: absolute; top: -20px; background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 9999px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); white-space: nowrap; letter-spacing: 0.5px; display: flex; align-items: center; gap: 3px;"><span>⚠️</span><span>UNVERIFIED</span></div>`
          : '';

        const customIcon = L.divIcon({
          className: 'custom-outage-marker',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              ${unverifiedBadge}
              <div style="width: 38px; height: 38px; border-radius: 50%; background-color: ${markerBg}; border: 3px solid #ffffff; box-shadow: 0 4px 12px ${isVerified ? 'rgba(228,30,37,0.4)' : 'rgba(217,119,6,0.4)'}; display: flex; align-items: center; justify-content: center; color: white;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.9 17.06 11 21 11 21z"/></svg>
              </div>
              <div style="position: absolute; width: 60px; height: 60px; border-radius: 50%; background-color: ${pulseBg}; animation: pulseRing 2s infinite;"></div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const coords = storageService.resolveIncidentCoordinates(
          outage.areaId,
          outage.barangay,
          outage.cityMunicipality,
          outage.latitude,
          outage.longitude
        );

        const marker = L.marker([coords.latitude, coords.longitude], { icon: customIcon });
        marker.on('click', () => {
          setSelectedOutage(outage);
        });
        marker.addTo(markersLayerRef.current!);

        if (outage.criticalFacilitiesNearby) {
          outage.criticalFacilitiesNearby.forEach((fac) => {
            const hospitalIcon = L.divIcon({
              className: 'custom-hospital-marker',
              html: `
                <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                  <div style="background: white; border: 1px solid #c2c6d3; border-radius: 6px; padding: 2px 6px; font-size: 10px; font-weight: bold; color: #191c1e; box-shadow: 0 2px 6px rgba(0,0,0,0.15); margin-bottom: 2px; white-space: nowrap;">
                    ${fac.name}
                  </div>
                  <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #ba1a1a; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M19 10.5h-4.5V6a1.5 1.5 0 0 0-3 0v4.5H7a1.5 1.5 0 0 0 0 3h4.5V18a1.5 1.5 0 0 0 3 0v-4.5H19a1.5 1.5 0 0 0 0-3z"/></svg>
                  </div>
                </div>
              `,
              iconSize: [32, 50],
              iconAnchor: [16, 50]
            });

            const facMarker = L.marker([fac.latitude, fac.longitude], { icon: hospitalIcon });
            facMarker.bindPopup(`
              <div style="padding: 10px; font-family: Inter, sans-serif;">
                <h4 style="margin: 0; font-size: 13px; font-weight: bold; color: #191c1e;">${fac.name}</h4>
                <p style="margin: 4px 0 0; font-size: 11px; color: #737782;">Facility: ${fac.type}</p>
                <div style="margin-top: 6px; display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; background: ${
                  fac.backupPowerStatus === 'Generator Active' ? '#fef3c7; color: #92400e;' : '#fee2e2; color: #991b1b;'
                }">
                  ${fac.backupPowerStatus}
                </div>
              </div>
            `);
            facMarker.addTo(markersLayerRef.current!);
          });
        }
      });

      if (activeArea) {
        mapInstanceRef.current.flyTo([activeArea.latitude, activeArea.longitude], 14, {
          duration: 1.2
        });
      }
    }
  }, [activeOutages, activeArea?.id, googleMapsApiKey]);

  const handleRecenter = async () => {
    setIsLocatingMap(true);
    try {
      const pos = await locationService.getCurrentPosition();
      if (pos) {
        setCameraTarget({ lat: pos.latitude, lng: pos.longitude });
        setCameraTrigger((prev) => prev + 1);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([pos.latitude, pos.longitude], 15, { duration: 1.2 });
        }
        if (pos.nearestArea) {
          storageService.setSelectedArea(pos.nearestArea);
        }
      }
    } catch {
      if (activeArea) {
        setCameraTarget({ lat: activeArea.latitude, lng: activeArea.longitude });
        setCameraTrigger((prev) => prev + 1);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([activeArea.latitude, activeArea.longitude], 15, { duration: 1 });
        }
      }
    } finally {
      setIsLocatingMap(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const matched = storageService.getSupportedAreas().find((a) =>
      (a?.barangay || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a?.cityMunicipality || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (matched) {
      setCameraTarget({ lat: matched.latitude, lng: matched.longitude });
      setCameraTrigger((prev) => prev + 1);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([matched.latitude, matched.longitude], 15);
      }
      const outage = storageService.getActiveOutageForArea(matched.id);
      if (outage) setSelectedOutage(outage);
    }
  };

  return (
    <main className="flex-1 w-full flex flex-col relative h-[calc(100vh-65px)] md:h-screen overflow-y-auto">
      {/* Map Container Area */}
      <div className="relative w-full h-[55vh] md:h-[62vh] shrink-0 bg-[#eceef0] overflow-hidden">
        {googleMapsApiKey ? (
          <APIProvider apiKey={googleMapsApiKey} solutionChannel="GMP_visgl_reactgooglemaps_v1.0.0">
            <div className="w-full h-full relative">
              <Map
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                defaultCenter={cameraTarget}
                defaultZoom={14}
                gestureHandling="greedy"
                disableDefaultUI={false}
                style={{ width: '100%', height: '100%' }}
              >
                <MapCameraController target={cameraTarget} zoom={14} triggerKey={cameraTrigger} />

                {/* Render Outage Markers */}
                {activeOutages.map((outage) => {
                  const isVerified = outage.verified && outage.verificationStatus !== 'pending';
                  const markerBg = isVerified ? '#e41e25' : '#d97706';
                  const pulseBg = isVerified ? 'rgba(228,30,37,0.25)' : 'rgba(217,119,6,0.25)';
                  const coords = storageService.resolveIncidentCoordinates(
                    outage.areaId,
                    outage.barangay,
                    outage.cityMunicipality,
                    outage.latitude,
                    outage.longitude
                  );

                  return (
                    <React.Fragment key={outage.id}>
                      <AdvancedMarker
                        position={{ lat: coords.latitude, lng: coords.longitude }}
                        onClick={() => setSelectedOutage(outage)}
                        title={`${outage.barangay} - ${outage.status}`}
                      >
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          {!isVerified && (
                            <div style={{
                              position: 'absolute',
                              top: '-20px',
                              background: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fcd34d',
                              fontSize: '9px',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '9999px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                              whiteSpace: 'nowrap',
                              letterSpacing: '0.5px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              <span>⚠️</span>
                              <span>UNVERIFIED</span>
                            </div>
                          )}
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            backgroundColor: markerBg,
                            border: '3px solid #ffffff',
                            boxShadow: `0 4px 12px ${isVerified ? 'rgba(228,30,37,0.4)' : 'rgba(217,119,6,0.4)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                              <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.9 17.06 11 21 11 21z"/>
                            </svg>
                          </div>
                          <div style={{
                            position: 'absolute',
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            backgroundColor: pulseBg,
                            animation: 'pulseRing 2s infinite',
                            pointerEvents: 'none'
                          }} />
                        </div>
                      </AdvancedMarker>

                      {/* Nearby Critical Facilities */}
                      {outage.criticalFacilitiesNearby?.map((fac, idx) => (
                        <AdvancedMarker
                          key={`${outage.id}-fac-${idx}`}
                          position={{ lat: fac.latitude, lng: fac.longitude }}
                          onClick={() => setSelectedFacility(fac)}
                          title={`${fac.name} (${fac.type})`}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                            <div style={{
                              background: 'white',
                              border: '1px solid #c2c6d3',
                              borderRadius: '6px',
                              padding: '2px 6px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              color: '#191c1e',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                              marginBottom: '2px',
                              whiteSpace: 'nowrap'
                            }}>
                              {fac.name}
                            </div>
                            <div style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              backgroundColor: '#ba1a1a',
                              border: '2px solid white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                <path d="M19 10.5h-4.5V6a1.5 1.5 0 0 0-3 0v4.5H7a1.5 1.5 0 0 0 0 3h4.5V18a1.5 1.5 0 0 0 3 0v-4.5H19a1.5 1.5 0 0 0 0-3z"/>
                              </svg>
                            </div>
                          </div>
                        </AdvancedMarker>
                      ))}
                    </React.Fragment>
                  );
                })}

                {/* Critical Facility Details Popup InfoWindow */}
                {selectedFacility && (
                  <InfoWindow
                    position={{ lat: selectedFacility.latitude, lng: selectedFacility.longitude }}
                    onCloseClick={() => setSelectedFacility(null)}
                  >
                    <div className="p-2 font-sans max-w-xs">
                      <h4 className="font-bold text-sm text-[#191c1e]">{selectedFacility.name}</h4>
                      <p className="text-xs text-[#737782] mt-0.5">Facility: {selectedFacility.type}</p>
                      <div className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedFacility.backupPowerStatus === 'Generator Active'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedFacility.backupPowerStatus}
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </div>
          </APIProvider>
        ) : (
          <div ref={mapContainerRef} className="w-full h-full z-10" />
        )}

        {/* Search Overlay on Map */}
        <div className="absolute top-4 left-4 right-4 md:right-auto md:w-96 z-20 pointer-events-auto">
          <form onSubmit={handleSearchSubmit} className="relative shadow-md rounded-full overflow-hidden bg-white">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737782] text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Philippine location on map..."
              className="w-full pl-10 pr-10 py-2.5 bg-white text-xs sm:text-sm font-medium text-[#191c1e] placeholder-[#737782] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737782]"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
              </button>
            )}
          </form>
        </div>

        {/* Floating Action Buttons */}
        <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-2.5 pointer-events-auto">
          <button
            onClick={handleRecenter}
            disabled={isLocatingMap}
            className="w-11 h-11 bg-white hover:bg-[#f2f4f6] text-[#00346e] rounded-full shadow-md border border-[#c2c6d3] flex items-center justify-center transition-all active:scale-95 disabled:opacity-75 cursor-pointer"
            title="Locate Me / Recenter Map"
          >
            {isLocatingMap ? (
              <span className="material-symbols-outlined text-[20px] animate-spin">
                progress_activity
              </span>
            ) : (
              <span className="material-symbols-outlined text-[22px] icon-fill">
                my_location
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('/report')}
            className="w-12 h-12 bg-[#e41e25] hover:bg-[#bb0014] text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 animate-pulse-soft cursor-pointer"
            title="Report Outage Immediately"
          >
            <span className="material-symbols-outlined text-[24px]">campaign</span>
          </button>
        </div>

        {/* Map Legend Overlay */}
        <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-xs border border-[#c2c6d3] rounded-xl p-2.5 shadow-md hidden sm:flex flex-col gap-1.5 text-[11px] text-[#424751]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#e41e25] animate-pulse"></span>
            <span className="font-bold text-[#191c1e]">Active Outage (Verified)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#d97706] animate-pulse"></span>
            <span className="font-bold text-amber-800">Citizen Report (Unverified)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ba1a1a]"></span>
            <span>Hospital / Critical Site</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#004a98]"></span>
            <span>Restored / Monitored Area</span>
          </div>
        </div>
      </div>

      {/* Outage Map Popover / Bottom Drawer if Selected */}
      {selectedOutage && (
        <div className="px-4 md:px-8 py-3 bg-[#d7e3ff]/30 border-b border-[#abc7ff] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${selectedOutage.verified ? 'bg-[#ffdad6] text-[#e41e25]' : 'bg-amber-100 text-amber-700'} flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-[24px] icon-fill">
                {selectedOutage.verified ? 'bolt' : 'report'}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-[#191c1e]">{selectedOutage.barangay}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  selectedOutage.status === 'Restored'
                    ? 'bg-[#d7e3ff] text-[#00346e]'
                    : 'bg-[#e41e25] text-white'
                }`}>
                  {selectedOutage.status}
                </span>

                {selectedOutage.verified ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">verified</span>
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">pending</span>
                    <span>Unverified</span>
                  </span>
                )}

                {selectedOutage.disputed && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px] text-amber-700">warning</span>
                    <span>A community member flagged this as inaccurate</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#424751] mt-0.5">
                {selectedOutage.peopleAffected} reported affected • Started {new Date(selectedOutage.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onNavigate(`/outage/${selectedOutage.id}`)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#00346e] hover:bg-[#004a98] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              View Full Details
            </button>
            <button
              onClick={() => setSelectedOutage(null)}
              className="p-2 text-[#737782] hover:bg-white rounded-lg cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* System Overview & Reliability Metrics Section (Concept Paper Requirement) */}
      <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full flex flex-col gap-6 pb-24 md:pb-12">
        <div>
          <h2 className="text-xl font-bold text-[#191c1e] tracking-tight">
            System Overview & Reliability Scorecard
          </h2>
          <p className="text-xs text-[#737782] mt-0.5">
            Transparent algorithmic metrics calculated directly from database records for {reliability.areaName}
          </p>
        </div>

        {/* 4-Stat Metrics Bento Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-[#c2c6d3]/80 shadow-2xs">
            <div className="flex items-center justify-between text-[#00346e] mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#737782]">
                Reliability Score
              </span>
              <span className="material-symbols-outlined text-[20px] text-[#004a98]">
                insights
              </span>
            </div>
            <p className="text-2xl font-extrabold text-[#00346e]">
              {reliability.reliabilityScore}%
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              ✓ Service Provider Benchmark
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#c2c6d3]/80 shadow-2xs">
            <div className="flex items-center justify-between text-[#e41e25] mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#737782]">
                Active Outages
              </span>
              <span className="material-symbols-outlined text-[20px]">
                flash_off
              </span>
            </div>
            <p className="text-2xl font-extrabold text-[#e41e25]">
              {activeOutages.length}
            </p>
            <p className="text-[11px] text-[#737782] mt-1">
              {activeOutages.filter(o => !o.verified).length} unverified citizen reports
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#c2c6d3]/80 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#737782]">
                Resolution Rate
              </span>
              <span className="material-symbols-outlined text-[20px]">
                task_alt
              </span>
            </div>
            <p className="text-2xl font-extrabold text-[#191c1e]">
              {reliability.resolutionPercentage}%
            </p>
            <p className="text-[11px] text-[#737782] mt-1">
              {reliability.addressedReports} resolved in 30 days
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#c2c6d3]/80 shadow-2xs">
            <div className="flex items-center justify-between text-[#00346e] mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#737782]">
                Avg Restoration
              </span>
              <span className="material-symbols-outlined text-[20px]">
                timer
              </span>
            </div>
            <p className="text-2xl font-extrabold text-[#191c1e]">
              {Math.floor(reliability.avgOutageDurationMinutes / 60)}h {reliability.avgOutageDurationMinutes % 60}m
            </p>
            <p className="text-[11px] text-[#737782] mt-1">
              Historical repair average
            </p>
          </div>
        </div>

        {/* Active Outages Detailed List */}
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-[#191c1e] uppercase tracking-wider">
            Active Grid Interruptions Across the Philippines ({activeOutages.length})
          </h3>

          {activeOutages.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-[#c2c6d3] text-center text-xs text-[#737782]">
              All monitored regional power grids are currently stable.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeOutages.map((outage) => (
                <div
                  key={outage.id}
                  onClick={() => onNavigate(`/outage/${outage.id}`)}
                  className={`bg-white p-4 rounded-2xl border-l-4 ${
                    outage.verified ? 'border-[#e41e25]' : 'border-amber-500'
                  } border-y border-r border-[#c2c6d3] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col gap-2`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-[#191c1e]">{outage.barangay}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          outage.verified ? 'bg-[#ffdad6] text-[#93000d]' : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {outage.status}
                        </span>

                        {outage.verified ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">pending</span>
                            <span>Unverified</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#424751] mt-0.5">
                        {outage.cityMunicipality}, {outage.province}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-extrabold ${outage.verified ? 'text-[#e41e25]' : 'text-amber-700'}`}>
                        {outage.peopleAffected}
                      </span>
                      <span className="text-[10px] text-[#737782] block">affected</span>
                    </div>
                  </div>

                  {outage.disputed && (
                    <div className="flex items-center gap-1 text-[11px] text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                      <span className="material-symbols-outlined text-[14px] text-amber-700">warning</span>
                      <span>A community member flagged this as inaccurate</span>
                    </div>
                  )}

                  <p className="text-xs text-[#737782] line-clamp-1">
                    {outage.communityReportedCause}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
