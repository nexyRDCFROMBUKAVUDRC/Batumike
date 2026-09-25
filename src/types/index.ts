export const NNECXY_CATEGORIES = [
  '😂 Comédie',
  '🎵 Musique',
  '💃 Danse',
  '📚 Éducation',
  '🙏 Motivation / Religion',
  '⚽ Sport',
  '📰 Actualité Goma',
  '🎬 Film / Série',
  '👶 Dessin Animé',
  '🏪 Business',
] as const;

export type NnecxyCategory = typeof NNECXY_CATEGORIES[number];

export interface User {
  id: string;
  name: string;
  postNom?: string; // Post-nom (spécificité RDC / Afrique centrale : Nom, Post-nom, Prénom)
  surname: string;
  email?: string;
  phone?: string;
  birthDate: string; // YYYY-MM-DD
  avatar: string;
  handle: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  totalLikes: number;
  isVerified: boolean;
  createdAt: string;
  isFollowed?: boolean;
  authProvider?: 'email' | 'google' | 'phone' | 'apple' | 'oauth' | 'sso';
  deletionScheduledAt?: string | null; // For 14-day deletion rule
  securityCode?: string; // Code fourni lors de la création du compte (requis pour suppression)
  interests?: NnecxyCategory[]; // Préférences de l'utilisateur (Section 7)
  passwordHash?: string; // Haché de sécurité (Section 15, 17)
  isOnline?: boolean; // Présence en ligne pour la messagerie
  lastActive?: string;
}

export type VideoStatus = 'pending' | 'approved' | 'rejected' | 'deleted';

export interface Video {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    isVerified: boolean;
  };
  videoUrl: string;
  video_url?: string;
  thumbnailUrl: string;
  caption: string;
  category?: NnecxyCategory; // Catégorie obligatoire (Section 6)
  status?: VideoStatus; // Statut backend (Section 3: pending, approved, rejected, deleted)
  tags: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  isLiked?: boolean;
  isFollowed?: boolean;
  duration?: number;
  audioTitle?: string;
  sizeBytes?: number;
  allowDownload?: boolean;
  createdAt: string;
}

export interface VideoAnalytics {
  impressions: number;
  playsStarted: number;
  validViews: number;
  watchTimeSeconds: number;
  avgWatchPercentage: number;
  completions: number;
  likes: number;
  comments: number;
  shares: number;
  downloads: number;
  followsGenerated: number;
  unfollowsGenerated: number;
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'message';
  actor: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
  };
  videoId?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name?: string;
  avatar?: string;
  groupAdminId?: string;
  memberIds: string[];
  members: User[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface VideoDraft {
  uri: string;
  uris?: string[];
  file?: File;
  name: string;
  size: number;
  type: string;
  duration?: number;
  audioTrack?: string;
  audioVolume?: number;
  textOverlays?: Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
    fontSize: number;
  }>;
  stickers?: Array<{
    id: string;
    sticker: string;
    x: number;
    y: number;
    scale: number;
  }>;
  caption?: string;
  tags?: string[];
  category?: NnecxyCategory;
}

export interface PhoneMediaAsset {
  id: string;
  uri: string;
  localUri?: string;
  filename: string;
  mediaType: 'video' | 'photo';
  width?: number;
  height?: number;
  duration?: number;
  creationTime?: number;
  size?: number;
  thumbnail?: string;
  file?: File;
}

export type SupportedLanguage = 'fr' | 'en' | 'sw' | 'lng' | 'ha' | 'pt' | 'ar' | 'es' | 'zh' | 'hi';

export type AppThemeMode = 'light' | 'dark' | 'system';
