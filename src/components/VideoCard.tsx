import React, { useState, useRef } from 'react';
import { Video, User } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { saveVideoToGallery } from '@/services/gallerySaver';
import {
  Heart,
  MessageCircle,
  Share2,
  Download,
  RefreshCw,
  Music,
  Check,
  UserPlus,
  Flag,
  Play,
} from 'lucide-react';

interface VideoCardProps {
  video: Video;
  currentUser: User | null;
  isActive?: boolean;
  onLike?: (video: Video) => void;
  onComment?: (video: Video) => void;
  onShare?: (video: Video) => void;
  onFollow?: (video: Video) => void;
  onOpenCreator?: (userId: string) => void;
  onReport?: (video: Video) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  currentUser,
  isActive = false,
  onLike,
  onComment,
  onShare,
  onFollow,
  onOpenCreator,
  onReport,
}) => {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const clickTimeoutRef = useRef<any>(null);

  // Supports both video.videoUrl and video.video_url format
  const videoSourceUrl = (video as unknown as Record<string, string>).video_url || video.videoUrl;

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await saveVideoToGallery(videoSourceUrl);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleVideoClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      // Double tap -> Like
      onLike?.(video);
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play().catch(() => {});
            setIsPaused(false);
          } else {
            videoRef.current.pause();
            setIsPaused(true);
          }
        }
      }, 260);
    }
  };

  const isOwnVideo = currentUser?.id === video.userId;

  return (
    <div
      id={`video-card-${video.id}`}
      className="relative shrink-0 select-none overflow-hidden bg-black"
      style={{
        width: '100vw',
        height: '100dvh',
        background: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        margin: 0,
        padding: 0,
      }}
    >
      <video
        ref={videoRef}
        src={videoSourceUrl}
        poster={video.thumbnailUrl}
        className="cursor-pointer select-none"
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          borderRadius: 0,
        }}
        playsInline
        preload="auto"
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onClick={handleVideoClick}
        {...({ 'webkit-playsinline': 'true', 'x5-playsinline': 'true' } as any)}
      />

      {/* Custom Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none animate-scale-up">
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-2xl">
            <Play size={32} className="ml-1 fill-white text-white" />
          </div>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85 pointer-events-none" />

      {/* Right Action Sidebar */}
      <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-4">
        {/* Creator Avatar */}
        <div className="relative">
          <img
            src={video.user.avatar}
            alt={video.user.name}
            referrerPolicy="no-referrer"
            onClick={() => onOpenCreator?.(video.userId)}
            className="w-11 h-11 rounded-full object-cover border-2 border-white cursor-pointer shadow-lg active:scale-95 transition-transform"
          />
        </div>

        {/* Like */}
        <button
          onClick={() => onLike?.(video)}
          className="flex flex-col items-center gap-1 group active:scale-80 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
            <Heart size={24} className={video.isLiked ? 'fill-red-600 text-red-600' : 'text-white'} />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow">{video.likesCount}</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => onComment?.(video)}
          className="flex flex-col items-center gap-1 group active:scale-80 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
            <MessageCircle size={22} />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow">{video.commentsCount}</span>
        </button>

        {/* Share */}
        <button
          onClick={() => onShare?.(video)}
          className="flex flex-col items-center gap-1 group active:scale-80 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
            <Share2 size={22} />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow">{video.sharesCount}</span>
        </button>

        {/* DOWNLOAD / SAVE BUTTON (Save directly to phone Gallery) */}
        <button
          id={`btn-card-download-${video.id}`}
          onClick={handleDownloadClick}
          disabled={isDownloading}
          className="flex flex-col items-center gap-1 group active:scale-80 transition-transform disabled:opacity-70"
          title="Enregistrer dans la galerie photos"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white group-hover:text-blue-400">
            {isDownloading ? (
              <RefreshCw size={20} className="animate-spin text-blue-400" />
            ) : (
              <Download size={20} />
            )}
          </div>
          <span className="text-[10px] font-semibold text-white/90 drop-shadow">
            {isDownloading ? 'En cours...' : 'Télécharger'}
          </span>
        </button>

        {/* Report */}
        {onReport && (
          <button
            onClick={() => onReport(video)}
            className="p-2 text-white/60 hover:text-red-500 active:scale-90 transition-transform"
            title={t.report}
          >
            <Flag size={16} />
          </button>
        )}
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-4 left-4 right-16 z-20 space-y-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span
            onClick={() => onOpenCreator?.(video.userId)}
            className="font-extrabold text-sm text-white drop-shadow cursor-pointer hover:underline"
          >
            @{video.user.handle}
          </span>

          {!isOwnVideo && onFollow && (
            <button
              onClick={() => onFollow(video)}
              className={`text-[11px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1 active:scale-95 transition-all ${
                video.isFollowed ? 'bg-black/60 text-white border border-white/30' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {video.isFollowed ? (
                <>
                  <Check size={13} className="text-white" />
                  <span>{t.following}</span>
                </>
              ) : (
                <>
                  <UserPlus size={13} className="text-white" />
                  <span>{t.follow}</span>
                </>
              )}
            </button>
          )}
        </div>

        <p className="text-xs leading-relaxed line-clamp-3 text-white/95 drop-shadow">
          {video.caption}
        </p>

        {video.audioTitle && (
          <div className="flex items-center gap-2 text-[11px] text-white/80 font-medium">
            <Music size={13} className="text-blue-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="truncate max-w-[200px]">{video.audioTitle}</span>
          </div>
        )}
      </div>
    </div>
  );
};
