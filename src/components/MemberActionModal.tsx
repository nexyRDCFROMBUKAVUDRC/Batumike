import React from 'react';
import { User } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { dataService } from '../services/dataService';
import {
  UserPlus,
  UserCheck,
  MessageCircle,
  ExternalLink,
  X,
  CheckCircle2,
  Share2,
} from 'lucide-react';

interface MemberActionModalProps {
  isOpen: boolean;
  member: User | null;
  currentUser: User | null;
  onClose: () => void;
  onOpenCreatorProfile: (userId: string) => void;
  onOpenDirectChat: (userId: string) => void;
  onFollowChanged?: (userId: string, isFollowed: boolean) => void;
}

export const MemberActionModal: React.FC<MemberActionModalProps> = ({
  isOpen,
  member,
  currentUser,
  onClose,
  onOpenCreatorProfile,
  onOpenDirectChat,
  onFollowChanged,
}) => {
  const { theme, isDark } = useTheme();
  const { t } = useI18n();

  if (!isOpen || !member) return null;

  const isMe = currentUser?.id === member.id;
  const isFollowed = Boolean(member.isFollowed);

  const handleToggleFollow = () => {
    if (!currentUser) return;
    const result = dataService.toggleFollow(member.id);
    onFollowChanged?.(member.id, result.isFollowed);
  };

  return (
    <div
      id="member-action-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        id="member-action-modal"
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 border shadow-2xl space-y-4"
        style={{
          backgroundColor: theme.background,
          borderColor: theme.border,
          color: theme.text,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with avatar & handle */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                referrerPolicy="no-referrer"
              />
              {member.isVerified && (
                <CheckCircle2
                  size={14}
                  className="absolute -bottom-1 -right-1 text-blue-500 fill-blue-500 text-white"
                />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold truncate">
                {member.name} {member.surname}
              </h3>
              <p className="text-xs text-blue-500 font-semibold">@{member.handle}</p>
              <p className="text-[10px] opacity-60">
                {member.followersCount.toLocaleString()} abonnés • {member.totalLikes.toLocaleString()} likes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:opacity-70 active:scale-95"
            style={{ color: theme.text }}
          >
            <X size={18} />
          </button>
        </div>

        {member.bio && (
          <p className="text-xs opacity-80 leading-relaxed px-1">
            "{member.bio}"
          </p>
        )}

        {/* Action Buttons list */}
        <div className="space-y-2 pt-1">
          {/* Follow / Unfollow */}
          {!isMe && (
            <button
              type="button"
              id="btn-member-modal-follow"
              onClick={handleToggleFollow}
              className={`w-full py-3 px-4 rounded-2xl flex items-center justify-between text-xs font-bold transition-all active:scale-98 border shadow-xs ${
                isFollowed
                  ? 'bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700'
                  : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isFollowed ? <UserCheck size={17} /> : <UserPlus size={17} />}
                <span>{isFollowed ? 'Abonné (Ne plus suivre)' : 'Suivre ce créateur'}</span>
              </div>
              <span className="text-[10px] opacity-70">
                {isFollowed ? 'Abonné' : '+ Suivre'}
              </span>
            </button>
          )}

          {/* Send Direct Message */}
          {!isMe && (
            <button
              type="button"
              id="btn-member-modal-message"
              onClick={() => {
                onClose();
                onOpenDirectChat(member.id);
              }}
              className="w-full py-3 px-4 rounded-2xl flex items-center justify-between text-xs font-bold transition-all active:scale-98 border"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.text,
              }}
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle size={17} className="text-blue-500" />
                <span>Écrire un message direct</span>
              </div>
              <span className="text-xs opacity-60">→</span>
            </button>
          )}

          {/* View Full Profile */}
          <button
            type="button"
            id="btn-member-modal-profile"
            onClick={() => {
              onClose();
              onOpenCreatorProfile(member.id);
            }}
            className="w-full py-3 px-4 rounded-2xl flex items-center justify-between text-xs font-bold transition-all active:scale-98 border"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.border,
              color: theme.text,
            }}
          >
            <div className="flex items-center gap-2.5">
              <ExternalLink size={17} className="text-blue-500" />
              <span>Voir son profil complet & ses vidéos</span>
            </div>
            <span className="text-xs opacity-60">→</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl text-xs font-semibold text-center opacity-70 hover:opacity-100 transition-opacity"
          style={{ color: theme.text }}
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
