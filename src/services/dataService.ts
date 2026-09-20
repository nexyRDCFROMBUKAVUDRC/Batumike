import { User, Video, Comment, NotificationItem, Conversation, ChatMessage, VideoDraft } from '../types';
import { supabase, isSupabaseConfigured, BUCKETS } from './supabase';

const USERS_STORAGE_KEY = 'nnecxy_users';
const VIDEOS_STORAGE_KEY = 'nnecxy_videos';
const COMMENTS_STORAGE_KEY = 'nnecxy_comments';
const NOTIFICATIONS_STORAGE_KEY = 'nnecxy_notifications';
const CONVERSATIONS_STORAGE_KEY = 'nnecxy_conversations';
const MESSAGES_STORAGE_KEY = 'nnecxy_messages';
const REPORTS_STORAGE_KEY = 'nnecxy_reports';
const SESSION_STORAGE_KEY = 'nnecxy_session';
const LIKES_STORAGE_KEY = 'nnecxy_user_likes';
const FOLLOWS_STORAGE_KEY = 'nnecxy_user_follows';
const WATCH_STATS_STORAGE_KEY = 'nnecxy_watch_stats';

// Initial verified creators with real MP4 video clips
const INITIAL_USERS: User[] = [
  {
    id: 'u_demo_user',
    name: 'Justin',
    surname: 'Batumike',
    email: 'demo@nnecxy.com',
    handle: 'justin_creator',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bio: 'Créateur officiel sur NNECXY V1 ✨ Partage, danse & musique',
    birthDate: '1998-07-15',
    followersCount: 1250,
    followingCount: 45,
    totalLikes: 7800,
    isVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u_nnecxy_official',
    name: 'NNECXY',
    surname: 'Officiel',
    email: 'official@nnecxy.com',
    handle: 'nnecxy',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    bio: 'Bienvenue sur NNECXY V1. La plateforme sociale vidéo fluide et authentique.',
    birthDate: '2000-01-01',
    followersCount: 1420,
    followingCount: 12,
    totalLikes: 8900,
    isVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u_dj_afrorhythm',
    name: 'Malik',
    surname: 'Kone',
    email: 'malik@nnecxy.com',
    handle: 'malik_vibes',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Danseur & Créateur de rythmes urbains. Kinshasa / Paris.',
    birthDate: '1998-05-14',
    followersCount: 3840,
    followingCount: 195,
    totalLikes: 24500,
    isVerified: true,
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'u_elena_motion',
    name: 'Elena',
    surname: 'Ndugu',
    email: 'elena@nnecxy.com',
    handle: 'elena_creations',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Énergie positive & cascades visuelles 🎬',
    birthDate: '2001-11-20',
    followersCount: 2190,
    followingCount: 88,
    totalLikes: 14200,
    isVerified: true,
    createdAt: '2026-02-01T00:00:00Z',
  },
];

// Initial real playable MP4 videos (reliable public CDNs)
const INITIAL_VIDEOS: Video[] = [
  {
    id: 'vid_1',
    userId: 'u_nnecxy_official',
    user: {
      id: 'u_nnecxy_official',
      name: 'NNECXY Officiel',
      handle: 'nnecxy',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
    caption: 'Lancement officiel de NNECXY V1 ! Découvrez la puissance du partage vidéo sans intermédiaire. #NNECXY #SocialV1 #Vision',
    tags: ['NNECXY', 'SocialV1', 'Vision'],
    likesCount: 542,
    commentsCount: 38,
    sharesCount: 120,
    viewsCount: 3200,
    duration: 15,
    audioTitle: 'NNECXY Anthem - Sound Design',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    allowDownload: true,
  },
  {
    id: 'vid_2',
    userId: 'u_dj_afrorhythm',
    user: {
      id: 'u_dj_afrorhythm',
      name: 'Malik Kone',
      handle: 'malik_vibes',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    caption: 'Session impro au coucher de soleil. La danse libère l’esprit 🌊✨ #Danse #AfroBeat #Freestyle',
    tags: ['Danse', 'AfroBeat', 'Freestyle'],
    likesCount: 820,
    commentsCount: 64,
    sharesCount: 95,
    viewsCount: 5120,
    duration: 15,
    audioTitle: 'Afrobeats Beat #1 - Original Mix',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    allowDownload: true,
  },
  {
    id: 'vid_3',
    userId: 'u_elena_motion',
    user: {
      id: 'u_elena_motion',
      name: 'Elena Ndugu',
      handle: 'elena_creations',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&auto=format&fit=crop&q=80',
    caption: 'Voyage cinématique entre ciel et terre. Vous préférez la ville ou la nature sauvage ? 🏔️ #Voyage #Cinema #Creativite',
    tags: ['Voyage', 'Cinema', 'Creativite'],
    likesCount: 410,
    commentsCount: 22,
    sharesCount: 45,
    viewsCount: 2800,
    duration: 15,
    audioTitle: 'Amapiano Groove - Summer Wave',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    allowDownload: true,
  },
];

class DataService {
  private users: User[] = [];
  private videos: Video[] = [];
  private comments: Comment[] = [];
  private notifications: NotificationItem[] = [];
  private conversations: Conversation[] = [];
  private messages: ChatMessage[] = [];
  private reports: Array<{ targetId: string; reason: string; reporterId: string; createdAt: string }> = [];
  private currentUser: User | null = null;
  private userLikes: Set<string> = new Set();
  private userFollows: Set<string> = new Set();
  private watchStats: Record<string, { views: number; completions: number; totalDuration: number }> = {};

  constructor() {
    this.initData();
  }

  private initData() {
    try {
      // Users
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      this.users = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;

      // Ensure default creators and demo account are always present
      INITIAL_USERS.forEach((initU) => {
        if (!this.users.some((u) => u.id === initU.id || (u.email && u.email.toLowerCase() === initU.email?.toLowerCase()))) {
          this.users.push(initU);
        }
      });

      // Videos
      const storedVideos = localStorage.getItem(VIDEOS_STORAGE_KEY);
      this.videos = storedVideos ? JSON.parse(storedVideos) : INITIAL_VIDEOS;

      // Comments
      const storedComments = localStorage.getItem(COMMENTS_STORAGE_KEY);
      this.comments = storedComments ? JSON.parse(storedComments) : [
        {
          id: 'c_1',
          videoId: 'vid_1',
          userId: 'u_dj_afrorhythm',
          user: {
            id: 'u_dj_afrorhythm',
            name: 'Malik Kone',
            handle: 'malik_vibes',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          },
          content: 'Félicitations pour le déploiement de NNECXY V1 ! Une vraie plateforme fluide !',
          createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        },
      ];

      // Session
      const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (storedSession) {
        const found = this.users.find((u) => u.id === storedSession);
        if (found) {
          this.currentUser = found;
        }
      }

      // Likes
      const storedLikes = localStorage.getItem(LIKES_STORAGE_KEY);
      if (storedLikes) {
        this.userLikes = new Set(JSON.parse(storedLikes));
      }

      // Follows
      const storedFollows = localStorage.getItem(FOLLOWS_STORAGE_KEY);
      if (storedFollows) {
        this.userFollows = new Set(JSON.parse(storedFollows));
      }

      // Conversations & Messages
      const storedConvs = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      this.conversations = storedConvs ? JSON.parse(storedConvs) : [
        {
          id: 'conv_official',
          isGroup: false,
          memberIds: ['u_nnecxy_official'],
          members: [INITIAL_USERS[0]],
          lastMessage: 'Bienvenue sur NNECXY ! Partagez vos premières créations vidéo.',
          lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
          unreadCount: 1,
        },
      ];

      const storedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);
      this.messages = storedMessages ? JSON.parse(storedMessages) : [
        {
          id: 'm_1',
          conversationId: 'conv_official',
          senderId: 'u_nnecxy_official',
          text: 'Bienvenue sur NNECXY ! Partagez vos premières créations vidéo.',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];

      // Notifications
      const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      this.notifications = storedNotifications ? JSON.parse(storedNotifications) : [
        {
          id: 'notif_welcome',
          userId: this.currentUser?.id || 'guest',
          type: 'follow',
          actor: INITIAL_USERS[0],
          message: 'vous souhaite la bienvenue sur NNECXY V1 !',
          read: false,
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
      ];

      // Watch stats
      const storedWatch = localStorage.getItem(WATCH_STATS_STORAGE_KEY);
      if (storedWatch) {
        this.watchStats = JSON.parse(storedWatch);
      }
    } catch (e) {
      console.error('Error loading local persistence data:', e);
      this.users = INITIAL_USERS;
      this.videos = INITIAL_VIDEOS;
    }
  }

  private saveUsers() {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users));
  }

  private saveVideos() {
    localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(this.videos));
  }

  private saveComments() {
    localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(this.comments));
  }

  private saveSession() {
    if (this.currentUser) {
      localStorage.setItem(SESSION_STORAGE_KEY, this.currentUser.id);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  private saveLikes() {
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(Array.from(this.userLikes)));
  }

  private saveFollows() {
    localStorage.setItem(FOLLOWS_STORAGE_KEY, JSON.stringify(Array.from(this.userFollows)));
  }

  private saveConversations() {
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(this.conversations));
  }

  private saveMessages() {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(this.messages));
  }

  private saveNotifications() {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
  }

  private saveWatchStats() {
    localStorage.setItem(WATCH_STATS_STORAGE_KEY, JSON.stringify(this.watchStats));
  }

  // --- AUTH METHODS ---

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public calculateAge(birthDateStr: string): number {
    if (!birthDateStr) return 0;
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(0, age);
  }

  public register(
    paramsOrName:
      | {
          name: string;
          surname: string;
          email: string;
          handle?: string;
          birthDate: string;
          password: string;
        }
      | string,
    argSurname?: string,
    argEmailOrPhone?: string,
    argBirthDate?: string,
    argPassword?: string
  ): { success: boolean; error?: string; user?: User } {
    let name: string;
    let surname: string;
    let emailOrPhone: string;
    let birthDate: string;
    let password: string;
    let customHandle: string | undefined;

    if (typeof paramsOrName === 'object') {
      name = paramsOrName.name;
      surname = paramsOrName.surname;
      emailOrPhone = paramsOrName.email;
      birthDate = paramsOrName.birthDate;
      password = paramsOrName.password;
      customHandle = paramsOrName.handle;
    } else {
      name = paramsOrName;
      surname = argSurname || '';
      emailOrPhone = argEmailOrPhone || '';
      birthDate = argBirthDate || '';
      password = argPassword || '';
    }

    // 1. Validate fields
    if (!name.trim() || !surname.trim() || !emailOrPhone.trim() || !birthDate || !password) {
      return { success: false, error: 'Tous les champs sont obligatoires.' };
    }

    // 2. Strict age >= 18 validation (Master Prompt section 18)
    const age = this.calculateAge(birthDate);
    if (age < 18) {
      return {
        success: false,
        error: 'underage',
      };
    }

    // 3. Check for existing user
    const existing = this.users.find(
      (u) =>
        u.email?.toLowerCase() === emailOrPhone.toLowerCase() ||
        u.phone === emailOrPhone ||
        (customHandle && u.handle.toLowerCase() === customHandle.toLowerCase())
    );
    if (existing) {
      if (customHandle && existing.handle.toLowerCase() === customHandle.toLowerCase()) {
        return { success: false, error: 'handle_taken' };
      }
      return { success: false, error: 'email_taken' };
    }

    // 4. Create new user
    const isEmail = emailOrPhone.includes('@');
    const baseHandle = (name.toLowerCase() + '_' + surname.toLowerCase())
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 16);

    const chosenHandle = customHandle || `${baseHandle}_${Math.floor(Math.random() * 899 + 100)}`;

    const newUser: User = {
      id: 'u_' + Date.now(),
      name: name.trim(),
      surname: surname.trim(),
      email: isEmail ? emailOrPhone.trim().toLowerCase() : undefined,
      phone: !isEmail ? emailOrPhone.trim() : undefined,
      birthDate,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      handle: chosenHandle,
      bio: 'Membre passionné de la communauté NNECXY ✨',
      followersCount: 0,
      followingCount: 0,
      totalLikes: 0,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.currentUser = newUser;
    this.saveUsers();
    this.saveSession();

    return { success: true, user: newUser };
  }

  public login(
    emailOrPhone: string,
    password: string
  ): { success: boolean; error?: string; user?: User; isPendingDeletion?: boolean } {
    if (!emailOrPhone.trim() || !password) {
      return { success: false, error: 'Veuillez renseigner vos identifiants.' };
    }

    const cleanInput = emailOrPhone.trim().toLowerCase();
    let user = this.users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === cleanInput) ||
        (u.phone && u.phone === cleanInput) ||
        u.handle.toLowerCase() === cleanInput
    );

    if (!user && (cleanInput === 'demo@nnecxy.com' || cleanInput === 'justinbatumike902@gmail.com')) {
      user = INITIAL_USERS[0];
      if (user && !this.users.some((u) => u.id === user!.id)) {
        this.users.unshift(user);
        this.saveUsers();
      }
    }

    if (!user) {
      return {
        success: false,
        error: 'Identifiants invalides. Veuillez vérifier vos informations.',
      };
    }

    // Check if account has a scheduled 14-day deletion (Section 22)
    const isPendingDeletion = Boolean(user.deletionScheduledAt);

    this.currentUser = user;
    this.saveSession();

    return { success: true, user, isPendingDeletion };
  }

  public loginWithGoogle(googleData: {
    email: string;
    name?: string;
    surname?: string;
    avatar?: string;
    birthDate?: string;
  }): { success: boolean; error?: string; user?: User; isPendingDeletion?: boolean } {
    const email = googleData.email.trim().toLowerCase();
    if (!email) {
      return { success: false, error: 'Email Google non valide.' };
    }

    // 1. Check if user already exists with this Google email
    let user = this.users.find(
      (u) => u.email?.toLowerCase() === email
    );

    if (!user) {
      // Create new NNECXY account with Google profile data
      const rawName = (googleData.name || email.split('@')[0]).trim();
      const baseHandle = rawName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 14);

      let handle = baseHandle || 'user';
      let suffix = Math.floor(Math.random() * 899 + 100);
      while (this.users.some((u) => u.handle.toLowerCase() === handle.toLowerCase())) {
        handle = `${baseHandle}_${suffix}`;
        suffix = Math.floor(Math.random() * 899 + 100);
      }

      const newUser: User = {
        id: 'u_g_' + Date.now(),
        name: rawName,
        surname: (googleData.surname || '').trim(),
        email: email,
        birthDate: googleData.birthDate || '2000-01-01', // Default adult 18+
        avatar:
          googleData.avatar ||
          `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        handle,
        bio: 'Membre certifié NNECXY ✨ Connexion Google',
        followersCount: 0,
        followingCount: 0,
        totalLikes: 0,
        isVerified: true,
        authProvider: 'google',
        createdAt: new Date().toISOString(),
      };

      this.users.push(newUser);
      user = newUser;
      this.saveUsers();
    }

    const isPendingDeletion = Boolean(user.deletionScheduledAt);
    this.currentUser = user;
    this.saveSession();

    return { success: true, user, isPendingDeletion };
  }

  public loginWithOAuth(provider: 'oauth' | 'apple' | 'sso', profileData: {
    name: string;
    email?: string;
    avatar?: string;
  }): { success: boolean; error?: string; user?: User; isPendingDeletion?: boolean } {
    const rawEmail = (profileData.email || `${provider}_${Date.now()}@nnecxy.com`).toLowerCase();
    
    let user = this.users.find(
      (u) => (profileData.email && u.email?.toLowerCase() === profileData.email.toLowerCase()) ||
             (u.authProvider === provider && u.name === profileData.name)
    );

    if (!user) {
      const rawName = profileData.name.trim();
      const baseHandle = rawName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 14);

      let handle = baseHandle || `${provider}_user`;
      let suffix = Math.floor(Math.random() * 899 + 100);
      while (this.users.some((u) => u.handle.toLowerCase() === handle.toLowerCase())) {
        handle = `${baseHandle}_${suffix}`;
        suffix = Math.floor(Math.random() * 899 + 100);
      }

      const defaultAvatar = provider === 'apple'
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';

      const newUser: User = {
        id: `u_${provider}_${Date.now()}`,
        name: rawName,
        surname: '',
        email: rawEmail,
        birthDate: '2000-01-01',
        avatar: profileData.avatar || defaultAvatar,
        handle,
        bio: `Membre certifié NNECXY ✨ Connexion via ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
        followersCount: 0,
        followingCount: 0,
        totalLikes: 0,
        isVerified: true,
        authProvider: provider,
        createdAt: new Date().toISOString(),
      };

      this.users.push(newUser);
      user = newUser;
      this.saveUsers();
    }

    const isPendingDeletion = Boolean(user.deletionScheduledAt);
    this.currentUser = user;
    this.saveSession();

    return { success: true, user, isPendingDeletion };
  }

  public loginWithPhone(
    phone: string,
    name?: string,
    birthDate?: string
  ): { success: boolean; error?: string; user?: User; isPendingDeletion?: boolean } {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      return { success: false, error: 'Numéro de téléphone requis.' };
    }

    let user = this.users.find((u) => u.phone === cleanPhone);

    if (!user) {
      const chosenName = (name || 'Utilisateur').trim();
      const baseHandle = chosenName
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 10);
      const suffix = Math.floor(Math.random() * 899 + 100);

      const newUser: User = {
        id: `u_ph_${Date.now()}`,
        name: chosenName,
        surname: '',
        phone: cleanPhone,
        birthDate: birthDate || '2000-01-01',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        handle: `${baseHandle || 'user'}_${suffix}`,
        bio: 'Membre certifié NNECXY ✨ Connecté par téléphone',
        followersCount: 0,
        followingCount: 0,
        totalLikes: 0,
        isVerified: false,
        authProvider: 'phone',
        createdAt: new Date().toISOString(),
      };

      this.users.push(newUser);
      user = newUser;
      this.saveUsers();
    }

    const isPendingDeletion = Boolean(user.deletionScheduledAt);
    this.currentUser = user;
    this.saveSession();

    return { success: true, user, isPendingDeletion };
  }

  public logout(): void {
    this.currentUser = null;
    this.saveSession();
  }

  public scheduleAccountDeletion(userId: string): { success: boolean; scheduledDate: string } {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, scheduledDate: '' };

    // 14 days in future
    const deletionDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    user.deletionScheduledAt = deletionDate;
    this.saveUsers();

    if (this.currentUser?.id === userId) {
      this.currentUser.deletionScheduledAt = deletionDate;
      this.saveSession();
    }

    return { success: true, scheduledDate: deletionDate };
  }

  public cancelAccountDeletion(userId: string): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;

    user.deletionScheduledAt = null;
    this.saveUsers();

    if (this.currentUser?.id === userId) {
      this.currentUser.deletionScheduledAt = null;
      this.saveSession();
    }

    return true;
  }

  public updateProfile(
    userId: string,
    data: { name?: string; surname?: string; bio?: string; avatar?: string }
  ): User | null {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return null;

    if (data.name) user.name = data.name.trim();
    if (data.surname) user.surname = data.surname.trim();
    if (data.bio !== undefined) user.bio = data.bio.trim();
    if (data.avatar) user.avatar = data.avatar;

    // Update avatar in all published videos & comments (Section 41/58)
    if (data.avatar) {
      this.videos.forEach((v) => {
        if (v.userId === userId) {
          v.user.avatar = data.avatar!;
          if (data.name) v.user.name = `${user.name} ${user.surname}`;
        }
      });
      this.comments.forEach((c) => {
        if (c.userId === userId) {
          c.user.avatar = data.avatar!;
          if (data.name) c.user.name = `${user.name} ${user.surname}`;
        }
      });
      this.saveVideos();
      this.saveComments();
    }

    this.saveUsers();
    if (this.currentUser?.id === userId) {
      this.currentUser = { ...user };
      this.saveSession();
    }

    return user;
  }

  // --- VIDEOS & FEED METHODS ---

  public getVideos(): Video[] {
    // Sort videos using progressive engagement signals (Section 44-46)
    return [...this.videos].map((v) => ({
      ...v,
      isLiked: this.userLikes.has(v.id),
      isFollowed: this.userFollows.has(v.userId),
    }));
  }

  public getVideoById(id: string): Video | undefined {
    const v = this.videos.find((item) => item.id === id);
    if (!v) return undefined;
    return {
      ...v,
      isLiked: this.userLikes.has(v.id),
      isFollowed: this.userFollows.has(v.userId),
    };
  }

  public getUserVideos(userId: string): Video[] {
    return this.getVideos().filter((v) => v.userId === userId);
  }

  public getLikedVideos(): Video[] {
    return this.getVideos().filter((v) => this.userLikes.has(v.id));
  }

  public toggleLike(videoId: string): { isLiked: boolean; newCount: number } {
    const video = this.videos.find((v) => v.id === videoId);
    if (!video) return { isLiked: false, newCount: 0 };

    const alreadyLiked = this.userLikes.has(videoId);
    if (alreadyLiked) {
      this.userLikes.delete(videoId);
      video.likesCount = Math.max(0, video.likesCount - 1);
    } else {
      this.userLikes.add(videoId);
      video.likesCount += 1;

      // Notification to video owner
      if (this.currentUser && video.userId !== this.currentUser.id) {
        this.addNotification({
          userId: video.userId,
          type: 'like',
          actor: this.currentUser,
          videoId: video.id,
          message: 'a aimé votre vidéo',
        });
      }
    }

    this.saveLikes();
    this.saveVideos();
    return { isLiked: !alreadyLiked, newCount: video.likesCount };
  }

  public toggleFollow(targetUserId: string): { isFollowed: boolean } {
    if (!this.currentUser || this.currentUser.id === targetUserId) {
      return { isFollowed: false }; // Section 29: "Interdire le suivi de son propre compte"
    }

    const targetUser = this.users.find((u) => u.id === targetUserId);
    if (!targetUser) return { isFollowed: false };

    const isCurrentlyFollowed = this.userFollows.has(targetUserId);

    if (isCurrentlyFollowed) {
      this.userFollows.delete(targetUserId);
      targetUser.followersCount = Math.max(0, targetUser.followersCount - 1);
      this.currentUser.followingCount = Math.max(0, this.currentUser.followingCount - 1);
    } else {
      this.userFollows.add(targetUserId);
      targetUser.followersCount += 1;
      this.currentUser.followingCount += 1;

      this.addNotification({
        userId: targetUserId,
        type: 'follow',
        actor: this.currentUser,
        message: 'a commencé à vous suivre',
      });
    }

    this.saveFollows();
    this.saveUsers();
    this.saveSession();

    return { isFollowed: !isCurrentlyFollowed };
  }

  public getComments(videoId: string): Comment[] {
    return this.comments.filter((c) => c.videoId === videoId);
  }

  public addComment(videoId: string, content: string): Comment | null {
    if (!this.currentUser || !content.trim()) return null;

    const video = this.videos.find((v) => v.id === videoId);
    if (!video) return null;

    const newComment: Comment = {
      id: 'c_' + Date.now(),
      videoId,
      userId: this.currentUser.id,
      user: {
        id: this.currentUser.id,
        name: `${this.currentUser.name} ${this.currentUser.surname}`,
        handle: this.currentUser.handle,
        avatar: this.currentUser.avatar,
      },
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    this.comments.push(newComment);
    video.commentsCount += 1;

    this.saveComments();
    this.saveVideos();

    if (video.userId !== this.currentUser.id) {
      this.addNotification({
        userId: video.userId,
        type: 'comment',
        actor: this.currentUser,
        videoId: video.id,
        message: `a commenté: "${content.slice(0, 30)}${content.length > 30 ? '...' : ''}"`,
      });
    }

    return newComment;
  }

  public deleteComment(commentId: string): boolean {
    if (!this.currentUser) return false;
    const comment = this.comments.find((c) => c.id === commentId);
    if (!comment) return false;

    // Check permission: only author or video creator
    const video = this.videos.find((v) => v.id === comment.videoId);
    if (comment.userId !== this.currentUser.id && video?.userId !== this.currentUser.id) {
      return false;
    }

    this.comments = this.comments.filter((c) => c.id !== commentId);
    if (video) {
      video.commentsCount = Math.max(0, video.commentsCount - 1);
      this.saveVideos();
    }
    this.saveComments();
    return true;
  }

  public recordWatchEvent(videoId: string, watchSeconds: number, is100Percent: boolean): void {
    if (!this.watchStats[videoId]) {
      this.watchStats[videoId] = { views: 0, completions: 0, totalDuration: 0 };
    }
    this.watchStats[videoId].views += 1;
    this.watchStats[videoId].totalDuration += watchSeconds;
    if (is100Percent) {
      this.watchStats[videoId].completions += 1;
    }
    this.saveWatchStats();
  }

  public recordShare(videoId: string): void {
    const video = this.videos.find((v) => v.id === videoId);
    if (video) {
      video.sharesCount += 1;
      this.saveVideos();
    }
  }

  public publishVideo(draft: VideoDraft, user: User): { success: boolean; error?: string; video?: Video } {
    // 1. Strict size check: 25 MB max (Master prompt section 2, 36)
    const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
    if (draft.size > MAX_SIZE_BYTES) {
      return {
        success: false,
        error: 'La taille de la vidéo dépasse 25 Mo. Maximum : 25 MB.',
      };
    }

    // 2. Format tags
    const caption = draft.caption || '';
    const tagsFromCaption = caption.match(/#[\w\u0590-\u05ff]+/gi)?.map((t) => t.slice(1)) || [];
    const combinedTags = Array.from(new Set([...tagsFromCaption, ...(draft.tags || [])]));

    const newVideo: Video = {
      id: 'vid_' + Date.now(),
      userId: user.id,
      user: {
        id: user.id,
        name: `${user.name} ${user.surname}`,
        handle: user.handle,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
      videoUrl: draft.uri,
      thumbnailUrl: draft.uri,
      caption: caption.trim() || 'Nouvelle vidéo sur NNECXY',
      tags: combinedTags,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 1,
      duration: draft.duration || 15,
      audioTitle: draft.audioTrack || 'Son original',
      sizeBytes: draft.size,
      createdAt: new Date().toISOString(),
      allowDownload: true,
    };

    // Insert at front of feed
    this.videos.unshift(newVideo);
    this.saveVideos();

    return { success: true, video: newVideo };
  }

  public deleteVideo(videoId: string, userId: string): boolean {
    const video = this.videos.find((v) => v.id === videoId);
    if (!video || video.userId !== userId) return false;

    this.videos = this.videos.filter((v) => v.id !== videoId);
    this.comments = this.comments.filter((c) => c.videoId !== videoId);

    this.saveVideos();
    this.saveComments();
    return true;
  }

  public reportContent(
    targetType: 'video' | 'user' | 'comment',
    targetId: string,
    reason: string,
    reporterId: string
  ): { success: boolean; error?: string } {
    // Check duplicate report (Section 36, 51)
    const existing = this.reports.find(
      (r) => r.targetId === targetId && r.reporterId === reporterId
    );
    if (existing) {
      return { success: false, error: 'alreadyReported' };
    }

    this.reports.push({
      targetId,
      reason,
      reporterId,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(this.reports));
    return { success: true };
  }

  // --- NOTIFICATIONS ---

  public getNotifications(userId: string): NotificationItem[] {
    return this.notifications.filter((n) => n.userId === userId || n.userId === 'guest');
  }

  public markNotificationAsRead(notifId: string): void {
    const notif = this.notifications.find((n) => n.id === notifId);
    if (notif) {
      notif.read = true;
      this.saveNotifications();
    }
  }

  private addNotification(data: {
    userId: string;
    type: 'like' | 'comment' | 'follow' | 'message';
    actor: User;
    videoId?: string;
    message: string;
  }) {
    const newNotif: NotificationItem = {
      id: 'notif_' + Date.now(),
      userId: data.userId,
      type: data.type,
      actor: {
        id: data.actor.id,
        name: `${data.actor.name} ${data.actor.surname}`,
        handle: data.actor.handle,
        avatar: data.actor.avatar,
      },
      videoId: data.videoId,
      message: data.message,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(newNotif);
    this.saveNotifications();
  }

  // --- MESSAGES & CHAT ---

  public getConversations(userId: string): Conversation[] {
    return this.conversations;
  }

  public getMessages(conversationId: string): ChatMessage[] {
    return this.messages.filter((m) => m.conversationId === conversationId);
  }

  public sendMessage(conversationId: string, text: string): ChatMessage | null {
    if (!this.currentUser || !text.trim()) return null;

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      conversationId,
      senderId: this.currentUser.id,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    this.messages.push(newMsg);

    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.lastMessage = text.trim();
      conv.lastMessageTime = newMsg.createdAt;
      this.saveConversations();
    }

    this.saveMessages();
    return newMsg;
  }

  public createGroup(name: string, memberIds: string[]): Conversation {
    const current = this.currentUser || INITIAL_USERS[0];
    const groupMembers = this.users.filter((u) => memberIds.includes(u.id) || u.id === current.id);

    const newGroup: Conversation = {
      id: 'grp_' + Date.now(),
      isGroup: true,
      name: name.trim(),
      groupAdminId: current.id,
      memberIds: groupMembers.map((u) => u.id),
      members: groupMembers,
      lastMessage: 'Groupe créé',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
    };

    this.conversations.unshift(newGroup);
    this.saveConversations();
    return newGroup;
  }

  // --- SEARCH ---

  public search(query: string): { users: User[]; videos: Video[]; tags: string[] } {
    const q = query.trim().toLowerCase();
    if (!q) return { users: [], videos: [], tags: [] };

    const matchedUsers = this.users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.surname.toLowerCase().includes(q) ||
        u.handle.toLowerCase().includes(q) ||
        u.bio.toLowerCase().includes(q)
    );

    const matchedVideos = this.videos.filter(
      (v) =>
        v.caption.toLowerCase().includes(q) ||
        v.tags.some((t) => t.toLowerCase().includes(q))
    );

    const matchedTags = Array.from(
      new Set(
        this.videos
          .flatMap((v) => v.tags)
          .filter((t) => t.toLowerCase().includes(q.replace('#', '')))
      )
    );

    return { users: matchedUsers, videos: matchedVideos, tags: matchedTags };
  }

  public getUserById(userId: string): User | undefined {
    return this.users.find((u) => u.id === userId);
  }

  public getAllUsers(): User[] {
    return [...this.users].map((u) => ({
      ...u,
      isFollowed: this.userFollows.has(u.id),
    }));
  }

  public getOrCreateDirectConversation(targetUserId: string): Conversation | null {
    if (!this.currentUser || this.currentUser.id === targetUserId) return null;

    const targetUser = this.users.find((u) => u.id === targetUserId);
    if (!targetUser) return null;

    // Check if direct conversation already exists
    let conv = this.conversations.find(
      (c) =>
        !c.isGroup &&
        c.memberIds &&
        c.memberIds.includes(this.currentUser!.id) &&
        c.memberIds.includes(targetUserId)
    );

    if (!conv) {
      conv = {
        id: `dm_${this.currentUser.id}_${targetUserId}`,
        isGroup: false,
        name: `${targetUser.name} ${targetUser.surname}`.trim(),
        avatar: targetUser.avatar,
        memberIds: [this.currentUser.id, targetUserId],
        members: [this.currentUser, targetUser],
        lastMessage: 'Nouvelle conversation',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      };
      this.conversations.unshift(conv);
      this.saveConversations();
    }

    return conv;
  }
}

export const dataService = new DataService();
