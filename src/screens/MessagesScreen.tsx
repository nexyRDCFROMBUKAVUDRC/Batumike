import React, { useState, useEffect, useRef } from 'react';
import { User, Conversation, ChatMessage } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { dataService } from '../services/dataService';
import {
  ArrowLeft,
  Send,
  Users,
  MessageSquare,
  Plus,
  CheckCircle2,
  Search,
  X,
  UserCheck,
  MessageCircle,
} from 'lucide-react';

interface MessagesScreenProps {
  currentUser: User | null;
  onBack: () => void;
  initialTargetUserId?: string | null;
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({
  currentUser,
  onBack,
  initialTargetUserId,
}) => {
  const { theme, isDark } = useTheme();
  const { t } = useI18n();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Direct messaging contact picker modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [availableContacts, setAvailableContacts] = useState<User[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = () => {
    if (currentUser) {
      setConversations(dataService.getConversations(currentUser.id));
    }
  };

  useEffect(() => {
    loadConversations();
  }, [currentUser]);

  // Handle incoming direct chat request from other screens
  useEffect(() => {
    if (initialTargetUserId && currentUser && initialTargetUserId !== currentUser.id) {
      const conv = dataService.getOrCreateDirectConversation(initialTargetUserId);
      if (conv) {
        setActiveConv(conv);
        loadConversations();
      }
    }
  }, [initialTargetUserId, currentUser]);

  useEffect(() => {
    if (activeConv) {
      setMessages(dataService.getMessages(activeConv.id));
    }
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOpenNewChat = () => {
    // Load users, strictly filtering out currentUser ("quelqu'un ne doit jamais s'écrire un message")
    const all = dataService.getAllUsers().filter((u) => u.id !== currentUser?.id);
    setAvailableContacts(all);
    setContactSearchQuery('');
    setShowNewChatModal(true);
  };

  const handleSelectContactForChat = (targetUser: User) => {
    if (!currentUser || targetUser.id === currentUser.id) return;
    const conv = dataService.getOrCreateDirectConversation(targetUser.id);
    if (conv) {
      setActiveConv(conv);
      loadConversations();
    }
    setShowNewChatModal(false);
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeConv || !currentUser) return;
    const sent = dataService.sendMessage(activeConv.id, inputText);
    if (sent) {
      setMessages((prev) => [...prev, sent]);
      setInputText('');
      loadConversations();
    }
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || !currentUser) return;
    const group = dataService.createGroup(newGroupName, []);
    setShowNewGroupModal(false);
    setNewGroupName('');
    loadConversations();
    setActiveConv(group);
  };

  if (activeConv) {
    return (
      <div
        id="active-chat-view"
        className="flex flex-col h-full w-full max-w-md mx-auto select-none"
        style={{ backgroundColor: theme.background, color: theme.text }}
      >
        {/* Chat Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 z-20"
          style={{ borderColor: theme.border, backgroundColor: theme.card }}
        >
          <button
            onClick={() => setActiveConv(null)}
            className="p-1 rounded-full hover:opacity-80 active:scale-95"
          >
            <ArrowLeft size={18} style={{ color: theme.text }} />
          </button>

          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {activeConv.isGroup ? (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <Users size={16} />
              </div>
            ) : (
              <img
                src={activeConv.members[0]?.avatar || ''}
                alt="Avatar"
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <div className="truncate">
              <h3 className="text-xs font-bold truncate">
                {activeConv.name || activeConv.members[0]?.name}
              </h3>
              <span className="text-[10px] font-semibold">
                {activeConv.isGroup ? `${activeConv.members.length} membres` : 'En ligne'}
              </span>
            </div>
          </div>
        </div>

        {/* Message bubbles list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {messages.map((m) => {
            const isMe = m.senderId === currentUser?.id;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-xs ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : isDark
                      ? 'bg-black text-white border border-white rounded-bl-xs'
                      : 'bg-white text-black border border-black rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] font-mono mt-1 px-1">
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input bar */}
        <div
          className="p-3 border-t flex items-center gap-2"
          style={{ borderColor: theme.border, backgroundColor: theme.card }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={t.typeMessage}
            className="flex-1 px-3.5 py-2 text-xs rounded-full border bg-transparent focus:outline-none focus:border-blue-500"
            style={{ borderColor: theme.border, color: theme.text }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 active:scale-95 transition-transform"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="messages-screen"
      className="flex flex-col h-full w-full max-w-md mx-auto select-none overflow-hidden"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-20"
        style={{ borderColor: theme.border, backgroundColor: theme.background }}
      >
        <button onClick={onBack} className="p-1 rounded-full hover:opacity-80">
          <ArrowLeft size={18} style={{ color: theme.text }} />
        </button>
        <h2 className="text-base font-bold">{t.messages}</h2>
        <div className="flex items-center gap-1.5">
          <button
            id="btn-new-chat-message"
            onClick={handleOpenNewChat}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 active:scale-95 text-xs font-bold shadow transition-all"
            title="Nouveau message"
          >
            <MessageCircle size={14} />
            <span>Écrire</span>
          </button>
          <button
            onClick={() => setShowNewGroupModal(true)}
            className="p-1.5 rounded-full bg-blue-600/15 text-blue-500 hover:bg-blue-600/25 active:scale-95"
            title={t.createGroup}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin pb-28">
        {conversations.length === 0 ? (
          <div className="py-20 text-center text-xs space-y-3" style={{ color: theme.text }}>
            <MessageSquare size={36} className="mx-auto text-blue-600 opacity-80" />
            <p className="font-semibold text-sm">Aucune conversation active.</p>
            <p className="text-[11px] opacity-70">
              Discutez avec vos amis et les créateurs que vous suivez.
            </p>
            <button
              onClick={handleOpenNewChat}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 active:scale-95 shadow"
            >
              <MessageCircle size={14} />
              <span>Choisir un destinataire</span>
            </button>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConv(conv)}
              className="p-3 rounded-2xl border flex items-center justify-between cursor-pointer hover:opacity-90 active:scale-98 transition-all"
              style={{ backgroundColor: theme.card, borderColor: theme.border }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {conv.isGroup ? (
                  <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
                    <Users size={18} />
                  </div>
                ) : (
                  <img
                    src={conv.members[0]?.avatar || ''}
                    alt="User"
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-full object-cover shrink-0 border border-blue-600"
                  />
                )}
                <div className="min-w-0">
                  <h4 className="text-xs font-bold truncate">
                    {conv.name || conv.members[0]?.name}
                  </h4>
                  <p className="text-[11px] truncate mt-0.5" style={{ color: theme.text }}>
                    {conv.lastMessage || 'Nouvelle conversation'}
                  </p>
                </div>
              </div>

              {conv.unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Direct Contact Picker Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none">
          <div
            className="w-full max-w-sm rounded-3xl p-4 border flex flex-col max-h-[85vh] shadow-2xl"
            style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-blue-500" />
                <h3 className="text-sm font-bold">Nouveau message</h3>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-full hover:opacity-80"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search contacts input */}
            <div className="py-3">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs"
                style={{ borderColor: theme.border, backgroundColor: theme.background }}
              >
                <Search size={14} className="text-neutral-400" />
                <input
                  type="text"
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  placeholder="Rechercher parmi les contacts..."
                  className="flex-1 bg-transparent focus:outline-none"
                  style={{ color: theme.text }}
                  autoFocus
                />
                {contactSearchQuery && (
                  <button onClick={() => setContactSearchQuery('')} className="text-neutral-400">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] opacity-70 pb-2 px-1">
              Choisissez un créateur ou un abonné à qui écrire :
            </p>

            {/* Contact list with infinite vertical scroll */}
            <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
              {availableContacts
                .filter((u) => {
                  if (!contactSearchQuery.trim()) return true;
                  const q = contactSearchQuery.toLowerCase();
                  return (
                    u.name.toLowerCase().includes(q) ||
                    u.surname.toLowerCase().includes(q) ||
                    u.handle.toLowerCase().includes(q)
                  );
                })
                .map((contact) => (
                  <div
                    key={contact.id}
                    id={`contact-picker-item-${contact.id}`}
                    onClick={() => handleSelectContactForChat(contact)}
                    className="p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 cursor-pointer hover:border-blue-500/60 active:scale-98 transition-all"
                    style={{ borderColor: theme.border, backgroundColor: theme.background }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-blue-500/30"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold truncate">
                            {contact.name} {contact.surname}
                          </span>
                          {contact.isVerified && (
                            <CheckCircle2 size={12} className="text-blue-500 fill-blue-500 text-white shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-blue-500 truncate">
                          @{contact.handle}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {contact.isFollowed && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                          Suivi
                        </span>
                      )}
                      <button
                        className="p-1.5 rounded-full bg-blue-600 text-white shadow"
                        title="Démarrer la discussion"
                      >
                        <Send size={12} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* New Group Modal */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div
            className="w-full max-w-xs rounded-2xl p-5 border space-y-4 shadow-2xl"
            style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text }}
          >
            <h4 className="text-sm font-bold">{t.createGroup}</h4>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder={t.groupName}
              className="w-full px-3 py-2 text-xs rounded-xl border bg-transparent focus:outline-none focus:border-blue-500"
              style={{ borderColor: theme.border, color: theme.text }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewGroupModal(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border transition-all"
                style={{
                  borderColor: theme.border,
                  backgroundColor: isDark ? '#000000' : '#FFFFFF',
                  color: theme.text,
                }}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white disabled:opacity-40"
              >
                {t.create}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
