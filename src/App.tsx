import React, { useState, useEffect } from 'react';
import { Area, User } from './types';
import { storageService } from './services/storageService';
import { firestoreService } from './services/firestoreService';
import { Header } from './components/Header';
import { SideNav } from './components/SideNav';
import { BottomNav } from './components/BottomNav';
import { OfflineBanner } from './components/OfflineBanner';

// Views
import { LandingView } from './views/LandingView';
import { LocationSelectModal } from './views/LocationSelectModal';
import { HomeView } from './views/HomeView';
import { MapView } from './views/MapView';
import { OutageDetailsView } from './views/OutageDetailsView';
import { ReportOutageWizard } from './views/ReportOutageWizard';
import { HistoryView } from './views/HistoryView';
import { VerificationPortalView } from './views/VerificationPortalView';
import { AdminPortalView } from './views/AdminPortalView';
import { ScheduledOutagesView } from './views/ScheduledOutagesView';
import { NotificationsView } from './views/NotificationsView';
import { MoreMenuView } from './views/MoreMenuView';
import { SettingsView } from './views/SettingsView';

export function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => storageService.getCurrentUser());
  const [currentArea, setCurrentArea] = useState<Area | null>(() => {
    return storageService.getCurrentArea();
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || '/home';
  });
  const [gmpQuotaReached, setGmpQuotaReached] = useState(false);

  // Subscribe to storage changes & initialize Firestore real-time sync
  useEffect(() => {
    const handleGmpQuota = () => {
      setGmpQuotaReached(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleGmpQuota);

    const stopFirestoreSync = firestoreService.initRealtimeSync();

    const unsubscribeAuth = firestoreService.onAuthChange(async (fbUser) => {
      if (fbUser) {
        try {
          const user = await firestoreService.resolveUserSession(fbUser);
          setCurrentUser(user);
          const userArea = storageService.getCurrentArea();
          setCurrentArea(userArea);
        } catch (err) {
          console.warn('Auth state resolution warning:', err);
        }
      }
    });

    const unsubscribeStorage = storageService.subscribe(() => {
      setCurrentUser(storageService.getCurrentUser());
      const area = storageService.getCurrentArea();
      setCurrentArea(area);
    });

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setCurrentRoute(hash);
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleGmpQuota);
      stopFirestoreSync();
      unsubscribeAuth();
      unsubscribeStorage();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigate = (route: string) => {
    window.location.hash = route;
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectArea = (area: Area) => {
    storageService.setCurrentArea(area);
    setCurrentArea(area);
    const user = storageService.getCurrentUser();
    if (user && user.id && user.id !== 'user-guest') {
      firestoreService.syncUserProfile(user).catch(() => {});
    }
  };

  // Determine Outage ID for dynamic route `/outage/:id`
  let activeOutageId: string | null = null;
  if (currentRoute.startsWith('/outage/')) {
    activeOutageId = currentRoute.replace('/outage/', '');
  }

  // Render view based on route
  const renderContent = () => {
    if (currentRoute === '/landing') {
      return (
        <LandingView
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          onSelectArea={handleSelectArea}
          onNavigate={navigate}
        />
      );
    }

    if (activeOutageId) {
      return (
        <OutageDetailsView
          outageId={activeOutageId}
          currentUser={currentUser}
          onNavigate={navigate}
          onBack={() => navigate('/home')}
        />
      );
    }

    if (currentRoute === '/map') {
      return (
        <MapView
          currentArea={currentArea}
          currentUser={currentUser}
          onNavigate={navigate}
        />
      );
    }

    if (currentRoute === '/report' || currentRoute.startsWith('/report/')) {
      return (
        <ReportOutageWizard
          currentArea={currentArea}
          currentUser={currentUser}
          onNavigate={navigate}
          onCancel={() => navigate('/home')}
        />
      );
    }

    if (currentRoute === '/history' || currentRoute.startsWith('/history/')) {
      return (
        <HistoryView
          currentUser={currentUser}
          onNavigate={navigate}
        />
      );
    }

    if (currentRoute === '/verification') {
      return (
        <VerificationPortalView
          currentUser={currentUser}
          onNavigate={navigate}
        />
      );
    }

    if (currentRoute === '/admin') {
      const isSuperAdmin = storageService.isAdmin(currentUser);
      if (!isSuperAdmin) {
        return (
          <div className="flex-1 flex items-center justify-center p-6 text-center animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 border border-[#c2c6d3] shadow-lg flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[36px]">gpp_maybe</span>
              </div>
              <h2 className="text-xl font-bold text-[#191c1e]">Access Restricted</h2>
              <p className="text-xs text-[#5b6068] leading-relaxed">
                The Admin Master Dashboard is restricted exclusively to authorized System Admin accounts.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
                <button
                  onClick={() => navigate('/home')}
                  className="flex-1 py-2.5 px-4 bg-[#004a98] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#00346e] transition-colors"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        );
      }
      return (
        <AdminPortalView
          currentUser={currentUser}
          onNavigate={navigate}
          onUserChange={(user) => setCurrentUser(user)}
        />
      );
    }

    if (currentRoute === '/scheduled') {
      return (
        <ScheduledOutagesView
          currentArea={currentArea}
          currentUser={currentUser}
          onNavigate={navigate}
        />
      );
    }

    if (currentRoute === '/notifications') {
      return (
        <NotificationsView
          currentUser={currentUser}
          onNavigate={navigate}
        />
      );
    }

    if (currentRoute === '/more') {
      return (
        <MoreMenuView
          currentUser={currentUser}
          onNavigate={navigate}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
        />
      );
    }

    if (currentRoute === '/settings') {
      return (
        <SettingsView
          currentUser={currentUser}
          currentArea={currentArea}
          onSelectArea={handleSelectArea}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          onNavigate={navigate}
        />
      );
    }

    // Default: Home View
    return (
      <HomeView
        currentArea={currentArea}
        currentUser={currentUser}
        onNavigate={navigate}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
      />
    );
  };

  const isLandingPage = currentRoute === '/landing';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fb] text-[#191c1e] antialiased">
      {/* Google Maps Quota Exhaustion Notice Banner */}
      {gmpQuotaReached && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Network offline banner */}
      <OfflineBanner />

      {/* Main Header with Location Picker and Role Switcher (Hidden on pure landing screen) */}
      {!isLandingPage && (
        <Header
          currentArea={currentArea}
          currentUser={currentUser}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          onNavigate={navigate}
          onUserChange={(user) => setCurrentUser(user)}
        />
      )}

      {/* Main Layout Container (Desktop Sidebar + Content) */}
      <div className="flex-1 flex w-full">
        {/* Desktop Side Navigation */}
        {!isLandingPage && (
          <SideNav
            currentPath={currentRoute}
            currentUser={currentUser}
            onNavigate={navigate}
          />
        )}

        {/* Dynamic Route View Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {renderContent()}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Hidden on landing) */}
      {!isLandingPage && (
        <BottomNav
          currentPath={currentRoute}
          onNavigate={navigate}
        />
      )}

      {/* Area / Location Selection Modal Dialog & Bottom Sheet */}
      {isLocationModalOpen && (
        <LocationSelectModal
          currentArea={currentArea}
          onClose={() => setIsLocationModalOpen(false)}
          onSelectArea={handleSelectArea}
        />
      )}
    </div>
  );
}

export default App;
