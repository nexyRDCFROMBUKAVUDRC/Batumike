import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { dataService } from '../services/dataService';
import {
  X,
  Search,
  CheckCircle2,
  UserPlus,
  Check,
  MessageCircle,
  Users,
} from 'lucide-react';

interface CommunityMembersModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onOpenCreatorProfile: (userId: string) => void;
  onOpenDirectChat: (userId: string) => void;
}

export const CommunityMembersModal: React.FC<CommunityMembersModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onOpenCreatorProfile,
  onOpenDirectChat,
}) => {
  const { theme, isDark } = useTheme();
  const { t } = useI18n();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadUsers = () => {
    const list = dataService.getAllUsers();
    setAllUsers(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsers = allUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.surname.toLowerCase().includes(q) ||
      u.handle.toLowerCase().includes(q) ||
      (u.bio && u.bio.toLowerCase().includes(q))
    );
  });

  const handleFollowToggle = (userId: string) => {
    if (!currentUser) return;
    const result = dataService.toggleFollow(userId);
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            isFollowed: result.isFollowed,
            followersCount: result.isFollowed
              ? u.followersCount + 1
              : Math.max(0, u.followersCount - 1),
          };
        }
        return u;
      })
    );
  };

  return (
    <div
      id="community-members-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        id="community-members-modal"
        className="w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-md rounded-none sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden border"
        style={{
          backgroundColor: theme.background,
          borderColor: theme.border,
          color: theme.text,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3.5 border-b sticky top-0 z-10"
          style={{ borderColor: theme.border, backgroundColor: theme.card }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600/15 text-blue-500 flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight">
                Membres NNECXY
              </h2>
              <p className="text-[11px] opacity-70">
                {allUsers.length} créateurs et utilisateurs inscrits
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:opacity-80 active:scale-95"
            style={{ backgroundColor: isDark ? '#262626' : '#F3F4F6' }}
            aria-label="Fermer"
          >
            <X size={18} style={{ color: theme.text }} />
          </button>
        </div>

        {/* Search bar */}
        <div
          className="p-3 border-b"
          style={{ borderColor: theme.border, backgroundColor: theme.background }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.card,
            }}
          >
            <Search size={15} className="text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un membre par nom ou @handle..."
              className="flex-1 bg-transparent focus:outline-none"
              style={{ color: theme.text }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-neutral-400 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Members List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
          {filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-xs opacity-60">
              Aucun membre trouvé pour "{searchQuery}".
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isMe = currentUser?.id === user.id;

              return (
                <div
                  key={user.id}
                  id={`member-item-${user.id}`}
                  className="p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all hover:border-blue-500/50"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  }}
                >
                  {/* User info clickable to profile */}
                  <div
                    onClick={() => {
                      onOpenCreatorProfile(user.id);
                      onClose();
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover border-2 border-blue-500/20 group-hover:border-blue-500 transition-colors"
                      />
                      {user.isVerified && (
                        <CheckCircle2
                          size={13}
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
                        <p className="text-[10px] opacity-70 truncate mt-0.5 max-w-[180px]">
                          {user.bio}
                        </p>
                      )}
                      <p className="text-[10px] opacity-60 mt-0.5">
                        {user.followersCount.toLocaleString()} abonnés
                      </p>
                    </div>
                  </div>

                  {/* Actions: Suivre & Écrire */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isMe && (
                      <>
                        <button
                          id={`btn-member-follow-${user.id}`}
                          onClick={() => handleFollowToggle(user.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${
                            user.isFollowed
                              ? 'bg-neutral-800 text-white border border-neutral-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow'
                          }`}
                        >
                          {user.isFollowed ? (
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

                        <button
                          id={`btn-member-chat-${user.id}`}
                          onClick={() => {
                            onOpenDirectChat(user.id);
                            onClose();
                          }}
                          className="p-2 rounded-full bg-blue-600/15 text-blue-500 hover:bg-blue-600/25 active:scale-95 transition-all"
                          title="Écrire un message"
                          aria-label={`Écrire à ${user.name}`}
                        >
                          <MessageCircle size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
