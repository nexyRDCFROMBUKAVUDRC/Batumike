import React, { useState, useEffect, useRef } from 'react';
import { Video, User } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { dataService } from '../services/dataService';
import { nativeMediaService } from '../services/nativeMediaService';
import { saveVideoToGallery } from '@/services/gallerySaver';
import { NnecxyLogo } from '../components/NnecxyLogo';
import { CommentsModal } from '../components/CommentsModal';
import { ReportModal } from '../components/ReportModal';
import { CommunityMembersModal } from '../components/CommunityMembersModal';
import {
  Heart,
  MessageCircle,
  Share2,
  Download,
  AlertCircle,
  Volume2,
  VolumeX,
  Plus,
  UserPlus,
  Check,
  Flag,
  Music,
  RefreshCw,
  Users,
  Play,
  Pause,
} from 'lucide-react';

interface FeedScreenProps {
  currentUser: User | null;
  targetVideoId?: string | null;
  onOpenCreatorProfile: (userId: string) => void;
  onOpenCreate: () => void;
  onOpenDirectChat?: (userId: string) => void;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({
  currentUser,
  targetVideoId,
  onOpenCreatorProfile,
  onOpenCreate,
  onOpenDirectChat,
}) => {
  const { theme } = useTheme();
  const { t } = useI18n();

  const [videos, setVideos] = useState<Video[]>(() => dataService.getFeedVideos(0, 15));
  const [activeIndex, setActiveIndex] = useState(() => {
    const saved = dataService.getLastFeedPosition();
    return saved.index || 0;
  });
  const [loadedVideos, setLoadedVideos] = useState<Record<string, boolean>>({});
  const [isMuted, setIsMuted] = useState(false);
  const userExplicitlyMuted = useRef(false);

  const [doubleTapHeart, setDoubleTapHeart] = useState<{ x: number; y: number } | null>(null);
  const [activeCommentVideoId, setActiveCommentVideoId] = useState<string | null>(null);
  const [activeReportVideoId, setActiveReportVideoId] = useState<string | null>(null);
  const [pausedVideoId, setPausedVideoId] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [downloadingVideoId, setDownloadingVideoId] = useState<string | null>(null);
  const [showCommunityModal, setShowCommunityModal] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const clickTimerRef = useRef<any>(null);
  const batchRef = useRef<number>(0);
  const previousActiveIndex = useRef<number>(-1);
  const hasScrolledToTarget = useRef<string | null>(null);

  const loadFeed = () => {
    batchRef.current = 0;
    const list = dataService.getFeedVideos(0, 15);
    setVideos(list);
  };

  const loadMoreVideos = () => {
    batchRef.current += 1;
    const nextBatch = dataService.getFeedVideos(batchRef.current, 10);
    if (nextBatch.length > 0) {
      setVideos((prev) => [...prev, ...nextBatch]);
    }
  };

  useEffect(() => {
    loadFeed();

    // Section 13: Restaurer la position de lecture après interaction ou retour au feed
    const savedPos = dataService.getLastFeedPosition();
    if (!targetVideoId && savedPos.videoId) {
      const idx = videos.findIndex((v) => v.id === savedPos.videoId);
      if (idx !== -1) {
        setActiveIndex(idx);
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = idx * containerRef.current.clientHeight;
          }
        }, 60);
      }
    }

    const handleCustomToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      if (customEvent.detail?.message) {
        setShareToast(customEvent.detail.message);
        setTimeout(() => setShareToast(null), 3500);
      }
    };

    window.addEventListener('nnecxy:toast', handleCustomToast);
    return () => {
      window.removeEventListener('nnecxy:toast', handleCustomToast);
    };
  }, []);

  // Deep Link handler: Scroll to target video if targetVideoId is provided (se lance une seule fois par cible)
  useEffect(() => {
    if (targetVideoId && hasScrolledToTarget.current !== targetVideoId && videos.length > 0) {
      const targetIndex = videos.findIndex((v) => v.id === targetVideoId);
      if (targetIndex !== -1) {
        hasScrolledToTarget.current = targetVideoId;
        setActiveIndex(targetIndex);
        if (containerRef.current) {
          containerRef.current.scrollTop = targetIndex * containerRef.current.clientHeight;
        }
      }
    }
  }, [targetVideoId, videos]);

  // Handle active video playback:
  // IMPORTANT: Reactions (like, follow, comments, etc.) MUST NEVER restart the video from 0!
  // Only reset currentTime to 0 when user actually scrolls to a DIFFERENT video.
  useEffect(() => {
    const isDifferentVideo = previousActiveIndex.current !== activeIndex;

    videoRefs.current.forEach((videoEl, index) => {
      if (!videoEl) return;
      if (index === activeIndex) {
        if (isDifferentVideo && videoEl.currentTime > 0.5) {
          videoEl.currentTime = 0;
        }
        videoEl.muted = isMuted;

        if ((isDifferentVideo || videoEl.paused) && pausedVideoId !== videos[activeIndex]?.id) {
          if (videoEl.paused) {
            const playPromise = videoEl.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {
                // Autoplay policy fallback: mute & play until first user interaction
                videoEl.muted = true;
                videoEl.play().catch(() => {});
              });
            }
          }
        }
      } else {
        // Video scrolled away: STOP IMMEDIATELY and silence sound completely
        videoEl.pause();
        videoEl.currentTime = 0;
        videoEl.muted = true;
      }
    });

    previousActiveIndex.current = activeIndex;
  }, [activeIndex, isMuted, pausedVideoId]);

  // Préchargement immédiat et proactif des prochaines vidéos fournies par l'algorithme backend
  useEffect(() => {
    if (videos.length === 0) return;
    for (let offset = 1; offset <= 2; offset++) {
      const targetIdx = activeIndex + offset;
      if (targetIdx < videos.length) {
        const targetEl = videoRefs.current[targetIdx];
        if (targetEl) {
          targetEl.preload = 'auto';
          if (targetEl.readyState < 2) {
            targetEl.load();
          }
        }
      }
    }
  }, [activeIndex, videos]);

  // Unmute upon first user interaction if user hasn't explicitly chosen to mute
  const handleUserInteraction = () => {
    if (!userExplicitlyMuted.current && isMuted) {
      setIsMuted(false);
      const currentVid = videoRefs.current[activeIndex];
      if (currentVid) {
        currentVid.muted = false;
      }
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    userExplicitlyMuted.current = nextMuted;
    setIsMuted(nextMuted);

    const activeEl = videoRefs.current[activeIndex];
    if (activeEl) {
      activeEl.muted = nextMuted;
    }
  };

  // Handle scroll detection for vertical snap
  const handleScroll = () => {
    handleUserInteraction();
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const newIndex = Math.round(scrollTop / clientHeight);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < videos.length) {
      setActiveIndex(newIndex);
      if (videos[newIndex]) {
        dataService.setLastFeedPosition(videos[newIndex].id, newIndex);
      }
      // Section 10: Infinite replenishment when approaching end
      if (newIndex >= videos.length - 3) {
        loadMoreVideos();
      }
    }
  };

  // At 100% video completion:
  // Immediately trigger next video playback without network waiting, smoothly scroll
  const handleVideoEnded = (index: number) => {
    const video = videos[index];
    if (video) {
      dataService.recordWatchEvent(video.id, video.duration || 15, true, currentUser?.id);
    }

    if (containerRef.current && videos.length > 0) {
      const nextIndex = (index + 1) % videos.length;
      const nextTop = nextIndex * containerRef.current.clientHeight;

      // Lancement immédiat sans attendre la connexion (vidéo déjà préchargée)
      const nextEl = videoRefs.current[nextIndex];
      if (nextEl) {
        nextEl.currentTime = 0;
        nextEl.muted = isMuted;
        const playPromise = nextEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            nextEl.muted = true;
            nextEl.play().catch(() => {});
          });
        }
      }

      containerRef.current.scrollTo({ top: nextTop, behavior: 'smooth' });
      setActiveIndex(nextIndex);
      if (nextIndex >= videos.length - 3) {
        loadMoreVideos();
      }
    }
  };

  // Like handler (Single tap button or double-tap video)
  const handleLike = (video: Video) => {
    const result = dataService.toggleLike(video.id);
    setVideos((prev) =>
      prev.map((v) =>
        v.id === video.id ? { ...v, isLiked: result.isLiked, likesCount: result.newCount } : v
      )
    );
  };

  // Trigger like and heart animation for double-tap / double-click
  const triggerHeartAndLike = (clientX: number, clientY: number, targetRect: DOMRect, video: Video) => {
    setDoubleTapHeart({
      x: clientX - targetRect.left,
      y: clientY - targetRect.top,
    });
    setTimeout(() => setDoubleTapHeart(null), 800);

    if (!video.isLiked) {
      handleLike(video);
    }
  };

  // Single tap: Play / Pause toggle
  // Double tap: Like + Heart animation
  const handleVideoAreaClick = (e: React.MouseEvent<HTMLElement>, video: Video, index: number) => {
    handleUserInteraction();
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (clickTimerRef.current) {
      // Double tap detected!
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      triggerHeartAndLike(clientX, clientY, rect, video);
    } else {
      // Single tap: toggle Play/Pause after brief debounce
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        const videoEl = videoRefs.current[index];
        if (videoEl) {
          if (videoEl.paused) {
            videoEl.play().catch(() => {});
            setPausedVideoId(null);
          } else {
            videoEl.pause();
            setPausedVideoId(video.id);
          }
        }
      }, 260);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLElement>, video: Video) => {
    handleUserInteraction();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    triggerHeartAndLike(e.clientX, e.clientY, rect, video);
  };

  // Follow creator toggle (Section 29)
  const handleFollow = (video: Video) => {
    if (!currentUser) return;
    const result = dataService.toggleFollow(video.userId);
    setVideos((prev) =>
      prev.map((v) =>
        v.userId === video.userId ? { ...v, isFollowed: result.isFollowed } : v
      )
    );
  };

  // Native Share handler (Système de partage natif)
  const handleShare = async (video: Video) => {
    dataService.recordShare(video.id);
    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, sharesCount: v.sharesCount + 1 } : v))
    );

    const result = await nativeMediaService.shareVideo({
      id: video.id,
      title: video.caption || 'NNECXY V1',
      description: video.caption,
      videoUrl: video.videoUrl,
    });

    setShareToast(result.message);
    setTimeout(() => setShareToast(null), 3000);
  };

  // Gallery Download handler (@capacitor/filesystem + @capacitor/media)
  const handleDownload = async (video: Video) => {
    // Section 15: Vérification de l'autorisation de téléchargement de l'auteur
    if (video.allowDownload === false) {
      setShareToast('Le téléchargement est désactivé pour cette vidéo.');
      setTimeout(() => setShareToast(null), 3000);
      return;
    }

    setDownloadingVideoId(video.id);
    try {
      const videoSource = (video as unknown as Record<string, string>).video_url || video.videoUrl;
      await saveVideoToGallery(videoSource);
      dataService.recordDownload(video.id);
    } catch {
      setShareToast('Erreur lors du téléchargement. Veuillez réessayer.');
      setTimeout(() => setShareToast(null), 3500);
    } finally {
      setDownloadingVideoId(null);
    }
  };

  // Ensure feed is immediately hydrated without flashing empty notice
  if (videos.length === 0) {
    const freshVideos = dataService.getFeedVideos(0, 15);
    if (freshVideos.length > 0) {
      setVideos(freshVideos);
      return null;
    }
  }

  return (
    <div
      id="feed-screen"
      ref={containerRef}
      onScroll={handleScroll}
      className="relative w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none bg-black select-none"
      style={{ height: '100%', scrollSnapType: 'y mandatory' }}
    >
      {/* Toast Notice */}
      {shareToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-black/90 backdrop-blur-md border border-blue-500/40 rounded-full text-xs font-semibold text-white shadow-xl animate-fade-in">
          {shareToast}
        </div>
      )}

      {videos.map((video, index) => {
        const isActive = index === activeIndex;
        const isOwnVideo = currentUser?.id === video.userId;
        const videoSource = (video as any).video_url || video.videoUrl;

        return (
          <div
            key={video.id}
            id={`feed-item-${video.id}`}
            className="relative w-full h-full shrink-0 snap-start flex items-center justify-center overflow-hidden bg-black"
            style={{
              width: '100%',
              height: '100%',
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
            {/* Real HTML5 Video Player - 100% screen occupation */}
            <video
              ref={(el) => {
                videoRefs.current[index] = el;
              }}
              src={`${videoSource}#t=0.001`}
              className="w-full h-full object-cover cursor-pointer select-none"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 0,
              }}
              loop={false}
              playsInline
              preload={index === activeIndex || index === activeIndex + 1 ? 'auto' : 'metadata'}
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
              muted={isMuted}
              onEnded={() => handleVideoEnded(index)}
              onClick={(e) => handleVideoAreaClick(e, video, index)}
              onDoubleClick={(e) => handleDoubleClick(e, video)}
              {...({ 'webkit-playsinline': 'true', 'x5-playsinline': 'true' } as any)}
            />

            {/* Custom Play/Pause Overlay (No native Android controls) */}
            {pausedVideoId === video.id && isActive && (
              <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none animate-scale-up">
                <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-2xl">
                  <Play size={32} className="ml-1 fill-white text-white" />
                </div>
              </div>
            )}

            {/* Top Bar Controls */}
            <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
              {/* Filigrane discret et transparent NNECXY (En haut à gauche) */}
              <div className="pointer-events-auto flex items-center gap-1.5 px-2 py-1 select-none opacity-80 hover:opacity-100 transition-opacity">
                <NnecxyLogo size="sm" watermark={true} transparent={true} />
                <span className="text-[11px] font-extrabold tracking-widest text-white/75 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                  NNECXY
                </span>
              </div>

              {/* Top Right Controls: Membres de NNECXY + Volume */}
              <div className="pointer-events-auto flex items-center gap-2">
                {/* Button: Découvrir tous les membres inscrits */}
                <button
                  id="btn-feed-community-members"
                  onClick={() => setShowCommunityModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/75 active:scale-95 transition-all border border-white/20 shadow-lg group"
                  title="Voir tous les membres NNECXY"
                >
                  <Users size={14} className="text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold">Membres</span>
                </button>

                {/* Sound Mute / Unmute Button */}
                <button
                  id="btn-feed-mute-toggle"
                  onClick={handleToggleMute}
                  className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/75 active:scale-95 transition-all border border-white/20 shadow-lg"
                  aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                >
                  {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} className="text-blue-400" />}
                </button>
              </div>
            </div>

            {/* Double Tap Heart Animation */}
            {doubleTapHeart && isActive && (
              <div
                className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-ping"
                style={{ left: doubleTapHeart.x, top: doubleTapHeart.y }}
              >
                <Heart size={80} className="fill-red-600 text-red-600 drop-shadow-2xl" />
              </div>
            )}

            {/* Gradient shadow for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85 pointer-events-none" />

            {/* Right Action Buttons Sidebar */}
            <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-4">
              {/* Creator Avatar with NNECXY Follow Badge */}
              <div className="relative">
                <img
                  src={video.user.avatar}
                  alt={video.user.name}
                  referrerPolicy="no-referrer"
                  onClick={() => onOpenCreatorProfile(video.userId)}
                  className="w-11 h-11 rounded-full object-cover border-2 border-white cursor-pointer active:scale-95 transition-transform"
                />
                {!isOwnVideo && (
                  <button
                    id={`btn-follow-avatar-${video.userId}`}
                    onClick={() => handleFollow(video)}
                    title={video.isFollowed ? t.following : t.follow}
                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-white transition-all shadow-md active:scale-90 ${
                      video.isFollowed
                        ? 'bg-black border-2 border-white text-white'
                        : 'bg-blue-600 hover:bg-blue-700 ring-2 ring-black'
                    }`}
                  >
                    {video.isFollowed ? <Check size={11} className="text-white" /> : <Plus size={12} />}
                  </button>
                )}
              </div>

              {/* Like Button */}
              <button
                id={`btn-like-${video.id}`}
                onClick={() => handleLike(video)}
                className="flex flex-col items-center gap-1 group active:scale-80 transition-transform"
              >
                <div
                  className={`w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition-colors ${
                    video.isLiked ? 'text-red-600' : 'text-white group-hover:text-red-600'
                  }`}
                >
                  <Heart
                    size={24}
                    className={video.isLiked ? 'fill-red-600 text-red-600' : ''}
                  />
                </div>
                <span className="text-[11px] font-bold text-white drop-shadow">
                  {video.likesCount}
                </span>
              </button>

              {/* Comments Button */}
              <button
                id={`btn-comments-${video.id}`}
                onClick={() => setActiveCommentVideoId(video.id)}
                className="flex flex-col items-center gap-1 group active:scale-80 transition-transform"
              >
                <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white group-hover:text-blue-400">
                  <MessageCircle size={24} />
                </div>
                <span className="text-[11px] font-bold text-white drop-shadow">
                  {video.commentsCount}
                </span>
              </button>

              {/* Share Button */}
              <button
                id={`btn-share-${video.id}`}
                onClick={() => handleShare(video)}
                className="flex flex-col items-center gap-1 group active:scale-80 transition-transform"
              >
                <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white group-hover:text-white">
                  <Share2 size={22} />
                </div>
                <span className="text-[11px] font-bold text-white drop-shadow">
                  {video.sharesCount}
                </span>
              </button>

              {/* Download Button (Native Gallery Download) */}
              <button
                id={`btn-download-${video.id}`}
                onClick={() => handleDownload(video)}
                disabled={downloadingVideoId === video.id}
                className="flex flex-col items-center gap-1 group active:scale-80 transition-transform disabled:opacity-70"
                title="Télécharger dans la galerie photos"
              >
                <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white group-hover:text-blue-400">
                  {downloadingVideoId === video.id ? (
                    <RefreshCw size={20} className="animate-spin text-blue-400" />
                  ) : (
                    <Download size={20} />
                  )}
                </div>
                <span className="text-[10px] font-semibold text-white/90 drop-shadow">
                  {downloadingVideoId === video.id ? 'En cours...' : 'Télécharger'}
                </span>
              </button>

              {/* Report Button (Danger zone: Rouge) */}
              <button
                id={`btn-report-${video.id}`}
                onClick={() => setActiveReportVideoId(video.id)}
                className="p-2 text-white/60 hover:text-red-500 active:scale-90 transition-transform"
                title={t.report}
              >
                <Flag size={16} />
              </button>
            </div>

            {/* Bottom Left Info: Creator name, Follow button, caption, audio track */}
            <div className="absolute left-4 bottom-6 right-16 z-20 text-white space-y-2">
              {/* Category badge (Section 6) */}
              {video.category && (
                <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white shadow-sm">
                  <span>{video.category}</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 flex-wrap">
                <div
                  onClick={() => onOpenCreatorProfile(video.userId)}
                  className="inline-flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 transition-transform"
                >
                  <span className="font-bold text-sm drop-shadow">{video.user.name}</span>
                  {video.user.isVerified && (
                    <span className="w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[8px] font-black shadow-xs">
                      ✓
                    </span>
                  )}
                  <span className="text-xs text-white/90 font-medium drop-shadow">
                    @{video.user.handle}
                  </span>
                </div>

                {/* NNECXY Follow (Suivre / Abonné) Button - Action Button: Bleu */}
                {!isOwnVideo && (
                  <button
                    id={`btn-nnecxy-follow-${video.userId}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollow(video);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-md active:scale-95 select-none ${
                      video.isFollowed
                        ? 'bg-black text-white border-2 border-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {video.isFollowed ? (
                      <>
                        <Check size={13} className="text-white stroke-[2.5]" />
                        <span>{t.following}</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={13} className="text-white stroke-[2.2]" />
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
      })}

      {/* Comments Modal Bottom Sheet */}
      {activeCommentVideoId && (
        <CommentsModal
          videoId={activeCommentVideoId}
          isOpen={Boolean(activeCommentVideoId)}
          onClose={() => {
            const commentCount = dataService.getComments(activeCommentVideoId).length;
            setVideos((prev) =>
              prev.map((v) =>
                v.id === activeCommentVideoId ? { ...v, commentsCount: commentCount } : v
              )
            );
            setActiveCommentVideoId(null);
          }}
          currentUser={currentUser}
        />
      )}

      {/* Report Modal */}
      {activeReportVideoId && (
        <ReportModal
          targetId={activeReportVideoId}
          targetType="video"
          isOpen={Boolean(activeReportVideoId)}
          onClose={() => setActiveReportVideoId(null)}
          reporterId={currentUser?.id || 'guest'}
        />
      )}

      {/* Community Members Full List Modal */}
      {showCommunityModal && (
        <CommunityMembersModal
          isOpen={showCommunityModal}
          currentUser={currentUser}
          onClose={() => setShowCommunityModal(false)}
          onOpenCreatorProfile={(userId) => {
            setShowCommunityModal(false);
            onOpenCreatorProfile(userId);
          }}
          onOpenDirectChat={(userId) => {
            setShowCommunityModal(false);
            if (onOpenDirectChat) {
              onOpenDirectChat(userId);
            }
          }}
        />
      )}
    </div>
  );
};
