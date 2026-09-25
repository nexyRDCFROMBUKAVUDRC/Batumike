import React, { useState } from 'react';
import { User, Video } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { dataService } from '../services/dataService';
import { saveVideoToGallery } from '@/services/gallerySaver';
import { MemberActionModal } from '../components/MemberActionModal';
import {
  Search as SearchIcon,
  X,
  CheckCircle2,
  Heart,
  Play,
  ArrowLeft,
  UserPlus,
  Check,
  MessageCircle,
  Users,
  Download,
} from 'lucide-react';

interface SearchScreenProps {
  currentUser?: User | null;
  onOpenCreator: (userId: string) => void;
  onBack: () => void;
  onOpenDirectChat?: (userId: string) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  currentUser,
  onOpenCreator,
  onBack,
  onOpenDirectChat,
}) => {
  const { theme } = useTheme();
  const { t } = useI18n();

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'users' | 'videos'>('all');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({});
  const [actionMember, setActionMember] = useState<User | null>(null);

  const results = dataService.search(query);
  const allUsers = dataService.getAllUsers();

  const handleToggleFollow = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (!currentUser) return;
    const res = dataService.toggleFollow(userId);
    setFollowedMap((prev) => ({ ...prev, [userId]: res.isFollowed }));
  };

  const isUserFollowed = (user: User) => {
    if (followedMap[user.id] !== undefined) return followedMap[user.id];
    return Boolean(user.isFollowed);
  };

  return (
    <div
      id="search-screen"
      className="flex flex-col h-full w-full max-w-md mx-auto select-none overflow-hidden"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* Header Search Input */}
      <div
        className="p-3 border-b flex items-center gap-2 sticky top-0 z-20"
        style={{ borderColor: theme.border, backgroundColor: theme.background }}
      >
        <button onClick={onBack} className="p-1 rounded-full hover:opacity-80">
          <ArrowLeft size={18} style={{ color: theme.text }} />
        </button>

        <div
          className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full border-2 text-xs font-medium"
          style={{ backgroundColor: theme.card, borderColor: theme.border }}
        >
          <SearchIcon size={16} style={{ color: theme.text }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher créateurs, vidéos, hashtags..."
            className="flex-1 bg-transparent focus:outline-none"
            style={{ color: theme.text }}
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="hover:opacity-80" style={{ color: theme.text }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        className="flex px-4 py-2 border-b-2 gap-2 text-xs font-bold"
        style={{ borderColor: theme.border }}
      >
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-full transition-all ${
            activeFilter === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'border-2'
          }`}
          style={activeFilter === 'all' ? undefined : { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }}
        >
          Tout
        </button>
        <button
          onClick={() => setActiveFilter('users')}
          className={`px-3 py-1.5 rounded-full transition-all ${
            activeFilter === 'users'
              ? 'bg-blue-600 text-white shadow-md'
              : 'border-2'
          }`}
          style={activeFilter === 'users' ? undefined : { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }}
        >
          Créateurs ({results.users.length})
        </button>
        <button
          onClick={() => setActiveFilter('videos')}
          className={`px-3 py-1.5 rounded-full transition-all ${
            activeFilter === 'videos'
              ? 'bg-blue-600 text-white shadow-md'
              : 'border-2'
          }`}
          style={activeFilter === 'videos' ? undefined : { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }}
        >
          Vidéos ({results.videos.length})
        </button>
      </div>

      {/* Results Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin pb-28">
        {!query.trim() ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-500 uppercase tracking-wider">
              <Users size={16} />
              <span>Personnes suggérées (Membres NNECXY)</span>
            </div>

            <div className="space-y-2">
              {allUsers.slice(0, 8).map((user) => {
                const followed = isUserFollowed(user);
                const isMe = currentUser?.id === user.id;

                return (
                  <div
                    key={user.id}
                    id={`suggested-user-${user.id}`}
                    onClick={() => setActionMember(user)}
                    className="p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer hover:border-blue-500/50 active:scale-98 transition-all"
                    style={{ backgroundColor: theme.card, borderColor: theme.border }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-full object-cover border-2 border-blue-500/20"
                        />
                        {user.isVerified && (
                          <CheckCircle2
                            size={12}
                            className="absolute -bottom-0.5 -right-0.5 text-blue-500 fill-blue-500 text-white"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold truncate">
                            {user.name} {user.surname}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-600/20 text-blue-500">
                              Vous
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-blue-500 truncate">
                          @{user.handle}
                        </p>
                        {user.bio && (
                          <p className="text-[10px] opacity-70 truncate mt-0.5">
                            {user.bio}
                          </p>
                        )}
                        <p className="text-[10px] opacity-60 mt-0.5">
                          {user.followersCount.toLocaleString()} abonnés
                        </p>
                      </div>
                    </div>

                    {!isMe && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => handleToggleFollow(e, user.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 active:scale-95 transition-all ${
                            followed
                              ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow'
                          }`}
                        >
                          {followed ? (
                            <>
                              <Check size={12} />
                              <span>Suivi</span>
                            </>
                          ) : (
                            <>
                              <UserPlus size={12} />
                              <span>Suivre</span>
                            </>
                          )}
                        </button>

                        {onOpenDirectChat && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDirectChat(user.id);
                            }}
                            className="p-2 rounded-full bg-blue-600/15 text-blue-500 hover:bg-blue-600/25 active:scale-95"
                            title="Écrire un message"
                          >
                            <MessageCircle size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : results.users.length === 0 && results.videos.length === 0 ? (
          <div className="py-16 text-center text-xs font-semibold" style={{ color: theme.text }}>
            Aucun résultat pour "{query}".
          </div>
        ) : (
          <>
            {/* Users section */}
            {(activeFilter === 'all' || activeFilter === 'users') && results.users.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500">
                  Créateurs ({results.users.length})
                </h3>
                <div className="space-y-2">
                  {results.users.map((user) => {
                    const followed = isUserFollowed(user);
                    const isMe = currentUser?.id === user.id;

                    return (
                      <div
                        key={user.id}
                        id={`search-user-${user.id}`}
                        onClick={() => setActionMember(user)}
                        className="p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer hover:border-blue-500/50 active:scale-98 transition-all"
                        style={{ backgroundColor: theme.card, borderColor: theme.border }}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              referrerPolicy="no-referrer"
                              className="w-11 h-11 rounded-full object-cover border-2 border-blue-500/20"
                            />
                            {user.isVerified && (
                              <CheckCircle2
                                size={12}
                                className="absolute -bottom-0.5 -right-0.5 text-blue-500 fill-blue-500 text-white"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold truncate">
                                {user.name} {user.surname}
                              </span>
                              {isMe && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-600/20 text-blue-500">
                                  Vous
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-blue-500 truncate block">
                              @{user.handle}
                            </span>
                            {user.bio && (
                              <p className="text-[10px] opacity-70 truncate mt-0.5">
                                {user.bio}
                              </p>
                            )}
                            <p className="text-[10px] opacity-60 mt-0.5">
                              {user.followersCount.toLocaleString()} abonnés
                            </p>
                          </div>
                        </div>

                        {!isMe && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={(e) => handleToggleFollow(e, user.id)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 active:scale-95 transition-all ${
                                followed
                                  ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow'
                              }`}
                            >
                              {followed ? (
                                <>
                                  <Check size={12} />
                                  <span>Suivi</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus size={12} />
                                  <span>Suivre</span>
                                </>
                              )}
                            </button>

                            {onOpenDirectChat && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenDirectChat(user.id);
                                }}
                                className="p-2 rounded-full bg-blue-600/15 text-blue-500 hover:bg-blue-600/25 active:scale-95"
                                title="Écrire un message"
                              >
                                <MessageCircle size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Videos section */}
            {(activeFilter === 'all' || activeFilter === 'videos') && results.videos.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.text }}>
                  Vidéos
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {results.videos.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => setSelectedVideo(vid)}
                      className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black cursor-pointer group shadow border-2"
                      style={{ borderColor: theme.border }}
                    >
                      <img
                        src={vid.thumbnailUrl}
                        alt={vid.caption}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-[10px] text-white font-bold">
                        <Play size={10} className="fill-white" />
                        <span>{vid.viewsCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Video Modal if opened from search */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-fade-in">
          <div className="relative w-full max-w-sm h-[75vh] bg-black rounded-3xl overflow-hidden border-2 border-blue-600 flex flex-col shadow-2xl">
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between">
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 bg-blue-600 rounded-full text-white hover:opacity-90 active:scale-95 transition-all"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                id={`btn-search-download-${selectedVideo.id}`}
                onClick={() => saveVideoToGallery(selectedVideo.videoUrl)}
                className="p-2 bg-black/70 backdrop-blur-md rounded-full text-white hover:bg-blue-600 active:scale-95 transition-all"
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

      {/* Member Action Modal */}
      {actionMember && (
        <MemberActionModal
          isOpen={Boolean(actionMember)}
          member={actionMember}
          currentUser={currentUser || null}
          onClose={() => setActionMember(null)}
          onOpenCreatorProfile={(userId) => {
            setActionMember(null);
            onOpenCreator(userId);
          }}
          onOpenDirectChat={(userId) => {
            setActionMember(null);
            if (onOpenDirectChat) {
              onOpenDirectChat(userId);
            }
          }}
          onFollowChanged={(userId, isFollowed) => {
            setFollowedMap((prev) => ({ ...prev, [userId]: isFollowed }));
          }}
        />
      )}
    </div>
  );
};
