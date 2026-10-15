export type UserRole = 
  | 'citizen' 
  | 'utility_provider' 
  | 'lgu' 
  | 'verification_team' 
  | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  organization?: string;
  verified: boolean;
  savedAreaIds: string[];
  selectedAreaId?: string;
  createdAt: string;
  isAuthenticated?: boolean;
  isGuest?: boolean;
}

export interface Area {
  id: string;
  region: string;
  province: string;
  cityMunicipality: string;
  district: string;
  barangay: string;
  subdivisionVillage?: string;
  latitude: number;
  longitude: number;
  supported: boolean;
  utilityProvider: string;
  lguName: string;
  createdAt: string;
}

export type OutageStatus = 'Investigating' | 'Repairing' | 'Restoring' | 'Restored';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type FrequencyType = 'chronic' | 'one-time';
export type ImpactTag = 'Home' | 'Business' | 'Hospital' | 'School' | 'Other';

export interface CriticalFacility {
  id: string;
  name: string;
  type: 'Hospital' | 'Dialysis Center' | 'Water Pumping Station' | 'Emergency Services' | 'School';
  latitude: number;
  longitude: number;
  backupPowerStatus: 'Generator Active' | 'Running Low on Fuel' | 'No Generator' | 'Stable';
  barangay: string;
}

export interface Outage {
  id: string;
  areaId: string;
  region: string;
  province: string;
  cityMunicipality: string;
  barangay: string;
  subdivisionVillage?: string;
  latitude: number;
  longitude: number;
  startedAt: string;
  restoredAt?: string;
  estimatedRestorationAt?: string;
  status: OutageStatus;
  communityReportedCause: string;
  officialConfirmedCause?: string;
  peopleAffected: number;
  verified: boolean;
  verificationStatus: VerificationStatus;
  disputed?: boolean;
  disputeReason?: string;
  frequencyType: FrequencyType;
  provider: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  criticalFacilitiesNearby?: CriticalFacility[];
}

export interface OutageReport {
  id: string;
  outageId?: string;
  reporterId: string;
  name: string;
  contactNumber: string; // Confidential
  areaId: string;
  region: string;
  province: string;
  cityMunicipality: string;
  barangay: string;
  subdivisionVillage?: string;
  latitude?: number;
  longitude?: number;
  outageStartTime: string;
  reportedCause: string;
  additionalNotes?: string;
  attachmentUrls: string[];
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  meTooCount: number;
  createdAt: string;
  disputed?: boolean;
  disputeReason?: string;
  flaggedCount?: number;
}

export interface OutageConfirmation {
  id: string;
  outageId: string;
  userId: string;
  createdAt: string;
}

export interface CommunityUpdate {
  id: string;
  outageId: string;
  userId?: string;
  name: string;
  contactNumber?: string; // Stored securely, never shown publicly
  message: string;
  impactTag: ImpactTag;
  createdAt: string;
}

export interface OfficialUpdate {
  id: string;
  outageId: string;
  authorId: string;
  authorName: string;
  organization: string;
  organizationType: 'utility' | 'lgu' | 'agency';
  message: string;
  actionTaken?: string;
  createdAt: string;
  verified: boolean;
}

export interface ScheduledOutage {
  id: string;
  areaId: string;
  areaName: string;
  provider: string;
  reason: string;
  startAt: string;
  endAt: string;
  status: 'Upcoming' | 'In Progress' | 'Completed';
  affectedBarangays: string[];
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'outage_alert' | 'status_change' | 'restored' | 'report_verified' | 'scheduled_maintenance' | 'community_update';
  title: string;
  message: string;
  outageId?: string;
  read: boolean;
  createdAt: string;
}

export interface ReportFlag {
  id: string;
  outageId?: string;
  reportId?: string;
  userId: string;
  reason: string;
  createdAt: string;
  reviewed: boolean;
}

export interface HistoricalIncident {
  id: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  subdivisionVillage?: string;
  startedAt: string;
  resolvedAt?: string;
  durationMinutes?: number;
  cause: string;
  provider: string;
  affectedCount: number;
  status?: OutageStatus | 'Pending' | 'Verified' | 'Rejected' | 'Investigating' | 'Repairing' | 'Restoring' | 'Restored';
  verificationStatus?: VerificationStatus;
  disputed?: boolean;
  disputeReason?: string;
  category?: 'restored' | 'active' | 'report';
  reporterName?: string;
  contactNumber?: string;
  additionalNotes?: string;
  attachments?: string[];
  reportId?: string;
  outageId?: string;
}

export interface ReliabilityMetric {
  areaId: string;
  areaName: string;
  provider: string;
  reliabilityScore: number; // e.g. 94.8%
  avgOutageDurationMinutes: number;
  monthlyOutageCount: number;
  resolutionPercentage: number;
  responseScore: number;
  frequencyTag: FrequencyType;
  unaddressedReports: number;
  addressedReports: number;
}
