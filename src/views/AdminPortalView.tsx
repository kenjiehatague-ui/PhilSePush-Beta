import React, { useState, useEffect } from 'react';
import { Area, Outage, OutageReport, User, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { firestoreService } from '../services/firestoreService';

interface AdminPortalViewProps {
  currentUser: User;
  onNavigate: (route: string) => void;
  onUserChange?: (user: User) => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  currentUser,
  onNavigate,
  onUserChange
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'outages' | 'areas' | 'scheduled'>('users');
  const [outages, setOutages] = useState<Outage[]>([]);
  const [reports, setReports] = useState<OutageReport[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reports Debugging & Management state
  const [searchReportQuery, setSearchReportQuery] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState<'ALL' | 'pending' | 'verified' | 'rejected'>('ALL');
  const [reportCityFilter, setReportCityFilter] = useState('ALL');
  const [deleteReportTarget, setDeleteReportTarget] = useState<OutageReport | null>(null);
  const [isDeletingReport, setIsDeletingReport] = useState(false);

  // Form states
  const [statusUpdateOutageId, setStatusUpdateOutageId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<Outage['status']>('Repairing');
  const [officialCause, setOfficialCause] = useState('');
  const [officialMessage, setOfficialMessage] = useState('');

  // New Area form
  const [newBarangay, setNewBarangay] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newProvince, setNewProvince] = useState('');
  const [newProvider, setNewProvider] = useState('Davao Light');

  // New Scheduled Outage form
  const [schedAreaId, setSchedAreaId] = useState('');
  const [schedReason, setSchedReason] = useState('');
  const [schedDate, setSchedDate] = useState('');

  // New User Account form
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('utility_provider');
  const [newUserOrg, setNewUserOrg] = useState('');

  const loadData = () => {
    setOutages(storageService.getOutages());
    setReports(storageService.getReports());
    setAreas(storageService.getSupportedAreas());
    setScheduled(storageService.getScheduledOutages());
    setUsers(storageService.getUsers());
  };

  useEffect(() => {
    loadData();
    const unsub = storageService.subscribe(loadData);
    return unsub;
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole, userOrg?: string) => {
    const target = users.find((u) => u.id === userId);
    storageService.setUserRole(userId, newRole, userOrg);
    await firestoreService.saveUserRole(userId, newRole, userOrg, target?.email).catch(() => {});
    loadData();
    if (
      currentUser.id === userId ||
      (target?.email && currentUser.email?.toLowerCase() === target.email.toLowerCase())
    ) {
      const updated = storageService.getCurrentUser();
      onUserChange?.(updated);
    }
    triggerToast(`User role updated to ${newRole.replace('_', ' ').toUpperCase()}`);
  };

  const handleSwitchActiveRole = (role: UserRole) => {
    storageService.switchUserRole(role);
    const updated = storageService.getCurrentUser();
    onUserChange?.(updated);
    triggerToast(`Active session switched to ${role.toUpperCase()}`);
  };

  const handleCreateUserAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const email = newUserEmail.trim().toLowerCase();
    const existing = storageService.findUserByEmail(email);
    const userId = existing ? existing.id : `preauth-${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const newUser: User = {
      id: userId,
      name: newUserName.trim(),
      email: email,
      role: newUserRole,
      organization: newUserOrg.trim() || undefined,
      verified: newUserRole !== 'citizen',
      savedAreaIds: existing?.savedAreaIds || ['area-davao-poblacion-1a'],
      createdAt: existing?.createdAt || new Date().toISOString()
    };

    storageService.addUser(newUser);
    await firestoreService.syncUserProfile(newUser).catch(() => {});
    await firestoreService.saveUserRole(newUser.id, newUser.role, newUser.organization, newUser.email).catch(() => {});

    setNewUserName('');
    setNewUserEmail('');
    setNewUserOrg('');
    setShowAddUserModal(false);
    loadData();
    triggerToast(`Authorized account created for ${newUser.email} with role: ${newUser.role.replace('_', ' ').toUpperCase()}`);
  };

  const handleUpdateOutageStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdateOutageId) return;

    storageService.updateOutageStatus(
      statusUpdateOutageId,
      newStatus,
      officialCause.trim() || undefined,
      officialMessage.trim() || undefined,
      currentUser.organization || 'Davao Light Dispatch'
    );

    setStatusUpdateOutageId(null);
    setOfficialCause('');
    setOfficialMessage('');
    triggerToast('Outage status updated and broadcasted.');
  };

  const handleAddNewArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarangay.trim() || !newCity.trim()) return;

    storageService.addArea({
      region: 'Region X',
      province: newProvince.trim() || 'Misamis Oriental',
      cityMunicipality: newCity.trim(),
      district: 'District 1',
      barangay: newBarangay.trim(),
      latitude: 8.4822,
      longitude: 124.6472,
      supported: true,
      utilityProvider: newProvider,
      lguName: `LGU ${newCity}`
    });

    setNewBarangay('');
    setNewCity('');
    setNewProvince('');
    triggerToast(`Coverage area ${newBarangay} added.`);
  };

  const handleCreateScheduledOutage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedAreaId || !schedReason) return;

    const matchedArea = areas.find((a) => a.id === schedAreaId);
    if (!matchedArea) return;

    storageService.addScheduledOutage({
      areaId: schedAreaId,
      barangay: matchedArea.barangay,
      cityMunicipality: matchedArea.cityMunicipality,
      startAt: schedDate || new Date().toISOString(),
      endAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      reason: schedReason,
      provider: matchedArea.utilityProvider
    });

    setSchedReason('');
    setSchedDate('');
    triggerToast('Scheduled maintenance advisory published.');
  };

  const handleDeleteReport = async (report: OutageReport) => {
    setIsDeletingReport(true);
    storageService.deleteReport(report.id);
    await firestoreService.deleteReport(report.id).catch((err) => {
      console.warn('Firestore cloud delete error or offline:', err);
    });
    setIsDeletingReport(false);
    setDeleteReportTarget(null);
    loadData();
    triggerToast(`Report #${report.id.slice(-8)} in ${report.barangay} permanently deleted.`);
  };

  const handleClearTestReports = async () => {
    const testReports = reports.filter(
      (r) =>
        r.reporterId === 'user-citizen-demo' ||
        r.name.toLowerCase().includes('sample') ||
        r.name.toLowerCase().includes('demo') ||
        r.name.toLowerCase().includes('test') ||
        r.additionalNotes?.toLowerCase().includes('sample')
    );
    if (testReports.length === 0) {
      triggerToast('No sample/test reports found to purge.');
      return;
    }
    if (!window.confirm(`Are you sure you want to purge all ${testReports.length} sample/test reports?`)) return;
    const ids = testReports.map((r) => r.id);
    storageService.deleteReportsBatch(ids);
    for (const id of ids) {
      await firestoreService.deleteReport(id).catch(() => {});
    }
    loadData();
    triggerToast(`Purged ${ids.length} sample/test reports.`);
  };

  const handleAddSampleReport = () => {
    const sampleAreas = areas.length > 0 ? areas : storageService.getSupportedAreas();
    const randomArea = sampleAreas[Math.floor(Math.random() * sampleAreas.length)];
    const newRep = storageService.createOutageReport({
      reporterId: 'user-citizen-demo',
      name: 'Admin Debug Tester',
      contactNumber: '+63 917 555 0199',
      areaId: randomArea?.id || 'area-davao-poblacion-1a',
      region: randomArea?.region || 'Region XI',
      province: randomArea?.province || 'Davao del Sur',
      cityMunicipality: randomArea?.cityMunicipality || 'Davao City',
      barangay: randomArea?.barangay || 'Barangay 1-A (Poblacion)',
      subdivisionVillage: 'Debug Zone Block 1',
      latitude: randomArea?.latitude || 7.0715,
      longitude: randomArea?.longitude || 125.6105,
      outageStartTime: new Date().toISOString(),
      reportedCause: 'Debug Test Simulation: Transformer Overload',
      additionalNotes: 'Sample report generated for verification and deletion debugging.',
      attachmentUrls: []
    });
    firestoreService.saveReport(newRep).catch(() => {});
    loadData();
    triggerToast(`Created test report #${newRep.id.slice(-8)} in ${newRep.barangay}.`);
  };

  const filteredUsers = users.filter((u) => {
    if (!searchUserQuery.trim()) return true;
    const q = searchUserQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.organization && u.organization.toLowerCase().includes(q))
    );
  });

  const filteredReports = reports.filter((r) => {
    if (reportStatusFilter !== 'ALL' && r.verificationStatus !== reportStatusFilter) {
      return false;
    }
    if (reportCityFilter !== 'ALL' && r.cityMunicipality !== reportCityFilter) {
      return false;
    }
    if (searchReportQuery.trim()) {
      const q = searchReportQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.barangay.toLowerCase().includes(q) ||
        r.cityMunicipality.toLowerCase().includes(q) ||
        (r.province && r.province.toLowerCase().includes(q)) ||
        r.name.toLowerCase().includes(q) ||
        (r.contactNumber && r.contactNumber.toLowerCase().includes(q)) ||
        (r.reportedCause && r.reportedCause.toLowerCase().includes(q)) ||
        (r.additionalNotes && r.additionalNotes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const uniqueReportCities = Array.from(new Set(reports.map((r) => r.cityMunicipality))).filter(Boolean);

  const isSuperAdmin = storageService.isAdmin(currentUser);

  if (!isSuperAdmin) {
    return (
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="bg-white rounded-3xl p-8 border border-[#c2c6d3] shadow-lg flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[36px]">gpp_maybe</span>
          </div>
          <h1 className="text-xl font-bold text-[#191c1e]">Admin Access Restricted</h1>
          <p className="text-xs text-[#5b6068] leading-relaxed">
            Only designated System Admin accounts have access to this dashboard.
          </p>
          <button
            onClick={() => onNavigate('/home')}
            className="w-full py-2.5 px-4 bg-[#004a98] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#00346e] transition-colors"
          >
            Back to Public Grid
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-6 pb-24 md:pb-12 flex flex-col gap-6" id="admin-portal-main">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#00346e] text-white px-4 py-3 rounded-2xl shadow-xl border border-[#abc7ff] flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Identity Badge */}
      <div className="bg-purple-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-800 border border-purple-500 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px] text-purple-200">verified</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-300">Authorized Super Admin</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-700 text-purple-100">Exclusive Master Access</span>
            </div>
            <p className="text-xs text-purple-100 font-mono mt-0.5">
              ID: <span className="font-bold text-white">{currentUser.id}</span> • {currentUser.email || 'Admin Master Account'}
            </p>
          </div>
        </div>
        <div className="text-[11px] text-purple-200 bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-700/50">
          Super Admin Console Active
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#00346e] mb-1">
            <span className="material-symbols-outlined text-[24px] icon-fill text-purple-700">
              admin_panel_settings
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#737782]">
              PhilSePush Master Console
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#191c1e] tracking-tight">
            Super Admin & System Access Control
          </h1>
          <p className="text-xs sm:text-sm text-[#737782] mt-0.5">
            Set account role permissions, switch testing roles at any time, manage outages, and configure franchise areas.
          </p>
        </div>

        {/* Super Admin Quick Role Switcher Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-[#c2c6d3] rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold text-[#737782] uppercase px-2">Role Simulator:</span>
          {(['citizen', 'utility_provider', 'lgu', 'verification_team', 'admin'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => handleSwitchActiveRole(r)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                currentUser.role === r
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'bg-[#f2f4f6] text-[#424751] hover:bg-[#e0e3e5]'
              }`}
            >
              {r === 'utility_provider' ? 'Utility' : r === 'lgu' ? 'LGU' : r === 'verification_team' ? 'Verifier' : r === 'admin' ? 'Super Admin' : 'Citizen'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#c2c6d3] gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'users'
              ? 'border-purple-700 text-purple-700'
              : 'border-transparent text-[#737782] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
          <span>Accounts & Role Permissions ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'reports'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-[#737782] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">description</span>
          <span>Citizen Reports & Debug Records ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('outages')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'outages'
              ? 'border-[#004a98] text-[#004a98]'
              : 'border-transparent text-[#737782] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">bolt</span>
          <span>Active Outages ({outages.filter((o) => o.status !== 'Restored').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('areas')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'areas'
              ? 'border-[#004a98] text-[#004a98]'
              : 'border-transparent text-[#737782] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">map</span>
          <span>Coverage Areas ({areas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('scheduled')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'scheduled'
              ? 'border-[#004a98] text-[#004a98]'
              : 'border-transparent text-[#737782] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          <span>Scheduled Outages ({scheduled.length})</span>
        </button>
      </div>

      {/* TAB 1: USER ACCOUNTS & ROLE PERMISSION MANAGEMENT (Super Admin Feature) */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#c2c6d3] shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#737782]">
                search
              </span>
              <input
                type="text"
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                placeholder="Search accounts by name, email, or role..."
                className="w-full pl-10 pr-4 py-2 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs outline-none focus:bg-white focus:border-purple-600"
              />
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>+ Create Authorized Account</span>
            </button>
          </div>

          {/* User Role Management Cards Table */}
          <div className="grid grid-cols-1 gap-3.5">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  user.id === currentUser.id ? 'border-purple-300 ring-2 ring-purple-100' : 'border-[#c2c6d3]'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : user.role === 'verification_team'
                      ? 'bg-amber-100 text-amber-800'
                      : user.role === 'utility_provider'
                      ? 'bg-blue-100 text-blue-800'
                      : user.role === 'lgu'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    <span className="material-symbols-outlined text-[22px]">
                      {user.role === 'admin'
                        ? 'admin_panel_settings'
                        : user.role === 'verification_team'
                        ? 'verified_user'
                        : user.role === 'utility_provider'
                        ? 'bolt'
                        : user.role === 'lgu'
                        ? 'location_city'
                        : 'person'}
                    </span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-[#191c1e]">{user.name}</h4>
                      {user.id === currentUser.id && (
                        <span className="text-[10px] bg-purple-700 text-white px-2 py-0.5 rounded-full font-bold">
                          Active You
                        </span>
                      )}
                      {user.verified && user.role !== 'citizen' && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 border border-emerald-200">
                          <span className="material-symbols-outlined text-[13px]">verified</span>
                          Verified Official
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#5b6068] mt-0.5">{user.email || 'No email associated'}</p>
                    {user.organization && (
                      <p className="text-xs font-semibold text-[#00346e] mt-0.5">
                        Agency: {user.organization}
                      </p>
                    )}
                  </div>
                </div>

                {/* Role Assignment Selector & Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-[#e0e3e5] w-full md:w-auto justify-start md:justify-end">
                  <span className="text-xs font-bold text-[#737782] whitespace-nowrap">Role:</span>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole, user.organization)}
                    className="flex-1 sm:flex-initial min-w-[140px] px-2.5 py-1.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs font-bold text-[#191c1e] outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <option value="citizen">Citizen</option>
                    <option value="utility_provider">Utility Provider</option>
                    <option value="lgu">LGU Officer</option>
                    <option value="verification_team">Verification Team</option>
                    <option value="admin">System Super Admin</option>
                  </select>

                  <button
                    onClick={() => {
                      const newOrg = prompt('Enter Organization / Agency name for this account:', user.organization || '');
                      if (newOrg !== null) {
                        handleRoleChange(user.id, user.role, newOrg.trim());
                      }
                    }}
                    className="px-2.5 py-1.5 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#424751] text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-1 shrink-0"
                    title="Edit Department / Agency"
                  >
                    <span className="material-symbols-outlined text-[15px]">corporate_fare</span>
                    <span>Set Org</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Role Permissions Matrix Reference Card */}
          <div className="bg-white rounded-2xl border border-[#c2c6d3] p-5 shadow-2xs flex flex-col gap-3">
            <h3 className="text-sm font-bold text-[#191c1e] uppercase tracking-wider">
              System Role Permissions Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <span className="font-bold text-gray-900 block mb-1">Citizen (Guest)</span>
                <p className="text-gray-600">Browse map, submit reports with photo, "Me Too" counter, community comments. No account required.</p>
              </div>

              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200">
                <span className="font-bold text-blue-950 block mb-1">Utility & LGU Officers</span>
                <p className="text-blue-900">Privilege to add/update "Critical Infrastructure Monitoring" & post "Verified Utility & LGU Responses".</p>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-950 block mb-1">Verification Team</span>
                <p className="text-amber-900">Privilege to manage report triage, telephone-verify outages, and publish to the live map.</p>
              </div>

              <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200">
                <span className="font-bold text-purple-950 block mb-1">System Super Admin</span>
                <p className="text-purple-900">All permissions of all roles + switch roles at any time + assign roles to any user account.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CITIZEN REPORTS & DEBUGGING RECORDS */}
      {activeTab === 'reports' && (
        <div className="flex flex-col gap-5">
          {/* Debug Summary Metrics & Actions Banner */}
          <div className="bg-white rounded-2xl border border-[#c2c6d3] p-4 sm:p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-gray-700">inventory_2</span>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">Total Reports</span>
                  <span className="text-sm font-extrabold text-gray-900">{reports.length}</span>
                </div>
              </div>

              <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-amber-700">pending_actions</span>
                <div>
                  <span className="text-[10px] text-amber-700 font-bold block uppercase">Pending Triage</span>
                  <span className="text-sm font-extrabold text-amber-900">
                    {reports.filter((r) => r.verificationStatus === 'pending').length}
                  </span>
                </div>
              </div>

              <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-emerald-700">verified</span>
                <div>
                  <span className="text-[10px] text-emerald-700 font-bold block uppercase">Verified Active</span>
                  <span className="text-sm font-extrabold text-emerald-900">
                    {reports.filter((r) => r.verificationStatus === 'verified').length}
                  </span>
                </div>
              </div>

              <div className="px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-rose-700">cancel</span>
                <div>
                  <span className="text-[10px] text-rose-700 font-bold block uppercase">Rejected</span>
                  <span className="text-sm font-extrabold text-rose-900">
                    {reports.filter((r) => r.verificationStatus === 'rejected').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Debugging Utility Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAddSampleReport}
                className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Create a synthetic test report for triage/deletion debugging"
              >
                <span className="material-symbols-outlined text-[17px]">add_circle</span>
                <span>+ Test Report</span>
              </button>

              <button
                type="button"
                onClick={handleClearTestReports}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Purge all synthetic test & demo reports"
              >
                <span className="material-symbols-outlined text-[17px]">cleaning_services</span>
                <span>Purge Sample Reports</span>
              </button>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#c2c6d3] shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#737782]">
                search
              </span>
              <input
                type="text"
                value={searchReportQuery}
                onChange={(e) => setSearchReportQuery(e.target.value)}
                placeholder="Search by ID, Barangay, City, Reporter, Cause, Notes..."
                className="w-full pl-10 pr-4 py-2 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs outline-none focus:bg-white focus:border-purple-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs font-bold text-[#191c1e] outline-none"
              >
                <option value="ALL">All Statuses ({reports.length})</option>
                <option value="pending">Pending Triage</option>
                <option value="verified">Verified Outages</option>
                <option value="rejected">Rejected Reports</option>
              </select>

              {uniqueReportCities.length > 0 && (
                <select
                  value={reportCityFilter}
                  onChange={(e) => setReportCityFilter(e.target.value)}
                  className="px-3 py-2 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl text-xs font-bold text-[#191c1e] outline-none"
                >
                  <option value="ALL">All Cities ({uniqueReportCities.length})</option>
                  {uniqueReportCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              )}

              {(searchReportQuery || reportStatusFilter !== 'ALL' || reportCityFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchReportQuery('');
                    setReportStatusFilter('ALL');
                    setReportCityFilter('ALL');
                  }}
                  className="px-3 py-2 text-xs font-bold text-[#737782] hover:text-[#191c1e] hover:bg-[#f2f4f6] rounded-xl transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-[#c2c6d3] text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px]">folder_off</span>
              </div>
              <h4 className="text-base font-bold text-[#191c1e]">No Incident Reports Found</h4>
              <p className="text-xs text-[#5b6068] max-w-sm">
                {reports.length === 0
                  ? 'No citizen reports have been filed yet. You can click "+ Test Report" above to simulate a submission.'
                  : 'No reports match your active search and filter parameters.'}
              </p>
              {(searchReportQuery || reportStatusFilter !== 'ALL' || reportCityFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchReportQuery('');
                    setReportStatusFilter('ALL');
                    setReportCityFilter('ALL');
                  }}
                  className="mt-2 px-4 py-2 bg-[#004a98] text-white text-xs font-bold rounded-xl"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-[#c2c6d3] p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col gap-4"
                >
                  {/* Top Bar: IDs, Status Badge, Timestamp */}
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-[#e0e3e5]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">
                        #{report.id.slice(-8)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          report.verificationStatus === 'verified'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : report.verificationStatus === 'rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {report.verificationStatus === 'verified'
                          ? 'Verified Incident'
                          : report.verificationStatus === 'rejected'
                          ? 'Rejected'
                          : 'Pending Triage'}
                      </span>
                      {report.outageId && (
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          Linked Outage: #{report.outageId}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-[#5b6068]">
                        {new Date(report.outageStartTime || report.createdAt || Date.now()).toLocaleString('en-PH', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Main Grid: Location & Reporter Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {/* Location */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-[#737782] uppercase tracking-wider">
                        Location & Area
                      </span>
                      <p className="text-sm font-bold text-[#191c1e]">
                        {report.barangay}, {report.cityMunicipality}
                      </p>
                      <p className="text-[#5b6068]">
                        {report.province || 'Misamis Oriental'} • {report.region || 'Region X'}
                      </p>
                      {report.subdivisionVillage && (
                        <p className="text-[#424751] italic">
                          Landmark/Sitio: {report.subdivisionVillage}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-[11px] font-mono text-gray-500 mt-1">
                        <span className="material-symbols-outlined text-[14px] text-red-500">location_on</span>
                        <span>{report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}</span>
                      </div>
                    </div>

                    {/* Reporter Info */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-[#737782] uppercase tracking-wider">
                        Citizen Reporter
                      </span>
                      <p className="font-bold text-[#191c1e]">{report.name || 'Anonymous Citizen'}</p>
                      <p className="text-[#5b6068] font-mono">
                        Contact: {report.contactNumber || 'No phone number provided'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                        UID: {report.reporterId}
                      </p>
                      {report.meTooCount ? (
                        <div className="flex items-center gap-1 text-emerald-700 font-bold mt-1">
                          <span className="material-symbols-outlined text-[14px]">group</span>
                          <span>+{report.meTooCount} Community "Me Too" confirms</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Incident Details & Cause */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-[#737782] uppercase tracking-wider">
                        Reported Cause & Notes
                      </span>
                      <div className="inline-block">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded font-semibold text-[11px]">
                          {report.reportedCause || 'Power Interruption'}
                        </span>
                      </div>
                      {report.additionalNotes && (
                        <p className="text-[#424751] mt-1 bg-[#f8f9fb] p-2 rounded-lg border border-[#e0e3e5] leading-relaxed">
                          "{report.additionalNotes}"
                        </p>
                      )}
                      {report.rejectionReason && (
                        <div className="mt-1 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-[11px]">
                          <strong>Rejection Remarks:</strong> {report.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photo Evidence Preview if present */}
                  {report.photoUrl && (
                    <div className="pt-2 border-t border-[#e0e3e5]">
                      <span className="text-[10px] font-bold text-[#737782] uppercase block mb-1.5">
                        Uploaded Citizen Evidence Photo
                      </span>
                      <img
                        src={report.photoUrl}
                        alt="Citizen Evidence"
                        className="w-32 h-20 object-cover rounded-xl border border-gray-200 shadow-2xs hover:opacity-90 cursor-pointer"
                        onClick={() => window.open(report.photoUrl, '_blank')}
                      />
                    </div>
                  )}

                  {/* Card Action Controls Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e0e3e5]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigate('/map')}
                        className="px-3 py-1.5 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#424751] text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">map</span>
                        <span>Locate on Map</span>
                      </button>

                      {report.outageId && (
                        <button
                          type="button"
                          onClick={() => onNavigate(`/outage/${report.outageId}`)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[15px]">bolt</span>
                          <span>View Outage #{report.outageId}</span>
                        </button>
                      )}
                    </div>

                    {/* Admin Delete Action Button */}
                    <button
                      type="button"
                      onClick={() => setDeleteReportTarget(report)}
                      className="px-3.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 hover:border-red-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs group"
                      title="Permanently remove this report for debugging purposes"
                    >
                      <span className="material-symbols-outlined text-[16px] text-red-600 group-hover:text-white">
                        delete
                      </span>
                      <span>Delete from Records</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OUTAGE LIFECYCLE CONTROLLER */}
      {activeTab === 'outages' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4">
            {outages.map((outage) => (
              <div
                key={outage.id}
                className="bg-white rounded-2xl p-5 border border-[#c2c6d3] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        outage.status === 'Restored'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-[#ffdad6] text-[#93000d]'
                      }`}
                    >
                      {outage.status}
                    </span>
                    <span className="text-xs text-[#737782]">ID #{outage.id}</span>
                  </div>

                  <h3 className="text-base font-bold text-[#191c1e]">
                    {outage.barangay}, {outage.cityMunicipality}
                  </h3>
                  <p className="text-xs text-[#424751] mt-0.5">
                    Impact: <strong>{outage.peopleAffected} residents</strong> • Grid: {outage.provider}
                  </p>
                  <p className="text-xs text-[#737782] mt-1">
                    Community Cause: {outage.communityReportedCause}
                  </p>
                  {outage.officialConfirmedCause && (
                    <p className="text-xs text-[#00346e] font-semibold mt-1">
                      Official: {outage.officialConfirmedCause}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setStatusUpdateOutageId(outage.id);
                      setNewStatus(outage.status);
                      setOfficialCause(outage.officialConfirmedCause || '');
                    }}
                    className="px-4 py-2 bg-[#004a98] hover:bg-[#00346e] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                  >
                    Update Status & Dispatch
                  </button>

                  <button
                    onClick={() => onNavigate(`/outage/${outage.id}`)}
                    className="px-3 py-2 bg-[#f2f4f6] text-[#424751] hover:text-[#191c1e] text-xs font-semibold rounded-xl"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AREA COVERAGE MANAGER */}
      {activeTab === 'areas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Area Form */}
          <div className="bg-white p-5 rounded-2xl border border-[#c2c6d3] shadow-2xs flex flex-col gap-3 h-fit">
            <h3 className="text-sm font-bold text-[#191c1e]">Add New Coverage Barangay</h3>
            <form onSubmit={handleAddNewArea} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-[#424751] block mb-1">Barangay Name *</label>
                <input
                  type="text"
                  required
                  value={newBarangay}
                  onChange={(e) => setNewBarangay(e.target.value)}
                  placeholder="e.g. Barangay Macasandig"
                  className="w-full p-2.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#424751] block mb-1">City / Municipality *</label>
                <input
                  type="text"
                  required
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="e.g. Davao City"
                  className="w-full p-2.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#424751] block mb-1">Province</label>
                <input
                  type="text"
                  value={newProvince}
                  onChange={(e) => setNewProvince(e.target.value)}
                  placeholder="e.g. Davao del Sur"
                  className="w-full p-2.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#424751] block mb-1">Utility Provider</label>
                <select
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                  className="w-full p-2.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl outline-none"
                >
                  <option value="Davao Light">Davao Light (DLPC)</option>
                  <option value="Meralco">Meralco</option>
                  <option value="VECO">VECO</option>
                  <option value="MORE Power">MORE Power</option>
                  <option value="CEPALCO">CEPALCO</option>
                </select>
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-2.5 bg-[#004a98] hover:bg-[#00346e] text-white font-bold rounded-xl shadow-xs"
              >
                Register Coverage Area
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-3">
            {areas.map((area) => (
              <div
                key={area.id}
                className="bg-white p-4 rounded-2xl border border-[#c2c6d3] shadow-2xs flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-sm font-bold text-[#191c1e]">
                    {area.barangay}, {area.cityMunicipality}
                  </h4>
                  <p className="text-xs text-[#737782]">
                    Province: {area.province} • Provider: <strong>{area.utilityProvider}</strong>
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Supported
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SCHEDULED OUTAGE ADVISORIES */}
      {activeTab === 'scheduled' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#c2c6d3] shadow-2xs flex flex-col gap-3 h-fit">
            <h3 className="text-sm font-bold text-[#191c1e]">Broadcast Scheduled Maintenance</h3>
            <form onSubmit={handleCreateScheduledOutage} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-[#424751] block mb-1">Target Area *</label>
                <select
                  required
                  value={schedAreaId}
                  onChange={(e) => setSchedAreaId(e.target.value)}
                  className="w-full p-2.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl outline-none font-bold"
                >
                  <option value="">Select Area</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.barangay}, {a.cityMunicipality}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#424751] block mb-1">Maintenance Reason *</label>
                <textarea
                  required
                  rows={2}
                  value={schedReason}
                  onChange={(e) => setSchedReason(e.target.value)}
                  placeholder="e.g. Substation transformer upgrade and pole relocation"
                  className="w-full p-2.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#424751] block mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full p-2.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-2.5 bg-[#004a98] hover:bg-[#00346e] text-white font-bold rounded-xl shadow-xs"
              >
                Broadcast Maintenance Advisory
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-3">
            {scheduled.map((sched) => (
              <div
                key={sched.id}
                className="bg-white p-5 rounded-2xl border border-[#c2c6d3] shadow-2xs flex items-start justify-between gap-4"
              >
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                    Scheduled Maintenance
                  </span>
                  <h4 className="text-base font-bold text-[#191c1e] mt-1.5">
                    {sched.barangay}, {sched.cityMunicipality}
                  </h4>
                  <p className="text-xs text-[#424751] mt-0.5">{sched.reason}</p>
                  <p className="text-[11px] text-[#737782] mt-2">
                    Date: {new Date(sched.startAt).toLocaleString()} • Provider: {sched.provider}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outage Status Update Modal */}
      {statusUpdateOutageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#c2c6d3] animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#e0e3e5] mb-4">
              <h3 className="text-base font-bold text-[#191c1e]">Update Outage Status & Official Log</h3>
              <button
                onClick={() => setStatusUpdateOutageId(null)}
                className="text-[#737782] hover:text-[#191c1e]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateOutageStatus} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-[#424751] block mb-1">Status Lifecycle Phase *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl outline-none font-bold text-xs"
                >
                  <option value="Investigating">Investigating</option>
                  <option value="Repairing">Repairing</option>
                  <option value="Restoring">Restoring</option>
                  <option value="Restored">Restored (Close Case)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#424751] block mb-1">Official Confirmed Cause</label>
                <input
                  type="text"
                  value={officialCause}
                  onChange={(e) => setOfficialCause(e.target.value)}
                  placeholder="e.g. Primary line tripped due to fallen acacia branch"
                  className="w-full p-2.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#424751] block mb-1">Official Dispatch Log Message</label>
                <textarea
                  rows={3}
                  value={officialMessage}
                  onChange={(e) => setOfficialMessage(e.target.value)}
                  placeholder="e.g. Crew 4 is en route with replacement transformer. Estimated restoration 3:30 PM."
                  className="w-full p-2.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setStatusUpdateOutageId(null)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-[#424751] hover:bg-[#eceef0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-[#004a98] text-white hover:bg-[#00346e]"
                >
                  Save & Publish Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Authorized User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#c2c6d3] animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#e0e3e5] mb-4">
              <h3 className="text-base font-bold text-[#191c1e]">Register Authorized User Account</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-[#737782] hover:text-[#191c1e]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateUserAccount} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-[#424751] block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Engr. Maria Santos"
                  className="w-full p-2.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#424751] block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. marco.santos@davaolight.com.ph"
                  className="w-full p-2.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#424751] block mb-1">Assign Role *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl outline-none font-bold text-xs"
                >
                  <option value="utility_provider">Utility Provider</option>
                  <option value="lgu">LGU Officer</option>
                  <option value="verification_team">Verification Team</option>
                  <option value="admin">System Super Admin</option>
                  <option value="citizen">Citizen</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#424751] block mb-1">Organization / Agency Name</label>
                <input
                  type="text"
                  value={newUserOrg}
                  onChange={(e) => setNewUserOrg(e.target.value)}
                  placeholder="e.g. Davao Light Operations, Davao City DRRMO"
                  className="w-full p-2.5 bg-[#f8f9fb] border border-[#c2c6d3] rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-[#424751] hover:bg-[#eceef0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-xs"
                >
                  Create & Grant Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Delete Report Confirmation Modal */}
      {deleteReportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#c2c6d3] animate-slide-up flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-[#ba1a1a] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">delete_forever</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#191c1e]">Delete Report Record</h3>
                <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md uppercase">
                  Super Admin Debugging Mode
                </span>
              </div>
            </div>

            <p className="text-xs text-[#424751] leading-relaxed">
              Are you sure you want to permanently delete report{' '}
              <span className="font-mono font-bold text-[#191c1e]">#{deleteReportTarget.id.slice(-8)}</span> filed for{' '}
              <span className="font-semibold text-[#191c1e]">{deleteReportTarget.barangay}, {deleteReportTarget.cityMunicipality}</span>?
            </p>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1 text-gray-700">
              <div><strong>Reporter:</strong> {deleteReportTarget.name || 'Anonymous'} ({deleteReportTarget.contactNumber || 'No phone'})</div>
              <div><strong>Reported Cause:</strong> {deleteReportTarget.reportedCause}</div>
              <div><strong>Status:</strong> {deleteReportTarget.verificationStatus.toUpperCase()}</div>
              {deleteReportTarget.additionalNotes && (
                <div className="truncate text-gray-500"><strong>Notes:</strong> {deleteReportTarget.additionalNotes}</div>
              )}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0 mt-0.5">warning</span>
              <span>This record will be purged from the app and the Firestore cloud database. If this was an unverified incident on the live map, its marker will also be cleaned up.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#e0e3e5]">
              <button
                type="button"
                disabled={isDeletingReport}
                onClick={() => setDeleteReportTarget(null)}
                className="px-4 py-2.5 text-xs font-bold text-[#424751] hover:bg-[#eceef0] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingReport}
                onClick={() => handleDeleteReport(deleteReportTarget)}
                className="px-5 py-2.5 text-xs font-bold bg-[#ba1a1a] hover:bg-[#93000d] text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isDeletingReport ? 'hourglass_top' : 'delete'}
                </span>
                <span>{isDeletingReport ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
