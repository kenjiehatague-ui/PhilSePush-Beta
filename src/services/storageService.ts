import {
  User,
  UserRole,
  Area,
  Outage,
  OutageReport,
  OutageConfirmation,
  CommunityUpdate,
  OfficialUpdate,
  ScheduledOutage,
  AppNotification,
  ReportFlag,
  ReliabilityMetric,
  CriticalFacility,
  HistoricalIncident
} from '../types';
import { generateAllDavaoAreas } from '../data/davaoBarangays';

const STORAGE_KEYS = {
  USERS: 'philsepush_users',
  CURRENT_USER: 'philsepush_current_user',
  AREAS: 'philsepush_areas',
  SELECTED_AREA: 'philsepush_selected_area',
  OUTAGES: 'philsepush_outages',
  REPORTS: 'philsepush_reports',
  CONFIRMATIONS: 'philsepush_confirmations',
  COMMUNITY_UPDATES: 'philsepush_community_updates',
  OFFICIAL_UPDATES: 'philsepush_official_updates',
  SCHEDULED_OUTAGES: 'philsepush_scheduled_outages',
  NOTIFICATIONS: 'philsepush_notifications',
  FLAGS: 'philsepush_flags',
  INITIALIZED: 'philsepush_db_v3_davao_full_integration'
};

const DAVAO_CITY_ALL_AREAS = generateAllDavaoAreas();

// Initial Seed Data: Realistic Philippine Locations (All 182 Davao City barangays leading as primary)
const SEED_AREAS: Area[] = [
  // All 182 Davao City Barangays as primary hub
  ...DAVAO_CITY_ALL_AREAS,
  {
    id: 'area-makati-belair',
    region: 'National Capital Region (NCR)',
    province: 'Metro Manila',
    cityMunicipality: 'Makati City',
    district: 'District 1',
    barangay: 'Barangay Bel-Air',
    subdivisionVillage: 'Salcedo Village',
    latitude: 14.5586,
    longitude: 121.0264,
    supported: true,
    utilityProvider: 'Meralco (Manila Electric Company)',
    lguName: 'City Government of Makati',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'area-cebu-lahug',
    region: 'Region VII (Central Visayas)',
    province: 'Cebu',
    cityMunicipality: 'Cebu City',
    district: 'North District',
    barangay: 'Barangay Lahug',
    subdivisionVillage: 'Cebu IT Park Area',
    latitude: 10.3298,
    longitude: 123.8967,
    supported: true,
    utilityProvider: 'VECO (Visayan Electric Company)',
    lguName: 'City Government of Cebu',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'area-qc-batasan',
    region: 'National Capital Region (NCR)',
    province: 'Metro Manila',
    cityMunicipality: 'Quezon City',
    district: 'District 2',
    barangay: 'Barangay Batasan Hills',
    subdivisionVillage: 'Filinvest 1 & 2',
    latitude: 14.6853,
    longitude: 121.0967,
    supported: true,
    utilityProvider: 'Meralco',
    lguName: 'Quezon City Government',
    createdAt: '2026-01-01T00:00:00Z'
  }
];

const SEED_CRITICAL_FACILITIES: CriticalFacility[] = [
  {
    id: 'crit-davao-1',
    name: 'Southern Philippines Medical Center (SPMC Main Hospital)',
    type: 'Hospital',
    latitude: 7.0945,
    longitude: 125.6260,
    backupPowerStatus: 'Generator Active',
    barangay: 'Barangay Alfonso Angliongto, Sr.'
  },
  {
    id: 'crit-davao-2',
    name: 'Davao Doctors Hospital',
    type: 'Hospital',
    latitude: 7.0650,
    longitude: 125.6040,
    backupPowerStatus: 'Stable',
    barangay: 'Barangay 10-A (Poblacion)'
  },
  {
    id: 'crit-davao-3',
    name: 'Davao City Water District (DCWD) Dumoy Main Production Well',
    type: 'Water Pumping Station',
    latitude: 7.0435,
    longitude: 125.5420,
    backupPowerStatus: 'Stable',
    barangay: 'Barangay Dumoy'
  },
  {
    id: 'crit-davao-4',
    name: 'San Pedro Hospital of Davao City',
    type: 'Hospital',
    latitude: 7.0820,
    longitude: 125.6200,
    backupPowerStatus: 'Stable',
    barangay: 'Barangay 19-B (Poblacion)'
  }
];

const SEED_OUTAGES: Outage[] = [
  // Primary Active Outage in Barangay 1-A (Poblacion), Davao City
  {
    id: 'outage-davao-poblacion-active',
    areaId: DAVAO_CITY_ALL_AREAS[0]?.id || 'area-davao-poblacion-1a',
    region: 'Region XI (Davao Region)',
    province: 'Davao del Sur',
    cityMunicipality: 'Davao City',
    barangay: 'Barangay 1-A (Poblacion)',
    subdivisionVillage: 'Claro M. Recto / San Pedro, Davao City',
    latitude: 7.0715,
    longitude: 125.6105,
    startedAt: '2026-08-23T11:30:00Z',
    estimatedRestorationAt: '2026-08-23T17:30:00Z',
    status: 'Repairing',
    communityReportedCause: 'Damaged Transformer / Feeder Line Trip on Recto Street',
    officialConfirmedCause: 'Bajada Substation Feeder 4 trip caused by tree branch striking high-voltage line.',
    peopleAffected: 64,
    verified: true,
    verificationStatus: 'verified',
    disputed: false,
    frequencyType: 'chronic',
    provider: 'Davao Light and Power Company (DLPC)',
    createdBy: 'system_seed',
    createdAt: '2026-08-23T11:35:00Z',
    updatedAt: '2026-08-23T12:00:00Z',
    criticalFacilitiesNearby: SEED_CRITICAL_FACILITIES
  },
  // Active outage in Makati
  {
    id: 'outage-makati-active',
    areaId: 'area-makati-belair',
    region: 'National Capital Region (NCR)',
    province: 'Metro Manila',
    cityMunicipality: 'Makati City',
    barangay: 'Barangay Bel-Air',
    subdivisionVillage: 'Salcedo Village',
    latitude: 14.5586,
    longitude: 121.0264,
    startedAt: '2026-08-23T10:15:00Z',
    estimatedRestorationAt: '2026-08-23T14:00:00Z',
    status: 'Investigating',
    communityReportedCause: 'Underground cable insulation failure near corner tower',
    officialConfirmedCause: 'Emergency isolation of transformer vault for safety inspection.',
    peopleAffected: 18,
    verified: true,
    verificationStatus: 'verified',
    disputed: false,
    frequencyType: 'one-time',
    provider: 'Meralco',
    createdBy: 'system_seed',
    createdAt: '2026-08-23T10:20:00Z',
    updatedAt: '2026-08-23T10:30:00Z'
  },
  // Verified Historical Restored Outage 1 (Davao City Poblacion)
  {
    id: 'outage-davao-poblacion-hist-1',
    areaId: DAVAO_CITY_ALL_AREAS[0]?.id || 'area-davao-poblacion-1a',
    region: 'Region XI (Davao Region)',
    province: 'Davao del Sur',
    cityMunicipality: 'Davao City',
    barangay: 'Barangay 1-A (Poblacion)',
    subdivisionVillage: 'San Pedro Street Commercial Zone',
    latitude: 7.0720,
    longitude: 125.6110,
    startedAt: '2026-08-21T13:42:00Z',
    restoredAt: '2026-08-21T16:18:00Z',
    status: 'Restored',
    communityReportedCause: 'Damaged Line',
    officialConfirmedCause: 'Line repaired and re-energized after safety patrol cleared fallen branch.',
    peopleAffected: 54,
    verified: true,
    verificationStatus: 'verified',
    disputed: false,
    frequencyType: 'chronic',
    provider: 'Davao Light and Power Company (DLPC)',
    createdBy: 'system_seed',
    createdAt: '2026-08-21T13:42:00Z',
    updatedAt: '2026-08-21T16:18:00Z'
  },
  // Verified Historical Restored Outage 2 (Davao City Buhangin)
  {
    id: 'outage-davao-buhangin-hist-2',
    areaId: DAVAO_CITY_ALL_AREAS[40]?.id || 'area-davao-buhangin',
    region: 'Region XI (Davao Region)',
    province: 'Davao del Sur',
    cityMunicipality: 'Davao City',
    barangay: 'Barangay Buhangin (Poblacion)',
    subdivisionVillage: 'Buhangin Highway / Milan Crossing',
    latitude: 7.1020,
    longitude: 125.6180,
    startedAt: '2026-08-15T10:05:00Z',
    restoredAt: '2026-08-15T10:50:00Z',
    status: 'Restored',
    communityReportedCause: 'Scheduled Maintenance',
    officialConfirmedCause: 'Replacement of surge arrester on Buhangin Substation Feeder 3.',
    peopleAffected: 32,
    verified: true,
    verificationStatus: 'verified',
    disputed: false,
    frequencyType: 'one-time',
    provider: 'Davao Light and Power Company (DLPC)',
    createdBy: 'system_seed',
    createdAt: '2026-08-15T10:05:00Z',
    updatedAt: '2026-08-15T10:50:00Z'
  },
  // Verified Historical Restored Outage 3 (Davao City Talomo)
  {
    id: 'outage-davao-talomo-hist-3',
    areaId: DAVAO_CITY_ALL_AREAS[60]?.id || 'area-davao-talomo',
    region: 'Region XI (Davao Region)',
    province: 'Davao del Sur',
    cityMunicipality: 'Davao City',
    barangay: 'Barangay Talomo Proper',
    subdivisionVillage: 'Matina Aplaya & Talomo Beach',
    latitude: 7.0450,
    longitude: 125.5680,
    startedAt: '2026-08-08T23:20:00Z',
    restoredAt: '2026-08-09T04:32:00Z',
    status: 'Restored',
    communityReportedCause: 'Transformer Failure',
    officialConfirmedCause: '100kVA Pole-mounted Transformer replacement completed following severe lightning strike.',
    peopleAffected: 118,
    verified: true,
    verificationStatus: 'verified',
    disputed: false,
    frequencyType: 'chronic',
    provider: 'Davao Light and Power Company (DLPC)',
    createdBy: 'system_seed',
    createdAt: '2026-08-08T23:20:00Z',
    updatedAt: '2026-08-09T04:32:00Z'
  }
];

const SEED_OFFICIAL_UPDATES: OfficialUpdate[] = [
  {
    id: 'off-up-1',
    outageId: 'outage-davao-poblacion-active',
    authorId: 'user-dlpc-officer',
    authorName: 'Engr. M. Santos (Davao Light)',
    organization: 'Davao Light and Power Company (DLPC)',
    organizationType: 'utility',
    message: 'Repair crews have been dispatched to the Bajada Substation Feeder 4 area. Patrol team is clearing vegetation along Recto Street. Restoration expected in 4-5 hours.',
    actionTaken: 'Line patrol team deployed; isolation switch engaged for crew safety.',
    createdAt: '2026-08-23T11:45:00Z',
    verified: true
  },
  {
    id: 'off-up-2',
    outageId: 'outage-davao-poblacion-active',
    authorId: 'user-davao-cdrrmo',
    authorName: 'Davao City DRRMO Desk',
    organization: 'City Government of Davao - CTTMO & DRRMO',
    organizationType: 'lgu',
    message: 'CTTMO traffic enforcers deployed to major intersections along San Pedro St and Recto Ave due to inactive traffic lights.',
    actionTaken: 'Traffic officers stationed; emergency generator active at nearest health station.',
    createdAt: '2026-08-23T12:00:00Z',
    verified: true
  }
];

const SEED_COMMUNITY_UPDATES: CommunityUpdate[] = [
  {
    id: 'comm-up-1',
    outageId: 'outage-davao-poblacion-active',
    name: 'Marco P.',
    contactNumber: '09171234567',
    message: 'Power tripped suddenly around 11:30 AM on Recto St near City Hall.',
    impactTag: 'Home',
    createdAt: '2026-08-23T11:38:00Z'
  },
  {
    id: 'comm-up-2',
    outageId: 'outage-davao-poblacion-active',
    name: "Davao Durian Cafe",
    contactNumber: '09189876543',
    message: 'Running generator for POS and coffee grinders for now.',
    impactTag: 'Business',
    createdAt: '2026-08-23T11:45:00Z'
  }
];

const SEED_REPORTS: OutageReport[] = [
  {
    id: 'rep-davao-1',
    outageId: 'outage-davao-poblacion-active',
    reporterId: 'user-juan-delacruz',
    name: 'Juan Dela Cruz',
    contactNumber: '+63 912 345 6789',
    areaId: DAVAO_CITY_ALL_AREAS[0]?.id || 'area-davao-poblacion-1a',
    region: 'Region XI (Davao Region)',
    province: 'Davao del Sur',
    cityMunicipality: 'Davao City',
    barangay: 'Barangay 1-A (Poblacion)',
    subdivisionVillage: 'Claro M. Recto St',
    latitude: 7.0715,
    longitude: 125.6105,
    outageStartTime: '2026-08-23T11:30:00',
    reportedCause: 'Transformer trip',
    additionalNotes: 'Loud popping noise heard near Recto Street transformer bank.',
    attachmentUrls: [],
    verificationStatus: 'verified',
    meTooCount: 64,
    createdAt: '2026-08-23T11:35:00Z'
  }
];

const SEED_CONFIRMATIONS: OutageConfirmation[] = [
  { id: 'conf-1', outageId: 'outage-davao-poblacion-active', userId: 'user-seed-1', createdAt: '2026-08-23T11:36:00Z' },
  { id: 'conf-2', outageId: 'outage-davao-poblacion-active', userId: 'user-seed-2', createdAt: '2026-08-23T11:40:00Z' }
];

const SEED_SCHEDULED_OUTAGES: ScheduledOutage[] = [
  {
    id: 'sched-davao-1',
    areaId: DAVAO_CITY_ALL_AREAS[40]?.id || 'area-davao-buhangin',
    areaName: 'Barangay Buhangin (Poblacion) & Cabantian, Davao City',
    provider: 'Davao Light and Power Company (DLPC)',
    reason: 'Upgrading of 13.8kV distribution lines and transformer bank balancing at Buhangin Substation.',
    startAt: '2026-08-26T08:30:00Z',
    endAt: '2026-08-26T16:00:00Z',
    status: 'Upcoming',
    affectedBarangays: ['Buhangin (Poblacion)', 'Cabantian', 'Acacia', 'Indangan'],
    createdAt: '2026-08-21T09:00:00Z'
  },
  {
    id: 'sched-makati-1',
    areaId: 'area-makati-belair',
    areaName: 'Barangay Bel-Air / Salcedo Village, Makati',
    provider: 'Meralco',
    reason: 'Annual preventive maintenance of substation transformer banks.',
    startAt: '2026-08-27T01:00:00Z',
    endAt: '2026-08-27T05:00:00Z',
    status: 'Upcoming',
    affectedBarangays: ['Bel-Air', 'San Lorenzo'],
    createdAt: '2026-08-19T09:00:00Z'
  }
];

export const ADMIN_USER_IDS: string[] = ['XojG37IWFMgitFnj7EieMbE2Abm2', 'N3kCJHwK4HcTXhWhutz7hkzQBWm1', 'oNiiAT9AUmPz2hlxwitnzwSmH3E3'];
export const ADMIN_USER_ID = ADMIN_USER_IDS[0];

export function isSystemAdminId(id?: string): boolean {
  return Boolean(id && ADMIN_USER_IDS.includes(id));
}

export const GUEST_CITIZEN: User = {
  id: 'user-guest',
  name: 'Guest Citizen',
  email: '',
  role: 'citizen',
  verified: false,
  savedAreaIds: [],
  selectedAreaId: undefined,
  createdAt: '2026-01-01T00:00:00Z'
};

const SEED_USERS: User[] = [
  {
    id: 'user-guest',
    name: 'Guest Citizen',
    email: '',
    role: 'citizen',
    verified: false,
    savedAreaIds: [],
    selectedAreaId: undefined,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'XojG37IWFMgitFnj7EieMbE2Abm2',
    name: 'System Super Admin',
    email: 'admin@philsepush.gov.ph',
    phoneNumber: '+63 917 888 9999',
    role: 'admin',
    organization: 'PhilSePush Master Authority',
    verified: true,
    savedAreaIds: [DAVAO_CITY_ALL_AREAS[0]?.id || 'area-davao-poblacion-1a', 'area-makati-belair'],
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'N3kCJHwK4HcTXhWhutz7hkzQBWm1',
    name: 'System Admin',
    email: 'admin2@philsepush.gov.ph',
    phoneNumber: '+63 917 888 8888',
    role: 'admin',
    organization: 'PhilSePush Master Authority',
    verified: true,
    savedAreaIds: [DAVAO_CITY_ALL_AREAS[0]?.id || 'area-davao-poblacion-1a', 'area-makati-belair'],
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'oNiiAT9AUmPz2hlxwitnzwSmH3E3',
    name: 'System Admin',
    email: 'admin3@philsepush.gov.ph',
    phoneNumber: '+63 917 888 7777',
    role: 'admin',
    organization: 'PhilSePush Master Authority',
    verified: true,
    savedAreaIds: [DAVAO_CITY_ALL_AREAS[0]?.id || 'area-davao-poblacion-1a', 'area-makati-belair'],
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-dlpc-officer',
    name: 'Engr. Marco Santos',
    email: 'dispatch@davaolight.com.ph',
    phoneNumber: '+63 917 888 9999',
    role: 'utility_provider',
    organization: 'Davao Light and Power Company (DLPC)',
    verified: true,
    savedAreaIds: [DAVAO_CITY_ALL_AREAS[0]?.id || 'area-davao-poblacion-1a', DAVAO_CITY_ALL_AREAS[40]?.id || 'area-davao-buhangin'],
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-davao-cdrrmo',
    name: 'Davao City DRRMO Desk',
    email: 'drrmo@davaocity.gov.ph',
    phoneNumber: '+63 82 241 1000',
    role: 'lgu',
    organization: 'City Government of Davao',
    verified: true,
    savedAreaIds: [DAVAO_CITY_ALL_AREAS[0]?.id || 'area-davao-poblacion-1a'],
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-verifier-1',
    name: 'Verification Officer Santos',
    email: 'verify@philsepush.org',
    role: 'verification_team',
    organization: 'PhilSePush Civic Trust Team',
    verified: true,
    savedAreaIds: [DAVAO_CITY_ALL_AREAS[0]?.id || 'area-davao-poblacion-1a'],
    createdAt: '2026-01-01T00:00:00Z'
  }
];

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    userId: 'user-citizen-default',
    type: 'outage_alert',
    title: 'Active Outage Alert',
    message: 'A power interruption was reported and verified in your area: Barangay 1-A (Poblacion), Davao City.',
    outageId: 'outage-davao-poblacion-active',
    read: false,
    createdAt: '2026-08-23T11:35:00Z'
  },
  {
    id: 'notif-2',
    userId: 'user-citizen-default',
    type: 'status_change',
    title: 'Utility Response Dispatched',
    message: 'Davao Light (DLPC) has dispatched repair crews to resolve the Bajada Substation feeder fault.',
    outageId: 'outage-davao-poblacion-active',
    read: false,
    createdAt: '2026-08-23T11:45:00Z'
  }
];

class StorageService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initialize();
  }

  public initialize(forceReset = false) {
    if (typeof window === 'undefined') return;

    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInit || forceReset) {
      localStorage.setItem(STORAGE_KEYS.AREAS, JSON.stringify(SEED_AREAS));
      localStorage.removeItem(STORAGE_KEYS.SELECTED_AREA);
      localStorage.setItem(STORAGE_KEYS.OUTAGES, JSON.stringify(SEED_OUTAGES));
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(SEED_REPORTS));
      localStorage.setItem(STORAGE_KEYS.CONFIRMATIONS, JSON.stringify(SEED_CONFIRMATIONS));
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_UPDATES, JSON.stringify(SEED_COMMUNITY_UPDATES));
      localStorage.setItem(STORAGE_KEYS.OFFICIAL_UPDATES, JSON.stringify(SEED_OFFICIAL_UPDATES));
      localStorage.setItem(STORAGE_KEYS.SCHEDULED_OUTAGES, JSON.stringify(SEED_SCHEDULED_OUTAGES));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(SEED_USERS[0]));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
      localStorage.setItem(STORAGE_KEYS.FLAGS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    } else {
      // Ensure all 182 Davao City barangays are present and coordinates are synchronized
      try {
        const storedRaw = localStorage.getItem(STORAGE_KEYS.AREAS);
        const storedAreas: Area[] = storedRaw ? JSON.parse(storedRaw) : [];
        const seedMap = new Map<string, Area>();
        SEED_AREAS.forEach((a) => {
          seedMap.set(a.id, a);
          seedMap.set(`${a.cityMunicipality}::${a.barangay}`.toLowerCase(), a);
        });

        // Update stored areas with accurate coordinates from SEED_AREAS
        const updatedStored = storedAreas.map((area) => {
          const match = seedMap.get(area.id) || seedMap.get(`${area.cityMunicipality}::${area.barangay}`.toLowerCase());
          if (match) {
            return {
              ...area,
              latitude: match.latitude,
              longitude: match.longitude,
              district: match.district || area.district,
              utilityProvider: match.utilityProvider || area.utilityProvider
            };
          }
          return area;
        });

        const mergedMap = new Map<string, Area>();
        SEED_AREAS.forEach((a) => mergedMap.set(a.id, a));
        updatedStored.forEach((a) => {
          // If already in SEED_AREAS, preserve the accurate coordinates from SEED_AREAS
          const seed = seedMap.get(a.id);
          if (seed) {
            mergedMap.set(a.id, { ...a, latitude: seed.latitude, longitude: seed.longitude });
          } else {
            mergedMap.set(a.id, a);
          }
        });
        const merged = Array.from(mergedMap.values());
        localStorage.setItem(STORAGE_KEYS.AREAS, JSON.stringify(merged));

        // Sanitize stored outages with authoritative Area coordinates
        const storedOutagesRaw = localStorage.getItem(STORAGE_KEYS.OUTAGES);
        if (storedOutagesRaw) {
          try {
            const parsedOutages: Outage[] = JSON.parse(storedOutagesRaw);
            const sanitizedOutages = parsedOutages.map((o) => {
              const matchedArea = merged.find((a) => a.id === o.areaId) ||
                merged.find((a) => a.barangay.toLowerCase() === (o.barangay || '').toLowerCase());
              return {
                ...o,
                latitude: matchedArea ? matchedArea.latitude : o.latitude,
                longitude: matchedArea ? matchedArea.longitude : o.longitude
              };
            });
            localStorage.setItem(STORAGE_KEYS.OUTAGES, JSON.stringify(sanitizedOutages));
          } catch (e) {}
        }

        // Sanitize stored reports with authoritative Area coordinates
        const storedReportsRaw = localStorage.getItem(STORAGE_KEYS.REPORTS);
        if (storedReportsRaw) {
          try {
            const parsedReports: OutageReport[] = JSON.parse(storedReportsRaw);
            const sanitizedReports = parsedReports.map((r) => {
              const matchedArea = merged.find((a) => a.id === r.areaId) ||
                merged.find((a) => a.barangay.toLowerCase() === (r.barangay || '').toLowerCase());
              return {
                ...r,
                latitude: matchedArea ? matchedArea.latitude : r.latitude,
                longitude: matchedArea ? matchedArea.longitude : r.longitude
              };
            });
            localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(sanitizedReports));
          } catch (e) {}
        }
      } catch (e) {
        // ignore
      }

      // Sanitize current user if previously defaulted to old admin placeholder
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.id === 'OFjXJp1AjGgUp7ueYw0K6GO0xE43' || (parsed.role === 'admin' && !isSystemAdminId(parsed.id))) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(GUEST_CITIZEN));
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Storage listener error:', err);
      }
    });
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data || data === 'undefined' || data === 'null') {
        return defaultValue;
      }
      const parsed = JSON.parse(data);
      return parsed !== null && parsed !== undefined ? parsed : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify();
    } catch (err) {
      console.error(`Error saving to ${key}:`, err);
    }
  }

  // --- USER & AUTH ---
  public isAdmin(user?: User | null): boolean {
    const target = user || this.getCurrentUser();
    if (!target) return false;
    return isSystemAdminId(target.id) || target.role === 'admin';
  }

  public getCurrentUser(): User {
    const user = this.getItem<User>(STORAGE_KEYS.CURRENT_USER, GUEST_CITIZEN);
    if (!user || !user.id || user.id === 'OFjXJp1AjGgUp7ueYw0K6GO0xE43') {
      return GUEST_CITIZEN;
    }
    if (user.role === 'admin' && !isSystemAdminId(user.id)) {
      return { ...user, role: 'citizen' };
    }
    return user;
  }

  public setCurrentUser(user: User) {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  public resetToGuest(): User {
    const guest: User = {
      id: 'user-guest',
      name: 'Guest Citizen',
      email: '',
      role: 'citizen',
      verified: false,
      savedAreaIds: [],
      selectedAreaId: undefined,
      createdAt: new Date().toISOString()
    };
    this.setItem(STORAGE_KEYS.CURRENT_USER, guest);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_AREA);
    return guest;
  }

  public findUserByEmail(email?: string): User | undefined {
    if (!email) return undefined;
    const clean = email.toLowerCase().trim();
    return this.getUsers().find((u) => u.email && u.email.toLowerCase().trim() === clean);
  }

  public findUserById(id?: string): User | undefined {
    if (!id) return undefined;
    return this.getUsers().find((u) => u.id === id);
  }

  public switchUserRole(role: UserRole) {
    const current = this.getCurrentUser();
    // Only the super admin is authorized to switch roles
    if (!this.isAdmin(current)) {
      console.warn('Unauthorized: Only the system admin is allowed to switch roles.');
      return;
    }

    // Preserve the user's name, email, id, and profile while updating role & agency
    const updated: User = {
      ...current,
      role: role,
      verified: role !== 'citizen',
      organization:
        role === 'utility_provider'
          ? (current.organization || 'Davao Light Grid Dispatch')
          : role === 'lgu'
          ? (current.organization || 'City Government of Davao')
          : role === 'verification_team'
          ? (current.organization || 'PhilSePush Civic Trust Team')
          : role === 'admin'
          ? 'PhilSePush Master Authority'
          : undefined
    };

    this.setCurrentUser(updated);

    // Keep user record in sync in the stored user directory without changing name or email
    const users = this.getUsers();
    const exists = users.some((u) => u.id === updated.id);
    const updatedUsers = exists
      ? users.map((u) => (u.id === updated.id ? updated : u))
      : [...users, updated];
    this.setItem(STORAGE_KEYS.USERS, updatedUsers);
  }

  public getUsers(): User[] {
    const users = this.getItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
    return Array.isArray(users) && users.length > 0 ? users : SEED_USERS;
  }

  public updateUser(partialUser: Partial<User>) {
    const current = this.getCurrentUser();
    const updated: User = {
      ...current,
      ...partialUser
    };
    const users = this.getUsers().map((u) => (u.id === updated.id ? updated : u));
    this.setItem(STORAGE_KEYS.USERS, users);
    this.setCurrentUser(updated);
  }

  public setUserRole(userIdOrEmail: string, newRole: UserRole, organization?: string) {
    const targetKey = userIdOrEmail.toLowerCase().trim();
    let foundMatch = false;

    const users = this.getUsers().map((u) => {
      const matchId = u.id.toLowerCase() === targetKey;
      const matchEmail = u.email && u.email.toLowerCase().trim() === targetKey;
      if (matchId || matchEmail) {
        foundMatch = true;
        return {
          ...u,
          role: newRole,
          organization: organization !== undefined ? organization : u.organization,
          verified: newRole !== 'citizen',
        };
      }
      return u;
    });

    this.setItem(STORAGE_KEYS.USERS, users);

    const currentUser = this.getCurrentUser();
    const currentEmail = (currentUser.email || '').toLowerCase().trim();
    const currentId = currentUser.id.toLowerCase();
    if (currentId === targetKey || (currentEmail && currentEmail === targetKey)) {
      this.setCurrentUser({
        ...currentUser,
        role: newRole,
        organization: organization !== undefined ? organization : currentUser.organization,
        verified: newRole !== 'citizen',
      });
    }
  }

  public addUser(user: User) {
    const users = this.getUsers();
    const cleanEmail = user.email ? user.email.toLowerCase().trim() : '';
    const index = users.findIndex(
      (u) =>
        u.id === user.id ||
        (cleanEmail && u.email && u.email.toLowerCase().trim() === cleanEmail)
    );

    if (index >= 0) {
      // Merge and update existing user profile with new role / organization
      users[index] = {
        ...users[index],
        ...user,
        role: user.role || users[index].role,
        organization: user.organization || users[index].organization,
        verified: user.role !== 'citizen' ? true : (user.verified ?? users[index].verified)
      };
    } else {
      users.push(user);
    }
    this.setItem(STORAGE_KEYS.USERS, users);
  }

  public deleteUser(userId: string) {
    const users = this.getUsers().filter((u) => u.id !== userId);
    this.setItem(STORAGE_KEYS.USERS, users);
  }

  // --- CRITICAL FACILITIES MONITORING ---
  public addCriticalFacilityToOutage(
    outageId: string,
    facilityData: Omit<CriticalFacility, 'id'>
  ): CriticalFacility {
    const newFacility: CriticalFacility = {
      ...facilityData,
      id: `crit-${Date.now()}`
    };

    const outages = this.getOutages().map((o) => {
      if (o.id === outageId) {
        const existing = o.criticalFacilitiesNearby || [];
        return {
          ...o,
          criticalFacilitiesNearby: [...existing, newFacility],
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    });
    this.setItem(STORAGE_KEYS.OUTAGES, outages);
    return newFacility;
  }

  public updateCriticalFacilityStatus(
    outageId: string,
    facilityId: string,
    status: CriticalFacility['backupPowerStatus']
  ): boolean {
    let found = false;
    const outages = this.getOutages().map((o) => {
      if (o.id === outageId && o.criticalFacilitiesNearby) {
        const updatedFacilities = o.criticalFacilitiesNearby.map((f) => {
          if (f.id === facilityId) {
            found = true;
            return { ...f, backupPowerStatus: status };
          }
          return f;
        });
        return {
          ...o,
          criticalFacilitiesNearby: updatedFacilities,
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    });
    if (found) {
      this.setItem(STORAGE_KEYS.OUTAGES, outages);
    }
    return found;
  }

  // --- AREAS ---
  public getAreas(): Area[] {
    const areas = this.getItem<Area[]>(STORAGE_KEYS.AREAS, SEED_AREAS);
    const existing = Array.isArray(areas) && areas.length > 0 ? areas : SEED_AREAS;
    
    // Ensure all seed areas (including all 182 Davao barangays) are accessible and have accurate coordinates
    const seedMap = new Map<string, Area>();
    SEED_AREAS.forEach((a) => {
      seedMap.set(a.id, a);
      seedMap.set(`${a.cityMunicipality}::${a.barangay}`.toLowerCase(), a);
    });

    const areaMap = new Map<string, Area>();
    SEED_AREAS.forEach((a) => areaMap.set(a.id, a));
    existing.forEach((a) => {
      const match = seedMap.get(a.id) || seedMap.get(`${a.cityMunicipality}::${a.barangay}`.toLowerCase());
      if (match) {
        areaMap.set(a.id, {
          ...a,
          latitude: match.latitude,
          longitude: match.longitude,
          district: match.district || a.district,
          utilityProvider: match.utilityProvider || a.utilityProvider
        });
      } else {
        areaMap.set(a.id, a);
      }
    });
    return Array.from(areaMap.values());
  }

  public getSupportedAreas(): Area[] {
    const supported = this.getAreas().filter((a) => a.supported);
    return supported.length > 0 ? supported : this.getAreas();
  }

  public getAreaById(id: string): Area | undefined {
    return this.getAreas().find((a) => a.id === id);
  }

  public getSelectedArea(): Area | null {
    // 1. Check if logged in user has a selectedAreaId connected to their account
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.selectedAreaId) {
      const userArea = this.getAreaById(currentUser.selectedAreaId);
      if (userArea) return userArea;
    }

    // 2. Fall back to local storage key SELECTED_AREA
    const area = this.getItem<Area | null>(STORAGE_KEYS.SELECTED_AREA, null);
    if (!area || !area.id) {
      return null;
    }
    const fresh = this.getAreaById(area.id);
    return fresh || area;
  }

  public setSelectedArea(area: Area | null) {
    if (area) {
      this.setItem(STORAGE_KEYS.SELECTED_AREA, area);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_AREA);
      this.notify();
    }

    // Connect selected area directly to the user account
    const current = this.getCurrentUser();
    if (current && current.id) {
      const savedIds = current.savedAreaIds || [];
      const updatedIds = area ? Array.from(new Set([area.id, ...savedIds])) : savedIds;
      const updatedUser: User = {
        ...current,
        selectedAreaId: area ? area.id : undefined,
        savedAreaIds: updatedIds
      };
      this.setItem(STORAGE_KEYS.CURRENT_USER, updatedUser);

      // Keep user list synced
      const users = this.getUsers().map((u) => (u.id === updatedUser.id ? updatedUser : u));
      this.setItem(STORAGE_KEYS.USERS, users);
    }
  }

  public getMonitoredAreas(): Area[] {
    const current = this.getCurrentUser();
    const savedIds = current?.savedAreaIds || [];
    const allAreas = this.getAreas();

    const matchedMap = new Map<string, Area>();

    // Always include currently selected area first
    const selected = this.getSelectedArea();
    if (selected) {
      matchedMap.set(selected.id, selected);
    }

    // Include user saved area IDs
    savedIds.forEach((id) => {
      const area = this.getAreaById(id);
      if (area) {
        matchedMap.set(area.id, area);
      }
    });

    // If still empty, fallback to initial default supported areas
    if (matchedMap.size === 0) {
      const defaults = allAreas.slice(0, 3);
      defaults.forEach((a) => matchedMap.set(a.id, a));
    }

    return Array.from(matchedMap.values());
  }

  public addSavedArea(areaId: string) {
    const current = this.getCurrentUser();
    const savedIds = current?.savedAreaIds || [];
    if (!savedIds.includes(areaId)) {
      const updatedIds = [areaId, ...savedIds];
      this.updateUser({ savedAreaIds: updatedIds });
    }
  }

  public removeSavedArea(areaId: string) {
    const current = this.getCurrentUser();
    const savedIds = current?.savedAreaIds || [];
    const updatedIds = savedIds.filter((id) => id !== areaId);
    this.updateUser({ savedAreaIds: updatedIds });
  }

  public getCurrentArea(): Area | null {
    const selected = this.getSelectedArea();
    if (selected) return selected;
    const defaultArea = this.getSupportedAreas()[0];
    return defaultArea || null;
  }

  public setCurrentArea(area: Area | null) {
    this.setSelectedArea(area);
  }

  public addArea(area: Omit<Area, 'id' | 'createdAt'>): Area {
    const areas = this.getAreas();
    const newArea: Area = {
      ...area,
      id: `area-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    areas.push(newArea);
    this.setItem(STORAGE_KEYS.AREAS, areas);
    return newArea;
  }

  public toggleAreaSupport(areaId: string, supported: boolean) {
    const areas = this.getAreas().map((a) => (a.id === areaId ? { ...a, supported } : a));
    this.setItem(STORAGE_KEYS.AREAS, areas);
  }

  public getNearestArea(lat: number, lng: number): Area | null {
    const targetLat = Number(lat);
    const targetLng = Number(lng);
    const areas = this.getAreas();

    if (isNaN(targetLat) || isNaN(targetLng) || areas.length === 0) {
      return null;
    }

    // Philippines geographical bounding box check
    const isWithinPhilippines =
      targetLat >= 4.0 && targetLat <= 22.0 && targetLng >= 116.0 && targetLng <= 127.0;

    let closestArea: Area | null = null;
    let minDistanceKm = Infinity;

    // Haversine formula for great-circle distance in kilometers
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    areas.forEach((area) => {
      const aLat = Number(area.latitude);
      const aLng = Number(area.longitude);
      if (isNaN(aLat) || isNaN(aLng)) return;

      const dLat = toRad(aLat - targetLat);
      const dLng = toRad(aLng - targetLng);
      const sa =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(targetLat)) * Math.cos(toRad(aLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa));
      const distKm = R * c;

      if (distKm < minDistanceKm) {
        minDistanceKm = distKm;
        closestArea = area;
      }
    });

    // If target coordinates are outside Philippines or further than 100km from any supported area,
    // do not force a false match
    if (!isWithinPhilippines || minDistanceKm > 100) {
      return null;
    }

    return closestArea;
  }

  public resolveIncidentCoordinates(
    areaId?: string,
    barangay?: string,
    cityMunicipality?: string,
    fallbackLat = 8.4822,
    fallbackLng = 124.6472
  ): { latitude: number; longitude: number } {
    const areas = this.getAreas();
    if (areaId) {
      const match = areas.find((a) => a.id === areaId);
      if (match) return { latitude: match.latitude, longitude: match.longitude };
    }
    if (barangay) {
      const bClean = barangay.toLowerCase().replace('barangay', '').trim();
      const match = areas.find((a) => {
        const aClean = (a?.barangay || '').toLowerCase().replace('barangay', '').trim();
        const cityMatch = !cityMunicipality || (a?.cityMunicipality || '').toLowerCase().includes((cityMunicipality || '').toLowerCase());
        return cityMatch && (aClean === bClean || aClean.includes(bClean) || bClean.includes(aClean));
      });
      if (match) return { latitude: match.latitude, longitude: match.longitude };
    }
    return { latitude: fallbackLat, longitude: fallbackLng };
  }

  // --- OUTAGES ---
  public getOutages(): Outage[] {
    const raw = this.getItem<Outage[]>(STORAGE_KEYS.OUTAGES, SEED_OUTAGES);
    return raw.map((o) => {
      const coords = this.resolveIncidentCoordinates(o.areaId, o.barangay, o.cityMunicipality, o.latitude, o.longitude);
      return {
        ...o,
        latitude: coords.latitude,
        longitude: coords.longitude
      };
    });
  }

  public getActiveOutages(): Outage[] {
    return this.getOutages().filter((o) => o.status !== 'Restored');
  }

  public getHistoricalOutages(searchQuery = '', dateFilter = 'all', providerFilter = ''): Outage[] {
    let list = this.getOutages().filter((o) => o.status === 'Restored' && o.verified);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.barangay.toLowerCase().includes(q) ||
          o.cityMunicipality.toLowerCase().includes(q) ||
          o.province.toLowerCase().includes(q) ||
          o.provider.toLowerCase().includes(q) ||
          o.communityReportedCause.toLowerCase().includes(q) ||
          o.startedAt.includes(q)
      );
    }

    if (providerFilter && providerFilter !== 'All') {
      list = list.filter((o) => o.provider.toLowerCase().includes(providerFilter.toLowerCase()));
    }

    if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      list = list.filter((o) => new Date(o.startedAt) >= thirtyDaysAgo);
    } else if (dateFilter === '90days') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      list = list.filter((o) => new Date(o.startedAt) >= ninetyDaysAgo);
    }

    return list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  public getOutageById(id: string): Outage | undefined {
    const directOutage = this.getOutages().find((o) => o.id === id);
    if (directOutage) return directOutage;

    // Fallback: If passed a report ID, resolve to its linked outage or synthesize an Outage object
    const report = this.getReports().find((r) => r.id === id);
    if (report) {
      if (report.outageId) {
        const linkedOutage = this.getOutages().find((o) => o.id === report.outageId);
        if (linkedOutage) return linkedOutage;
      }
      const area = this.getAreas().find((a) => a.id === report.areaId);
      return {
        id: report.id,
        areaId: report.areaId,
        region: report.region || area?.region || 'Region X - Northern Mindanao',
        barangay: report.barangay,
        cityMunicipality: report.cityMunicipality,
        province: report.province,
        subdivisionVillage: report.subdivisionVillage,
        latitude: report.latitude || area?.latitude || 8.4542,
        longitude: report.longitude || area?.longitude || 124.6319,
        startedAt: report.outageStartTime || report.createdAt,
        status: 'Investigating',
        verificationStatus: report.verificationStatus || 'pending',
        verified: report.verificationStatus === 'verified',
        officialConfirmedCause: report.reportedCause,
        communityReportedCause: report.reportedCause || 'Citizen Reported Interruption',
        peopleAffected: report.meTooCount || 1,
        frequencyType: 'one-time',
        provider: area?.utilityProvider?.split('(')[0]?.trim() || 'Regional Utility',
        createdBy: report.reporterId || 'community-citizen',
        disputed: report.disputed,
        disputeReason: report.disputeReason,
        createdAt: report.createdAt,
        updatedAt: report.createdAt
      };
    }

    return undefined;
  }

  public getActiveOutageForArea(areaId: string): Outage | undefined {
    return this.getActiveOutages().find((o) => o.areaId === areaId);
  }

  public updateOutageStatus(
    outageId: string,
    status: Outage['status'],
    officialConfirmedCause?: string,
    officialMessage?: string,
    organization = 'CEPALCO',
    authorName = 'Official Dispatch Desk'
  ) {
    const outages = this.getOutages().map((o) => {
      if (o.id === outageId) {
        return {
          ...o,
          status,
          officialConfirmedCause: officialConfirmedCause ?? o.officialConfirmedCause,
          restoredAt: status === 'Restored' ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    });
    this.setItem(STORAGE_KEYS.OUTAGES, outages);

    if (officialMessage || officialConfirmedCause) {
      const actionText =
        status === 'Restored'
          ? 'Case Resolved: Power 100% Restored'
          : status === 'Repairing'
          ? 'Status updated: Fixing & Line Repairs in Progress'
          : status === 'Restoring'
          ? 'Status updated: Grid Feeder Energization'
          : 'Status updated: Under Investigation';

      this.addOfficialUpdate({
        outageId,
        authorId: 'auth-officer',
        authorName: authorName,
        organization: organization,
        organizationType: organization.toLowerCase().includes('lgu') || organization.toLowerCase().includes('city') || organization.toLowerCase().includes('barangay') ? 'lgu' : 'utility',
        message: officialMessage || `${actionText}. ${officialConfirmedCause || ''}`.trim(),
        actionTaken: actionText
      });
    }

    if (status === 'Restored') {
      const out = this.getOutageById(outageId);
      this.addNotification({
        userId: 'user-citizen-default',
        type: 'restored',
        title: 'Power Restored',
        message: `Power has been fully restored in ${out?.barangay || 'your area'}. Case marked as resolved.`,
        outageId
      });
    }
  }

  public getHistoricalIncidents(): HistoricalIncident[] {
    const outages = this.getOutages();
    const reports = this.getReports();
    const areas = this.getAreas();

    const incidentList: HistoricalIncident[] = [];
    const processedOutageIds = new Set<string>();

    // 1. Process all outages (Restored + Active/Repairing/Investigating)
    outages.forEach((o) => {
      processedOutageIds.add(o.id);
      const start = new Date(o.startedAt).getTime();
      const end = o.restoredAt ? new Date(o.restoredAt).getTime() : Date.now();
      const durationMinutes = Math.max(15, Math.round((end - start) / 60000));

      incidentList.push({
        id: o.id,
        barangay: o.barangay,
        cityMunicipality: o.cityMunicipality,
        province: o.province,
        subdivisionVillage: o.subdivisionVillage,
        startedAt: o.startedAt,
        resolvedAt: o.restoredAt || (o.status === 'Restored' ? new Date().toISOString() : undefined),
        durationMinutes: o.status === 'Restored' ? durationMinutes : undefined,
        cause: o.officialConfirmedCause || o.communityReportedCause || 'Unspecified grid event',
        provider: o.provider,
        affectedCount: o.peopleAffected || 1,
        status: o.status,
        verificationStatus: o.verificationStatus || 'verified',
        disputed: o.disputed,
        disputeReason: o.disputeReason,
        category: o.status === 'Restored' ? 'restored' : 'active',
        outageId: o.id
      });
    });

    // 2. Process all citizen outage reports (newly reported cases and queued incident reports)
    reports.forEach((r) => {
      const area = areas.find((a) => a.id === r.areaId);
      const provider = area?.utilityProvider?.split('(')[0]?.trim() || 'Regional Utility';
      const linkedOutage = r.outageId ? outages.find((o) => o.id === r.outageId) : undefined;

      const isRestored = linkedOutage?.status === 'Restored' || Boolean(linkedOutage?.restoredAt);
      const isVerified = r.verificationStatus === 'verified' || Boolean(linkedOutage?.verified);
      const isRejected = r.verificationStatus === 'rejected';

      const resolvedTimestamp = linkedOutage?.restoredAt || (isRestored ? (linkedOutage?.updatedAt || new Date().toISOString()) : undefined);
      const startMs = new Date(r.outageStartTime || r.createdAt).getTime();
      const endMs = resolvedTimestamp ? new Date(resolvedTimestamp).getTime() : Date.now();
      const duration = isRestored ? Math.max(15, Math.round((endMs - startMs) / 60000)) : undefined;

      incidentList.push({
        id: r.id,
        barangay: r.barangay,
        cityMunicipality: r.cityMunicipality,
        province: r.province,
        subdivisionVillage: r.subdivisionVillage,
        startedAt: r.outageStartTime || r.createdAt,
        resolvedAt: resolvedTimestamp,
        durationMinutes: duration,
        cause: linkedOutage?.officialConfirmedCause || r.reportedCause || 'Community reported interruption',
        provider: linkedOutage?.provider || provider,
        affectedCount: r.meTooCount || 1,
        status: isRestored ? 'Restored' : linkedOutage?.status || (isVerified ? 'Verified' : isRejected ? 'Rejected' : 'Pending'),
        verificationStatus: isVerified ? 'verified' : isRejected ? 'rejected' : (r.verificationStatus || 'pending'),
        disputed: r.disputed,
        disputeReason: r.disputeReason,
        category: isRestored ? 'restored' : 'report',
        reporterName: r.name,
        contactNumber: r.contactNumber,
        additionalNotes: r.additionalNotes,
        attachments: r.attachmentUrls,
        reportId: r.id,
        outageId: r.outageId || linkedOutage?.id
      });
    });

    // Sort newest first by start/creation timestamp
    return incidentList.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  // --- ME TOO (CONFIRMATIONS) ---
  public getConfirmations(): OutageConfirmation[] {
    return this.getItem<OutageConfirmation[]>(STORAGE_KEYS.CONFIRMATIONS, SEED_CONFIRMATIONS);
  }

  public hasUserConfirmed(outageId: string, userId: string): boolean {
    const confirmations = this.getConfirmations();
    return confirmations.some((c) => c.outageId === outageId && c.userId === userId);
  }

  public confirmOutage(outageId: string, userId: string): boolean {
    if (this.hasUserConfirmed(outageId, userId)) {
      return false; // Already confirmed
    }

    const confirmations = this.getConfirmations();
    confirmations.push({
      id: `conf-${Date.now()}`,
      outageId,
      userId,
      createdAt: new Date().toISOString()
    });
    this.setItem(STORAGE_KEYS.CONFIRMATIONS, confirmations);

    // Update peopleAffected in Outage authoritative record
    const outages = this.getOutages().map((o) => {
      if (o.id === outageId) {
        return {
          ...o,
          peopleAffected: (o.peopleAffected || 0) + 1,
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    });
    this.setItem(STORAGE_KEYS.OUTAGES, outages);
    return true;
  }

  // --- CITIZEN OUTAGE REPORTS ---
  public getReports(): OutageReport[] {
    const raw = this.getItem<OutageReport[]>(STORAGE_KEYS.REPORTS, SEED_REPORTS);
    return raw.map((r) => {
      const coords = this.resolveIncidentCoordinates(r.areaId, r.barangay, r.cityMunicipality, r.latitude, r.longitude);
      return {
        ...r,
        latitude: coords.latitude,
        longitude: coords.longitude
      };
    });
  }

  public getPendingReports(): OutageReport[] {
    return this.getReports().filter((r) => r.verificationStatus === 'pending');
  }

  public createOutageReport(data: Omit<OutageReport, 'id' | 'createdAt' | 'verificationStatus' | 'meTooCount'>): OutageReport {
    const reports = this.getReports();
    const reportId = `rep-${Date.now()}`;
    const area = this.getAreaById(data.areaId) || this.getAreas().find((a) => a.barangay === data.barangay) || SEED_AREAS[0];
    const coords = this.resolveIncidentCoordinates(data.areaId, data.barangay, data.cityMunicipality, data.latitude, data.longitude);

    const newReport: OutageReport = {
      ...data,
      latitude: coords.latitude,
      longitude: coords.longitude,
      id: reportId,
      verificationStatus: 'pending',
      meTooCount: 1,
      createdAt: new Date().toISOString()
    };

    // Immediately show up on map by aggregating to existing active outage or creating a new Unverified Outage
    const outages = this.getOutages();
    let existingOutage = outages.find(
      (o) => o.areaId === data.areaId && o.status !== 'Restored'
    );

    if (existingOutage) {
      existingOutage.peopleAffected = (existingOutage.peopleAffected || 0) + 1;
      existingOutage.updatedAt = new Date().toISOString();
      newReport.outageId = existingOutage.id;
      this.setItem(STORAGE_KEYS.OUTAGES, outages);
    } else {
      const isDavao = data.cityMunicipality?.toLowerCase().includes('davao') || area?.cityMunicipality?.toLowerCase().includes('davao');
      const defaultProvider = isDavao ? 'Davao Light and Power Company (DLPC)' : (area?.utilityProvider || 'Electric Cooperative');
      const defaultRegion = isDavao ? 'Region XI (Davao Region)' : (data.region || area?.region || 'Region X');
      const defaultProvince = isDavao ? 'Davao del Sur' : (data.province || area?.province || 'Misamis Oriental');

      const newOutage: Outage = {
        id: `outage-${Date.now()}`,
        areaId: data.areaId || area?.id || `area-custom-${Date.now()}`,
        region: data.region || defaultRegion,
        province: data.province || defaultProvince,
        cityMunicipality: data.cityMunicipality || (isDavao ? 'Davao City' : area?.cityMunicipality || 'Davao City'),
        barangay: data.barangay || area?.barangay || 'Barangay 1-A (Poblacion)',
        subdivisionVillage: data.subdivisionVillage || area?.subdivisionVillage || 'Community Area',
        latitude: coords.latitude,
        longitude: coords.longitude,
        startedAt: data.outageStartTime || new Date().toISOString(),
        estimatedRestorationAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        status: 'Investigating',
        communityReportedCause: data.reportedCause || 'Citizen Reported Interruption',
        peopleAffected: 1,
        verified: false,
        verificationStatus: 'pending',
        disputed: false,
        frequencyType: 'one-time',
        provider: area?.utilityProvider || defaultProvider,
        createdBy: data.reporterId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        criticalFacilitiesNearby: SEED_CRITICAL_FACILITIES.filter((f) => f.barangay === (data.barangay || area?.barangay))
      };
      outages.unshift(newOutage);
      this.setItem(STORAGE_KEYS.OUTAGES, outages);
      newReport.outageId = newOutage.id;
    }

    reports.unshift(newReport);
    this.setItem(STORAGE_KEYS.REPORTS, reports);

    // Add alert notification for verifiers/admins
    this.addNotification({
      userId: 'user-verifier-1',
      type: 'outage_alert',
      title: 'New Citizen Outage Report (Unverified)',
      message: `A new outage report in ${newReport.barangay}, ${newReport.cityMunicipality} is now visible on the map and pending verification.`,
      outageId: newReport.outageId || newReport.id
    });

    return newReport;
  }

  public verifyReport(
    reportId: string,
    verifierIdOrNotes?: string,
    officialNotes?: string,
    options?: {
      cause?: string;
      provider?: string;
      estimatedHours?: number;
      initialStatus?: Outage['status'];
    }
  ): Outage | null {
    const reports = this.getReports();
    const reportIndex = reports.findIndex((r) => r.id === reportId);
    if (reportIndex === -1) return null;

    const report = reports[reportIndex];
    report.verificationStatus = 'verified';
    report.disputed = false;
    report.disputeReason = undefined;
    this.setItem(STORAGE_KEYS.REPORTS, reports);

    const effectiveNotes =
      officialNotes ||
      (verifierIdOrNotes && !verifierIdOrNotes.startsWith('user-') ? verifierIdOrNotes : undefined);

    const targetStatus: Outage['status'] = options?.initialStatus || 'Repairing';

    // Check if an active outage already exists for this area to aggregate, or create new
    const outages = this.getOutages();
    let existingOutage = outages.find(
      (o) => o.areaId === report.areaId && o.status !== 'Restored'
    );

    let resultingOutageId: string;

    if (existingOutage) {
      existingOutage.peopleAffected = (existingOutage.peopleAffected || 0) + (report.meTooCount || 1);
      existingOutage.updatedAt = new Date().toISOString();
      existingOutage.verified = true;
      existingOutage.verificationStatus = 'verified';
      // Inaccurate flag cleared upon verification
      existingOutage.disputed = false;
      existingOutage.disputeReason = undefined;
      if (options?.initialStatus) {
        existingOutage.status = options.initialStatus;
      }
      if (effectiveNotes && !existingOutage.officialConfirmedCause) {
        existingOutage.officialConfirmedCause = effectiveNotes;
      }
      this.setItem(STORAGE_KEYS.OUTAGES, outages);
      report.outageId = existingOutage.id;
      this.setItem(STORAGE_KEYS.REPORTS, reports);
      resultingOutageId = existingOutage.id;
    } else {
      const area = this.getAreaById(report.areaId) || SEED_AREAS[0];
      const hours = options?.estimatedHours || 4;
      const newOutage: Outage = {
        id: `outage-${Date.now()}`,
        areaId: report.areaId,
        region: report.region,
        province: report.province,
        cityMunicipality: report.cityMunicipality,
        barangay: report.barangay,
        subdivisionVillage: report.subdivisionVillage || 'Community Area',
        latitude: report.latitude || area.latitude,
        longitude: report.longitude || area.longitude,
        startedAt: report.outageStartTime || new Date().toISOString(),
        estimatedRestorationAt: new Date(Date.now() + hours * 3600 * 1000).toISOString(),
        status: targetStatus,
        communityReportedCause: options?.cause || report.reportedCause,
        officialConfirmedCause:
          effectiveNotes || `Verified by Response Team: ${options?.cause || report.reportedCause}`,
        peopleAffected: Math.max(1, report.meTooCount || 1),
        verified: true,
        verificationStatus: 'verified',
        disputed: false,
        disputeReason: undefined,
        frequencyType: 'one-time',
        provider: options?.provider || area.utilityProvider,
        createdBy: report.reporterId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      outages.unshift(newOutage);
      this.setItem(STORAGE_KEYS.OUTAGES, outages);

      // Link report to new outage
      report.outageId = newOutage.id;
      this.setItem(STORAGE_KEYS.REPORTS, reports);
      resultingOutageId = newOutage.id;
    }

    // Mark any flags related to this report or outage as reviewed
    const flags = this.getItem<ReportFlag[]>(STORAGE_KEYS.FLAGS, []).map((f) => {
      if (f.reportId === report.id || (resultingOutageId && f.outageId === resultingOutageId)) {
        return { ...f, reviewed: true };
      }
      return f;
    });
    this.setItem(STORAGE_KEYS.FLAGS, flags);

    // Send notifications to reporter and public feed
    this.addNotification({
      userId: report.reporterId,
      type: 'report_verified',
      title: 'Report Verified & Published',
      message: `Your power outage incident report in ${report.barangay}, ${report.cityMunicipality} was verified and published to the live Philippine outage grid.`,
      outageId: resultingOutageId
    });

    this.addNotification({
      userId: 'user-citizen-default',
      type: 'outage_alert',
      title: `Confirmed Outage: ${report.barangay}`,
      message: `Electric interruption verified in ${report.barangay}, ${report.cityMunicipality} (${options?.provider || 'Grid Utility'}).`,
      outageId: resultingOutageId
    });

    return existingOutage || outages[0];
  }

  public rejectReport(reportId: string, verifierIdOrReason: string, reason?: string) {
    const finalReason = reason || verifierIdOrReason || 'Report rejected by verification team';
    const targetReport = this.getReports().find((r) => r.id === reportId);

    const reports = this.getReports().map((r) => {
      if (r.id === reportId) {
        return {
          ...r,
          verificationStatus: 'rejected' as const,
          rejectionReason: finalReason
        };
      }
      return r;
    });
    this.setItem(STORAGE_KEYS.REPORTS, reports);

    // If an unverified outage exists and has no other pending/verified reports, clean it up
    if (targetReport?.outageId) {
      const remainingForOutage = reports.filter(
        (r) => r.outageId === targetReport.outageId && r.verificationStatus !== 'rejected'
      );
      if (remainingForOutage.length === 0) {
        const outages = this.getOutages().filter(
          (o) => !(o.id === targetReport.outageId && !o.verified)
        );
        this.setItem(STORAGE_KEYS.OUTAGES, outages);
      }
    }
  }

  public reopenReport(reportId: string) {
    const reports = this.getReports().map((r) => {
      if (r.id === reportId) {
        return {
          ...r,
          verificationStatus: 'pending' as const,
          rejectionReason: undefined
        };
      }
      return r;
    });
    this.setItem(STORAGE_KEYS.REPORTS, reports);
  }

  public deleteReport(reportId: string): boolean {
    const reports = this.getReports();
    const targetReport = reports.find((r) => r.id === reportId);
    if (!targetReport) return false;

    const remainingReports = reports.filter((r) => r.id !== reportId);
    this.setItem(STORAGE_KEYS.REPORTS, remainingReports);

    // If an unverified outage was created solely by this report and has no other reports, clean it up
    if (targetReport.outageId) {
      const remainingForOutage = remainingReports.filter(
        (r) => r.outageId === targetReport.outageId
      );
      if (remainingForOutage.length === 0) {
        const outages = this.getOutages();
        const targetOutage = outages.find((o) => o.id === targetReport.outageId);
        if (targetOutage && !targetOutage.verified) {
          const updatedOutages = outages.filter((o) => o.id !== targetReport.outageId);
          this.setItem(STORAGE_KEYS.OUTAGES, updatedOutages);
        }
      }
    }

    // Clean up flags referencing this report
    const flags = this.getItem<ReportFlag[]>(STORAGE_KEYS.FLAGS, []).filter(
      (f) => f.reportId !== reportId
    );
    this.setItem(STORAGE_KEYS.FLAGS, flags);

    return true;
  }

  public deleteOutage(outageId: string): boolean {
    const outages = this.getOutages();
    const targetOutage = outages.find((o) => o.id === outageId);
    if (!targetOutage) return false;

    const remainingOutages = outages.filter((o) => o.id !== outageId);
    this.setItem(STORAGE_KEYS.OUTAGES, remainingOutages);

    // Also remove or unlink any reports referencing this outage
    const remainingReports = this.getReports().filter((r) => r.outageId !== outageId && r.id !== outageId);
    this.setItem(STORAGE_KEYS.REPORTS, remainingReports);

    // Clean up community updates and official updates for this outage
    const remainingComm = this.getCommunityUpdates().filter((u) => u.outageId !== outageId);
    this.setItem(STORAGE_KEYS.COMMUNITY_UPDATES, remainingComm);

    const remainingOfficial = this.getOfficialUpdates().filter((u) => u.outageId !== outageId);
    this.setItem(STORAGE_KEYS.OFFICIAL_UPDATES, remainingOfficial);

    // Clean up flags
    const flags = this.getItem<ReportFlag[]>(STORAGE_KEYS.FLAGS, []).filter(
      (f) => f.outageId !== outageId
    );
    this.setItem(STORAGE_KEYS.FLAGS, flags);

    return true;
  }

  public deleteHistoricalIncident(incidentId: string): boolean {
    let deleted = false;

    // Check if matching an outage
    if (this.deleteOutage(incidentId)) {
      deleted = true;
    }

    // Check if matching a citizen report
    if (this.deleteReport(incidentId)) {
      deleted = true;
    }

    return deleted;
  }

  public clearAllHistoricalIncidents(): number {
    const totalOutages = this.getOutages().length;
    const totalReports = this.getReports().length;

    this.setItem(STORAGE_KEYS.OUTAGES, []);
    this.setItem(STORAGE_KEYS.REPORTS, []);
    this.setItem(STORAGE_KEYS.COMMUNITY_UPDATES, []);
    this.setItem(STORAGE_KEYS.OFFICIAL_UPDATES, []);
    this.setItem(STORAGE_KEYS.FLAGS, []);

    return totalOutages + totalReports;
  }

  public deleteReportsBatch(reportIds: string[]): number {
    let count = 0;
    reportIds.forEach((id) => {
      if (this.deleteReport(id)) count++;
    });
    return count;
  }

  public clearTestReports(): number {
    const reports = this.getReports();
    const testReports = reports.filter(
      (r) =>
        r.reporterId === 'user-citizen-demo' ||
        r.name.toLowerCase().includes('sample') ||
        r.name.toLowerCase().includes('demo') ||
        r.name.toLowerCase().includes('test') ||
        r.additionalNotes?.toLowerCase().includes('sample')
    );
    return this.deleteReportsBatch(testReports.map((r) => r.id));
  }

  // --- COMMUNITY UPDATES ---
  public getCommunityUpdates(outageId?: string): CommunityUpdate[] {
    const updates = this.getItem<CommunityUpdate[]>(STORAGE_KEYS.COMMUNITY_UPDATES, SEED_COMMUNITY_UPDATES);
    if (!outageId) return updates;

    const matchingIds = new Set<string>([outageId]);
    const outages = this.getOutages();
    const reports = this.getReports();

    const foundOutage = outages.find((o) => o.id === outageId);
    if (foundOutage) {
      reports.filter((r) => r.outageId === foundOutage.id).forEach((r) => matchingIds.add(r.id));
    }

    const foundReport = reports.find((r) => r.id === outageId);
    if (foundReport && foundReport.outageId) {
      matchingIds.add(foundReport.outageId);
    }

    return updates.filter((u) => matchingIds.has(u.outageId));
  }

  public addCommunityUpdate(data: Omit<CommunityUpdate, 'id' | 'createdAt'>): CommunityUpdate {
    const updates = this.getItem<CommunityUpdate[]>(STORAGE_KEYS.COMMUNITY_UPDATES, SEED_COMMUNITY_UPDATES);
    const newUpdate: CommunityUpdate = {
      ...data,
      id: `comm-up-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    updates.unshift(newUpdate);
    this.setItem(STORAGE_KEYS.COMMUNITY_UPDATES, updates);
    return newUpdate;
  }

  // --- OFFICIAL UPDATES ---
  public getOfficialUpdates(outageId?: string): OfficialUpdate[] {
    const updates = this.getItem<OfficialUpdate[]>(STORAGE_KEYS.OFFICIAL_UPDATES, SEED_OFFICIAL_UPDATES);
    if (!outageId) return updates;

    const matchingIds = new Set<string>([outageId]);
    const outages = this.getOutages();
    const reports = this.getReports();

    const foundOutage = outages.find((o) => o.id === outageId);
    if (foundOutage) {
      reports.filter((r) => r.outageId === foundOutage.id).forEach((r) => matchingIds.add(r.id));
    }

    const foundReport = reports.find((r) => r.id === outageId);
    if (foundReport && foundReport.outageId) {
      matchingIds.add(foundReport.outageId);
    }

    return updates.filter((u) => matchingIds.has(u.outageId));
  }

  public addOfficialUpdate(data: Omit<OfficialUpdate, 'id' | 'createdAt' | 'verified'>): OfficialUpdate {
    const updates = this.getOfficialUpdates();
    const newUpdate: OfficialUpdate = {
      ...data,
      id: `off-up-${Date.now()}`,
      verified: true,
      createdAt: new Date().toISOString()
    };
    updates.unshift(newUpdate);
    this.setItem(STORAGE_KEYS.OFFICIAL_UPDATES, updates);
    return newUpdate;
  }

  // --- SCHEDULED OUTAGES ---
  public getScheduledOutages(): ScheduledOutage[] {
    return this.getItem<ScheduledOutage[]>(STORAGE_KEYS.SCHEDULED_OUTAGES, SEED_SCHEDULED_OUTAGES);
  }

  public addScheduledOutage(data: {
    id?: string;
    areaId: string;
    areaName?: string;
    barangay?: string;
    cityMunicipality?: string;
    startAt: string;
    endAt: string;
    reason: string;
    provider: string;
    status?: 'Upcoming' | 'In Progress' | 'Completed';
    affectedBarangays?: string[];
  }): ScheduledOutage {
    const list = this.getScheduledOutages();
    const areaTitle = data.areaName || (data.barangay ? `${data.barangay}, ${data.cityMunicipality || ''}` : 'Designated Area');
    const newSched: ScheduledOutage = {
      id: data.id || `sched-${Date.now()}`,
      areaId: data.areaId,
      areaName: areaTitle,
      provider: data.provider,
      reason: data.reason,
      startAt: data.startAt,
      endAt: data.endAt,
      status: data.status || 'Upcoming',
      affectedBarangays: data.affectedBarangays || (data.barangay ? [data.barangay] : []),
      createdAt: new Date().toISOString()
    };
    list.unshift(newSched);
    this.setItem(STORAGE_KEYS.SCHEDULED_OUTAGES, list);
    return newSched;
  }

  public deleteScheduledOutage(id: string): boolean {
    const list = this.getScheduledOutages();
    const target = list.find((s) => s.id === id);
    if (!target) return false;

    const remaining = list.filter((s) => s.id !== id);
    this.setItem(STORAGE_KEYS.SCHEDULED_OUTAGES, remaining);
    return true;
  }

  // --- NOTIFICATIONS ---
  public getNotifications(userId?: string): AppNotification[] {
    const notifs = this.getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    if (userId) {
      return notifs.filter((n) => n.userId === userId || n.userId === 'all');
    }
    return notifs;
  }

  public addNotification(data: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {
    const notifs = this.getNotifications();
    const newNotif: AppNotification = {
      ...data,
      id: `notif-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifs.unshift(newNotif);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  public markNotificationAsRead(id: string) {
    const notifs = this.getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  public markAllNotificationsAsRead(userId: string) {
    const notifs = this.getNotifications().map((n) => (n.userId === userId ? { ...n, read: true } : n));
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  public markAllNotificationsRead(userId: string) {
    this.markAllNotificationsAsRead(userId);
  }

  // --- FLAGS ---
  public flagOutage(outageId: string, userId: string, reason: string) {
    const flags = this.getItem<ReportFlag[]>(STORAGE_KEYS.FLAGS, []);
    flags.push({
      id: `flag-${Date.now()}`,
      outageId,
      userId,
      reason,
      createdAt: new Date().toISOString(),
      reviewed: false
    });
    this.setItem(STORAGE_KEYS.FLAGS, flags);

    // Flag outage in main list
    let flaggedBarangay = '';
    const outages = this.getOutages().map((o) => {
      if (o.id === outageId) {
        flaggedBarangay = o.barangay;
        return { ...o, disputed: true, disputeReason: reason, updatedAt: new Date().toISOString() };
      }
      return o;
    });
    this.setItem(STORAGE_KEYS.OUTAGES, outages);

    // Also flag any associated reports
    const reports = this.getReports().map((r) => {
      if (r.outageId === outageId || r.id === outageId) {
        return {
          ...r,
          disputed: true,
          disputeReason: reason,
          flaggedCount: (r.flaggedCount || 0) + 1
        };
      }
      return r;
    });
    this.setItem(STORAGE_KEYS.REPORTS, reports);

    // Add alert notification for verifiers and response teams
    this.addNotification({
      userId: 'user-verifier-1',
      type: 'outage_alert',
      title: 'Incident Flagged as Inaccurate',
      message: `A community member flagged the report in ${flaggedBarangay || 'outage record'} as inaccurate: "${reason}"`,
      outageId
    });
  }

  public flagReport(reportId: string, userId: string, reason: string) {
    const flags = this.getItem<ReportFlag[]>(STORAGE_KEYS.FLAGS, []);
    flags.push({
      id: `flag-${Date.now()}`,
      reportId,
      userId,
      reason,
      createdAt: new Date().toISOString(),
      reviewed: false
    });
    this.setItem(STORAGE_KEYS.FLAGS, flags);

    let linkedOutageId: string | undefined;
    let reportBarangay = '';
    const reports = this.getReports().map((r) => {
      if (r.id === reportId) {
        linkedOutageId = r.outageId;
        reportBarangay = r.barangay;
        return {
          ...r,
          disputed: true,
          disputeReason: reason,
          flaggedCount: (r.flaggedCount || 0) + 1
        };
      }
      return r;
    });
    this.setItem(STORAGE_KEYS.REPORTS, reports);

    if (linkedOutageId) {
      const outages = this.getOutages().map((o) => {
        if (o.id === linkedOutageId) {
          return { ...o, disputed: true, disputeReason: reason, updatedAt: new Date().toISOString() };
        }
        return o;
      });
      this.setItem(STORAGE_KEYS.OUTAGES, outages);
    }

    this.addNotification({
      userId: 'user-verifier-1',
      type: 'outage_alert',
      title: 'Report Flagged as Inaccurate',
      message: `A community member flagged citizen report #${reportId.slice(-6)} in ${reportBarangay || 'queue'} as inaccurate: "${reason}"`,
      outageId: linkedOutageId || reportId
    });
  }

  public clearDispute(targetId: string) {
    // Clear dispute from outages
    const outages = this.getOutages().map((o) => {
      if (o.id === targetId) {
        return {
          ...o,
          disputed: false,
          disputeReason: undefined,
          verified: true,
          verificationStatus: 'verified' as const,
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    });
    this.setItem(STORAGE_KEYS.OUTAGES, outages);

    // Clear dispute from reports
    const reports = this.getReports().map((r) => {
      if (r.id === targetId || r.outageId === targetId) {
        return {
          ...r,
          disputed: false,
          disputeReason: undefined,
          verificationStatus: 'verified' as const
        };
      }
      return r;
    });
    this.setItem(STORAGE_KEYS.REPORTS, reports);

    // Mark corresponding flags as reviewed
    const flags = this.getItem<ReportFlag[]>(STORAGE_KEYS.FLAGS, []).map((f) => {
      if (f.outageId === targetId || f.reportId === targetId) {
        return { ...f, reviewed: true };
      }
      return f;
    });
    this.setItem(STORAGE_KEYS.FLAGS, flags);
  }

  // --- RELIABILITY ANALYTICS ---
  public getReliabilityMetrics(areaId?: string): ReliabilityMetric {
    const outages = this.getOutages();
    const relevantOutages = areaId ? outages.filter((o) => o.areaId === areaId) : outages;

    const totalOutages = relevantOutages.length;
    const resolvedOutages = relevantOutages.filter((o) => o.status === 'Restored').length;
    const resolutionPercentage = totalOutages > 0 ? Math.round((resolvedOutages / totalOutages) * 100) : 100;

    // Calculate reliability score: 100 - (active outages * 2.5) with floor at 82%
    const activeCount = relevantOutages.filter((o) => o.status !== 'Restored').length;
    const reliabilityScore = Math.max(82, Math.min(99.4, 98.6 - activeCount * 3.4));

    const selectedArea = areaId ? this.getAreaById(areaId) : this.getSelectedArea();

    return {
      areaId: selectedArea?.id || 'all',
      areaName: selectedArea ? `${selectedArea.barangay}, ${selectedArea.cityMunicipality}` : 'All Philippine Coverage',
      provider: selectedArea?.utilityProvider || 'Davao Light and Power Company (DLPC)',
      reliabilityScore: Number(reliabilityScore.toFixed(1)),
      avgOutageDurationMinutes: 142,
      monthlyOutageCount: totalOutages,
      resolutionPercentage,
      responseScore: 92,
      frequencyTag: activeCount > 1 ? 'chronic' : 'one-time',
      unaddressedReports: activeCount,
      addressedReports: resolvedOutages
    };
  }

  // --- FIRESTORE CLOUD MERGE METHODS ---
  public mergeOutagesFromCloud(cloudOutages: Outage[]) {
    if (!cloudOutages || cloudOutages.length === 0) return;
    const current = this.getOutages();
    const map = new Map<string, Outage>();
    current.forEach((o) => map.set(o.id, o));
    cloudOutages.forEach((o) => {
      const coords = this.resolveIncidentCoordinates(o.areaId, o.barangay, o.cityMunicipality, o.latitude, o.longitude);
      map.set(o.id, {
        ...o,
        latitude: coords.latitude,
        longitude: coords.longitude
      });
    });
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    this.setItem(STORAGE_KEYS.OUTAGES, merged);
  }

  public mergeReportsFromCloud(cloudReports: OutageReport[]) {
    if (!cloudReports || cloudReports.length === 0) return;
    const current = this.getReports();
    const map = new Map<string, OutageReport>();
    current.forEach((r) => map.set(r.id, r));
    cloudReports.forEach((r) => {
      const coords = this.resolveIncidentCoordinates(r.areaId, r.barangay, r.cityMunicipality, r.latitude, r.longitude);
      map.set(r.id, {
        ...r,
        latitude: coords.latitude,
        longitude: coords.longitude
      });
    });
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    this.setItem(STORAGE_KEYS.REPORTS, merged);
  }

  public mergeCommunityUpdatesFromCloud(cloudUpdates: CommunityUpdate[]) {
    if (!cloudUpdates || cloudUpdates.length === 0) return;
    const current = this.getCommunityUpdates();
    const map = new Map<string, CommunityUpdate>();
    current.forEach((u) => map.set(u.id, u));
    cloudUpdates.forEach((u) => map.set(u.id, u));
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    this.setItem(STORAGE_KEYS.COMMUNITY_UPDATES, merged);
  }

  public mergeOfficialUpdatesFromCloud(cloudOfficial: OfficialUpdate[]) {
    if (!cloudOfficial || cloudOfficial.length === 0) return;
    const current = this.getOfficialUpdates();
    const map = new Map<string, OfficialUpdate>();
    current.forEach((u) => map.set(u.id, u));
    cloudOfficial.forEach((u) => map.set(u.id, u));
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    this.setItem(STORAGE_KEYS.OFFICIAL_UPDATES, merged);
  }

  public mergeScheduledOutagesFromCloud(cloudSched: ScheduledOutage[]) {
    if (!cloudSched || cloudSched.length === 0) return;
    const current = this.getScheduledOutages();
    const map = new Map<string, ScheduledOutage>();
    current.forEach((s) => map.set(s.id, s));
    cloudSched.forEach((s) => map.set(s.id, s));
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || b.startAt).getTime() - new Date(a.createdAt || a.startAt).getTime()
    );
    this.setItem(STORAGE_KEYS.SCHEDULED_OUTAGES, merged);
  }

  public mergeUsersFromCloud(cloudUsers: User[]) {
    if (!cloudUsers || cloudUsers.length === 0) return;
    const current = this.getUsers();
    const map = new Map<string, User>();

    // Seed/current local users
    current.forEach((u) => {
      if (u.id) map.set(u.id, u);
    });

    // Merge cloud users
    cloudUsers.forEach((rawCu) => {
      const cu: User = {
        ...rawCu,
        role: rawCu.role === 'admin' && !isSystemAdminId(rawCu.id) ? 'citizen' : rawCu.role
      };
      const existing = map.get(cu.id);
      if (existing) {
        map.set(cu.id, { ...existing, ...cu });
      } else {
        // Also check if any existing user shares the same email
        let foundKey: string | null = null;
        if (cu.email) {
          const cleanEmail = cu.email.toLowerCase().trim();
          for (const [k, v] of map.entries()) {
            if (v.email && v.email.toLowerCase().trim() === cleanEmail) {
              foundKey = k;
              break;
            }
          }
        }
        if (foundKey) {
          const prev = map.get(foundKey)!;
          map.set(foundKey, { ...prev, ...cu });
        } else {
          map.set(cu.id, cu);
        }
      }
    });

    const merged = Array.from(map.values());
    this.setItem(STORAGE_KEYS.USERS, merged);

    // If current logged-in user matches any user in cloud (by id or email), synchronize roles
    const activeUser = this.getCurrentUser();
    if (activeUser && activeUser.id && activeUser.id !== 'user-guest') {
      const currentEmail = (activeUser.email || '').toLowerCase().trim();
      const matched = merged.find(
        (u) =>
          u.id === activeUser.id ||
          (currentEmail && u.email && u.email.toLowerCase().trim() === currentEmail)
      );

      if (matched && (matched.role !== activeUser.role || matched.organization !== activeUser.organization)) {
        this.setCurrentUser({
          ...activeUser,
          role: matched.role,
          organization: matched.organization,
          verified: matched.verified ?? activeUser.verified
        });
      }
    }
  }

  public resetDemoData() {
    this.initialize(true);
  }
}

export const storageService = new StorageService();
