import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { I18nProvider, useI18n } from './context/I18nContext';
import { User, VideoDraft } from './types';
import { dataService } from './services/dataService';
import { nativeMediaService } from './services/nativeMediaService';

// Screens & Navigation
import { WelcomeScreen } from './screens/WelcomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { RulesScreen, LegalSectionTab } from './screens/RulesScreen';
import { FeedScreen } from './screens/FeedScreen';
import { SearchScreen } from './screens/SearchScreen';
import { CreateScreen } from './screens/CreateScreen';
import { VideoEditorScreen } from './screens/VideoEditorScreen';
import { PublishScreen } from './screens/PublishScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { CreatorProfileScreen } from './screens/CreatorProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { MessagesScreen } from './screens/MessagesScreen';
import { CompleteProfileScreen, ProfilePrefillData } from './screens/CompleteProfileScreen';
import { FinishProfileScreen } from './screens/FinishProfileScreen';
import { AuthCallbackScreen } from './screens/AuthCallbackScreen';
import { supabase } from './services/supabase';
import { BottomNavigation, TabType } from './components/BottomNavigation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SplashScreen } from './components/SplashScreen';

type ActiveView =
  | 'welcome'
  | 'login'
  | 'register'
  | 'complete_profile'
  | 'finish_profile'
  | 'auth_callback'
  | 'rules'
  | 'main'
  | 'create_select'
  | 'video_editor'
  | 'publish'
  | 'settings'
  | 'creator_profile';

const MainAppContent: React.FC = () => {
  const { theme } = useTheme();

  // Authentication State
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(() => dataService.getCurrentUser());
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    if (typeof window !== 'undefined') {
      const { hash, search, pathname } = window.location;
      if (
        hash.includes('access_token') ||
        search.includes('code=') ||
        pathname.includes('auth/callback') ||
        hash.includes('error=')
      ) {
        return 'auth_callback';
      }
      if (pathname.includes('finish-profile')) {
        return 'finish_profile';
      }
    }
    const user = dataService.getCurrentUser();
    return user ? 'main' : 'login';
  });
  const [profilePrefill, setProfilePrefill] = useState<ProfilePrefillData | null>(null);
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>('feed');

  // Creator profile navigation target
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);

  // Direct chat navigation target for 1-to-1 conversation
  const [directChatTargetUserId, setDirectChatTargetUserId] = useState<string | null>(null);

  // App Links / Deep Links target video
  const [targetDeepLinkVideoId, setTargetDeepLinkVideoId] = useState<string | null>(null);

  useEffect(() => {
    const cleanup = nativeMediaService.initDeepLinks((videoId) => {
      setTargetDeepLinkVideoId(videoId);
      setActiveView('main');
      setCurrentTab('feed');
    });
    return cleanup;
  }, []);

  const handleOpenDirectChat = (userId: string) => {
    setDirectChatTargetUserId(userId);
    setCurrentTab('inbox');
  };

  // Video Creation & Editing Pipeline
  const [currentDraft, setCurrentDraft] = useState<VideoDraft | null>(null);

  // Initialize Supabase Auth listener (Section 26 & 28)
  useEffect(() => {
    const unsub = dataService.initSupabaseAuth(
      (user: User | null) => {
        if (user) {
          // CAS B: Utilisateur existant avec profil complet -> Redirection directe vers le Feed
          setCurrentUser(user);
          setActiveView((prev) =>
            prev === 'login' || prev === 'register' || prev === 'welcome' || prev === 'complete_profile'
              ? 'main'
              : prev
          );
          setCurrentTab('feed');
        }
      },
      (prefill: ProfilePrefillData) => {
        // CAS A: Nouvel utilisateur -> Redirection obligatoire vers "Finaliser votre profil"
        setProfilePrefill(prefill);
        setActiveView('complete_profile');
      }
    );

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Native phone gallery direct picker ref
  const nativeFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleNativeMediaPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|m4v)$/i.test(file.name);
    const isPhoto = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
    if (!isVideo && !isPhoto) return;

    // Direct local object URL, NO upload or database recording
    const objectUrl = URL.createObjectURL(file);
    const draft: VideoDraft = {
      uri: objectUrl,
      file,
      name: file.name,
      size: file.size,
      type: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
      duration: isVideo ? 15 : undefined,
      audioTrack: 'Son original',
      audioVolume: 100,
      textOverlays: [],
      stickers: [],
    };

    setCurrentDraft(draft);
    setActiveView('video_editor');
    e.target.value = '';
  };

  // Return to previous view when closing rules or settings
  const [rulesPreviousView, setRulesPreviousView] = useState<ActiveView>('welcome');
  const [rulesInitialTab, setRulesInitialTab] = useState<LegalSectionTab>('terms');

  useEffect(() => {
    // Keep currentUser in sync with storage & enforce session rule
    const user = dataService.getCurrentUser();
    setCurrentUser(user);
    const publicViews: ActiveView[] = [
      'login',
      'register',
      'welcome',
      'rules',
      'auth_callback',
      'finish_profile',
      'complete_profile',
    ];
    if (!user && !publicViews.includes(activeView)) {
      setActiveView('login');
    }
  }, [activeView]);

  // Auth Handlers
  const handleAuthSuccess = (user: User) => {
    setLogoutNotice(null);
    setCurrentUser(user);
    setActiveView('main');
    setCurrentTab('feed');
  };

  const handleLogout = () => {
    dataService.logout();
    setCurrentUser(null);
    setLogoutNotice(
      'Déconnexion réussie. Conformément à la gestion de session, vous devez vous reconnecter ou vous inscrire pour accéder à NNECXY.'
    );
    setActiveView('login');
  };

  // Open rules helper
  const handleOpenRules = (from: ActiveView, tab: LegalSectionTab = 'terms') => {
    setRulesPreviousView(from);
    setRulesInitialTab(tab);
    setActiveView('rules');
  };

  // Creation Flow Handlers (Strictly: Selection -> Editor -> Publish -> Feed)
  const handleSelectVideoForCreation = (draft: VideoDraft) => {
    setCurrentDraft(draft);
    setActiveView('video_editor');
  };

  const handlePublishCompleted = () => {
    setCurrentDraft(null);
    setActiveView('main');
    setCurrentTab('feed');
  };

  return (
    <div
      id="nnecxy-mobile-viewport"
      className="fixed inset-0 w-full h-full min-h-[100dvh] h-[100dvh] w-screen flex flex-col overflow-hidden select-none"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* 0. Splash Screen Initialisation avec Logo Original */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* VIEW ROUTING */}

        {/* 1. Welcome Screen */}
        {activeView === 'welcome' && (
          <WelcomeScreen
            onLogin={() => {
              setLogoutNotice(null);
              setActiveView('login');
            }}
            onRegister={() => {
              setLogoutNotice(null);
              setActiveView('register');
            }}
            onOpenRules={(tab) => handleOpenRules('welcome', tab)}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {/* 2. Login Screen */}
        {activeView === 'login' && (
          <LoginScreen
            logoutNotice={logoutNotice}
            onSuccess={handleAuthSuccess}
            onNavigateToRegister={() => {
              setActiveView('register');
            }}
            onOpenRules={(tab) => handleOpenRules('login', tab)}
            onBack={() => {
              setLogoutNotice(null);
              setActiveView('welcome');
            }}
          />
        )}

        {/* 3. Register Screen */}
        {activeView === 'register' && (
          <RegisterScreen
            logoutNotice={logoutNotice}
            onSuccess={handleAuthSuccess}
            onNavigateToLogin={() => {
              setActiveView('login');
            }}
            onOpenRules={(tab) => handleOpenRules('register', tab)}
            onBack={() => {
              setLogoutNotice(null);
              setActiveView('welcome');
            }}
          />
        )}

        {/* 3b. Complete Profile Screen (CAS A: Nouvel utilisateur après Google OAuth) */}
        {activeView === 'complete_profile' && profilePrefill && (
          <CompleteProfileScreen
            prefill={profilePrefill}
            onComplete={(user) => {
              setCurrentUser(user);
              setProfilePrefill(null);
              setActiveView('main');
              setCurrentTab('feed');
            }}
            onCancel={() => {
              dataService.logout();
              setCurrentUser(null);
              setProfilePrefill(null);
              setActiveView('login');
            }}
          />
        )}

        {/* 3c. Auth Callback Screen (/auth/callback - Route d'authentification) */}
        {activeView === 'auth_callback' && (
          <AuthCallbackScreen
            onNavigate={(route) => {
              if (route === '/finish-profile') {
                setActiveView('finish_profile');
              } else if (route === '/feed') {
                const user = dataService.getCurrentUser();
                if (user) setCurrentUser(user);
                setActiveView('main');
                setCurrentTab('feed');
              } else {
                setActiveView('login');
              }
            }}
          />
        )}

        {/* 3d. Finish Profile Screen (/finish-profile - Finalisation du profil) */}
        {activeView === 'finish_profile' && (
          <FinishProfileScreen
            onSuccess={(user) => {
              setCurrentUser(user);
              setActiveView('main');
              setCurrentTab('feed');
            }}
            onCancel={() => {
              dataService.logout();
              setCurrentUser(null);
              setActiveView('login');
            }}
          />
        )}

        {/* 4. Rules Screen */}
        {activeView === 'rules' && (
          <RulesScreen
            initialTab={rulesInitialTab}
            onBack={() => setActiveView(rulesPreviousView)}
          />
        )}

        {/* 5. Video Selection Screen (Step 1 of Create) */}
        {activeView === 'create_select' && (
          <CreateScreen
            onSelectVideo={handleSelectVideoForCreation}
            onClose={() => setActiveView('main')}
          />
        )}

        {/* 6. Video Editor Screen (Step 2 of Create) */}
        {activeView === 'video_editor' && currentDraft && (
          <VideoEditorScreen
            draft={currentDraft}
            onUpdateDraft={(updated) => setCurrentDraft(updated)}
            onNext={() => setActiveView('publish')}
            onBack={() => {
              setCurrentDraft(null);
              setActiveView('main');
            }}
          />
        )}

        {/* 7. Publish Screen (Step 3 of Create) */}
        {activeView === 'publish' && currentDraft && (
          <PublishScreen
            draft={currentDraft}
            onBack={() => setActiveView('video_editor')}
            onComplete={handlePublishCompleted}
          />
        )}

        {/* 8. Settings Screen */}
        {activeView === 'settings' && (
          <ErrorBoundary
            fallbackTitle="Impossible d'afficher les paramètres"
            onReset={() => setActiveView('main')}
          >
            <SettingsScreen
              currentUser={currentUser}
              onBack={() => setActiveView('main')}
              onLogout={handleLogout}
              onOpenRules={(tab) => handleOpenRules('settings', tab)}
              onUpdateUser={(updated) => setCurrentUser(updated)}
            />
          </ErrorBoundary>
        )}

        {/* 9. Public Creator Profile Screen */}
        {activeView === 'creator_profile' && selectedCreatorId && (
          <CreatorProfileScreen
            userId={selectedCreatorId}
            currentUser={currentUser}
            onBack={() => {
              setSelectedCreatorId(null);
              setActiveView('main');
            }}
            onNavigateToFeed={(videoId) => {
              if (videoId) {
                setTargetDeepLinkVideoId(videoId);
              }
              setSelectedCreatorId(null);
              setActiveView('main');
              setCurrentTab('feed');
            }}
          />
        )}

        {/* 10. Main Tab Views (Feed, Search, Inbox, Profile) */}
        {activeView === 'main' && (
          <div className="relative flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-hidden">
              {currentTab === 'feed' && (
                <FeedScreen
                  currentUser={currentUser}
                  targetVideoId={targetDeepLinkVideoId}
                  onOpenCreatorProfile={(userId) => {
                    if (userId === currentUser?.id) {
                      setCurrentTab('profile');
                    } else {
                      setSelectedCreatorId(userId);
                      setActiveView('creator_profile');
                    }
                  }}
                  onOpenCreate={() => nativeFileInputRef.current?.click()}
                  onOpenDirectChat={handleOpenDirectChat}
                />
              )}

              {currentTab === 'search' && (
                <SearchScreen
                  currentUser={currentUser}
                  onOpenCreator={(userId) => {
                    if (userId === currentUser?.id) {
                      setCurrentTab('profile');
                    } else {
                      setSelectedCreatorId(userId);
                      setActiveView('creator_profile');
                    }
                  }}
                  onBack={() => setCurrentTab('feed')}
                  onOpenDirectChat={handleOpenDirectChat}
                />
              )}

              {currentTab === 'inbox' && (
                <MessagesScreen
                  currentUser={currentUser}
                  initialTargetUserId={directChatTargetUserId}
                  onBack={() => {
                    setDirectChatTargetUserId(null);
                    setCurrentTab('feed');
                  }}
                />
              )}

              {currentTab === 'profile' && (
                <ProfileScreen
                  currentUser={currentUser}
                  onOpenSettings={() => setActiveView('settings')}
                  onNavigateToFeed={(videoId) => {
                    if (videoId) {
                      setTargetDeepLinkVideoId(videoId);
                    }
                    setCurrentTab('feed');
                  }}
                  onUpdateUser={(updated) => setCurrentUser(updated)}
                />
              )}
            </div>

            {/* Bottom Tab Bar */}
            <BottomNavigation
              currentTab={currentTab}
              onSelectTab={(tab) => {
                if (tab === 'create') {
                  nativeFileInputRef.current?.click();
                } else {
                  setCurrentTab(tab);
                }
              }}
              currentUser={currentUser}
            />
          </div>
        )}

        {/* Native phone gallery system picker input */}
        <input
          ref={nativeFileInputRef}
          type="file"
          accept="video/*,image/*"
          className="hidden"
          onChange={handleNativeMediaPicked}
        />
      </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <MainAppContent />
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
