import React, { useState, useEffect } from 'react';
import { User, Video } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { dataService } from '../services/dataService';
import { saveVideoToGallery } from '@/services/gallerySaver';
import { ArrowLeft, CheckCircle2, Heart, Play, UserCheck, UserPlus, Download } from 'lucide-react';

interface CreatorProfileScreenProps {
  userId: string;
  currentUser: User | null;
  onBack: () => void;
  onNavigateToFeed?: (targetVideoId?: string) => void;
}

export const CreatorProfileScreen: React.FC<CreatorProfileScreenProps> = ({
  userId,
  currentUser,
  onBack,
  onNavigateToFeed,
}) => {
  const { theme } = useTheme();
  const { t } = useI18n();

  const [creator, setCreator] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isFollowed, setIsFollowed] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const loadData = () => {
    const u = dataService.getUserById(userId);
    if (u) {
      setCreator({ ...u });
      const userVids = dataService.getUserVideos(userId);
      setVideos(userVids);
      if (userVids.length > 0 && userVids[0].isFollowed !== undefined) {
        setIsFollowed(userVids[0].isFollowed);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  if (!creator) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xs font-semibold" style={{ color: theme.text }}>Créateur introuvable.</p>
        <button onClick={onBack} className="mt-4 text-xs font-bold text-blue-600">
          {t.back}
        </button>
      </div>
    );
  }

  const handleFollowToggle = () => {
    if (!currentUser) return;
    const res = dataService.toggleFollow(userId);
    setIsFollowed(res.isFollowed);
    loadData();
  };

  const isSelf = currentUser?.id === creator.id;

  return (
    <div
      id="creator-profile-screen"
      className="flex flex-col h-full w-full max-w-md mx-auto select-none overflow-y-auto scrollbar-none"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-20 backdrop-blur-md"
        style={{ borderColor: theme.border, backgroundColor: theme.background + 'EE' }}
      >
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:opacity-80 active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} style={{ color: theme.text }} />
        </button>
        <span className="font-extrabold text-base">@{creator.handle}</span>
        <div className="w-8" />
      </div>

      {/* Creator Info */}
      <div className="p-4 flex flex-col items-center text-center space-y-3">
        <img
          src={creator.avatar}
          alt={creator.name}
          referrerPolicy="no-referrer"
          className="w-20 h-20 rounded-full object-cover border-2 shadow-lg"
          style={{ borderColor: theme.accent }}
        />

        <div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-lg font-bold">
              {creator.name} {creator.surname}
            </h1>
            {creator.isVerified && (
              <CheckCircle2 size={16} className="text-blue-500 fill-blue-500 text-white" />
            )}
          </div>
          <p className="text-xs font-mono">@{creator.handle}</p>
        </div>

        <p className="text-xs leading-relaxed max-w-xs">{creator.bio}</p>

        {/* Follow button if not self */}
        {!isSelf && (
          <button
            onClick={handleFollowToggle}
            className={`px-6 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              isFollowed
                ? 'border-2 border-blue-600 bg-transparent'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            style={isFollowed ? { color: theme.text } : {}}
          >
            {isFollowed ? (
              <>
                <UserCheck size={14} />
                <span>{t.following}</span>
              </>
            ) : (
              <>
                <UserPlus size={14} />
                <span>{t.follow}</span>
              </>
            )}
          </button>
        )}

        {/* Real Stats */}
        <div
          className="w-full py-3 px-4 rounded-2xl border flex items-center justify-around"
          style={{ backgroundColor: theme.card, borderColor: theme.border }}
        >
          <div className="flex flex-col items-center">
            <span className="text-base font-extrabold">{creator.followingCount}</span>
            <span className="text-[10px] uppercase font-semibold">
              {t.subscriptions}
            </span>
          </div>
          <div className="w-[1px] h-6" style={{ backgroundColor: theme.border }} />
          <div className="flex flex-col items-center">
            <span className="text-base font-extrabold">{creator.followersCount}</span>
            <span className="text-[10px] uppercase font-semibold">
              {t.followers}
            </span>
          </div>
          <div className="w-[1px] h-6" style={{ backgroundColor: theme.border }} />
          <div className="flex flex-col items-center">
            <span className="text-base font-extrabold">{videos.length}</span>
            <span className="text-[10px] uppercase font-semibold">Vidéos</span>
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="p-2 flex-1 border-t pb-28" style={{ borderColor: theme.border }}>
        <h3 className="px-2 py-1 text-xs font-bold uppercase tracking-wider">
          Publications ({videos.length})
        </h3>
        {videos.length === 0 ? (
          <div className="py-12 text-center text-xs" style={{ color: theme.text }}>
            Ce créateur n'a pas encore publié de vidéo.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {videos.map((video) => (
              <div
                key={video.id}
                onClick={() => {
                  if (onNavigateToFeed) {
                    onNavigateToFeed(video.id);
                  } else {
                    setSelectedVideo(video);
                  }
                }}
                className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black border cursor-pointer group"
                style={{ borderColor: theme.border }}
                title="Lire directement la vidéo"
              >
                <video
                  src={`${video.videoUrl}#t=0.001`}
                  preload="metadata"
                  muted
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-[10px] text-white font-medium pointer-events-none">
                  <Play size={10} className="fill-white" />
                  <span>{video.viewsCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
          <div
            className="relative w-full max-w-sm h-[75vh] bg-black rounded-3xl overflow-hidden border flex flex-col shadow-2xl"
            style={{ borderColor: theme.border }}
          >
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between">
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                id={`btn-creator-download-${selectedVideo.id}`}
                onClick={() => saveVideoToGallery(selectedVideo.videoUrl)}
                className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-blue-600 active:scale-95 transition-all"
                title="Enregistrer dans la galerie"
              >
                <Download size={16} />
              </button>
            </div>
            <video
              src={selectedVideo.videoUrl}
              autoPlay
              controls
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent text-white">
              <p className="text-xs font-semibold">{selectedVideo.caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
