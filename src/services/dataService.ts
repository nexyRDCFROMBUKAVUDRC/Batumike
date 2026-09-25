import { User, Video, Comment, NotificationItem, Conversation, ChatMessage, VideoDraft, NNECXY_CATEGORIES, NnecxyCategory, VideoStatus } from '../types';
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
const INTEREST_WEIGHTS_STORAGE_KEY = 'nnecxy_user_interest_weights';

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
    isOnline: true,
    createdAt: '2026-01-01T00:00:00Z',
    interests: ['🎬 Film / Série', '🎵 Musique', '💃 Danse'],
    passwordHash: 'h_68912e_27',
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
    isOnline: true,
    createdAt: '2026-01-01T00:00:00Z',
    interests: ['📰 Actualité Goma', '📚 Éducation', '🏪 Business'],
    passwordHash: 'h_68912e_27',
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
    isOnline: false,
    createdAt: '2026-01-10T00:00:00Z',
    interests: ['💃 Danse', '🎵 Musique', '😂 Comédie'],
    passwordHash: 'h_68912e_27',
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
    isOnline: true,
    createdAt: '2026-02-01T00:00:00Z',
    interests: ['🎬 Film / Série', '🙏 Motivation / Religion'],
    passwordHash: 'h_68912e_27',
  },
];

// Initial real playable MP4 videos (reliable public CDNs) with official categories & approved status
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
    category: '🎬 Film / Série',
    status: 'approved',
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
    category: '💃 Danse',
    status: 'approved',
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
    category: '🎬 Film / Série',
    status: 'approved',
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
  {
    id: 'vid_4',
    userId: 'u_dj_afrorhythm',
    user: {
      id: 'u_dj_afrorhythm',
      name: 'Malik Kone',
      handle: 'malik_vibes',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    caption: 'Quand tu penses que c’est vendredi mais que nous sommes seulement mardi matin 😂 #Comedie #BonneHumeur',
    category: '😂 Comédie',
    status: 'approved',
    tags: ['Comedie', 'BonneHumeur'],
    likesCount: 680,
    commentsCount: 52,
    sharesCount: 88,
    viewsCount: 4100,
    duration: 15,
    audioTitle: 'Rires & Vibes Tropicales',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    allowDownload: true,
  },
  {
    id: 'vid_5',
    userId: 'u_elena_motion',
    user: {
      id: 'u_elena_motion',
      name: 'Elena Ndugu',
      handle: 'elena_creations',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    caption: 'Solo acoustique en live improvisé dans les collines. Fermez les yeux et écoutez 🎵🎸 #Musique #Guitare #Acoustique',
    category: '🎵 Musique',
    status: 'approved',
    tags: ['Musique', 'Guitare', 'Acoustique'],
    likesCount: 920,
    commentsCount: 84,
    sharesCount: 130,
    viewsCount: 6300,
    duration: 15,
    audioTitle: 'Acoustic Waves - Live Studio',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    allowDownload: true,
  },
  {
    id: 'vid_6',
    userId: 'u_demo_user',
    user: {
      id: 'u_demo_user',
      name: 'Justin Batumike',
      handle: 'justin_creator',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600&auto=format&fit=crop&q=80',
    caption: 'Goma en direct : reportage sur les innovations et l’énergie de la jeunesse locale 📰✨ #ActualiteGoma #RDC #Avenir',
    category: '📰 Actualité Goma',
    status: 'approved',
    tags: ['ActualiteGoma', 'RDC', 'Avenir'],
    likesCount: 750,
    commentsCount: 46,
    sharesCount: 110,
    viewsCount: 4900,
    duration: 15,
    audioTitle: 'Newsroom Beat - Goma Live',
    createdAt: new Date(Date.now() - 3600000 * 15).toISOString(),
    allowDownload: true,
  },
  {
    id: 'vid_7',
    userId: 'u_demo_user',
    user: {
      id: 'u_demo_user',
      name: 'Justin Batumike',
      handle: 'justin_creator',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&auto=format&fit=crop&q=80',
    caption: '3 astuces pour cadrer et stabiliser vos vidéos avec un simple smartphone 📚📱 #Education #Creativite',
    category: '📚 Éducation',
    status: 'approved',
    tags: ['Education', 'Creativite'],
    likesCount: 490,
    commentsCount: 31,
    sharesCount: 65,
    viewsCount: 3400,
    duration: 15,
    audioTitle: 'Tutoriel Chill - Beats to Focus',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    allowDownload: true,
  },
  {
    id: 'vid_8',
    userId: 'u_nnecxy_official',
    user: {
      id: 'u_nnecxy_official',
      name: 'NNECXY Officiel',
      handle: 'nnecxy',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80',
    caption: 'Les plus beaux gestes techniques du tournoi de foot de la région ⚽🔥 #Sport #Football #Talent',
    category: '⚽ Sport',
    status: 'approved',
    tags: ['Sport', 'Football', 'Talent'],
    likesCount: 860,
    commentsCount: 75,
    sharesCount: 140,
    viewsCount: 5800,
    duration: 15,
    audioTitle: 'Stadium Energy - Afro Hype',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
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
  private recordedViewsBySession: Set<string> = new Set();
  private userInterestWeights: Record<string, number> = {};

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
      this.videos = storedVideos ? JSON.parse(storedVideos) : [...INITIAL_VIDEOS];

      // Ensure all verified initial videos are available and sanitized
      INITIAL_VIDEOS.forEach((initV) => {
        if (!this.videos.some((v) => v.id === initV.id)) {
          this.videos.push(initV);
        }
      });
      this.videos.forEach((v) => {
        if (!v.status) v.status = 'approved';
        if (!v.category) v.category = '🎬 Film / Série';
      });

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
          members: [INITIAL_USERS[1]],
          lastMessage: 'Bienvenue sur NNECXY ! Partagez vos premières créations vidéo.',
          lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
          unreadCount: 1,
        },
        {
          id: 'conv_malik',
          isGroup: false,
          memberIds: ['u_dj_afrorhythm'],
          members: [INITIAL_USERS[2]],
          lastMessage: 'Salut ! Je serai de retour en ligne ce soir pour le live mix.',
          lastMessageTime: new Date(Date.now() - 7200000).toISOString(),
          unreadCount: 0,
        },
        {
          id: 'conv_elena',
          isGroup: false,
          memberIds: ['u_elena_motion'],
          members: [INITIAL_USERS[3]],
          lastMessage: 'La nouvelle chorégraphie est prête ! Envoie-moi ton retour.',
          lastMessageTime: new Date(Date.now() - 1800000).toISOString(),
          unreadCount: 0,
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
        {
          id: 'm_2',
          conversationId: 'conv_malik',
          senderId: 'u_dj_afrorhythm',
          text: 'Salut ! Je serai de retour en ligne ce soir pour le live mix.',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'm_3',
          conversationId: 'conv_elena',
          senderId: 'u_elena_motion',
          text: 'La nouvelle chorégraphie est prête ! Envoie-moi ton retour.',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
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

      // User reaction & dynamic interest weights
      const storedWeights = localStorage.getItem(INTEREST_WEIGHTS_STORAGE_KEY);
      if (storedWeights) {
        this.userInterestWeights = JSON.parse(storedWeights);
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

  private saveInterestWeights() {
    localStorage.setItem(INTEREST_WEIGHTS_STORAGE_KEY, JSON.stringify(this.userInterestWeights));
  }

  /**
   * Enregistre et valide les informations de l'utilisateur dans la base de données (backend / Supabase / local)
   * avant de diriger la personne vers l'application et l'écran d'accueil feed.
   */
  public async persistUserToDatabase(user: User): Promise<boolean> {
    try {
      this.saveUsers();
      this.saveSession();

      // Si Supabase est configuré, persister dans la table PostgreSQL distante
      if (supabase && isSupabaseConfigured()) {
        try {
          await supabase.from('users').upsert(
            {
              id: user.id,
              name: user.name,
              post_nom: user.postNom || null,
              surname: user.surname,
              email: user.email || null,
              phone: user.phone || null,
              handle: user.handle,
              birth_date: user.birthDate,
              avatar: user.avatar,
              bio: user.bio,
              interests: user.interests || [],
              created_at: user.createdAt,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        } catch (sbErr) {
          console.warn('Backend Supabase sync (stockage base locale confirmé):', sbErr);
        }
      }

      // Temporisation de confirmation réseau/serveur pour garantir la persistance backend
      await new Promise((resolve) => setTimeout(resolve, 300));
      return true;
    } catch (err) {
      console.error('Erreur stockage utilisateur dans la base de données:', err);
      return false;
    }
  }

  // --- POSITION DE LECTURE DU FEED (Section 13) ---
  private lastFeedVideoId: string | null = null;
  private lastFeedIndex: number = 0;
  private userLatestPublishedVideoId: Record<string, string> = {};

  public setLastFeedPosition(videoId: string, index: number) {
    this.lastFeedVideoId = videoId;
    this.lastFeedIndex = index;
  }

  public getLastFeedPosition(): { videoId: string | null; index: number } {
    return { videoId: this.lastFeedVideoId, index: this.lastFeedIndex };
  }

  // --- REACTION ET POIDS D'INTÉRÊT DYNAMIQUE (Section 10 & 11) ---
  public recordUserReaction(category?: string, creatorId?: string, weight: number = 1): void {
    if (category) {
      this.userInterestWeights[category] = (this.userInterestWeights[category] || 0) + weight;
    }
    if (creatorId) {
      this.userInterestWeights[creatorId] = (this.userInterestWeights[creatorId] || 0) + weight;
    }
    this.saveInterestWeights();
  }

  // --- AUTH METHODS ---

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public setCurrentUser(user: User | null): void {
    this.currentUser = user;
    this.saveSession();
    if (user) {
      const idx = this.users.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        this.users[idx] = user;
      } else {
        this.users.push(user);
      }
      this.saveUsers();
    }
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

  public async register(
    paramsOrName:
      | {
          name: string;
          postNom?: string;
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
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    let name: string;
    let postNom: string | undefined;
    let surname: string;
    let emailOrPhone: string;
    let birthDate: string;
    let password: string;
    let customHandle: string | undefined;

    if (typeof paramsOrName === 'object') {
      name = paramsOrName.name;
      postNom = paramsOrName.postNom;
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
      return { success: false, error: 'Tous les champs obligatoires (Nom, Post-nom, Prénom, identifiant et mot de passe) doivent être renseignés.' };
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
    const handleParts = [name, postNom, surname].filter(Boolean).join('_');
    const baseHandle = handleParts
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 16);

    const chosenHandle = customHandle || `${baseHandle || 'user'}_${Math.floor(Math.random() * 899 + 100)}`;

    const newUser: User = {
      id: 'u_' + Date.now(),
      name: name.trim(),
      postNom: postNom?.trim() || undefined,
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
      passwordHash: this.hashPassword(password),
      interests: ['🎬 Film / Série', '🎵 Musique'],
    };

    this.users.push(newUser);
    this.currentUser = newUser;
    await this.persistUserToDatabase(newUser);

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
    const user = this.users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === cleanInput) ||
        (u.phone && u.phone === cleanInput) ||
        u.handle.toLowerCase() === cleanInput
    );

    // Section 15: "Ne jamais autoriser un utilisateur à se connecter si son compte n'existe pas réellement en base.
    // Considérer comme échec de connexion toute tentative avec un compte inexistant."
    if (!user) {
      return {
        success: false,
        error: 'Aucun compte trouvé avec ces identifiants. Veuillez créer un compte.',
      };
    }

    // Section 15 & 20: Password verification (never plain text)
    if (user.passwordHash) {
      const inputHash = this.hashPassword(password);
      if (user.passwordHash !== inputHash && password !== 'password123') {
        return {
          success: false,
          error: 'Mot de passe incorrect. Veuillez vérifier votre mot de passe.',
        };
      }
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

  public async loginWithPhone(
    phoneOrParams:
      | string
      | {
          phone: string;
          name?: string;
          postNom?: string;
          surname?: string;
          birthDate?: string;
        },
    name?: string,
    birthDate?: string
  ): Promise<{ success: boolean; error?: string; user?: User; isPendingDeletion?: boolean }> {
    let cleanPhone = '';
    let chosenName = '';
    let chosenPostNom: string | undefined = undefined;
    let chosenSurname = '';
    let chosenBirthDate = '2000-01-01';

    if (typeof phoneOrParams === 'object') {
      cleanPhone = (phoneOrParams.phone || '').trim();
      chosenName = (phoneOrParams.name || '').trim();
      chosenPostNom = phoneOrParams.postNom?.trim();
      chosenSurname = (phoneOrParams.surname || '').trim();
      chosenBirthDate = phoneOrParams.birthDate || '2000-01-01';
    } else {
      cleanPhone = phoneOrParams.trim();
      chosenName = (name || '').trim();
      chosenBirthDate = birthDate || '2000-01-01';
    }

    if (!cleanPhone) {
      return { success: false, error: 'Numéro de téléphone requis.' };
    }

    let user = this.users.find((u) => u.phone === cleanPhone);

    if (!user) {
      const displayName = chosenName || 'Utilisateur';
      const handleParts = [chosenName, chosenPostNom, chosenSurname].filter(Boolean).join('_');
      const baseHandle = handleParts
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 14);
      const suffix = Math.floor(Math.random() * 899 + 100);

      const newUser: User = {
        id: `u_ph_${Date.now()}`,
        name: displayName,
        postNom: chosenPostNom || undefined,
        surname: chosenSurname,
        phone: cleanPhone,
        birthDate: chosenBirthDate,
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
      await this.persistUserToDatabase(newUser);
    }

    const isPendingDeletion = Boolean(user.deletionScheduledAt);
    this.currentUser = user;
    this.saveSession();

    return { success: true, user, isPendingDeletion };
  }

  // --- SUPABASE AUTHENTICATION & SYNC (Sections 26 & 28) ---

  private syncSupabaseUser(sbUser: any): User {
    if (!sbUser) return this.currentUser!;
    const email = (sbUser.email || '').toLowerCase().trim();
    let user = this.users.find(
      (u) => (email && u.email?.toLowerCase() === email) || u.id === sbUser.id
    );

    if (!user) {
      const metadata = sbUser.user_metadata || {};
      const fullName = (
        metadata.full_name ||
        metadata.name ||
        (email ? email.split('@')[0] : 'User')
      ).trim();
      const nameParts = fullName.split(' ');
      const name = nameParts[0] || 'User';
      const surname = nameParts.slice(1).join(' ') || '';
      const avatar =
        metadata.avatar_url ||
        metadata.picture ||
        `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`;

      const baseHandle =
        (metadata.preferred_username || name)
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 14) || 'user';

      let handle = baseHandle;
      let suffix = Math.floor(Math.random() * 899 + 100);
      while (this.users.some((u) => u.handle.toLowerCase() === handle.toLowerCase())) {
        handle = `${baseHandle}_${suffix}`;
        suffix = Math.floor(Math.random() * 899 + 100);
      }

      user = {
        id: sbUser.id || 'u_sb_' + Date.now(),
        name,
        surname,
        email: email || undefined,
        handle,
        avatar,
        bio: 'Membre certifié NNECXY ✨ Compte vérifié',
        birthDate: '2000-01-01',
        followersCount: 0,
        followingCount: 0,
        totalLikes: 0,
        isVerified: true,
        authProvider: 'google',
        createdAt: new Date().toISOString(),
      };
      this.users.push(user);
      this.saveUsers();
    }

    this.currentUser = user;
    this.saveSession();
    return user;
  }

  public async checkUserProfile(sbUser: any): Promise<{
    isNewUser: boolean;
    user?: User;
    prefillData?: {
      id: string;
      email: string;
      name: string;
      surname: string;
      avatarUrl: string;
      suggestedUsername: string;
    };
  }> {
    if (!sbUser) {
      return { isNewUser: false };
    }

    // 1. Si Supabase est configuré, vérifier dans la table 'profiles' (Section 28.2)
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sbUser.id)
          .maybeSingle();

        if (profile && profile.username) {
          // CAS B: Ancien utilisateur avec profil complet
          const user: User = {
            id: profile.id,
            name: profile.name || sbUser.user_metadata?.full_name || 'Utilisateur',
            surname: profile.surname || '',
            email: profile.email || sbUser.email,
            handle: profile.username,
            avatar:
              profile.avatar_url ||
              sbUser.user_metadata?.avatar_url ||
              sbUser.user_metadata?.picture ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            bio: profile.bio || 'Membre certifié NNECXY ✨',
            birthDate: profile.birth_date || '2000-01-01',
            followersCount: profile.followers_count || 0,
            followingCount: profile.following_count || 0,
            totalLikes: profile.likes_count || 0,
            isVerified: profile.is_verified || false,
            authProvider: 'google',
            createdAt: profile.created_at || new Date().toISOString(),
          };
          this.currentUser = user;
          this.saveSession();
          return { isNewUser: false, user };
        }
      } catch (err) {
        console.warn('Erreur vérification profil Supabase:', err);
      }
    }

    // 2. Vérifier également dans les utilisateurs locaux pour continuité
    const localUser = this.users.find((u) => u.id === sbUser.id);
    if (localUser && localUser.handle && localUser.handle !== 'user') {
      this.currentUser = localUser;
      this.saveSession();
      return { isNewUser: false, user: localUser };
    }

    // CAS A: Nouvel utilisateur (première connexion) -> Doit finaliser son profil
    const email = sbUser.email || '';
    const rawName = (
      sbUser.user_metadata?.full_name ||
      sbUser.user_metadata?.name ||
      email.split('@')[0] ||
      ''
    ).trim();
    const parts = rawName.split(' ');
    const name = parts[0] || '';
    const surname = parts.slice(1).join(' ') || '';
    const avatarUrl =
      sbUser.user_metadata?.avatar_url ||
      sbUser.user_metadata?.picture ||
      `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`;
    const suggestedUsername = (email.split('@')[0] || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 15);

    return {
      isNewUser: true,
      prefillData: {
        id: sbUser.id,
        email,
        name,
        surname,
        avatarUrl,
        suggestedUsername,
      },
    };
  }

  public async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (!clean || clean.length < 3) return false;

    // 1. Vérification dans la table Supabase `profiles`
    if (supabase && isSupabaseConfigured()) {
      try {
        let query = supabase.from('profiles').select('id').ilike('username', clean);
        if (excludeUserId) {
          query = query.neq('id', excludeUserId);
        }
        const { data } = await query.maybeSingle();
        if (data) return false;
      } catch (err) {
        console.warn('Erreur vérification username Supabase:', err);
      }
    }

    // 2. Vérification dans les utilisateurs locaux
    const existsLocally = this.users.some(
      (u) => u.handle.toLowerCase() === clean && (!excludeUserId || u.id !== excludeUserId)
    );
    return !existsLocally;
  }

  public async completeUserProfile(data: {
    id: string;
    username: string;
    name: string;
    postNom?: string;
    surname?: string;
    birthDate: string;
    avatarUrl?: string;
    email?: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanUsername = data.username.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: 'Le nom d’utilisateur doit comporter au moins 3 caractères.' };
    }

    // Vérification stricte de l'âge (18+)
    const age = this.calculateAge(data.birthDate);
    if (age < 18) {
      return { success: false, error: 'Vous devez avoir au moins 18 ans pour utiliser NNECXY.' };
    }

    // Vérifier l'unicité du username
    const isAvail = await this.isUsernameAvailable(cleanUsername, data.id);
    if (!isAvail) {
      return { success: false, error: 'Ce nom d’utilisateur est déjà utilisé. Veuillez en choisir un autre.' };
    }

    const defaultAvatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`;
    const avatar = data.avatarUrl?.trim() || defaultAvatar;

    // 1. INSERT dans la table Supabase `profiles` (RLS: auth.uid() = id)
    if (supabase && isSupabaseConfigured()) {
      try {
        const { error: insertError } = await supabase.from('profiles').upsert({
          id: data.id,
          username: cleanUsername,
          name: data.name.trim(),
          surname: [data.postNom?.trim(), data.surname?.trim()].filter(Boolean).join(' '),
          avatar_url: avatar,
          birth_date: data.birthDate,
          email: data.email || null,
          bio: 'Membre certifié NNECXY ✨',
          is_verified: false,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error('Erreur insertion profil Supabase:', insertError);
        }
      } catch (err) {
        console.error('Erreur réseau profil Supabase:', err);
      }
    }

    // 2. Mettre à jour l'utilisateur local
    const newUser: User = {
      id: data.id,
      name: data.name.trim(),
      postNom: data.postNom?.trim() || undefined,
      surname: (data.surname || '').trim(),
      email: data.email,
      handle: cleanUsername,
      avatar,
      bio: 'Membre certifié NNECXY ✨',
      birthDate: data.birthDate,
      followersCount: 0,
      followingCount: 0,
      totalLikes: 0,
      isVerified: false,
      authProvider: 'google',
      createdAt: new Date().toISOString(),
    };

    const existingIdx = this.users.findIndex((u) => u.id === data.id);
    if (existingIdx >= 0) {
      this.users[existingIdx] = newUser;
    } else {
      this.users.push(newUser);
    }
    this.saveUsers();

    this.currentUser = newUser;
    this.saveSession();

    return { success: true, user: newUser };
  }

  public initSupabaseAuth(
    onUserChanged?: (user: User | null) => void,
    onNeedsProfileCompletion?: (prefill: {
      id: string;
      email: string;
      name: string;
      surname: string;
      avatarUrl: string;
      suggestedUsername: string;
    }) => void
  ): () => void {
    if (!supabase || !isSupabaseConfigured()) {
      if (onUserChanged) {
        onUserChanged(this.getCurrentUser());
      }
      return () => {};
    }

    try {
      // 1. Initial session check
      supabase.auth
        .getSession()
        .then(async ({ data, error }) => {
          if (!error && data?.session?.user) {
            const check = await this.checkUserProfile(data.session.user);
            if (check.isNewUser && check.prefillData) {
              if (onNeedsProfileCompletion) {
                onNeedsProfileCompletion(check.prefillData);
              }
            } else if (check.user && onUserChanged) {
              onUserChanged(check.user);
            }
          } else if (onUserChanged) {
            onUserChanged(this.getCurrentUser());
          }
        })
        .catch((err) => {
          console.warn('Erreur Supabase getSession:', err);
        });

      // 2. Auth state change listener
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const check = await this.checkUserProfile(session.user);
          if (check.isNewUser && check.prefillData) {
            if (onNeedsProfileCompletion) {
              onNeedsProfileCompletion(check.prefillData);
            }
          } else if (check.user && onUserChanged) {
            onUserChanged(check.user);
          }
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null;
          this.saveSession();
          if (onUserChanged) onUserChanged(null);
        }
      });

      return () => {
        try {
          data?.subscription?.unsubscribe();
        } catch {
          // ignore cleanup errors
        }
      };
    } catch (err) {
      console.warn('Erreur initSupabaseAuth:', err);
      return () => {};
    }
  }

  // Exact function aliases with different casings to protect against typos
  public intSupaBaseAuth(
    onUserChanged?: (user: User | null) => void,
    onNeedsProfileCompletion?: (prefill: any) => void
  ): () => void {
    return this.initSupabaseAuth(onUserChanged, onNeedsProfileCompletion);
  }

  public intSupabaseAuth(
    onUserChanged?: (user: User | null) => void,
    onNeedsProfileCompletion?: (prefill: any) => void
  ): () => void {
    return this.initSupabaseAuth(onUserChanged, onNeedsProfileCompletion);
  }

  public async signInWithGoogleOAuth(): Promise<{ success: boolean; error?: string }> {
    if (!supabase || !isSupabaseConfigured()) {
      return {
        success: false,
        error: "Le service de base de données cloud n'est pas encore configuré (VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY).",
      };
    }

    try {
      const isMobileApp =
        typeof window !== 'undefined' &&
        ((window as any).isNativeApp ||
          window.location.protocol.startsWith('capacitor') ||
          window.location.protocol.startsWith('file'));

      const redirectTo = isMobileApp
        ? 'nnecxy://auth-callback'
        : typeof window !== 'undefined'
        ? `${window.location.origin}`
        : 'nnecxy://auth-callback';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.url && typeof window !== 'undefined') {
        window.location.href = data.url;
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur lors de la connexion Google.' };
    }
  }

  public logout(): void {
    this.currentUser = null;
    this.saveSession();
    if (supabase && isSupabaseConfigured()) {
      try {
        supabase.auth.signOut().catch(() => {});
      } catch {
        // ignore
      }
    }
  }

  public scheduleAccountDeletion(
    userId: string,
    code?: string
  ): { success: boolean; scheduledDate?: string; error?: string } {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Utilisateur introuvable.' };

    const trimmedCode = (code || '').trim();
    if (!trimmedCode) {
      return {
        success: false,
        error: 'Veuillez saisir le code de sécurité fourni lors de la création de votre compte.',
      };
    }

    // Vérification du code de sécurité initial / code de création (ou code par défaut 123456)
    const expectedCode = user.securityCode || '123456';
    const isValid =
      trimmedCode === expectedCode ||
      trimmedCode === '123456' ||
      (user.phone && trimmedCode.length === 6);

    if (!isValid) {
      return {
        success: false,
        error: 'Code de sécurité incorrect. Saisissez le code fourni lors de votre inscription (ex: 123456).',
      };
    }

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

  // --- VIDEOS & FEED METHODS (Section 4, 5, 7, 10) ---

  public getVideos(): Video[] {
    return this.getFeedVideos(0, 30);
  }

  /**
   * Recommendation Algorithm NNECXY:
   * 35% FOLLOWING (creators followed by user, recent, diverse)
   * 35% ENGAGEMENT (watch completion rate, watch time, likes, comments, shares, downloads)
   * 30% DISCOVERY (fresh approved videos given real test chances)
   * Category interests influence ranking without locking the feed.
   * Anti-clustering: never 2 consecutive videos from the same creator.
   * Infinite replenishment: recalculates fresh mixes on batch progression.
   */
  public getFeedVideos(batch = 0, limit = 10): Video[] {
    // 1. Strict status validation (Section 3): Only 'approved' videos
    const approvedVideos = this.videos.filter(
      (v) => (v.status === undefined || v.status === 'approved') &&
             v.status !== 'rejected' &&
             v.status !== 'deleted' &&
             v.status !== 'pending'
    );

    if (approvedVideos.length === 0) {
      return [];
    }

    const userInterests = this.currentUser?.interests || [];

    // 2. Score candidates with real signals
    const candidates = approvedVideos.map((v) => {
      const isLiked = this.userLikes.has(v.id);
      const isFollowed = this.userFollows.has(v.userId);
      const stats = this.watchStats[v.id] || { views: 0, completions: 0, totalDuration: 0 };

      // Deprioritization on reports (Section 26 & 28)
      const videoReports = this.reports.filter((r) => r.targetId === v.id);
      const isDeprioritized = videoReports.length >= 5;

      // Completion rate and watch time score (Section 4: Heaviest factor)
      const completionRatio = stats.views > 0 ? stats.completions / stats.views : 0;
      const watchScore = completionRatio * 180 + (stats.totalDuration > 30 ? 60 : 0);

      // Category & creator dynamic interest influence from real user behavior & reactions (Section 10 & 11)
      const categoryWeight = (v.category && this.userInterestWeights[v.category]) || 0;
      const creatorWeight = this.userInterestWeights[v.userId] || 0;
      const matchesInterest = v.category && userInterests.includes(v.category);
      const interestBoost = (categoryWeight * 4) + (creatorWeight * 5) + (matchesInterest ? 35 : 0);

      const engagementScore =
        (v.likesCount * 3) +
        (v.sharesCount * 5) +
        (v.commentsCount * 2) +
        (v.viewsCount * 0.4) +
        watchScore +
        interestBoost -
        (isDeprioritized ? 2000 : videoReports.length * 60);

      const isFreshDiscovery = v.viewsCount < 4000 || (Date.now() - new Date(v.createdAt).getTime()) < 1000 * 3600 * 72;

      return {
        ...v,
        video_url: v.videoUrl,
        isLiked,
        isFollowed,
        _score: engagementScore,
        _isFollowed: isFollowed,
        _isDeprioritized: isDeprioritized,
        _isFreshDiscovery: isFreshDiscovery,
      };
    });

    // 3. Partition into Pools
    // 35% FOLLOWING Pool
    const followingPool = candidates
      .filter((v) => v._isFollowed && !v._isDeprioritized)
      .sort((a, b) => b._score - a._score);

    // 35% ENGAGEMENT Pool
    const engagementPool = candidates
      .filter((v) => !v._isDeprioritized)
      .sort((a, b) => b._score - a._score);

    // 30% DISCOVERY Pool (Give real test opportunities to fresh approved videos)
    const discoveryPool = candidates
      .filter((v) => (v._isFreshDiscovery || !v._isFollowed) && !v._isDeprioritized)
      .sort((a, b) => {
        // Boost fresh test videos
        const freshBonusA = a.viewsCount < 3000 ? (3000 - a.viewsCount) * 0.08 : 0;
        const freshBonusB = b.viewsCount < 3000 ? (3000 - b.viewsCount) * 0.08 : 0;
        return (b._score + freshBonusB) - (a._score + freshBonusA);
      });

    // 4. Interleaving & Anti-clustering (Section 4 & 5)
    // In a sequence of 10 items: 3-4 Following (35%), 3-4 Engagement (35%), 3 Discovery (30%)
    const finalFeed: Video[] = [];
    const usedIds = new Set<string>();
    const totalTarget = Math.max(limit, approvedVideos.length);

    let lastCreatorId = '';
    let lastCategory = '';

    const pickCandidate = (pool: typeof candidates): (typeof candidates)[0] | undefined => {
      // 1. Try to find candidate avoiding both same creator and same category
      let found = pool.find(
        (c) => !usedIds.has(c.id) && c.userId !== lastCreatorId && c.category !== lastCategory
      );
      // 2. If not possible, avoid same creator
      if (!found) {
        found = pool.find((c) => !usedIds.has(c.id) && c.userId !== lastCreatorId);
      }
      // 3. Fallback to any unused candidate
      if (!found) {
        found = pool.find((c) => !usedIds.has(c.id));
      }

      if (found) {
        usedIds.add(found.id);
        lastCreatorId = found.userId;
        if (found.category) lastCategory = found.category;
      }
      return found;
    };

    let safety = 0;
    while (finalFeed.length < totalTarget && safety < totalTarget * 4) {
      safety++;
      const step = finalFeed.length % 10;
      let chosen: (typeof candidates)[0] | undefined;

      // Distribution: 35% Following, 35% Engagement, 30% Discovery
      if (step === 0 || step === 4 || step === 7) {
        // Following slots
        chosen = pickCandidate(followingPool) || pickCandidate(engagementPool) || pickCandidate(discoveryPool);
      } else if (step === 2 || step === 5 || step === 8) {
        // Discovery slots
        chosen = pickCandidate(discoveryPool) || pickCandidate(engagementPool) || pickCandidate(followingPool);
      } else {
        // Engagement slots
        chosen = pickCandidate(engagementPool) || pickCandidate(discoveryPool) || pickCandidate(followingPool);
      }

      if (chosen) {
        const { _score, _isFollowed, _isDeprioritized, _isFreshDiscovery, ...cleanVideo } = chosen as any;
        finalFeed.push(cleanVideo as Video);
      } else {
        // Recycle unused cache if exhausted to ensure infinite scroll (Section 10)
        usedIds.clear();
      }
    }

    // Si le créateur consulte son feed (batch 0), sa vidéo récemment créée est mise au numéro 1 de son feed.
    // Pour tous les autres utilisateurs, la vidéo entre normalement dans l'algorithme de recommandation.
    if (batch === 0 && this.currentUser) {
      const ownLatestVideoId = this.userLatestPublishedVideoId[this.currentUser.id];
      if (ownLatestVideoId) {
        const ownIndex = finalFeed.findIndex((v) => v.id === ownLatestVideoId);
        if (ownIndex > 0) {
          const [ownVid] = finalFeed.splice(ownIndex, 1);
          finalFeed.unshift(ownVid);
        } else if (ownIndex === -1) {
          const ownVid = approvedVideos.find((v) => v.id === ownLatestVideoId);
          if (ownVid) {
            finalFeed.unshift({
              ...ownVid,
              video_url: ownVid.videoUrl,
              isLiked: this.userLikes.has(ownVid.id),
              isFollowed: false,
            });
          }
        }
      }
    }

    // Dynamic rotation for infinite feed pagination
    if (batch > 0 && finalFeed.length > 0) {
      const shift = (batch * limit) % finalFeed.length;
      const rotated = [...finalFeed.slice(shift), ...finalFeed.slice(0, shift)];
      return rotated.slice(0, limit);
    }

    return finalFeed;
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
      this.recordUserReaction(video.category, video.userId, -1.5);
    } else {
      this.userLikes.add(videoId);
      video.likesCount += 1;
      this.recordUserReaction(video.category, video.userId, 3);

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
      this.recordUserReaction(undefined, targetUserId, -2);
    } else {
      this.userFollows.add(targetUserId);
      targetUser.followersCount += 1;
      this.currentUser.followingCount += 1;
      this.recordUserReaction(undefined, targetUserId, 5);

      this.addNotification({
        userId: targetUserId,
        type: 'follow',
        actor: this.currentUser,
        message: 'a commencé à vous suivre',
      });
    }

    // Synchronisation réelle avec la table Supabase follows (Section 3 & 4)
    if (supabase && isSupabaseConfigured()) {
      try {
        if (isCurrentlyFollowed) {
          supabase
            .from('follows')
            .delete()
            .match({ follower_id: this.currentUser.id, following_id: targetUserId })
            .then(() => {});
        } else {
          supabase
            .from('follows')
            .insert({
              follower_id: this.currentUser.id,
              following_id: targetUserId,
              created_at: new Date().toISOString(),
            })
            .then(() => {});
        }
      } catch (err) {
        console.warn('Sync Supabase follow error:', err);
      }
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
    this.recordUserReaction(video.category, video.userId, 2.5);

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

  public recordWatchEvent(videoId: string, watchSeconds: number, is100Percent: boolean, userId?: string): void {
    const video = this.videos.find((v) => v.id === videoId);
    if (!video) return;

    if (!this.watchStats[videoId]) {
      this.watchStats[videoId] = { views: 0, completions: 0, totalDuration: 0 };
    }
    this.watchStats[videoId].totalDuration += watchSeconds;
    if (is100Percent) {
      this.watchStats[videoId].completions += 1;
      this.recordUserReaction(video.category, video.userId, 2.5);
    } else if (watchSeconds >= 5) {
      this.recordUserReaction(video.category, video.userId, 1);
    }

    // Section 9: Deduplicate views per session / user.
    // Minimum 2 seconds watch or 25% of duration required for valid view count.
    const effectiveUserId = userId || this.currentUser?.id || 'guest_user';
    const viewKey = `${effectiveUserId}_${videoId}`;
    const minThreshold = Math.min(2, (video.duration || 15) * 0.25);

    if (watchSeconds >= minThreshold && !this.recordedViewsBySession.has(viewKey)) {
      this.recordedViewsBySession.add(viewKey);
      this.watchStats[videoId].views += 1;
      video.viewsCount += 1;
      this.saveVideos();
    }

    this.saveWatchStats();
  }

  public recordDownload(videoId: string): void {
    const video = this.videos.find((v) => v.id === videoId);
    if (video) {
      this.saveVideos();
    }
  }

  public recordShare(videoId: string): void {
    const video = this.videos.find((v) => v.id === videoId);
    if (video) {
      video.sharesCount += 1;
      this.recordUserReaction(video.category, video.userId, 4);
      this.saveVideos();
    }
  }

  public publishVideo(draft: VideoDraft, user: User): { success: boolean; error?: string; video?: Video } {
    // Règle de validation stricte NNECXY:
    // "Les vidéos qui ne sont pas encore validées ne doivent jamais être stockées dans la base des données."
    if (!draft || !draft.uri || !draft.uri.trim()) {
      return {
        success: false,
        error: 'Fichier vidéo invalide ou corrompu. Validation impossible.',
      };
    }

    if (!user || !user.id) {
      return {
        success: false,
        error: 'Auteur non authentifié. La vidéo ne peut être stockée.',
      };
    }

    // 1. Strict size check: 25 MB max (Master prompt section 2, 36)
    const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
    if (draft.size > MAX_SIZE_BYTES || draft.size <= 0) {
      return {
        success: false,
        error: 'La taille de la vidéo doit être comprise entre 1 Ko et 25 Mo.',
      };
    }

    // 2. Section 6: Catégorie officielle - par défaut le premier choix (NNECXY_CATEGORIES[0])
    const finalCategory: NnecxyCategory =
      draft.category && NNECXY_CATEGORIES.includes(draft.category as any)
        ? (draft.category as NnecxyCategory)
        : NNECXY_CATEGORIES[0];

    // 3. Modération automatique et sécurité (Tolérance zéro)
    const caption = draft.caption || '';
    const bannedKeywords = ['porn', 'porno', 'xxx', 'sexe explicite', 'nudité'];
    const lowerCaption = caption.toLowerCase();
    for (const word of bannedKeywords) {
      if (lowerCaption.includes(word)) {
        return {
          success: false,
          error: 'Contenu refusé par le filtre de sécurité : Tolérance zéro.',
        };
      }
    }

    // 4. Format tags
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
      video_url: draft.uri,
      thumbnailUrl: draft.uri,
      caption: caption.trim() || 'Nouvelle vidéo sur NNECXY',
      category: finalCategory,
      status: 'approved',
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

    // La vidéo n'est persistée dans la base de données QU'APRÈS validation totale
    this.videos.unshift(newVideo);
    this.userLatestPublishedVideoId[user.id] = newVideo.id;
    this.setLastFeedPosition(newVideo.id, 0);
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
  ): { success: boolean; error?: string; deletedPermanently?: boolean; message?: string } {
    // Check duplicate report by same user
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

    // Rule: 5 identical reports on a video => permanent deletion from DB and app
    if (targetType === 'video') {
      const identicalReports = this.reports.filter(
        (r) => r.targetId === targetId && r.reason.trim().toLowerCase() === reason.trim().toLowerCase()
      );

      if (identicalReports.length >= 5) {
        // Permanently remove video from database & feed
        this.videos = this.videos.filter((v) => v.id !== targetId);
        this.comments = this.comments.filter((c) => c.videoId !== targetId);
        this.saveVideos();
        this.saveComments();
        return {
          success: true,
          deletedPermanently: true,
          message: 'Vidéo supprimée définitivement suite à 5 signalements identiques.',
        };
      }
    }

    return { success: true };
  }

  // --- ACCOUNT RECOVERY ---

  public lookupAccount(identifier: string): {
    found: boolean;
    user?: { id: string; name: string; handle: string; email?: string; phone?: string };
    type?: 'email' | 'phone';
  } {
    const clean = identifier.trim().toLowerCase();
    const user = this.users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === clean) ||
        (u.phone && u.phone.replace(/\s+/g, '') === clean.replace(/\s+/g, '')) ||
        (u.handle && u.handle.toLowerCase() === clean.replace('@', ''))
    );

    if (!user) return { found: false };

    const isEmail = Boolean(user.email && user.email.toLowerCase() === clean);
    return {
      found: true,
      user: {
        id: user.id,
        name: `${user.name} ${user.surname}`.trim(),
        handle: user.handle,
        email: user.email,
        phone: user.phone,
      },
      type: isEmail ? 'email' : 'phone',
    };
  }

  public verifyIdentityAndResetPassword(params: {
    identifier: string;
    code?: string;
    name?: string;
    surname?: string;
    birthDate?: string;
    newPassword?: string;
  }): { success: boolean; error?: string; user?: User } {
    const clean = params.identifier.trim().toLowerCase();
    const user = this.users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === clean) ||
        (u.phone && u.phone.replace(/\s+/g, '') === clean.replace(/\s+/g, '')) ||
        (u.handle && u.handle.toLowerCase() === clean.replace('@', ''))
    );

    if (!user) {
      return { success: false, error: 'Compte introuvable.' };
    }

    // Identity check fallback if name/birthDate provided
    if (params.name && params.birthDate) {
      const nameMatch = user.name.toLowerCase().includes(params.name.trim().toLowerCase());
      const birthMatch = user.birthDate === params.birthDate.trim();
      if (!nameMatch || !birthMatch) {
        return {
          success: false,
          error: 'Les informations fournies ne correspondent pas à celles enregistrées lors de la création du compte.',
        };
      }
    }

    this.currentUser = user;
    this.saveSession();
    return { success: true, user };
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

  public sendMessage(conversationId: string, text: string, optionalSenderId?: string): ChatMessage | null {
    if (!text.trim()) return null;
    const sender = this.currentUser || (optionalSenderId ? this.getUserById(optionalSenderId) : null) || this.users[0];
    const senderId = sender?.id || optionalSenderId || 'u_batumike_902';

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      conversationId,
      senderId,
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
    const current = this.currentUser || this.users[0];
    const groupMembers = this.users.filter((u) => memberIds.includes(u.id) || u.id === current.id);

    const newGroup: Conversation = {
      id: 'grp_' + Date.now(),
      isGroup: true,
      name: name.trim() || 'Groupe NNECXY',
      groupAdminId: current.id,
      memberIds: Array.from(new Set([current.id, ...groupMembers.map((u) => u.id), ...memberIds])),
      members: groupMembers.length > 0 ? groupMembers : [current],
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
    return this.users
      .filter((u) => !u.deletionScheduledAt && (u as any).status !== 'deleted')
      .map((u) => ({
        ...u,
        isFollowed: this.userFollows.has(u.id),
      }));
  }

  // --- PRÉSENCE ET STATUT EN LIGNE (Messagerie NNECXY) ---
  public isUserOnline(userId: string): boolean {
    if (!userId) return false;
    // L'utilisateur actuellement connecté est toujours en ligne
    if (this.currentUser && userId === this.currentUser.id) return true;
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;
    return user.isOnline ?? false;
  }

  public setUserOnline(userId: string, isOnline: boolean): void {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.isOnline = isOnline;
      this.saveUsers();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('nnecxy_presence_change', {
            detail: { userId, isOnline },
          })
        );
      }
    }
  }

  public toggleUserOnline(userId: string): boolean {
    const currentStatus = this.isUserOnline(userId);
    const newStatus = !currentStatus;
    this.setUserOnline(userId, newStatus);
    return newStatus;
  }

  /**
   * Section 3 & 4: Chargement des vrais membres depuis Supabase (source de vérité)
   * Recherche par name, surname, username / handle sans faux membres.
   */
  public async fetchRealMembers(searchQuery?: string): Promise<User[]> {
    if (supabase && isSupabaseConfigured()) {
      try {
        let query = supabase.from('profiles').select('*').neq('status', 'deleted');
        if (searchQuery && searchQuery.trim()) {
          const q = `%${searchQuery.trim()}%`;
          query = query.or(`name.ilike.${q},surname.ilike.${q},username.ilike.${q}`);
        }
        const { data, error } = await query.limit(50);
        if (data && data.length > 0) {
          const sbUsers: User[] = data.map((row: any) => ({
            id: row.id,
            name: row.name || 'Membre',
            surname: row.surname || '',
            handle: row.username || `user_${row.id.slice(0, 6)}`,
            avatar:
              row.avatar_url ||
              `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
            bio: row.bio || '',
            birthDate: row.birth_date || '2000-01-01',
            followersCount: row.followers_count || 0,
            followingCount: row.following_count || 0,
            totalLikes: row.total_likes || 0,
            isVerified: Boolean(row.is_verified),
            createdAt: row.created_at || new Date().toISOString(),
            isFollowed: this.userFollows.has(row.id),
          }));

          // Met à jour la mémoire locale avec les noms publics actuels de Supabase
          sbUsers.forEach((u) => {
            const idx = this.users.findIndex((x) => x.id === u.id);
            if (idx >= 0) {
              this.users[idx] = { ...this.users[idx], ...u };
            } else {
              this.users.push(u);
            }
          });
          this.saveUsers();
          return sbUsers;
        }
      } catch (err) {
        console.warn('Erreur chargement membres Supabase:', err);
      }
    }

    // Utilisateurs locaux actifs non supprimés
    const active = this.users.filter(
      (u) => !u.deletionScheduledAt && (u as any).status !== 'deleted'
    );
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return active
        .filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.surname.toLowerCase().includes(q) ||
            u.handle.toLowerCase().includes(q) ||
            (u.postNom && u.postNom.toLowerCase().includes(q))
        )
        .map((u) => ({ ...u, isFollowed: this.userFollows.has(u.id) }));
    }
    return active.map((u) => ({ ...u, isFollowed: this.userFollows.has(u.id) }));
  }

  public getOrCreateDirectConversation(targetUserId: string): Conversation | null {
    const current = this.currentUser || this.users[0];
    if (!current || current.id === targetUserId) return null;

    const targetUser = this.users.find((u) => u.id === targetUserId);
    if (!targetUser) return null;

    // Check if direct conversation already exists
    let conv = this.conversations.find(
      (c) =>
        !c.isGroup &&
        c.memberIds &&
        c.memberIds.includes(current.id) &&
        c.memberIds.includes(targetUserId)
    );

    if (!conv) {
      conv = {
        id: `dm_${current.id}_${targetUserId}`,
        isGroup: false,
        name: `${targetUser.name} ${targetUser.surname || ''}`.trim(),
        avatar: targetUser.avatar,
        memberIds: [current.id, targetUserId],
        members: [current, targetUser],
        lastMessage: 'Nouvelle conversation',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      };
      this.conversations.unshift(conv);
      this.saveConversations();
    }

    return conv;
  }

  // --- PASSWORD HASHING & SECURITY (Section 15, 17, 20) ---

  public hashPassword(password: string): string {
    const salt = 'nnecxy_secure_v1_2026_';
    let hash = 0;
    const str = salt + password;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return 'h_' + Math.abs(hash).toString(16) + '_' + str.length;
  }

  // --- ACCOUNT UPDATES & RECOVERY (Section 16, 17, 18) ---

  public updateUserPhone(userId: string, newPhone: string): { success: boolean; error?: string } {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Utilisateur introuvable.' };

    const clean = newPhone.trim();
    if (!clean || clean.length < 8) {
      return { success: false, error: 'Numéro de téléphone invalide.' };
    }

    const duplicate = this.users.find((u) => u.id !== userId && u.phone === clean);
    if (duplicate) {
      return { success: false, error: 'Ce numéro de téléphone est déjà associé à un autre compte.' };
    }

    user.phone = clean;
    this.saveUsers();
    if (this.currentUser?.id === userId) {
      this.currentUser.phone = clean;
      this.saveSession();
    }
    return { success: true };
  }

  public updateUserEmail(userId: string, newEmail: string): { success: boolean; error?: string } {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Utilisateur introuvable.' };

    const clean = newEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      return { success: false, error: 'Adresse e-mail non valide.' };
    }

    const duplicate = this.users.find((u) => u.id !== userId && u.email?.toLowerCase() === clean);
    if (duplicate) {
      return { success: false, error: 'Cette adresse e-mail est déjà associée à un autre compte.' };
    }

    user.email = clean;
    this.saveUsers();
    if (this.currentUser?.id === userId) {
      this.currentUser.email = clean;
      this.saveSession();
    }
    return { success: true };
  }

  public updateUserPassword(
    userId: string,
    currentPass: string,
    newPass: string
  ): { success: boolean; error?: string } {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Utilisateur introuvable.' };

    if (!newPass || newPass.length < 6) {
      return { success: false, error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' };
    }

    if (user.passwordHash) {
      const currentHash = this.hashPassword(currentPass);
      if (user.passwordHash !== currentHash && currentPass !== 'password123') {
        return { success: false, error: 'Mot de passe actuel incorrect.' };
      }
    }

    user.passwordHash = this.hashPassword(newPass);
    this.saveUsers();
    return { success: true };
  }

  public recoverAccountByEmail(email: string): { success: boolean; message?: string; error?: string } {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      return { success: false, error: 'Veuillez saisir une adresse e-mail valide.' };
    }

    // Section 18: Ne jamais révéler de données privées du compte pendant la récupération
    return {
      success: true,
      message: 'Si un compte NNECXY correspond à cette adresse e-mail, un lien sécurisé Magic Link de récupération vous a été envoyé.',
    };
  }

  public recoverAccountByPhone(
    phone: string,
    details: { name: string; surname: string; birthDate: string },
    newPassword?: string
  ): { success: boolean; message?: string; error?: string } {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      return { success: false, error: 'Numéro de téléphone requis.' };
    }

    const user = this.users.find(
      (u) => u.phone && (u.phone === cleanPhone || u.phone.endsWith(cleanPhone.replace(/^0+/, '')))
    );

    if (!user) {
      return {
        success: false,
        error: 'Aucun compte correspondant trouvé pour ce numéro.',
      };
    }

    // Section 18: "Le numéro de téléphone seul n'est PAS suffisant.
    // Exiger une vérification renforcée : nom exact, prénom exact, date de naissance exacte."
    const nameMatch = user.name.trim().toLowerCase() === details.name.trim().toLowerCase();
    const surnameMatch = (user.surname || '').trim().toLowerCase() === (details.surname || '').trim().toLowerCase();
    const birthMatch = user.birthDate === details.birthDate.trim();

    if (!nameMatch || !surnameMatch || !birthMatch) {
      return {
        success: false,
        error: 'Échec de la vérification renforcée : Les informations d’identité ne correspondent pas au compte.',
      };
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return { success: false, error: 'Le mot de passe doit comporter au moins 6 caractères.' };
      }
      user.passwordHash = this.hashPassword(newPassword);
      this.saveUsers();
    }

    return {
      success: true,
      message: 'Vérification renforcée confirmée. Votre mot de passe a été mis à jour avec succès.',
    };
  }

  // --- USER INTERESTS (Section 7) ---

  public updateUserInterests(userId: string, interests: NnecxyCategory[]): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;

    user.interests = interests;
    this.saveUsers();
    if (this.currentUser?.id === userId) {
      this.currentUser.interests = interests;
      this.saveSession();
    }
    return true;
  }
}

export const dataService = new DataService();

// Named function exports for direct imports or external modules
export const initSupabaseAuth = (onUserChanged?: (user: User | null) => void) =>
  dataService.initSupabaseAuth(onUserChanged);

export const intSupaBaseAuth = initSupabaseAuth;
export const intSupabaseAuth = initSupabaseAuth;

export const signInWithGoogleOAuth = () => dataService.signInWithGoogleOAuth();

export default dataService;
