import React, { useState } from 'react';
import { Area, User } from '../types';
import { storageService } from '../services/storageService';
import { locationService } from '../services/locationService';
import { firestoreService } from '../services/firestoreService';
import confetti from 'canvas-confetti';

interface ReportOutageWizardProps {
  currentArea: Area | null;
  currentUser: User;
  onNavigate: (route: string) => void;
  onCancel: () => void;
}

export const ReportOutageWizard: React.FC<ReportOutageWizardProps> = ({
  currentArea,
  currentUser,
  onNavigate,
  onCancel
}) => {
  const activeArea = currentArea || storageService.getSelectedArea();
  const activeUser = currentUser || storageService.getCurrentUser();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Location
  const hierarchy = locationService.getHierarchyOptions();
  const [selectedArea, setSelectedArea] = useState<Area>(activeArea);
  const [selectedRegion, setSelectedRegion] = useState(activeArea?.region || '');
  const [selectedProvince, setSelectedProvince] = useState(activeArea?.province || '');
  const [selectedCity, setSelectedCity] = useState(activeArea?.cityMunicipality || '');
  const [selectedBarangay, setSelectedBarangay] = useState(activeArea?.barangay || '');
  const [subdivision, setSubdivision] = useState(activeArea?.subdivisionVillage || '');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Step 2: Details
  const [outageStartTime, setOutageStartTime] = useState(() => {
    const now = new Date();
    // format as YYYY-MM-DDTHH:mm for datetime-local
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [reportedCause, setReportedCause] = useState('Damaged Pole');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  // Step 3: Confirm & Contact
  const [fullName, setFullName] = useState(activeUser?.name || 'Juan Dela Cruz');
  const [contactNumber, setContactNumber] = useState(
    activeUser?.phoneNumber ? activeUser.phoneNumber.replace('+63', '').trim() : '912 345 6789'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle GPS detection
  const handleUseCurrentLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const res = await locationService.getCurrentPosition();
      setSelectedArea(res.nearestArea);
      setSelectedRegion(res.nearestArea.region);
      setSelectedProvince(res.nearestArea.province);
      setSelectedCity(res.nearestArea.cityMunicipality);
      setSelectedBarangay(res.nearestArea.barangay);
      setSubdivision(res.nearestArea.subdivisionVillage || '');
    } catch (err) {
      console.warn('GPS location error:', err);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachmentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 3 Form Submission
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !contactNumber.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const finalContact = `+63 ${contactNumber.replace(/^\+?63/, '').trim()}`;
      
      const newReport = storageService.createOutageReport({
        reporterId: activeUser?.id || 'user-citizen-default',
        name: fullName.trim(),
        contactNumber: finalContact,
        areaId: selectedArea?.id || activeArea?.id || storageService.getSupportedAreas()[0]?.id || 'area-davao-poblacion-1a',
        region: selectedRegion || selectedArea?.region || activeArea?.region || 'Region XI (Davao Region)',
        province: selectedProvince || selectedArea?.province || activeArea?.province || 'Davao del Sur',
        cityMunicipality: selectedCity || selectedArea?.cityMunicipality || activeArea?.cityMunicipality || 'Davao City',
        barangay: selectedBarangay || selectedArea?.barangay || activeArea?.barangay || 'Poblacion',
        subdivisionVillage: subdivision.trim() || undefined,
        latitude: selectedArea?.latitude || activeArea?.latitude || 7.0731,
        longitude: selectedArea?.longitude || activeArea?.longitude || 125.6128,
        outageStartTime: outageStartTime,
        reportedCause: reportedCause,
        additionalNotes: additionalNotes.trim() || undefined,
        attachmentUrls: attachmentPreview ? [attachmentPreview] : []
      });

      // Synchronize to Firestore cloud in background
      firestoreService.saveReport(newReport).catch((err) => {
        console.warn('Firestore report sync fallback:', err);
      });

      if (newReport.outageId) {
        const linkedOutage = storageService.getOutageById(newReport.outageId);
        if (linkedOutage) {
          firestoreService.saveOutage(linkedOutage).catch(() => {});
        }
      }

      setIsSubmitting(false);
      setStep(4);

      try {
        confetti({
          particleCount: 50,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}
    }, 700);
  };

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 md:px-0 py-6 pb-24 flex flex-col items-center">
      {/* Top Breadcrumb Header for Report wizard */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={step === 1 ? onCancel : () => setStep((s) => (s - 1) as any)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#424751] hover:text-[#00346e] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>{step === 1 ? 'Cancel' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-1 text-xs font-semibold text-[#00346e]">
          <span className="material-symbols-outlined text-[16px] icon-fill">location_on</span>
          <span>{selectedBarangay || currentArea?.barangay || 'Selected Location'}</span>
        </div>
      </div>

      {/* Main Wizard Card */}
      <div className="w-full bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#c2c6d3]/70 overflow-hidden">
        {/* Step Progress Stepper matching Stitch specs */}
        {step < 4 && (
          <div className="bg-[#f8f9fb] px-6 py-6 border-b border-[#e0e3e5]">
            <div className="relative flex items-center justify-between w-full max-w-md mx-auto">
              <div className="absolute top-4 left-0 w-full h-[2px] bg-[#c2c6d3] -z-0"></div>
              <div
                className="absolute top-4 left-0 h-[2px] bg-[#004a98] transition-all duration-300 -z-0"
                style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
              ></div>

              {/* Step 1 Indicator */}
              <div className="flex flex-col items-center gap-1 z-10 bg-[#f8f9fb] px-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > 1
                      ? 'bg-[#004a98] text-white'
                      : 'border-2 border-[#004a98] bg-white text-[#004a98] ring-4 ring-[#d7e3ff]'
                  }`}
                >
                  {step > 1 ? (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  ) : (
                    '1'
                  )}
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    step === 1 ? 'text-[#004a98]' : 'text-[#737782]'
                  }`}
                >
                  Location
                </span>
              </div>

              {/* Step 2 Indicator */}
              <div className="flex flex-col items-center gap-1 z-10 bg-[#f8f9fb] px-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > 2
                      ? 'bg-[#004a98] text-white'
                      : step === 2
                      ? 'border-2 border-[#004a98] bg-white text-[#004a98] ring-4 ring-[#d7e3ff]'
                      : 'border border-[#c2c6d3] bg-[#eceef0] text-[#737782]'
                  }`}
                >
                  {step > 2 ? (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  ) : (
                    '2'
                  )}
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    step === 2 ? 'text-[#004a98]' : 'text-[#737782]'
                  }`}
                >
                  Details
                </span>
              </div>

              {/* Step 3 Indicator */}
              <div className="flex flex-col items-center gap-1 z-10 bg-[#f8f9fb] px-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === 3
                      ? 'border-2 border-[#004a98] bg-white text-[#004a98] ring-4 ring-[#d7e3ff]'
                      : 'border border-[#c2c6d3] bg-[#eceef0] text-[#737782]'
                  }`}
                >
                  3
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    step === 3 ? 'text-[#004a98]' : 'text-[#737782]'
                  }`}
                >
                  Confirm
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: LOCATION SELECTION */}
        {step === 1 && (
          <div className="p-6 md:p-8 flex flex-col gap-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-extrabold text-[#191c1e] tracking-tight">
                Where is the outage?
              </h1>
              <p className="text-xs sm:text-sm text-[#424751] mt-1">
                Please provide the exact location to help dispatch teams and notify affected neighbors.
              </p>
            </div>

            {/* Use Current GPS Location Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isDetectingLocation}
              className="w-full bg-[#00346e] hover:bg-[#004a98] text-white font-bold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
            >
              {isDetectingLocation ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                  <span>Detecting GPS Location...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px] icon-fill">
                    my_location
                  </span>
                  <span>Use current location</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-4">
              <div className="h-px bg-[#c2c6d3] flex-1"></div>
              <span className="text-[11px] font-bold text-[#737782] uppercase tracking-wider">
                Or Enter Manually
              </span>
              <div className="h-px bg-[#c2c6d3] flex-1"></div>
            </div>

            {/* 5-Level Administrative Dropdown Hierarchy */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#191c1e]">Region</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setSelectedProvince('');
                    setSelectedCity('');
                    setSelectedBarangay('');
                  }}
                  className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl px-4 py-3 text-sm text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none"
                >
                  <option value="">Select Region</option>
                  {hierarchy.regions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#191c1e]">Province</label>
                <select
                  value={selectedProvince}
                  disabled={!selectedRegion}
                  onChange={(e) => {
                    setSelectedProvince(e.target.value);
                    setSelectedCity('');
                    setSelectedBarangay('');
                  }}
                  className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl px-4 py-3 text-sm text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none disabled:opacity-50"
                >
                  <option value="">Select Province</option>
                  {selectedRegion &&
                    hierarchy.getProvinces(selectedRegion).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#191c1e]">City / Municipality</label>
                <select
                  value={selectedCity}
                  disabled={!selectedProvince}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setSelectedBarangay('');
                  }}
                  className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl px-4 py-3 text-sm text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none disabled:opacity-50"
                >
                  <option value="">Select City / Municipality</option>
                  {selectedProvince &&
                    hierarchy.getCities(selectedProvince).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#191c1e]">Barangay</label>
                <select
                  value={selectedBarangay}
                  disabled={!selectedCity}
                  onChange={(e) => {
                    setSelectedBarangay(e.target.value);
                    const matched = storageService.getSupportedAreas().find(
                      (a) => a.barangay === e.target.value && a.cityMunicipality === selectedCity
                    );
                    if (matched) setSelectedArea(matched);
                  }}
                  className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl px-4 py-3 text-sm text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none disabled:opacity-50"
                >
                  <option value="">Select Barangay</option>
                  {selectedCity &&
                    hierarchy.getBarangays(selectedCity).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#191c1e]">
                  Subdivision / Zone / Landmark <span className="text-[#737782] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={subdivision}
                  onChange={(e) => setSubdivision(e.target.value)}
                  placeholder="e.g. Zone 1, Vamenta Village, near Plaza"
                  className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl px-4 py-3 text-sm text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none"
                />
              </div>
            </div>

            {/* Next Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!selectedBarangay}
                className="bg-[#00346e] hover:bg-[#004a98] text-white font-bold text-sm py-3 px-8 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <span>Next</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: OUTAGE DETAILS */}
        {step === 2 && (
          <div className="p-6 md:p-8 flex flex-col gap-6 animate-fade-in relative">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#e41e25]"></div>

            <div>
              <h1 className="text-2xl font-extrabold text-[#191c1e] tracking-tight">
                Outage Details
              </h1>
              <p className="text-xs sm:text-sm text-[#424751] mt-1">
                When did it start and what might have caused it?
              </p>
            </div>

            {/* Time Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#191c1e]" htmlFor="startTime">
                When did the outage start?
              </label>
              <div className="relative">
                <input
                  id="startTime"
                  type="datetime-local"
                  required
                  value={outageStartTime}
                  onChange={(e) => setOutageStartTime(e.target.value)}
                  className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl px-4 py-3 text-sm text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none"
                />
              </div>
            </div>

            {/* Possible Cause Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#191c1e]" htmlFor="cause">
                What do you think caused the outage?
              </label>
              <select
                id="cause"
                value={reportedCause}
                onChange={(e) => setReportedCause(e.target.value)}
                className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl px-4 py-3 text-sm text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none"
              >
                <option value="Damaged Pole">Damaged Pole / Downed Line</option>
                <option value="Transformer Failure">Transformer Spark / Explosion</option>
                <option value="Electrical Equipment Issue">Electrical Equipment Issue</option>
                <option value="Weather-related">Weather-related (Heavy Rain / Thunder)</option>
                <option value="Accident / Vehicular Impact">Vehicular Impact / Construction Hit</option>
                <option value="Planned Maintenance">Planned Maintenance</option>
                <option value="Unknown">Unknown / Sudden Blackout</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Additional Observations Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#191c1e]" htmlFor="notes">
                Additional Observations <span className="text-[#737782] font-normal">(Optional)</span>
              </label>
              <textarea
                id="notes"
                rows={2}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g. Whole street lost power, smoke seen near pole #42, traffic lights off..."
                className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl p-3 text-xs sm:text-sm text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none resize-none"
              ></textarea>
            </div>

            {/* Photo / Video Attachment Uploader */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-[#191c1e]">
                  Add photo or video
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#eceef0] text-[#737782]">
                  Optional
                </span>
              </div>
              <p className="text-[11px] text-[#737782]">
                Photos or videos help our verification team confirm the report faster.
              </p>

              {attachmentPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-[#c2c6d3] bg-[#eceef0] p-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={attachmentPreview}
                      alt="Attachment Preview"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#191c1e]">Photo Evidence Attached</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">Ready for verification</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachmentPreview(null)}
                    className="p-2 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-[#c2c6d3] hover:border-[#004a98] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-[#f8f9fb] hover:bg-[#f2f4f6] transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-[#eceef0] group-hover:bg-[#d7e3ff] flex items-center justify-center text-[#737782] group-hover:text-[#00346e] transition-colors">
                    <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                  </div>
                  <span className="text-xs font-bold text-[#191c1e] group-hover:text-[#004a98]">
                    Tap to upload photo evidence
                  </span>
                  <span className="text-[11px] text-[#737782]">
                    JPG, PNG, or MP4 (Max 10MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Stepper Buttons */}
            <div className="pt-4 flex items-center justify-between gap-4 border-t border-[#e0e3e5]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl border border-[#00346e] text-[#00346e] text-xs font-bold hover:bg-[#d7e3ff] transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-[#00346e] hover:bg-[#004a98] text-white font-bold text-xs py-3 px-8 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
              >
                <span>Next</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRM & SUBMIT */}
        {step === 3 && (
          <form onSubmit={handleSubmitReport} className="p-6 md:p-8 flex flex-col gap-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-extrabold text-[#191c1e] tracking-tight">
                Confirm & Submit
              </h1>
              <p className="text-xs sm:text-sm text-[#424751] mt-1">
                Please provide your contact information to help our team verify this report.
              </p>
            </div>

            {/* Summary Preview Box */}
            <div className="bg-[#f2f4f6] rounded-xl p-4 border border-[#c2c6d3] flex flex-col gap-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#e0e3e5]">
                <span className="font-bold text-[#737782] uppercase">Outage Location</span>
                <span className="font-bold text-[#191c1e]">{selectedBarangay}, {selectedCity}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#e0e3e5]">
                <span className="font-bold text-[#737782] uppercase">Reported Cause</span>
                <span className="font-bold text-[#004a98]">{reportedCause}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#737782] uppercase">Start Time</span>
                <span className="font-bold text-[#191c1e]">{new Date(outageStartTime).toLocaleString()}</span>
              </div>
            </div>

            {/* Full Name Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#191c1e]" htmlFor="fullName">
                Full Name <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Juan Dela Cruz"
                className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl px-4 py-3 text-sm text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none"
              />
            </div>

            {/* Contact Number Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#191c1e]" htmlFor="contactNumber">
                Contact Number <span className="text-[#ba1a1a]">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-sm font-semibold text-[#737782] select-none">
                  +63
                </span>
                <input
                  id="contactNumber"
                  type="tel"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="912 345 6789"
                  className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl pl-14 pr-4 py-3 text-sm text-[#191c1e] focus:ring-2 focus:ring-[#004a98] outline-none"
                />
              </div>
            </div>

            {/* Strict Privacy Protection Notice Banner */}
            <div className="bg-[#d7e3ff]/40 border border-[#abc7ff] rounded-xl p-4 flex gap-3 items-start">
              <span className="material-symbols-outlined text-[#00346e] text-[22px] shrink-0 mt-0.5 icon-fill">
                shield_lock
              </span>
              <p className="text-xs text-[#001b3f] leading-relaxed">
                Your information will be required for verification purposes but it will <strong>NOT be revealed to the public</strong>.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-[#e0e3e5]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[#00346e] text-[#00346e] text-xs font-bold hover:bg-[#d7e3ff] transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !fullName.trim() || !contactNumber.trim()}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#004a98] hover:bg-[#00346e] text-white font-bold text-xs shadow-xs transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                    <span>Submitting Report...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Submit Report</span>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: THANK YOU / SUBMITTED MODAL */}
        {step === 4 && (
          <div className="p-8 md:p-12 flex flex-col items-center text-center gap-6 animate-fade-in">
            <div className="w-20 h-20 bg-[#d7e3ff] text-[#00346e] rounded-full flex items-center justify-center ring-8 ring-white shadow-lg animate-pulse-soft">
              <span className="material-symbols-outlined text-[44px] icon-fill">
                check_circle
              </span>
            </div>

            <div className="max-w-md">
              <h2 className="text-2xl font-extrabold text-[#191c1e]">
                Thank you for reporting
              </h2>
              <p className="text-sm text-[#424751] mt-2 leading-relaxed">
                Your report has been submitted and is now <strong>immediately visible on the live map</strong> tagged with the <span className="font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">Unverified</span> tag. Our verification team and utility dispatchers will review details shortly to confirm.
              </p>
            </div>

            <div className="w-full max-w-sm flex flex-col gap-3 mt-2">
              <button
                onClick={() => onNavigate('/map')}
                className="w-full bg-[#e41e25] hover:bg-[#c9181e] text-white py-3.5 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">map</span>
                <span>View on Live Outage Map</span>
              </button>

              <button
                onClick={() => onNavigate('/history')}
                className="w-full bg-[#00346e] hover:bg-[#004a98] text-white py-3.5 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">manage_search</span>
                <span>View in Outage History</span>
              </button>

              <button
                onClick={() => onNavigate('/home')}
                className="w-full bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#191c1e] py-3 rounded-xl text-xs font-bold border border-[#c2c6d3] transition-all"
              >
                Back to Home Dashboard
              </button>

              {(currentUser.role === 'admin' || currentUser.role === 'verification_team') && (
                <button
                  onClick={() => onNavigate('/verification')}
                  className="w-full bg-purple-50 hover:bg-purple-100 text-purple-900 py-3 rounded-xl text-xs font-bold border border-purple-200 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>View Verification Queue</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
