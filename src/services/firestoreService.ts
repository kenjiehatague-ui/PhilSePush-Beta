import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import {
  db,
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  handleFirestoreError,
  OperationType,
  FirebaseUser
} from './firebase';
import {
  Outage,
  OutageReport,
  CommunityUpdate,
  OfficialUpdate,
  ScheduledOutage,
  AppNotification,
  User,
  Area
} from '../types';
import { storageService, isSystemAdminId } from './storageService';

// Helper to recursively remove undefined fields so Firestore doesn't throw "Unsupported field value: undefined"
function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanFirestoreData(item)) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

export class FirestoreService {
  private unsubscribers: Unsubscribe[] = [];
  private isInitialized = false;
  private isConnected = false;

  // Initialize live Firestore listeners
  public initRealtimeSync(): () => void {
    if (this.isInitialized) {
      return () => this.stopRealtimeSync();
    }
    this.isInitialized = true;

    try {
      // 1. Sync Live Outages
      const outagesCol = collection(db, 'outages');
      const unsubOutages = onSnapshot(
        outagesCol,
        (snapshot) => {
          this.isConnected = true;
          if (!snapshot.empty) {
            const liveOutages: Outage[] = [];
            snapshot.forEach((docSnap) => {
              liveOutages.push({ ...docSnap.data(), id: docSnap.id } as Outage);
            });
            // Update local storage cache
            storageService.mergeOutagesFromCloud(liveOutages);
          }
        },
        (error) => {
          console.warn('Firestore Outages snapshot error (will use local fallback):', error);
          this.isConnected = false;
        }
      );
      this.unsubscribers.push(unsubOutages);

      // 2. Sync Citizen Reports
      const reportsCol = collection(db, 'reports');
      const unsubReports = onSnapshot(
        reportsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const liveReports: OutageReport[] = [];
            snapshot.forEach((docSnap) => {
              liveReports.push({ ...docSnap.data(), id: docSnap.id } as OutageReport);
            });
            storageService.mergeReportsFromCloud(liveReports);
          }
        },
        (error) => {
          console.warn('Firestore Reports snapshot error:', error);
        }
      );
      this.unsubscribers.push(unsubReports);

      // 3. Sync Community Updates
      const commCol = collection(db, 'community_updates');
      const unsubComm = onSnapshot(
        commCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const liveComm: CommunityUpdate[] = [];
            snapshot.forEach((docSnap) => {
              liveComm.push({ ...docSnap.data(), id: docSnap.id } as CommunityUpdate);
            });
            storageService.mergeCommunityUpdatesFromCloud(liveComm);
          }
        },
        (error) => {
          console.warn('Firestore Community Updates snapshot error:', error);
        }
      );
      this.unsubscribers.push(unsubComm);

      // 4. Sync Official Bulletins
      const officialCol = collection(db, 'official_updates');
      const unsubOfficial = onSnapshot(
        officialCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const liveOfficial: OfficialUpdate[] = [];
            snapshot.forEach((docSnap) => {
              liveOfficial.push({ ...docSnap.data(), id: docSnap.id } as OfficialUpdate);
            });
            storageService.mergeOfficialUpdatesFromCloud(liveOfficial);
          }
        },
        (error) => {
          console.warn('Firestore Official Updates snapshot error:', error);
        }
      );
      this.unsubscribers.push(unsubOfficial);

      // 5. Sync Users & Authorized Roles
      const usersCol = collection(db, 'users');
      const unsubUsers = onSnapshot(
        usersCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const liveUsers: User[] = [];
            snapshot.forEach((docSnap) => {
              liveUsers.push({ ...docSnap.data(), id: docSnap.id } as User);
            });
            storageService.mergeUsersFromCloud(liveUsers);
          }
        },
        (error) => {
          console.warn('Firestore Users snapshot error:', error);
          if (error?.code === 'permission-denied') {
            try {
              handleFirestoreError(error, OperationType.LIST, 'users');
            } catch (err) {
              // Structured JSON error logged
            }
          }
        }
      );
      this.unsubscribers.push(unsubUsers);

      // 6. Sync Scheduled Maintenance Advisories
      const schedCol = collection(db, 'scheduled_outages');
      const unsubSched = onSnapshot(
        schedCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const liveSched: ScheduledOutage[] = [];
            snapshot.forEach((docSnap) => {
              liveSched.push({ ...docSnap.data(), id: docSnap.id } as ScheduledOutage);
            });
            storageService.mergeScheduledOutagesFromCloud(liveSched);
          }
        },
        (error) => {
          console.warn('Firestore Scheduled Outages snapshot error:', error);
        }
      );
      this.unsubscribers.push(unsubSched);
    } catch (err) {
      console.warn('Firestore real-time sync init error:', err);
    }

    return () => this.stopRealtimeSync();
  }

  public stopRealtimeSync() {
    this.unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        // ignore cleanup error
      }
    });
    this.unsubscribers = [];
    this.isInitialized = false;
  }

  // --- CLOUD MUTATIONS WITH FIRESTORE ERROR HANDLING ---

  public async saveReport(report: OutageReport): Promise<void> {
    const path = `reports/${report.id}`;
    try {
      const payload = cleanFirestoreData({
        ...report,
        syncedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, 'reports', report.id), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async updateReportStatus(reportId: string, status: 'pending' | 'verified' | 'rejected', reason?: string): Promise<void> {
    const path = `reports/${reportId}`;
    try {
      const payload: any = {
        verificationStatus: status,
        rejectionReason: reason || null,
        updatedAt: new Date().toISOString(),
      };
      if (status === 'verified') {
        payload.disputed = false;
        payload.disputeReason = null;
      }
      await updateDoc(doc(db, 'reports', reportId), cleanFirestoreData(payload));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  public async deleteReport(reportId: string): Promise<void> {
    const path = `reports/${reportId}`;
    try {
      await deleteDoc(doc(db, 'reports', reportId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  public async flagOutage(outageId: string, reason: string): Promise<void> {
    const path = `outages/${outageId}`;
    try {
      const payload = cleanFirestoreData({
        disputed: true,
        disputeReason: reason,
        updatedAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'outages', outageId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  public async flagReport(reportId: string, reason: string): Promise<void> {
    const path = `reports/${reportId}`;
    try {
      const payload = cleanFirestoreData({
        disputed: true,
        disputeReason: reason,
        updatedAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'reports', reportId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  public async clearDispute(targetId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'outages', targetId), {
        disputed: false,
        disputeReason: null,
        updatedAt: new Date().toISOString()
      }).catch(() => {});
      await updateDoc(doc(db, 'reports', targetId), {
        disputed: false,
        disputeReason: null,
        updatedAt: new Date().toISOString()
      }).catch(() => {});
    } catch (error) {
      // ignore
    }
  }

  public async saveOutage(outage: Outage): Promise<void> {
    const path = `outages/${outage.id}`;
    try {
      const payload = cleanFirestoreData({
        ...outage,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, 'outages', outage.id), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async deleteOutage(outageId: string): Promise<void> {
    const path = `outages/${outageId}`;
    try {
      await deleteDoc(doc(db, 'outages', outageId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  public async deleteHistoricalIncident(incidentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'outages', incidentId)).catch(() => {});
      await deleteDoc(doc(db, 'reports', incidentId)).catch(() => {});
    } catch (error) {
      // ignore
    }
  }

  public async clearAllHistoricalIncidents(): Promise<void> {
    try {
      const outagesSnap = await getDocs(collection(db, 'outages'));
      outagesSnap.forEach((d) => {
        deleteDoc(doc(db, 'outages', d.id)).catch(() => {});
      });

      const reportsSnap = await getDocs(collection(db, 'reports'));
      reportsSnap.forEach((d) => {
        deleteDoc(doc(db, 'reports', d.id)).catch(() => {});
      });

      const commSnap = await getDocs(collection(db, 'community_updates'));
      commSnap.forEach((d) => {
        deleteDoc(doc(db, 'community_updates', d.id)).catch(() => {});
      });

      const offSnap = await getDocs(collection(db, 'official_updates'));
      offSnap.forEach((d) => {
        deleteDoc(doc(db, 'official_updates', d.id)).catch(() => {});
      });
    } catch (error) {
      console.warn('Error clearing historical incidents in Firestore:', error);
    }
  }

  public async saveScheduledOutage(sched: ScheduledOutage): Promise<void> {
    const path = `scheduled_outages/${sched.id}`;
    try {
      const payload = cleanFirestoreData({
        ...sched,
        updatedAt: new Date().toISOString()
      });
      await setDoc(doc(db, 'scheduled_outages', sched.id), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async deleteScheduledOutage(schedId: string): Promise<void> {
    const path = `scheduled_outages/${schedId}`;
    try {
      await deleteDoc(doc(db, 'scheduled_outages', schedId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  public async updateOutageStatus(outageId: string, status: Outage['status'], estimatedRestorationAt?: string): Promise<void> {
    const path = `outages/${outageId}`;
    try {
      const payload: Partial<Outage> = {
        status,
        updatedAt: new Date().toISOString(),
      };
      if (estimatedRestorationAt) payload.estimatedRestorationAt = estimatedRestorationAt;
      if (status === 'Restored') payload.restoredAt = new Date().toISOString();

      await updateDoc(doc(db, 'outages', outageId), cleanFirestoreData(payload));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  public async addCommunityUpdate(update: CommunityUpdate): Promise<void> {
    const path = `community_updates/${update.id}`;
    try {
      await setDoc(doc(db, 'community_updates', update.id), cleanFirestoreData(update));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async addOfficialUpdate(update: OfficialUpdate): Promise<void> {
    const path = `official_updates/${update.id}`;
    try {
      await setDoc(doc(db, 'official_updates', update.id), cleanFirestoreData(update));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async updateCriticalFacilities(outageId: string, facilities: any[]): Promise<void> {
    const path = `outages/${outageId}`;
    try {
      const payload = cleanFirestoreData({
        criticalFacilitiesNearby: facilities,
        updatedAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'outages', outageId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  public async saveUserRole(userId: string, role: any, organization?: string, email?: string): Promise<void> {
    const path = `users/${userId}`;
    try {
      const payload = cleanFirestoreData({
        role,
        organization: organization || '',
        verified: role !== 'citizen',
        updatedAt: new Date().toISOString()
      });
      // Use setDoc with merge: true so non-existent records don't fail
      await setDoc(doc(db, 'users', userId), payload, { merge: true });

      // If an email is provided, also update any cloud doc with matching email
      if (email) {
        const cleanEmail = email.toLowerCase().trim();
        try {
          const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
          const querySnap = await getDocs(q);
          querySnap.forEach((docSnap) => {
            if (docSnap.id !== userId) {
              setDoc(doc(db, 'users', docSnap.id), payload, { merge: true }).catch(() => {});
            }
          });
        } catch (e) {
          // ignore
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  public async addNotification(notification: AppNotification): Promise<void> {
    const path = `notifications/${notification.id}`;
    try {
      await setDoc(doc(db, 'notifications', notification.id), cleanFirestoreData(notification));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async syncUserProfile(user: User): Promise<void> {
    const path = `users/${user.id}`;
    try {
      const payload = cleanFirestoreData(user);
      await setDoc(doc(db, 'users', user.id), payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // --- AUTHENTICATION HELPERS & ROLE RESOLUTION ---

  public async resolveUserSession(fbUser: FirebaseUser): Promise<User> {
    const userEmail = (fbUser.email || '').toLowerCase().trim();

    // Check if Super Admin / System Admin
    const isAdminUser = isSystemAdminId(fbUser.uid);

    // 1. Try reading document from Firestore by Auth UID
    let cloudUser: User | null = null;
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        cloudUser = userSnap.data() as User;
      }
    } catch (err) {
      console.warn('Could not read user profile by UID from Firestore:', err);
    }

    // 2. If no cloud user by UID or role not set, query Firestore by user email
    if ((!cloudUser || !cloudUser.role || cloudUser.role === 'citizen') && userEmail) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail), limit(5));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          // Look for any document that has a non-citizen role assigned by admin
          const matchWithRole = querySnap.docs.find((d) => d.data().role && d.data().role !== 'citizen');
          const chosenDoc = matchWithRole || querySnap.docs[0];
          cloudUser = chosenDoc.data() as User;
        }
      } catch (err) {
        console.warn('Could not query user by email in Firestore:', err);
      }
    }

    // 3. Look up in local storage by email or UID (for pre-authorized accounts or offline role persistence)
    const localUser =
      storageService.findUserByEmail(userEmail) ||
      storageService.findUserById(fbUser.uid);

    // Determine final role:
    // Super Admin (UID only) > Cloud assigned role > Local assigned role > Citizen
    let finalRole = 'citizen';
    let finalOrg: string | undefined = undefined;
    let isVerified = Boolean(fbUser.emailVerified);

    if (isAdminUser) {
      finalRole = 'admin';
      finalOrg = 'PhilSePush Master Authority';
      isVerified = true;
    } else if (cloudUser && cloudUser.role && cloudUser.role !== 'citizen' && cloudUser.role !== 'admin') {
      finalRole = cloudUser.role;
      finalOrg = cloudUser.organization;
      isVerified = true;
    } else if (localUser && localUser.role && localUser.role !== 'citizen' && localUser.role !== 'admin') {
      finalRole = localUser.role;
      finalOrg = localUser.organization;
      isVerified = true;
    } else if (cloudUser && cloudUser.role && cloudUser.role !== 'admin') {
      finalRole = cloudUser.role;
      finalOrg = cloudUser.organization;
      isVerified = Boolean(cloudUser.verified || fbUser.emailVerified);
    }

    const savedSelectedAreaId = cloudUser?.selectedAreaId || localUser?.selectedAreaId;
    const savedAreaIds = cloudUser?.savedAreaIds || localUser?.savedAreaIds || [];

    const resolvedUser: User = {
      id: fbUser.uid,
      name:
        fbUser.displayName ||
        cloudUser?.name ||
        localUser?.name ||
        (isAdminUser ? 'System Super Admin' : 'Philippine Citizen'),
      email: fbUser.email || '',
      phoneNumber: fbUser.phoneNumber || cloudUser?.phoneNumber || localUser?.phoneNumber,
      role: finalRole as any,
      organization: finalOrg,
      verified: isVerified,
      savedAreaIds: savedAreaIds,
      selectedAreaId: savedSelectedAreaId,
      createdAt: cloudUser?.createdAt || localUser?.createdAt || new Date().toISOString()
    };

    // Restore selected area for user if present
    if (savedSelectedAreaId) {
      const area = storageService.getAreaById(savedSelectedAreaId);
      if (area) {
        storageService.setCurrentArea(area);
      }
    }

    // Keep both local storage and Firestore synced with the bound profile
    storageService.setCurrentUser(resolvedUser);
    storageService.addUser(resolvedUser);

    // Asynchronously write to Firestore users collection
    this.syncUserProfile(resolvedUser).catch((err) => {
      console.warn('Could not persist resolved user session to Firestore:', err);
    });

    return resolvedUser;
  }

  public async loginWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = await this.resolveUserSession(result.user);
      return user;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn('Firebase signOut error (ignoring if offline):', error);
    } finally {
      // Reset current user to a clean guest citizen
      storageService.resetToGuest();
    }
  }

  public onAuthChange(callback: (user: FirebaseUser | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, (user) => {
      callback(user);
    });
  }

  public isCloudConnected(): boolean {
    return this.isConnected;
  }
}

export const firestoreService = new FirestoreService();
