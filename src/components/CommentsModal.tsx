import React, { useState, useEffect } from 'react';
import { Comment, User } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { dataService } from '../services/dataService';
import { X, Send, Trash2 } from 'lucide-react';

interface CommentsModalProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  videoId,
  isOpen,
  onClose,
  currentUser,
}) => {
  const { theme } = useTheme();
  const { t } = useI18n();

  const [comments, setComments] = useState<Comment[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setComments(dataService.getComments(videoId));
    }
  }, [isOpen, videoId]);

  if (!isOpen) return null;

  const handleSendComment = () => {
    if (!inputText.trim() || isSending) return;
    setIsSending(true);

    const newComment = dataService.addComment(videoId, inputText);
    if (newComment) {
      setComments([...comments, newComment]);
      setInputText('');
    }
    setIsSending(false);
  };

  const handleDeleteComment = (commentId: string) => {
    const success = dataService.deleteComment(commentId);
    if (success) {
      setComments(comments.filter((c) => c.id !== commentId));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-md h-[60vh] rounded-t-3xl border-t flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: theme.border }}
        >
          <div className="w-6" />
          <h3 className="text-sm font-bold tracking-tight">
            {t.comments} ({comments.length})
          </h3>
          <button
            id="close-comments-btn"
            onClick={onClose}
            className="p-1 rounded-full hover:opacity-70"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-xs" style={{ color: theme.text }}>
              <p className="font-semibold">Aucun commentaire pour l'instant.</p>
              <p className="text-[11px] mt-1">Soyez le premier à commenter !</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isAuthor = currentUser?.id === comment.userId;
              return (
                <div key={comment.id} className="flex items-start gap-2.5 group">
                  <img
                    src={comment.user.avatar}
                    alt={comment.user.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-blue-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold truncate">{comment.user.name}</span>
                      <span className="text-[10px] font-mono">
                        @{comment.user.handle}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 break-words leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                  {isAuthor && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-600 p-1 transition-opacity"
                      title={t.deleteComment}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Add comment input */}
        <div
          className="p-3 border-t flex items-center gap-2"
          style={{ borderColor: theme.border, backgroundColor: theme.background }}
        >
          {currentUser?.avatar && (
            <img
              src={currentUser.avatar}
              alt="You"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
          )}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
            placeholder={t.addCommentPlaceholder}
            className="flex-1 px-3 py-2 text-xs rounded-full border bg-transparent focus:outline-none focus:border-blue-500"
            style={{ borderColor: theme.border, color: theme.text }}
          />
          <button
            id="send-comment-btn"
            onClick={handleSendComment}
            disabled={!inputText.trim() || isSending}
            className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 active:scale-95 transition-transform"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
