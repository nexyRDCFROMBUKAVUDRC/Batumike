import React, { useEffect } from 'react';
import { supabase } from '../services/supabase';
import { dataService } from '../services/dataService';
import { NnecxyLogo } from '../components/NnecxyLogo';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface AuthCallbackScreenProps {
  onNavigate: (route: '/login' | '/finish-profile' | '/feed') => void;
}

export const AuthCallbackScreen: React.FC<AuthCallbackScreenProps> = ({ onNavigate }) => {
  const { theme } = useTheme();

  useEffect(() => {
    let mounted = true;

    const processAuth = async () => {
      try {
        // 2. ECRAN CALLBACK /auth/callback :
        // Apres retour de Google, fais :
        // const { data: { session } } = await supabase.auth.getSession()
        // Si pas de session, reste sur login. Si session OK, continue.
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          if (mounted) onNavigate('/login');
          return;
        }

        // 3. VERIFICATION BASE DE DONNEES (C'EST LA PARTIE OU LA BASE COMPREND) :
        // Fais : const { data: profile } = await supabase.from('profiles').select('username').eq('id', session.user.id).single()
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();

        if (!mounted) return;

        // 4. ROUTAGE STANDARD D'AUTHENTIFICATION :
        // - Si profile == null ou profile.username == null : C'est un nouveau comme KX la premiere fois -> navigate('/finish-profile')
        // - Si profile.username existe : C'est un ancien -> navigate('/feed')
        if (profile == null || profile.username == null) {
          onNavigate('/finish-profile');
        } else {
          // Récupération complète pour initialiser le session user
          const { data: fullProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          const user = {
            id: session.user.id,
            name: fullProfile?.name || session.user.user_metadata?.full_name || profile.username,
            surname: fullProfile?.surname || '',
            email: fullProfile?.email || session.user.email,
            handle: fullProfile?.username || profile.username,
            avatar:
              fullProfile?.avatar_url ||
              session.user.user_metadata?.avatar_url ||
              session.user.user_metadata?.picture ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            bio: fullProfile?.bio || 'Membre certifié NNECXY ✨',
            birthDate: fullProfile?.birthdate || fullProfile?.birth_date || '2000-01-01',
            followersCount: fullProfile?.followers_count || 0,
            followingCount: fullProfile?.following_count || 0,
            totalLikes: fullProfile?.likes_count || 0,
            isVerified: fullProfile?.is_verified || false,
            authProvider: 'google',
            createdAt: fullProfile?.created_at || new Date().toISOString(),
          };

          dataService.setCurrentUser(user as any);
          onNavigate('/feed');
        }
      } catch (err) {
        console.error('Erreur callback auth:', err);
        if (mounted) onNavigate('/login');
      }
    };

    processAuth();

    return () => {
      mounted = false;
    };
  }, [onNavigate]);

  return (
    <div
      id="screen-auth-callback"
      className="min-h-full w-full flex flex-col items-center justify-center p-6 select-none"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <NnecxyLogo size="lg" watermark={true} transparent={true} />
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
          <Loader2 size={18} className="animate-spin text-blue-500" />
          <span>Connexion avec Google...</span>
        </div>
      </div>
    </div>
  );
};
