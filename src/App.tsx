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
import { BottomNavigation, TabType } from './components/BottomNavigation';
import { ErrorBoundary } from './components/ErrorBoundary';

type ActiveView =
  | 'welcome'
  | 'login'
  | 'register'
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
  const [currentUser, setCurrentUser] = useState<User | null>(() => dataService.getCurrentUser());
  const [activeView, setActiveView] = useState<ActiveView>(() => (currentUser ? 'main' : 'login'));
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
    const publicViews: ActiveView[] = ['login', 'register', 'welcome', 'rules'];
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
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#09090b' }}
    >
      {/* Mobile Shell Container (Centered, max-w-md, rounded frame on desktop) */}
      <div
        id="nnecxy-mobile-viewport"
        className="relative w-full h-full max-w-md flex flex-col overflow-hidden shadow-2xl md:h-[94vh] md:max-h-[920px] md:rounded-[36px] md:border"
        style={{
          backgroundColor: theme.background,
          borderColor: theme.border,
          color: theme.text,
        }}
      >
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
                  onNavigateToFeed={() => setCurrentTab('feed')}
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
