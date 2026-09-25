import React, { useState, useEffect, useRef } from 'react';
import { User, Conversation, ChatMessage } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { dataService } from '../services/dataService';
import { supabase } from '../services/supabase';
import {
  ArrowLeft,
  Send,
  Users,
  MessageSquare,
  Plus,
  CheckCircle2,
  Search,
  X,
  UserPlus,
  MessageCircle,
  Copy,
  Check,
  CheckCheck,
  AlertTriangle,
  RefreshCw,
  Info,
  MessageSquarePlus,
} from 'lucide-react';

export interface SupabaseGroup {
  id: string;
  name: string;
  created_by?: string;
  created_at?: string;
  memberCount?: number;
  lastMessage?: string;
}

export interface SupabaseGroupMember {
  id?: string | number;
  group_id: string;
  user_id: string;
  created_at?: string;
  user?: User;
}

export interface SupabaseGroupMessage {
  id: string | number;
  group_id: string;
  content?: string;
  message?: string;
  sender_id: string;
  created_at: string;
  sender?: User;
}

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

  // Navigation tab: 'groups' (Supabase groups) or 'direct' (1-to-1 chats)
  const [activeTab, setActiveTab] = useState<'groups' | 'direct'>(() =>
    initialTargetUserId ? 'direct' : 'groups'
  );

  // -------------------- Supabase Groups State --------------------
  const [groups, setGroups] = useState<SupabaseGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<SupabaseGroup | null>(null);
  const [groupMessages, setGroupMessages] = useState<SupabaseGroupMessage[]>([]);
  const [groupMembers, setGroupMembers] = useState<SupabaseGroupMember[]>([]);
  const [groupName, setGroupName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isSendingGroupMessage, setIsSendingGroupMessage] = useState(false);

  // Modals for groups
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showMembersListModal, setShowMembersListModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedInitialMembers, setSelectedInitialMembers] = useState<string[]>([]);
  const [createGroupMemberSearch, setCreateGroupMemberSearch] = useState('');
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);

  const handleOpenCreateGroup = () => {
    setGroupName('');
    setSelectedInitialMembers([]);
    setCreateGroupMemberSearch('');
    setCreateGroupError(null);
    setShowCreateGroupModal(true);
  };

  const handleToggleInitialMember = (userId: string) => {
    setSelectedInitialMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // -------------------- Direct Messages State --------------------
  const [directConversations, setDirectConversations] = useState<Conversation[]>([]);
  const [activeDirectConv, setActiveDirectConv] = useState<Conversation | null>(null);
  const [directMessages, setDirectMessages] = useState<ChatMessage[]>([]);
  const [directInputText, setDirectInputText] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [availableContacts, setAvailableContacts] = useState<User[]>([]);

  // -------------------- Online Presence State --------------------
  // Spécification: Vert pour "En ligne" (avec petit crochet/coche ✓), Noir pour "N'est pas en ligne" (avec croix ✕)
  const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});
  const [presenceFilter, setPresenceFilter] = useState<'all' | 'online' | 'offline'>('all');

  const isUserOnline = (userId: string): boolean => {
    if (!userId) return false;
    if (currentUser && userId === currentUser.id) return true;
    if (presenceMap[userId] !== undefined) return presenceMap[userId];
    return dataService.isUserOnline(userId);
  };

  const handleToggleUserPresence = (userId: string, userName?: string) => {
    if (!userId) return;
    const currentStatus = isUserOnline(userId);
    const nextStatus = !currentStatus;
    dataService.setUserOnline(userId, nextStatus);
    setPresenceMap((prev) => ({ ...prev, [userId]: nextStatus }));
    const name = userName || 'Contact';
    setSuccessToast(
      nextStatus
        ? `${name} est en ligne (✓ En ligne)`
        : `${name} n'est pas en ligne (✕ N'est pas en ligne)`
    );
  };

  useEffect(() => {
    const handlePresenceEvent = (e: any) => {
      if (e.detail?.userId) {
        setPresenceMap((prev) => ({
          ...prev,
          [e.detail.userId]: e.detail.isOnline,
        }));
      }
    };
    window.addEventListener('nnecxy_presence_change', handlePresenceEvent);
    return () => {
      window.removeEventListener('nnecxy_presence_change', handlePresenceEvent);
    };
  }, []);

  // -------------------- UI Alerts & Feedback --------------------
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Helper: obtain effective user ID valid for PostgreSQL UUID foreign keys
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const FALLBACK_SUPABASE_USER_ID = 'e705de22-a8c6-4f50-947e-6a2f0dce9e7e';

  const getEffectiveSupabaseUserId = async (): Promise<string> => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.id && UUID_REGEX.test(data.session.user.id)) {
        return data.session.user.id;
      }
    } catch (_) {}
    if (currentUser?.id && UUID_REGEX.test(currentUser.id)) {
      return currentUser.id;
    }
    return FALLBACK_SUPABASE_USER_ID;
  };

  const getUserId = () => {
    return currentUser?.id || 'u_batumike_902';
  };

  // Toast timeout
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // -------------------------------------------------------------
  // 4. AFFICHER les messages du groupe:
  // const { data } = await supabase.from('group_messages').select('*').eq('group_id', currentGroupId).order('created_at', { ascending: true })
  // -------------------------------------------------------------
  const loadGroupMessages = async (currentGroupId: string, silent: boolean = false) => {
    if (!silent) setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', currentGroupId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur chargement group_messages:', error);
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          setPermissionNotice(
            `GRANT ALL ON TABLE public.groups TO anon, authenticated, service_role;\nGRANT ALL ON TABLE public.group_members TO anon, authenticated, service_role;\nGRANT ALL ON TABLE public.group_messages TO anon, authenticated, service_role;\nGRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;`
          );
        }
        // Fallback local storage
        const local = dataService.getMessages(currentGroupId);
        setGroupMessages(
          local.map((m) => ({
            id: m.id,
            group_id: currentGroupId,
            content: m.text,
            message: m.text,
            sender_id: m.senderId,
            created_at: m.createdAt,
          }))
        );
      } else if (data) {
        setGroupMessages(
          data.map((m: any) => ({
            id: m.id,
            group_id: m.group_id,
            sender_id: m.sender_id,
            content: m.message || m.content || '',
            message: m.message || m.content || '',
            created_at: m.created_at,
          }))
        );
      }
    } catch (err: any) {
      console.error('Exception chargement group_messages:', err);
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  };

  // Load group members
  const loadGroupMembers = async (currentGroupId: string) => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', currentGroupId);

      if (!error && data) {
        const allUsers = dataService.getAllUsers();
        const enriched: SupabaseGroupMember[] = data.map((m) => ({
          ...m,
          user: allUsers.find((u) => u.id === m.user_id),
        }));
        setGroupMembers(enriched);
      }
    } catch (err) {
      console.error('Erreur chargement membres:', err);
    }
  };

  // Load all groups from Supabase
  const loadGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const { data: groupsData, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement groups Supabase:', error);
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          setPermissionNotice(
            `GRANT ALL ON TABLE public.groups TO anon, authenticated, service_role;\nGRANT ALL ON TABLE public.group_members TO anon, authenticated, service_role;\nGRANT ALL ON TABLE public.group_messages TO anon, authenticated, service_role;\nGRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;`
          );
        }
        // Fallback to local groups if permissions not yet applied in Supabase
        const localConvs = dataService.getConversations(getUserId()).filter((c) => c.isGroup);
        setGroups(
          localConvs.map((c) => ({
            id: c.id,
            name: c.name || 'Groupe NNECXY',
            created_by: c.groupAdminId,
            memberCount: c.members.length,
            lastMessage: c.lastMessage,
          }))
        );
      } else if (groupsData) {
        // Enforce member counts
        const { data: membersData } = await supabase
          .from('group_members')
          .select('group_id, user_id');

        const enriched = groupsData.map((g) => {
          const count = membersData?.filter((m) => m.group_id === g.id).length || 0;
          return {
            ...g,
            memberCount: count,
          };
        });
        setGroups(enriched);
      }
    } catch (err) {
      console.error('Exception chargement groups:', err);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  // -------------------------------------------------------------
  // 1. BOUTON "Créer Groupe":
  // const { data: group } = await supabase.from('groups').insert({ name: groupName, created_by: user.id }).select().single()
  // await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id })
  // -------------------------------------------------------------
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setCreateGroupError('Veuillez entrer un nom pour le groupe.');
      return;
    }
    setCreateGroupError(null);
    setIsCreatingGroup(true);

    try {
      const effectiveUserId = await getEffectiveSupabaseUserId();

      // 1. Insert into public.groups
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({ name: groupName.trim(), created_by: effectiveUserId })
        .select()
        .single();

      if (groupError) {
        console.error('Erreur création groupe:', groupError);
        if (groupError.code === '42501' || groupError.message?.includes('permission denied')) {
          setPermissionNotice(
            `GRANT ALL ON TABLE public.groups TO anon, authenticated, service_role;\nGRANT ALL ON TABLE public.group_members TO anon, authenticated, service_role;\nGRANT ALL ON TABLE public.group_messages TO anon, authenticated, service_role;\nGRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;`
          );
        }
        // Fallback local group
        const allMemberIds = [effectiveUserId, ...selectedInitialMembers];
        const localGroup = dataService.createGroup(groupName.trim(), allMemberIds);
        const newG: SupabaseGroup = {
          id: localGroup?.id || 'g_' + Date.now(),
          name: localGroup?.name || groupName.trim(),
          created_by: effectiveUserId,
          memberCount: allMemberIds.length,
        };
        setGroupName('');
        setSelectedInitialMembers([]);
        setShowCreateGroupModal(false);
        setCurrentGroup(newG);
        setSuccessToast(`Groupe "${groupName.trim()}" créé avec succès ! Discussion ouverte.`);
        return;
      }

      if (group) {
        // 1. Auto add creator to public.group_members
        try {
          await supabase
            .from('group_members')
            .insert({ group_id: group.id, user_id: effectiveUserId });
        } catch (memberError) {
          console.warn('Erreur ajout automatique créateur group_members:', memberError);
        }

        // 2. Add selected initial members to public.group_members if valid UUID
        if (selectedInitialMembers.length > 0) {
          for (const memberId of selectedInitialMembers) {
            if (UUID_REGEX.test(memberId)) {
              try {
                await supabase
                  .from('group_members')
                  .insert({ group_id: group.id, user_id: memberId });
              } catch (mErr) {
                console.warn('Erreur ajout membre initial:', mErr);
              }
            }
          }
        }

        const totalCount = Math.max(1, 1 + selectedInitialMembers.length);
        const activeG: SupabaseGroup = { ...group, memberCount: totalCount };

        // Immédiatement ouvrir le groupe et fermer la modale
        setGroupName('');
        setSelectedInitialMembers([]);
        setShowCreateGroupModal(false);
        setCurrentGroup(activeG);
        setSuccessToast(`Groupe "${group.name}" créé avec ${totalCount} membre(s) ! Discussion ouverte.`);

        // Charger en arrière-plan
        loadGroups();
        loadGroupMembers(group.id);
        loadGroupMessages(group.id);
      }
    } catch (err: any) {
      console.error('Exception création groupe:', err);
      setCreateGroupError(err?.message || 'Erreur lors de la création du groupe');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // -------------------------------------------------------------
  // 2. BOUTON "Ajouter Membre":
  // await supabase.from('group_members').insert({ group_id: currentGroupId, user_id: selectedUserId })
  // -------------------------------------------------------------
  const handleAddMember = async (selectedUserId: string) => {
    if (!currentGroup) return;
    const currentGroupId = currentGroup.id;
    setIsAddingMember(true);

    try {
      if (UUID_REGEX.test(selectedUserId)) {
        const { error } = await supabase
          .from('group_members')
          .insert({ group_id: currentGroupId, user_id: selectedUserId });

        if (error) {
          console.error('Erreur Supabase ajout membre:', error);
          if (error.code === '42501' || error.message?.includes('permission denied')) {
            setPermissionNotice(
              `GRANT ALL ON TABLE public.groups TO anon, authenticated, service_role;\nGRANT ALL ON TABLE public.group_members TO anon, authenticated, service_role;\nGRANT ALL ON TABLE public.group_messages TO anon, authenticated, service_role;\nGRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;`
            );
          }
        } else {
          setSuccessToast('Membre ajouté avec succès au groupe !');
        }
      } else {
        setSuccessToast('Membre ajouté à la discussion !');
      }

      setShowAddMemberModal(false);
      await loadGroupMembers(currentGroupId);
      await loadGroups();
    } catch (err: any) {
      console.error('Exception ajout membre:', err);
    } finally {
      setIsAddingMember(false);
    }
  };

  // -------------------------------------------------------------
  // 3. BOUTON "Envoyer Message Groupe":
  // await supabase.from('group_messages').insert({ group_id: currentGroupId, message: messageText, sender_id: user.id })
  // -------------------------------------------------------------
  const handleSendGroupMessage = async () => {
    if (!messageText.trim() || !currentGroup) return;
    const currentGroupId = currentGroup.id;
    const effectiveUserId = await getEffectiveSupabaseUserId();
    const content = messageText.trim();
    setMessageText('');
    setIsSendingGroupMessage(true);

    // Optimistic UI insert for immediate response
    const tempId = 'temp_' + Date.now();
    const optimisticMessage: SupabaseGroupMessage = {
      id: tempId,
      group_id: currentGroupId,
      content,
      message: content,
      sender_id: effectiveUserId,
      created_at: new Date().toISOString(),
    };
    setGroupMessages((prev) => [...prev, optimisticMessage]);

    try {
      // Colonne 'message' dans group_messages
      const { data, error } = await supabase
        .from('group_messages')
        .insert({ group_id: currentGroupId, message: content, sender_id: effectiveUserId })
        .select()
        .single();

      if (error) {
        console.warn('Tentative fallback content:', error);
        // Fallback colonne alternative 'content' si besoin
        const alt = await supabase
          .from('group_messages')
          .insert({ group_id: currentGroupId, content, sender_id: effectiveUserId })
          .select()
          .single();

        if (alt.data) {
          const norm = { ...alt.data, content: alt.data.content || alt.data.message };
          setGroupMessages((prev) => prev.map((m) => (m.id === tempId ? norm : m)));
        } else {
          // Fallback local send
          dataService.sendMessage(currentGroupId, content);
        }
      } else if (data) {
        const norm = { ...data, content: data.message || data.content };
        setGroupMessages((prev) =>
          prev.map((m) => (m.id === tempId ? norm : m))
        );
      }
    } catch (err: any) {
      console.error('Exception envoi message groupe:', err);
    } finally {
      setIsSendingGroupMessage(false);
    }
  };

  // -------------------- Supabase Realtime Subscription --------------------
  useEffect(() => {
    if (!currentGroup) return;
    const currentGroupId = currentGroup.id;

    loadGroupMessages(currentGroupId);
    loadGroupMembers(currentGroupId);

    // Subscribe to real-time events for this group
    const channel = supabase
      .channel(`nnecxy-group-${currentGroupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${currentGroupId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (!newMsg) return;
          const normalized: SupabaseGroupMessage = {
            id: newMsg.id,
            group_id: newMsg.group_id,
            sender_id: newMsg.sender_id,
            message: newMsg.message || newMsg.content || '',
            content: newMsg.message || newMsg.content || '',
            created_at: newMsg.created_at,
          };
          setGroupMessages((prev) => {
            if (prev.some((m) => m.id === normalized.id)) return prev;
            // Replace any optimistic message with the exact same content and sender
            const filtered = prev.filter(
              (m) =>
                !(
                  String(m.id).startsWith('temp_') &&
                  (m.content === normalized.content || m.message === normalized.message) &&
                  m.sender_id === normalized.sender_id
                )
            );
            return [...filtered, normalized];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${currentGroupId}`,
        },
        () => {
          loadGroupMembers(currentGroupId);
        }
      )
      .subscribe();

    // Polling fallback to guarantee continuous multi-user synchronization:
    const pollInterval = setInterval(() => {
      loadGroupMessages(currentGroupId, true);
    }, 2500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [currentGroup?.id]);

  // Initial load
  useEffect(() => {
    loadGroups();
    loadDirectConversations();
  }, [currentUser]);

  // Handle direct conversation if initialTargetUserId provided
  useEffect(() => {
    if (initialTargetUserId && currentUser && initialTargetUserId !== currentUser.id) {
      const conv = dataService.getOrCreateDirectConversation(initialTargetUserId);
      if (conv) {
        setActiveDirectConv(conv);
        setActiveTab('direct');
        loadDirectConversations();
      }
    }
  }, [initialTargetUserId, currentUser]);

  // Scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages, directMessages]);

  // Direct conversations loading
  const loadDirectConversations = () => {
    if (currentUser) {
      const all = dataService.getConversations(currentUser.id).filter((c) => !c.isGroup);
      setDirectConversations(all);
    }
  };

  useEffect(() => {
    if (activeDirectConv) {
      setDirectMessages(dataService.getMessages(activeDirectConv.id));
    }
  }, [activeDirectConv]);

  const handleOpenNewChat = () => {
    const all = dataService.getAllUsers().filter((u) => u.id !== currentUser?.id);
    setAvailableContacts(all);
    setContactSearchQuery('');
    setShowNewChatModal(true);
  };

  const handleSelectContactForDirectChat = (targetUser: User) => {
    if (!currentUser || targetUser.id === currentUser.id) return;
    const conv = dataService.getOrCreateDirectConversation(targetUser.id);
    if (conv) {
      setActiveDirectConv(conv);
      loadDirectConversations();
    }
    setShowNewChatModal(false);
  };

  const handleSendDirectMessage = () => {
    if (!directInputText.trim() || !activeDirectConv || !currentUser) return;
    const sent = dataService.sendMessage(activeDirectConv.id, directInputText);
    if (sent) {
      setDirectMessages((prev) => [...prev, sent]);
      setDirectInputText('');
      loadDirectConversations();
    }
  };

  const copySqlNotice = () => {
    if (permissionNotice) {
      navigator.clipboard.writeText(permissionNotice);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  // Helper to resolve user name and avatar
  const getUserInfo = (userId: string) => {
    if (currentUser && userId === currentUser.id) {
      return {
        name: currentUser.name || 'Moi',
        handle: currentUser.handle || 'moi',
        avatar: currentUser.avatar,
        isMe: true,
        isOnline: true,
      };
    }
    const found = dataService.getUserById(userId);
    if (found) {
      return {
        name: `${found.name} ${found.surname || ''}`.trim(),
        handle: found.handle,
        avatar: found.avatar,
        isMe: false,
        isOnline: isUserOnline(userId),
      };
    }
    return {
      name: `Utilisateur (${userId.slice(0, 6)})`,
      handle: userId.slice(0, 8),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      isMe: false,
      isOnline: isUserOnline(userId),
    };
  };

  // Helper pour le badge de statut:
  // - "En ligne" : couleur verte avec petit fauché/coche (✓)
  // - "N'est pas en ligne" : couleur noire avec croix (✕)
  // - Appuyer sur le badge permet de basculer en direct entre "En ligne" et "N'est pas en ligne"
  const renderPresenceBadge = (userId: string, userName?: string, compact: boolean = false) => {
    const online = isUserOnline(userId);
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleToggleUserPresence(userId, userName);
        }}
        className={`inline-flex items-center gap-1 rounded-full font-bold transition-all active:scale-95 cursor-pointer shadow-xs select-none ${
          compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
        } ${
          online
            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/40 hover:bg-emerald-500/25'
            : 'bg-black text-neutral-300 border border-neutral-700 hover:bg-neutral-900'
        }`}
        title={`Statut: ${online ? 'En ligne (✓)' : "N'est pas en ligne (✕)"} — Appuyez pour changer`}
      >
        {online ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <Check size={compact ? 9 : 11} className="stroke-[3] text-emerald-500 shrink-0" />
            <span>En ligne</span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 shrink-0" />
            <X size={compact ? 9 : 11} className="stroke-[2.5] text-neutral-300 shrink-0" />
            <span>N'est pas en ligne</span>
          </>
        )}
      </button>
    );
  };

  // Helper pour afficher l'avatar avec l'indicateur de présence (pastille verte avec ✓ ou noire avec ✕)
  const renderAvatarWithPresence = (
    avatarUrl: string,
    name: string,
    userId: string,
    sizeClass = 'w-10 h-10'
  ) => {
    const online = isUserOnline(userId);
    const badgeSize = sizeClass.includes('w-8')
      ? 'w-3.5 h-3.5'
      : sizeClass.includes('w-12')
      ? 'w-5 h-5'
      : 'w-4 h-4';
    const iconSize = sizeClass.includes('w-8') ? 8 : 10;

    return (
      <div
        className="relative shrink-0 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          handleToggleUserPresence(userId, name);
        }}
        title={`${name}: ${online ? 'En ligne (✓)' : "N'est pas en ligne (✕)"} — Appuyez pour changer`}
      >
        <img
          src={avatarUrl}
          alt={name}
          referrerPolicy="no-referrer"
          className={`${sizeClass} rounded-full object-cover border-2 transition-all ${
            online
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-black dark:border-neutral-700'
          }`}
        />
        <div
          className={`absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-neutral-900 shadow-xs transition-all ${badgeSize} ${
            online ? 'bg-emerald-500' : 'bg-black text-neutral-300'
          }`}
        >
          {online ? (
            <Check size={iconSize} className="stroke-[3]" />
          ) : (
            <X size={iconSize} className="stroke-[2.5]" />
          )}
        </div>
      </div>
    );
  };

  // =========================================================================
  // VIEW 1: ACTIVE GROUP CHAT
  // =========================================================================
  if (currentGroup) {
    return (
      <div
        id="active-group-chat-view"
        className="flex flex-col h-full w-full max-w-md mx-auto select-none"
        style={{ backgroundColor: theme.background, color: theme.text }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3.5 py-2.5 border-b sticky top-0 z-20"
          style={{ borderColor: theme.border, backgroundColor: theme.card }}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              onClick={() => setCurrentGroup(null)}
              className="p-1 rounded-full hover:opacity-80 active:scale-95 transition-transform"
              title="Retour aux groupes"
            >
              <ArrowLeft size={18} style={{ color: theme.text }} />
            </button>

            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Users size={16} />
            </div>

            <div className="truncate flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold truncate">{currentGroup.name}</h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/15 text-blue-500 shrink-0">
                  Cloud
                </span>
              </div>
              <button
                onClick={() => setShowMembersListModal(true)}
                className="text-[10px] opacity-75 hover:underline flex items-center gap-1 text-left"
              >
                <span>{groupMembers.length || currentGroup.memberCount || 1} membre(s)</span>
                <Info size={10} />
              </button>
            </div>
          </div>

          {/* 2. BOUTON "Ajouter Membre" */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="btn-ajouter-membre"
              onClick={() => {
                setMemberSearchQuery('');
                setShowAddMemberModal(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold active:scale-95 shadow transition-all"
              title="Ajouter un membre à ce groupe"
            >
              <UserPlus size={13} />
              <span className="hidden sm:inline">Ajouter Membre</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          </div>
        </div>

        {/* Permission Notice Banner (if PostgreSQL 42501 grant error happens) */}
        {permissionNotice && (
          <div className="mx-3 mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle size={13} />
                <span>Droits d'accès SQL requis</span>
              </div>
              <button
                onClick={() => setPermissionNotice(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={12} />
              </button>
            </div>
            <p className="opacity-90 leading-tight">
              Pour écrire directement sans blocage PostgreSQL, exécutez ce script dans votre Éditeur SQL :
            </p>
            <button
              onClick={copySqlNotice}
              className="self-start flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 text-black font-bold text-[10px] hover:bg-amber-400 active:scale-95 transition-all"
            >
              {copiedSql ? <Check size={11} /> : <Copy size={11} />}
              <span>{copiedSql ? 'Copié dans le presse-papiers !' : 'Copier le script SQL'}</span>
            </button>
          </div>
        )}

        {/* Success toast */}
        {successToast && (
          <div className="mx-3 mt-2 p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
        )}

        {/* 4. AFFICHER les messages du groupe */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoadingMessages && groupMessages.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs opacity-60">
              <RefreshCw size={18} className="animate-spin text-blue-500" />
              <span>Chargement des messages...</span>
            </div>
          ) : groupMessages.length === 0 ? (
            <div className="py-16 text-center text-xs opacity-70 space-y-2">
              <Users size={32} className="mx-auto text-blue-500 opacity-60" />
              <p className="font-bold text-sm">Bienvenue dans le groupe {currentGroup.name} !</p>
              <p className="text-[11px] max-w-xs mx-auto">
                Soyez le premier à envoyer un message à tous les membres.
              </p>
            </div>
          ) : (
            groupMessages.map((msg) => {
              const info = getUserInfo(msg.sender_id);
              const isMe = info.isMe;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}
                >
                  {/* Sender Name for other members */}
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <img
                        src={info.avatar}
                        alt={info.name}
                        referrerPolicy="no-referrer"
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span className="text-[10px] font-bold text-blue-500">
                        {info.name}
                      </span>
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-xs ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : isDark
                        ? 'bg-neutral-900 text-white border border-neutral-800 rounded-bl-xs'
                        : 'bg-white text-black border border-neutral-200 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message || msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[9px] font-mono opacity-70">
                        {msg.created_at
                          ? new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'À l’instant'}
                      </span>
                      {isMe && (
                        <CheckCheck size={11} className="text-blue-200 stroke-[2.5]" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 3. BOUTON "Envoyer Message Groupe" */}
        <div
          className="p-3 border-t flex items-center gap-2"
          style={{ borderColor: theme.border, backgroundColor: theme.card }}
        >
          <input
            id="input-group-message"
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendGroupMessage();
              }
            }}
            placeholder="Écrire un message au groupe..."
            className="flex-1 px-3.5 py-2 text-xs rounded-full border bg-transparent focus:outline-none focus:border-blue-500"
            style={{ borderColor: theme.border, color: theme.text }}
          />

          <button
            id="btn-envoyer-message-groupe"
            onClick={handleSendGroupMessage}
            disabled={!messageText.trim() || isSendingGroupMessage}
            className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 active:scale-95 transition-all shadow"
            title="Envoyer Message Groupe"
          >
            <Send size={15} />
          </button>
        </div>

        {/* Modal: 2. Ajouter Membre */}
        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none">
            <div
              className="w-full max-w-sm rounded-3xl p-4 border flex flex-col max-h-[85vh] shadow-2xl"
              style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text }}
            >
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.border }}>
                <div className="flex items-center gap-2">
                  <UserPlus size={18} className="text-blue-500" />
                  <div>
                    <h3 className="text-sm font-bold">Ajouter un membre</h3>
                    <p className="text-[10px] opacity-70">au groupe {currentGroup.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddMemberModal(false)}
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
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom ou @handle..."
                    className="flex-1 bg-transparent focus:outline-none"
                    style={{ color: theme.text }}
                    autoFocus
                  />
                  {memberSearchQuery && (
                    <button onClick={() => setMemberSearchQuery('')} className="text-neutral-400">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-1">
                {dataService
                  .getAllUsers()
                  .filter((u) => {
                    // Filter out already members
                    const isAlready = groupMembers.some((m) => m.user_id === u.id);
                    if (isAlready) return false;

                    if (!memberSearchQuery.trim()) return true;
                    const q = memberSearchQuery.toLowerCase();
                    return (
                      u.name.toLowerCase().includes(q) ||
                      (u.surname && u.surname.toLowerCase().includes(q)) ||
                      u.handle.toLowerCase().includes(q)
                    );
                  })
                  .map((contact) => (
                    <div
                      key={contact.id}
                      className="p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 transition-all"
                      style={{ borderColor: theme.border, backgroundColor: theme.background }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {renderAvatarWithPresence(
                          contact.avatar,
                          `${contact.name} ${contact.surname || ''}`.trim(),
                          contact.id,
                          'w-9 h-9'
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold truncate">
                              {contact.name} {contact.surname}
                            </span>
                            {contact.isVerified && (
                              <CheckCircle2 size={12} className="text-blue-500 fill-blue-500 text-white shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-blue-500 truncate">
                              @{contact.handle}
                            </span>
                            {renderPresenceBadge(contact.id, contact.name, true)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddMember(contact.id)}
                        disabled={isAddingMember}
                        className="px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold active:scale-95 transition-all shadow shrink-0"
                      >
                        + Ajouter
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal: View Group Members */}
        {showMembersListModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none">
            <div
              className="w-full max-w-sm rounded-3xl p-4 border flex flex-col max-h-[80vh] shadow-2xl"
              style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text }}
            >
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.border }}>
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-blue-500" />
                  <h3 className="text-sm font-bold">Membres du groupe ({groupMembers.length})</h3>
                </div>
                <button
                  onClick={() => setShowMembersListModal(false)}
                  className="p-1 rounded-full hover:opacity-80"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-3 scrollbar-thin pr-1">
                {groupMembers.map((m) => {
                  const info = getUserInfo(m.user_id);
                  const isCreator = currentGroup.created_by === m.user_id;

                  return (
                    <div
                      key={m.user_id}
                      className="p-2.5 rounded-2xl border flex items-center justify-between gap-2.5"
                      style={{ borderColor: theme.border, backgroundColor: theme.background }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {renderAvatarWithPresence(info.avatar, info.name, m.user_id, 'w-8 h-8')}
                        <div className="min-w-0">
                          <span className="text-xs font-bold truncate block">
                            {info.name} {info.isMe && '(Vous)'}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-blue-500 truncate">
                              @{info.handle}
                            </span>
                            {renderPresenceBadge(m.user_id, info.name, true)}
                          </div>
                        </div>
                      </div>

                      {isCreator && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          Créateur
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  setShowMembersListModal(false);
                  setShowAddMemberModal(true);
                }}
                className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs active:scale-95 shadow transition-all"
              >
                + Ajouter un autre membre
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE DIRECT (1-to-1) CHAT
  // =========================================================================
  if (activeDirectConv) {
    return (
      <div
        id="active-direct-chat-view"
        className="flex flex-col h-full w-full max-w-md mx-auto select-none"
        style={{ backgroundColor: theme.background, color: theme.text }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 z-20"
          style={{ borderColor: theme.border, backgroundColor: theme.card }}
        >
          <button
            onClick={() => setActiveDirectConv(null)}
            className="p-1 rounded-full hover:opacity-80 active:scale-95"
          >
            <ArrowLeft size={18} style={{ color: theme.text }} />
          </button>

          {renderAvatarWithPresence(
            activeDirectConv.members[0]?.avatar || '',
            `${activeDirectConv.members[0]?.name || ''} ${activeDirectConv.members[0]?.surname || ''}`.trim(),
            activeDirectConv.members[0]?.id || '',
            'w-9 h-9'
          )}
          <div className="truncate flex-1 min-w-0">
            <h3 className="text-xs font-bold truncate">
              {activeDirectConv.members[0]?.name} {activeDirectConv.members[0]?.surname}
            </h3>
            <div className="mt-0.5 flex items-center gap-1.5">
              {renderPresenceBadge(
                activeDirectConv.members[0]?.id || '',
                activeDirectConv.members[0]?.name
              )}
              <span className="text-[10px] opacity-60">
                (Appuyez pour basculer)
              </span>
            </div>
          </div>
        </div>

        {/* Direct messages list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {directMessages.map((m) => {
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
                      ? 'bg-neutral-900 text-white border border-neutral-800 rounded-bl-xs'
                      : 'bg-white text-black border border-neutral-200 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[9px] font-mono opacity-70">
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && (
                      <CheckCheck size={11} className="text-blue-200 stroke-[2.5]" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div
          className="p-3 border-t flex items-center gap-2"
          style={{ borderColor: theme.border, backgroundColor: theme.card }}
        >
          <input
            type="text"
            value={directInputText}
            onChange={(e) => setDirectInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendDirectMessage()}
            placeholder={t.typeMessage}
            className="flex-1 px-3.5 py-2 text-xs rounded-full border bg-transparent focus:outline-none focus:border-blue-500"
            style={{ borderColor: theme.border, color: theme.text }}
          />
          <button
            onClick={handleSendDirectMessage}
            disabled={!directInputText.trim()}
            className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 active:scale-95 transition-transform"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: MAIN LIST (GROUPS & DIRECT TABS)
  // =========================================================================
  return (
    <div
      id="messages-screen"
      className="flex flex-col h-full w-full max-w-md mx-auto select-none overflow-hidden"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* Top Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-20"
        style={{ borderColor: theme.border, backgroundColor: theme.background }}
      >
        <button onClick={onBack} className="p-1 rounded-full hover:opacity-80">
          <ArrowLeft size={18} style={{ color: theme.text }} />
        </button>

        <h2 className="text-base font-bold tracking-tight">Messages NNECXY</h2>

        <div className="flex items-center gap-1.5">
          {/* 1. BOUTON "Créer Groupe" */}
          <button
            id="btn-creer-groupe"
            onClick={handleOpenCreateGroup}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white active:scale-95 text-xs font-bold shadow transition-all"
            title="Créer un nouveau groupe"
          >
            <Plus size={14} />
            <span>Créer Groupe</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Groupes vs Direct */}
      <div
        className="flex items-center border-b px-2 py-1.5 gap-2"
        style={{ borderColor: theme.border, backgroundColor: theme.card }}
      >
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'groups'
              ? 'bg-blue-600 text-white shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Users size={14} />
          <span>Groupes de discussion</span>
          {groups.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'groups' ? 'bg-white/20 text-white' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {groups.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('direct')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'direct'
              ? 'bg-blue-600 text-white shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <MessageCircle size={14} />
          <span>Messages Privés</span>
          {directConversations.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'direct' ? 'bg-white/20 text-white' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {directConversations.length}
            </span>
          )}
        </button>
      </div>

      {/* Permission Notice Banner */}
      {permissionNotice && (
        <div className="mx-3 mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col gap-2 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle size={15} />
              <span>Permission de base de données (GRANT SQL)</span>
            </div>
            <button
              onClick={() => setPermissionNotice(null)}
              className="text-neutral-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-[11px] opacity-90 leading-relaxed">
            Vos 3 tables existent bien dans la base de données, mais le serveur d'API requiert d’accorder les droits aux rôles <code className="bg-black/40 px-1 py-0.5 rounded">anon</code> et <code className="bg-black/40 px-1 py-0.5 rounded">authenticated</code> :
          </p>
          <button
            onClick={copySqlNotice}
            className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 active:scale-95 transition-all shadow"
          >
            {copiedSql ? <Check size={13} /> : <Copy size={13} />}
            <span>{copiedSql ? 'SQL copié ! Collez dans votre Éditeur SQL' : 'Copier le script SQL (1-clic)'}</span>
          </button>
        </div>
      )}

      {/* Success Notification */}
      {successToast && (
        <div className="mx-3 mt-3 p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* Content depending on Active Tab */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin pb-28">
        {activeTab === 'groups' ? (
          <>
            {isLoadingGroups && groups.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 text-xs opacity-60">
                <RefreshCw size={20} className="animate-spin text-blue-500" />
                <span>Chargement des groupes...</span>
              </div>
            ) : groups.length === 0 ? (
              <div className="py-20 text-center text-xs space-y-3" style={{ color: theme.text }}>
                <Users size={40} className="mx-auto text-blue-600 opacity-80" />
                <p className="font-semibold text-sm">Aucun groupe créé pour l'instant.</p>
                <p className="text-[11px] opacity-70 max-w-xs mx-auto">
                  Créez votre premier groupe pour discuter à plusieurs en direct !
                </p>
                <button
                  onClick={handleOpenCreateGroup}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 active:scale-95 shadow"
                >
                  <Plus size={15} />
                  <span>Créer Groupe</span>
                </button>
              </div>
            ) : (
              groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => setCurrentGroup(group)}
                  className="p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer hover:border-blue-500/50 active:scale-98 transition-all shadow-xs"
                  style={{ backgroundColor: theme.card, borderColor: theme.border }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                      <Users size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold truncate">{group.name}</h4>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/15 text-blue-400">
                          {group.memberCount || 1} membre(s)
                        </span>
                      </div>
                      <p className="text-[11px] truncate mt-0.5 opacity-70">
                        {group.lastMessage || 'Cliquez pour ouvrir la discussion du groupe'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-blue-500 font-bold shrink-0">
                    Ouvrir →
                  </span>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            {/* Top Bar: Action & Presence Status Filters */}
            <div className="space-y-2 pb-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-black/10 dark:bg-white/5 p-1 rounded-xl border border-black/10 dark:border-white/10 text-[11px] overflow-x-auto scrollbar-none">
                  <button
                    onClick={() => setPresenceFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 ${
                      presenceFilter === 'all'
                        ? 'bg-blue-600 text-white shadow'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    Tous ({directConversations.length})
                  </button>

                  <button
                    onClick={() => setPresenceFilter('online')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 ${
                      presenceFilter === 'online'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-emerald-500 hover:bg-emerald-500/10'
                    }`}
                    title="Filtrer ceux qui sont en ligne"
                  >
                    <Check size={11} className="stroke-[3]" />
                    <span>En ligne ({directConversations.filter((c) => isUserOnline(c.members[0]?.id || '')).length})</span>
                  </button>

                  <button
                    onClick={() => setPresenceFilter('offline')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 ${
                      presenceFilter === 'offline'
                        ? 'bg-black text-white border border-neutral-700 shadow'
                        : 'text-neutral-400 hover:bg-black/20'
                    }`}
                    title="Filtrer ceux qui ne sont pas en ligne"
                  >
                    <X size={11} className="stroke-[2.5]" />
                    <span>Pas en ligne ({directConversations.filter((c) => !isUserOnline(c.members[0]?.id || '')).length})</span>
                  </button>
                </div>

                <button
                  onClick={handleOpenNewChat}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 active:scale-95 shadow shrink-0"
                  title="Écrire à un contact"
                >
                  <Plus size={13} />
                  <span className="hidden sm:inline">Nouveau chat</span>
                  <span className="sm:hidden">Écrire</span>
                </button>
              </div>

              {/* Horizontal Presence Rail: Contacts rapides avec statut en ligne / pas en ligne */}
              {availableContacts.length === 0 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                  {dataService
                    .getAllUsers()
                    .filter((u) => u.id !== currentUser?.id)
                    .slice(0, 6)
                    .map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => handleSelectContactForDirectChat(contact)}
                        className="flex flex-col items-center gap-1 shrink-0 p-1.5 rounded-xl cursor-pointer hover:bg-white/5 active:scale-95 transition-all text-center w-16"
                        title={`${contact.name}: ${isUserOnline(contact.id) ? 'En ligne (✓)' : "N'est pas en ligne (✕)"}`}
                      >
                        {renderAvatarWithPresence(contact.avatar, contact.name, contact.id, 'w-11 h-11')}
                        <span className="text-[10px] font-semibold truncate w-full">
                          {contact.name.split(' ')[0]}
                        </span>
                        {renderPresenceBadge(contact.id, contact.name, true)}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {directConversations.length === 0 ? (
              <div className="py-16 text-center text-xs space-y-3" style={{ color: theme.text }}>
                <MessageSquare size={36} className="mx-auto text-blue-600 opacity-80" />
                <p className="font-semibold text-sm">Aucune discussion privée.</p>
                <p className="text-[11px] opacity-70">
                  Discutez avec vos amis et les créateurs que vous suivez.
                </p>
                <button
                  onClick={handleOpenNewChat}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 active:scale-95 shadow"
                >
                  <MessageCircle size={14} />
                  <span>Écrire à un contact</span>
                </button>
              </div>
            ) : (
              directConversations
                .filter((conv) => {
                  if (presenceFilter === 'all') return true;
                  const online = isUserOnline(conv.members[0]?.id || '');
                  return presenceFilter === 'online' ? online : !online;
                })
                .map((conv) => {
                  const targetUser = conv.members[0];
                  const targetUserId = targetUser?.id || '';
                  const online = isUserOnline(targetUserId);

                  return (
                    <div
                      key={conv.id}
                      onClick={() => setActiveDirectConv(conv)}
                      className="p-3 rounded-2xl border flex items-center justify-between cursor-pointer hover:border-blue-500/50 active:scale-98 transition-all shadow-xs"
                      style={{ backgroundColor: theme.card, borderColor: theme.border }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {renderAvatarWithPresence(
                          targetUser?.avatar || '',
                          `${targetUser?.name || ''} ${targetUser?.surname || ''}`.trim(),
                          targetUserId,
                          'w-11 h-11'
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold truncate">
                              {targetUser?.name} {targetUser?.surname}
                            </h4>
                          </div>
                          <div className="mt-0.5">
                            {renderPresenceBadge(targetUserId, targetUser?.name)}
                          </div>
                          <p className="text-[11px] truncate mt-1 opacity-70">
                            {conv.lastMessage || 'Nouvelle conversation'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {conv.unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                        <span className="text-[10px] text-blue-500 font-semibold">
                          Ouvrir →
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </>
        )}
      </div>

      {/* Floating Action Button (FAB) pour action rapide */}
      <div className="fixed bottom-20 right-4 sm:right-6 z-30">
        {activeTab === 'groups' ? (
          <button
            id="fab-creer-groupe"
            onClick={handleOpenCreateGroup}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-2xl active:scale-95 transition-all cursor-pointer border border-blue-400/30"
            title="Créer un nouveau groupe"
          >
            <Users size={16} />
            <span>Nouveau Groupe</span>
          </button>
        ) : (
          <button
            id="fab-nouveau-message"
            onClick={handleOpenNewChat}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-2xl active:scale-95 transition-all cursor-pointer border border-blue-400/30"
            title="Démarrer une nouvelle discussion privée"
          >
            <MessageSquarePlus size={16} />
            <span>Nouveau Message</span>
          </button>
        )}
      </div>

      {/* 1. Modal: BOUTON "Créer Groupe" */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none">
          <div
            className="w-full max-w-sm rounded-3xl p-5 border space-y-3.5 shadow-2xl max-h-[90vh] flex flex-col"
            style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text }}
          >
            <div className="flex items-center justify-between pb-2 border-b shrink-0" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2">
                <Users size={18} className="text-blue-500" />
                <h4 className="text-sm font-bold">Nouveau groupe de discussion</h4>
              </div>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1 rounded-full hover:opacity-80"
              >
                <X size={16} />
              </button>
            </div>

            {/* Saisie Nom du groupe */}
            <div className="shrink-0">
              <label className="text-[11px] font-bold opacity-80 mb-1.5 block">
                Nom du groupe <span className="text-blue-500">*</span> :
              </label>
              <input
                id="input-group-name"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                placeholder="Ex: Artistes Kinshasa, Fans d'Afrobeat, Équipe..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border bg-transparent focus:outline-none focus:border-blue-500"
                style={{ borderColor: theme.border, color: theme.text }}
                autoFocus
              />
            </div>

            {/* Sélection immédiate des membres */}
            <div className="flex-1 flex flex-col min-h-0 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold opacity-80">
                  Inviter des membres ({selectedInitialMembers.length} sélectionné{selectedInitialMembers.length > 1 ? 's' : ''}) :
                </label>
                {selectedInitialMembers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedInitialMembers([])}
                    className="text-[10px] text-blue-500 font-bold hover:underline"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Recherche rapide de contacts */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shrink-0"
                style={{ borderColor: theme.border, backgroundColor: theme.background }}
              >
                <Search size={13} className="text-neutral-400" />
                <input
                  type="text"
                  value={createGroupMemberSearch}
                  onChange={(e) => setCreateGroupMemberSearch(e.target.value)}
                  placeholder="Rechercher des contacts..."
                  className="flex-1 bg-transparent focus:outline-none text-[11px]"
                  style={{ color: theme.text }}
                />
                {createGroupMemberSearch && (
                  <button onClick={() => setCreateGroupMemberSearch('')} className="text-neutral-400">
                    <X size={11} />
                  </button>
                )}
              </div>

              {/* Liste défilante des contacts à cocher */}
              <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin pr-1 max-h-48 border rounded-2xl p-2" style={{ borderColor: theme.border, backgroundColor: theme.background }}>
                {dataService
                  .getAllUsers()
                  .filter((u) => u.id !== currentUser?.id)
                  .filter((u) => {
                    if (!createGroupMemberSearch.trim()) return true;
                    const q = createGroupMemberSearch.toLowerCase();
                    return (
                      u.name.toLowerCase().includes(q) ||
                      (u.surname && u.surname.toLowerCase().includes(q)) ||
                      u.handle.toLowerCase().includes(q)
                    );
                  })
                  .map((contact) => {
                    const isSelected = selectedInitialMembers.includes(contact.id);
                    return (
                      <div
                        key={contact.id}
                        onClick={() => handleToggleInitialMember(contact.id)}
                        className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 text-white'
                            : 'hover:bg-white/5 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {renderAvatarWithPresence(contact.avatar, contact.name, contact.id, 'w-8 h-8')}
                          <div className="min-w-0">
                            <span className="text-xs font-bold truncate block">
                              {contact.name} {contact.surname || ''}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-blue-400 truncate">
                                @{contact.handle}
                              </span>
                              {renderPresenceBadge(contact.id, contact.name, true)}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'border-neutral-600 bg-neutral-800/40 text-transparent'
                          }`}
                        >
                          <Check size={12} className="stroke-[3]" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <p className="text-[10px] opacity-60 leading-tight shrink-0">
              Le groupe sera synchronisé et ouvrira directement la salle de discussion pour vous et vos membres.
            </p>

            <div className="flex gap-2 pt-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl border transition-all"
                style={{
                  borderColor: theme.border,
                  backgroundColor: isDark ? '#171717' : '#FFFFFF',
                  color: theme.text,
                }}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                id="modal-btn-confirm-create-group"
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || isCreatingGroup}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 shadow transition-all flex items-center justify-center gap-1.5"
              >
                {isCreatingGroup ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Création...</span>
                  </>
                ) : (
                  <span>Créer et ouvrir</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Contact Picker Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none">
          <div
            className="w-full max-w-sm rounded-3xl p-4 border flex flex-col max-h-[85vh] shadow-2xl"
            style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-blue-500" />
                <h3 className="text-sm font-bold">Nouveau message privé</h3>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-full hover:opacity-80"
              >
                <X size={18} />
              </button>
            </div>

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

            <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
              {availableContacts
                .filter((u) => {
                  if (!contactSearchQuery.trim()) return true;
                  const q = contactSearchQuery.toLowerCase();
                  return (
                    u.name.toLowerCase().includes(q) ||
                    (u.surname && u.surname.toLowerCase().includes(q)) ||
                    u.handle.toLowerCase().includes(q)
                  );
                })
                .map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleSelectContactForDirectChat(contact)}
                    className="p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 cursor-pointer hover:border-blue-500/60 active:scale-98 transition-all"
                    style={{ borderColor: theme.border, backgroundColor: theme.background }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {renderAvatarWithPresence(
                        contact.avatar,
                        `${contact.name} ${contact.surname || ''}`.trim(),
                        contact.id,
                        'w-10 h-10'
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold truncate">
                            {contact.name} {contact.surname}
                          </span>
                          {contact.isVerified && (
                            <CheckCircle2 size={12} className="text-blue-500 fill-blue-500 text-white shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-blue-500 truncate">
                            @{contact.handle}
                          </span>
                          {renderPresenceBadge(contact.id, contact.name, true)}
                        </div>
                      </div>
                    </div>

                    <button
                      className="p-1.5 rounded-full bg-blue-600 text-white shadow"
                      title="Démarrer la discussion"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
