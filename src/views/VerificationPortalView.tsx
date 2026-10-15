import React, { useState, useEffect } from 'react';
import { OutageReport, User, Area, Outage } from '../types';
import { storageService } from '../services/storageService';
import { firestoreService } from '../services/firestoreService';
import confetti from 'canvas-confetti';

interface VerificationPortalViewProps {
  currentUser?: User;
  onNavigate: (route: string) => void;
}

export const VerificationPortalView: React.FC<VerificationPortalViewProps> = ({
  currentUser,
  onNavigate
}) => {
  const activeUser = currentUser || storageService.getCurrentUser();

  const [reports, setReports] = useState<OutageReport[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState('ALL');
  
  // Modals state
  const [selectedReport, setSelectedReport] = useState<OutageReport | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewCause, setReviewCause] = useState('');
  const [reviewProvider, setReviewProvider] = useState('Davao Light (DLPC)');
  const [reviewHours, setReviewHours] = useState(4);
  const [reviewStatus, setReviewStatus] = useState<Outage['status']>('Repairing');
  const [reviewNotes, setReviewNotes] = useState('');
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<OutageReport | null>(null);
  
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [copiedContact, setCopiedContact] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadData = () => {
    setReports(storageService.getReports());
  };

  useEffect(() => {
    loadData();
    const unsub = storageService.subscribe(loadData);
    return unsub;
  }, []);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  // Quick 1-click verify
  const handleQuickVerify = (report: OutageReport) => {
    const outage = storageService.verifyReport(
      report.id,
      activeUser.id,
      `Verified by ${activeUser.name} (${activeUser.role})`,
      {
        initialStatus: 'Repairing'
      }
    );

    if (outage) {
      firestoreService.saveOutage(outage).catch(() => {});
    }
    firestoreService.updateReportStatus(report.id, 'verified').catch(() => {});

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {}

    triggerToast(`Report in ${report.barangay} verified & active on live grid!`);
  };

  // Open detailed review & custom dispatch modal
  const openReviewModal = (report: OutageReport) => {
    setSelectedReport(report);
    setReviewCause(report.reportedCause || 'Electrical equipment issue');
    setReviewStatus('Repairing');
    
    // Auto-detect provider based on region/city
    if (report.cityMunicipality.toLowerCase().includes('cagayan')) {
      setReviewProvider('CEPALCO');
    } else if (report.cityMunicipality.toLowerCase().includes('cebu')) {
      setReviewProvider('VECO');
    } else if (report.cityMunicipality.toLowerCase().includes('davao')) {
      setReviewProvider('Davao Light (DLPC)');
    } else {
      setReviewProvider('Meralco');
    }
    
    setReviewHours(4);
    setReviewNotes(`Incident confirmed at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Verification team dispatching field repairs.`);
    setShowReviewModal(true);
  };

  // Confirm custom review & publish
  const handleConfirmCustomVerify = () => {
    if (!selectedReport) return;
    const outage = storageService.verifyReport(
      selectedReport.id,
      activeUser.id,
      reviewNotes.trim() || `Verified root cause: ${reviewCause}`,
      {
        cause: reviewCause,
        provider: reviewProvider,
        estimatedHours: reviewHours,
        initialStatus: reviewStatus
      }
    );

    if (outage) {
      firestoreService.saveOutage(outage).catch(() => {});
    }
    firestoreService.updateReportStatus(selectedReport.id, 'verified').catch(() => {});

    setShowReviewModal(false);
    setSelectedReport(null);

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    triggerToast(`Outage published for ${selectedReport.barangay} as "${reviewStatus}"!`);
  };

  // Open reject modal
  const openRejectModal = (report: OutageReport) => {
    setSelectedReport(report);
    setRejectReason('Duplicate citizen report of active incident');
    setShowRejectModal(true);
  };

  // Confirm rejection
  const handleConfirmReject = () => {
    if (!selectedReport) return;
    storageService.rejectReport(
      selectedReport.id,
      activeUser.id,
      rejectReason.trim() || 'Duplicate or unverifiable report'
    );
    firestoreService.updateReportStatus(selectedReport.id, 'rejected').catch(() => {});
    setShowRejectModal(false);
    setSelectedReport(null);
    setRejectReason('');
    triggerToast(`Report #${selectedReport.id.slice(-6)} flagged as rejected.`);
  };

  // Reopen report back to pending
  const handleReopen = (reportId: string) => {
    storageService.reopenReport(reportId);
    firestoreService.updateReportStatus(reportId, 'pending').catch(() => {});
    triggerToast('Report returned to Pending Queue.');
  };

  // Permanently delete report from records (Admin debug action)
  const handleConfirmDelete = async () => {
    if (!reportToDelete) return;
    const targetId = reportToDelete.id;
    const targetBrgy = reportToDelete.barangay;
    
    storageService.deleteReport(targetId);
    await firestoreService.deleteReport(targetId).catch((err) => {
      console.warn('Firestore cloud delete error or offline:', err);
    });

    setShowDeleteModal(false);
    setReportToDelete(null);
    loadData();
    triggerToast(`Report #${targetId.slice(-8)} (${targetBrgy}) permanently deleted.`);
  };

  // Generate sample test report for demonstration
  const handleCreateSampleReport = () => {
    const areas = storageService.getSupportedAreas();
    const randomArea: Area = areas[Math.floor(Math.random() * areas.length)] || areas[0];
    const causes = ['Transformer explosion', 'Fallen tree branches on power line', 'Loud spark from electric pole', 'Substation primary tripping'];
    const randomCause = causes[Math.floor(Math.random() * causes.length)];

    storageService.createOutageReport({
      reporterId: 'user-citizen-demo',
      name: 'Maria Santos',
      contactNumber: '+63 917 889 4412',
      areaId: randomArea.id,
      region: randomArea.region,
      province: randomArea.province,
      cityMunicipality: randomArea.cityMunicipality,
      barangay: randomArea.barangay,
      subdivisionVillage: 'Phase 2, Block 5',
      latitude: randomArea.latitude,
      longitude: randomArea.longitude,
      outageStartTime: new Date().toISOString(),
      reportedCause: randomCause,
      additionalNotes: 'Loud electric buzzing heard before street went completely black. Neighbors are also reporting brownout.',
      attachmentUrls: []
    });

    setActiveTab('pending');
    triggerToast(`Sample report generated for ${randomArea.barangay}!`);
  };

  // Copy contact to clipboard
  const handleCopyContact = (contact: string) => {
    navigator.clipboard?.writeText(contact);
    setCopiedContact(contact);
    setTimeout(() => setCopiedContact(null), 2500);
  };

  // Switch role helper
  const handleSwitchToVerifier = () => {
    storageService.switchUserRole('verification_team');
  };

  // Filtering
  const filteredReports = reports.filter((r) => {
    const matchesTab = r.verificationStatus === activeTab;
    if (!matchesTab) return false;

    if (selectedCityFilter !== 'ALL' && !r.cityMunicipality.toLowerCase().includes(selectedCityFilter.toLowerCase())) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchBarangay = r.barangay?.toLowerCase().includes(q);
      const matchCity = r.cityMunicipality?.toLowerCase().includes(q);
      const matchName = r.name?.toLowerCase().includes(q);
      const matchCause = r.reportedCause?.toLowerCase().includes(q);
      const matchNotes = r.additionalNotes?.toLowerCase().includes(q);
      const matchContact = r.contactNumber?.toLowerCase().includes(q);
      return matchBarangay || matchCity || matchName || matchCause || matchNotes || matchContact;
    }

    return true;
  });

  const pendingCount = reports.filter((r) => r.verificationStatus === 'pending').length;
  const verifiedCount = reports.filter((r) => r.verificationStatus === 'verified').length;
  const rejectedCount = reports.filter((r) => r.verificationStatus === 'rejected').length;

  const isVerifierOrAdmin =
    activeUser?.role === 'verification_team' ||
    activeUser?.role === 'admin' ||
    activeUser?.role === 'utility_provider' ||
    activeUser?.role === 'lgu';

  const isAdmin = activeUser?.role === 'admin' || storageService.isAdmin(activeUser);

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-6 pb-24 md:pb-12 flex flex-col gap-6" id="verification-portal-main">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-4 z-50 bg-[#00346e] text-white px-4 py-3 rounded-2xl shadow-xl border border-[#abc7ff] flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">check_circle</span>
          <span>{successToast}</span>
        </div>
      )}

      {/* Role Alert Banner if User is Not Verifier */}
      {!isVerifierOrAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-amber-700">admin_panel_settings</span>
            <div>
              <p className="text-xs font-bold">You are currently viewing as: {activeUser.role}</p>
              <p className="text-[11px] text-amber-800">
                You have full access to test and trigger verifications. Switch to Verification Team role for dedicated permissions.
              </p>
            </div>
          </div>
          <button
            onClick={handleSwitchToVerifier}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-2xs"
          >
            Switch to Verifier Mode
          </button>
        </div>
      )}

      {/* Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#00346e] mb-1">
            <span className="material-symbols-outlined text-[24px] icon-fill text-[#004a98]">
              verified_user
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#737782]">
              PhilSePush Dispatch & Triage Control
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#191c1e] tracking-tight">
            Verification Queue & Dispatch Portal
          </h1>
          <p className="text-xs sm:text-sm text-[#737782] mt-0.5">
            Review incoming citizen power reports, inspect evidence, telephone-verify, and publish outages to the national grid map.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateSampleReport}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#c2c6d3] hover:bg-[#f2f4f6] text-xs font-bold text-[#004a98] shadow-2xs flex items-center gap-1.5 transition-colors"
            title="Generate a realistic citizen test report in the queue"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Sample Report</span>
          </button>

          <div className="flex items-center gap-2 bg-[#d7e3ff] px-3.5 py-2 rounded-xl border border-[#abc7ff]">
            <span className="material-symbols-outlined text-[20px] text-[#00346e]">
              security
            </span>
            <span className="text-xs font-bold text-[#00346e]">
              {activeUser.name} ({activeUser.role.replace('_', ' ')})
            </span>
          </div>
        </div>
      </div>

      {/* Quick Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#c2c6d3] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#737782] uppercase tracking-wider">Awaiting Verification</p>
            <p className="text-2xl font-black text-[#ba1a1a] mt-0.5">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#ffdad6] text-[#93000d] flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">pending_actions</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#c2c6d3] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#737782] uppercase tracking-wider">Verified & On Map</p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">{verifiedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">task_alt</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#c2c6d3] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#737782] uppercase tracking-wider">Rejected / Flagged</p>
            <p className="text-2xl font-black text-[#737782] mt-0.5">{rejectedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#eceef0] text-[#737782] flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">block</span>
          </div>
        </div>
      </div>

      {/* Controls Bar: Tabs, Search & City Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-[#c2c6d3] shadow-2xs">
        {/* Tabs */}
        <div className="flex gap-1.5 p-1 bg-[#f2f4f6] rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-2 font-bold text-xs rounded-lg flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'pending'
                ? 'bg-white text-[#004a98] shadow-xs'
                : 'text-[#737782] hover:text-[#191c1e]'
            }`}
          >
            <span>Pending Review</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              pendingCount > 0 ? 'bg-[#ffdad6] text-[#93000d]' : 'bg-[#e0e3e5] text-[#737782]'
            }`}>
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('verified')}
            className={`px-3.5 py-2 font-bold text-xs rounded-lg flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'verified'
                ? 'bg-white text-[#004a98] shadow-xs'
                : 'text-[#737782] hover:text-[#191c1e]'
            }`}
          >
            <span>Verified Outages</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
              {verifiedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3.5 py-2 font-bold text-xs rounded-lg flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'rejected'
                ? 'bg-white text-[#004a98] shadow-xs'
                : 'text-[#737782] hover:text-[#191c1e]'
            }`}
          >
            <span>Rejected / Spam</span>
            <span className="px-2 py-0.5 rounded-full bg-[#eceef0] text-[#737782] text-[10px] font-extrabold">
              {rejectedCount}
            </span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#737782] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports..."
              className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl pl-9 pr-3 py-2 text-xs text-[#191c1e] outline-none focus:ring-2 focus:ring-[#004a98]"
            />
          </div>

          <select
            value={selectedCityFilter}
            onChange={(e) => setSelectedCityFilter(e.target.value)}
            className="bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl px-3 py-2 text-xs font-semibold text-[#191c1e] outline-none focus:ring-2 focus:ring-[#004a98]"
          >
            <option value="ALL">All Cities</option>
            <option value="Davao">Davao City</option>
            <option value="Cebu">Cebu City</option>
            <option value="Makati">Makati City</option>
            <option value="Cagayan">Cagayan de Oro</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#c2c6d3] flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#737782]">
            <span className="material-symbols-outlined text-[36px]">
              {activeTab === 'pending' ? 'task_alt' : activeTab === 'verified' ? 'verified' : 'delete_sweep'}
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-[#191c1e]">
              No {activeTab} reports in queue
            </h3>
            <p className="text-xs text-[#737782] mt-1 max-w-sm">
              {activeTab === 'pending'
                ? 'All citizen power interruption submissions have been reviewed and dispatched.'
                : `There are currently no reports marked as ${activeTab}.`}
            </p>
          </div>
          {activeTab === 'pending' && (
            <button
              onClick={handleCreateSampleReport}
              className="mt-2 px-4 py-2 bg-[#004a98] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#00346e] transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Generate Test Incident</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((report) => {
            const isPending = report.verificationStatus === 'pending';
            const isVerified = report.verificationStatus === 'verified';
            const isRejected = report.verificationStatus === 'rejected';

            return (
              <div
                key={report.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-2xs flex flex-col justify-between gap-4 ${
                  isPending
                    ? 'border-amber-300 hover:border-amber-400'
                    : isVerified
                    ? 'border-emerald-200'
                    : 'border-[#c2c6d3] bg-[#f8f9fb]/50'
                }`}
              >
                <div className="flex flex-col gap-3">
                  {/* Status & ID Badge Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#e0e3e5] pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md flex items-center gap-1 ${
                          isPending
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isVerified
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>{report.verificationStatus.toUpperCase()}</span>
                      </span>

                      <span className="text-[10px] font-mono text-[#737782]">
                        #{report.id.slice(-8)}
                      </span>
                    </div>

                    <span className="text-[11px] font-medium text-[#737782] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span>{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>

                  {/* Location Title */}
                  <div>
                    <h3 className="text-base font-extrabold text-[#191c1e] tracking-tight">
                      {report.barangay}, {report.cityMunicipality}
                    </h3>
                    <p className="text-xs text-[#737782] mt-0.5 font-medium">
                      {report.subdivisionVillage ? `${report.subdivisionVillage} • ` : ''}
                      {report.province}, {report.region}
                    </p>
                  </div>

                  {/* Community Inaccurate Flag Alert */}
                  {report.disputed && (
                    <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-950">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0">warning</span>
                        <span className="font-bold truncate">A community member flagged this as inaccurate</span>
                      </div>
                      {report.disputeReason && (
                        <span className="text-[10px] italic text-amber-900 bg-white/80 px-2 py-0.5 rounded border border-amber-200 shrink-0 max-w-[140px] truncate">
                          "{report.disputeReason}"
                        </span>
                      )}
                    </div>
                  )}

                  {/* Reporter Contact & Verification Telephony Bar */}
                  <div className="bg-[#f8f9fb] p-3 rounded-xl border border-[#e0e3e5] flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#004a98]">person</span>
                        <span className="font-bold text-[#191c1e] truncate">{report.name}</span>
                      </div>
                      <p className="text-[11px] text-[#737782] font-mono mt-0.5">
                        {report.contactNumber}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopyContact(report.contactNumber)}
                        className="p-1.5 text-[#737782] hover:text-[#004a98] hover:bg-[#eceef0] rounded-lg transition-colors"
                        title="Copy phone number"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {copiedContact === report.contactNumber ? 'check' : 'content_copy'}
                        </span>
                      </button>

                      <a
                        href={`tel:${report.contactNumber}`}
                        className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px]"
                        title="Call reporter for telephone verification"
                      >
                        <span className="material-symbols-outlined text-[14px]">call</span>
                        <span>Call</span>
                      </a>
                    </div>
                  </div>

                  {/* Reported Outage Characteristics */}
                  <div className="bg-[#f2f4f6] p-3 rounded-xl flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-[#737782]">Citizen Reported Cause:</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-white rounded border border-[#c2c6d3] text-[#00346e]">
                        {report.reportedCause}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#424751] mt-0.5">
                      <span>Outage Started:</span>
                      <span className="font-semibold">
                        {new Date(report.outageStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#424751]">
                      <span>Community Me-Too:</span>
                      <span className="font-bold text-[#004a98]">{report.meTooCount || 1} citizens confirmed</span>
                    </div>

                    {report.additionalNotes && (
                      <p className="text-xs text-[#424751] italic bg-white p-2.5 rounded-lg border border-[#e0e3e5] mt-1">
                        &ldquo;{report.additionalNotes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Rejection Reason display if rejected */}
                  {isRejected && report.rejectionReason && (
                    <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-900">
                      <span className="font-bold block text-[10px] uppercase">Rejection Reason:</span>
                      <p className="mt-0.5">{report.rejectionReason}</p>
                    </div>
                  )}

                  {/* Photo Evidence Preview */}
                  {report.attachmentUrls && report.attachmentUrls.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-[#737782] uppercase block mb-1">
                        Attached Evidence ({report.attachmentUrls.length})
                      </span>
                      <div className="flex gap-2 overflow-x-auto">
                        {report.attachmentUrls.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt="Outage Evidence"
                            onClick={() => setPreviewPhotoUrl(url)}
                            className="w-20 h-16 object-cover rounded-lg border border-[#c2c6d3] cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="border-t border-[#e0e3e5] pt-3 flex items-center justify-between gap-2">
                  {isPending && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openRejectModal(report)}
                          className="px-3.5 py-2 rounded-xl border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6]/40 text-xs font-bold transition-colors"
                        >
                          Reject
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setReportToDelete(report);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-[#ba1a1a] hover:bg-[#ffdad6]/60 rounded-xl transition-colors shrink-0"
                            title="Delete report from records (Admin Debug)"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-1 justify-end">
                        <button
                          onClick={() => openReviewModal(report)}
                          className="px-3 py-2 rounded-xl bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#00346e] text-xs font-bold transition-colors flex items-center gap-1"
                          title="Open full review dialog to customize dispatch details"
                        >
                          <span className="material-symbols-outlined text-[16px]">tune</span>
                          <span>Details</span>
                        </button>

                        <button
                          onClick={() => handleQuickVerify(report)}
                          className="flex-1 max-w-[200px] py-2 px-3 rounded-xl bg-[#004a98] hover:bg-[#00346e] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          <span>Verify & Publish</span>
                        </button>
                      </div>
                    </>
                  )}

                  {isVerified && (
                    <div className="w-full flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        <span>Active on Live Grid</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setReportToDelete(report);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6]/60 rounded-xl transition-colors shrink-0"
                            title="Delete report from records (Admin Debug)"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                        {report.outageId && (
                          <button
                            onClick={() => onNavigate(`/outage/${report.outageId}`)}
                            className="px-3 py-1.5 bg-[#004a98] hover:bg-[#00346e] text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1 transition-colors"
                          >
                            <span>View Outage Page</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </button>
                        )}
                        <button
                          onClick={() => onNavigate('/map')}
                          className="px-2.5 py-1.5 bg-[#f2f4f6] text-[#00346e] text-xs font-bold rounded-xl hover:bg-[#e0e3e5]"
                        >
                          Map
                        </button>
                      </div>
                    </div>
                  )}

                  {isRejected && (
                    <div className="w-full flex items-center justify-between gap-2">
                      <span className="text-xs text-[#737782] font-semibold">Report dismissed</span>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setReportToDelete(report);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6]/60 rounded-xl transition-colors shrink-0"
                            title="Delete report from records (Admin Debug)"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleReopen(report.id)}
                          className="px-3 py-1.5 bg-white border border-[#c2c6d3] text-[#004a98] text-xs font-bold rounded-xl hover:bg-[#f2f4f6] flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">replay</span>
                          <span>Reopen to Queue</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Review & Custom Dispatch Modal */}
      {showReviewModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#c2c6d3] max-h-[90vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#004a98] tracking-wider">
                  Verification Workbench
                </span>
                <h3 className="text-lg font-extrabold text-[#191c1e]">
                  Publish Outage: {selectedReport.barangay}
                </h3>
                <p className="text-xs text-[#737782]">
                  {selectedReport.cityMunicipality}, {selectedReport.province}
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 text-[#737782] hover:text-[#191c1e] rounded-xl hover:bg-[#eceef0]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Inaccurate Flag Warning in Review Modal */}
            {selectedReport.disputed && (
              <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950 shadow-2xs animate-fade-in">
                <span className="material-symbols-outlined text-[22px] text-amber-700 shrink-0 mt-0.5">warning</span>
                <div>
                  <p className="font-extrabold text-amber-950">
                    A community member flagged this as inaccurate
                  </p>
                  {selectedReport.disputeReason && (
                    <p className="text-[11px] text-amber-900 italic mt-1 bg-white/80 p-2 rounded-lg border border-amber-200">
                      Reason: &ldquo;{selectedReport.disputeReason}&rdquo;
                    </p>
                  )}
                  <p className="text-[10px] text-amber-800 mt-1 font-medium">
                    Verifying and dispatching this incident will officially confirm the report and clear the inaccuracy flag.
                  </p>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="font-bold text-[#424751] block mb-1">
                  Distribution Utility Provider
                </label>
                <select
                  value={reviewProvider}
                  onChange={(e) => setReviewProvider(e.target.value)}
                  className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl p-3 text-xs font-semibold text-[#191c1e] outline-none focus:ring-2 focus:ring-[#004a98]"
                >
                  <option value="Davao Light (DLPC)">Davao Light & Power Co. (Davao)</option>
                  <option value="Meralco">Meralco (Metro Manila / Rizal / Bulacan)</option>
                  <option value="VECO">VECO - Visayan Electric (Cebu)</option>
                  <option value="CEPALCO">CEPALCO (Cagayan de Oro)</option>
                  <option value="MORE Power">MORE Electric (Iloilo)</option>
                  <option value="National Grid Corp. (NGCP)">NGCP Transmission</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#424751] block mb-1">
                  Confirmed / Classified Root Cause
                </label>
                <select
                  value={reviewCause}
                  onChange={(e) => setReviewCause(e.target.value)}
                  className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl p-3 text-xs font-semibold text-[#191c1e] outline-none focus:ring-2 focus:ring-[#004a98]"
                >
                  <option value="Transformer explosion / Faulty pole unit">Transformer explosion / Faulty pole unit</option>
                  <option value="Fallen tree branches over distribution lines">Fallen tree branches over distribution lines</option>
                  <option value="Feeder line primary tripping">Feeder line primary tripping</option>
                  <option value="Substation breaker emergency shutdown">Substation breaker emergency shutdown</option>
                  <option value="Severe weather / Thunderstorm lightning strike">Severe weather / Thunderstorm lightning strike</option>
                  <option value="Vehicular accident damaged electric post">Vehicular accident damaged electric post</option>
                  <option value="Emergency maintenance / Unscheduled repair">Emergency maintenance / Unscheduled repair</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#424751] block mb-1.5">
                  Initial Outage Lifecycle Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('Repairing')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-0.5 ${
                      reviewStatus === 'Repairing'
                        ? 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-400/40'
                        : 'bg-[#f8f9fb] text-[#424751] border-[#c2c6d3] hover:bg-white'
                    }`}
                  >
                    <span className="font-extrabold text-rose-700">Fixing (Active)</span>
                    <span className="text-[10px] text-[#737782]">Crews dispatched</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('Investigating')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-0.5 ${
                      reviewStatus === 'Investigating'
                        ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-400/40'
                        : 'bg-[#f8f9fb] text-[#424751] border-[#c2c6d3] hover:bg-white'
                    }`}
                  >
                    <span className="font-extrabold text-amber-700">Investigating</span>
                    <span className="text-[10px] text-[#737782]">Field assessment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('Restoring')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-0.5 ${
                      reviewStatus === 'Restoring'
                        ? 'bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-400/40'
                        : 'bg-[#f8f9fb] text-[#424751] border-[#c2c6d3] hover:bg-white'
                    }`}
                  >
                    <span className="font-extrabold text-blue-700">Restoring</span>
                    <span className="text-[10px] text-[#737782]">Energizing grid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('Restored')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-0.5 ${
                      reviewStatus === 'Restored'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400/40'
                        : 'bg-[#f8f9fb] text-[#424751] border-[#c2c6d3] hover:bg-white'
                    }`}
                  >
                    <span className="font-extrabold text-emerald-700">Resolved</span>
                    <span className="text-[10px] text-[#737782]">Already restored</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#424751] block mb-1">
                  Estimated Restoration Time Window
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 4, 6, 12].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setReviewHours(hours)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        reviewHours === hours
                          ? 'bg-[#004a98] text-white border-[#004a98]'
                          : 'bg-[#f8f9fb] text-[#424751] border-[#c2c6d3] hover:bg-[#eceef0]'
                      }`}
                    >
                      {hours} Hours
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-[#424751] block mb-1">
                  Public Dispatcher Advisory Notes
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Official status note visible to affected residents..."
                  className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl p-3 text-xs text-[#191c1e] outline-none focus:ring-2 focus:ring-[#004a98]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e0e3e5]">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-[#424751] hover:bg-[#eceef0] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCustomVerify}
                className="px-6 py-2.5 bg-[#004a98] hover:bg-[#00346e] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Publish to Live Map</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#c2c6d3] flex flex-col gap-4">
            <div>
              <h3 className="text-base font-bold text-[#191c1e]">
                Reject Report #{selectedReport.id.slice(-6)}
              </h3>
              <p className="text-xs text-[#737782] mt-0.5">
                {selectedReport.barangay}, {selectedReport.cityMunicipality} • Reported by {selectedReport.name}
              </p>
            </div>

            {/* Preset chips */}
            <div>
              <label className="text-[11px] font-bold text-[#424751] block mb-1.5">
                Common Rejection Reasons
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Duplicate citizen report of active incident',
                  'Power verified as currently restored by utility',
                  'Incomplete or unverifiable location coordinates',
                  'Private household issue / Breaker trip only',
                  'Spam or test report'
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setRejectReason(chip)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left ${
                      rejectReason === chip
                        ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                        : 'bg-[#f8f9fb] text-[#424751] border-[#c2c6d3] hover:bg-[#eceef0]'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#424751] block mb-1">
                Custom Rejection Remarks
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl p-3 text-xs text-[#191c1e] focus:ring-2 focus:ring-[#ba1a1a] outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#e0e3e5]">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-[#424751] hover:bg-[#eceef0] rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2.5 text-xs font-bold bg-[#ba1a1a] text-white hover:bg-[#93000d] rounded-xl shadow-xs transition-colors"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Fullscreen Modal */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in cursor-pointer"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="max-w-3xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewPhotoUrl}
              alt="Evidence Full View"
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/20"
            />
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute -top-3 -right-3 bg-white text-[#191c1e] p-2 rounded-full shadow-lg font-bold hover:bg-gray-100"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Debug Delete Report Confirmation Modal */}
      {showDeleteModal && reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#c2c6d3] animate-slide-up flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-[#ba1a1a] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">delete_forever</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#191c1e]">Delete Report Record</h3>
                <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md uppercase">
                  Admin Debugging Feature
                </span>
              </div>
            </div>

            <p className="text-xs text-[#424751] leading-relaxed">
              Are you sure you want to permanently delete report{' '}
              <span className="font-mono font-bold text-[#191c1e]">#{reportToDelete.id.slice(-8)}</span> from{' '}
              <span className="font-semibold text-[#191c1e]">{reportToDelete.barangay}, {reportToDelete.cityMunicipality}</span>?
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0 mt-0.5">warning</span>
              <span>This will purge this report from the local records and Firestore database. If this was the only pending report for an unverified incident, the unverified pin will also be removed.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#e0e3e5]">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setReportToDelete(null);
                }}
                className="px-4 py-2.5 text-xs font-bold text-[#424751] hover:bg-[#eceef0] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 text-xs font-bold bg-[#ba1a1a] hover:bg-[#93000d] text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
