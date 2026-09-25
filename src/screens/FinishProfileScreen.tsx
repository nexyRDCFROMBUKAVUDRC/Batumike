import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../services/supabase';
import { dataService } from '../services/dataService';
import { User } from '../types';
import { NnecxyLogo } from '../components/NnecxyLogo';
import {
  AtSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Sparkles,
  LogOut,
  ChevronRight,
} from 'lucide-react';

interface FinishProfileScreenProps {
  onSuccess: (user: User) => void;
  onCancel: () => void;
}

const AVAILABLE_INTERESTS = [
  'Danse & Chorégraphie',
  'Musique & Afrobeats',
  'Humour & Comédie',
  'Kinshasa & RDC Vibes',
  'Mode & Style',
  'Sport & Football',
  'Gaming & Jeux',
  'Cinéma & Actu',
  'Cuisine & Lifestyle',
  'Éducation & Tech',
];

export const FinishProfileScreen: React.FC<FinishProfileScreenProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { theme, isDark } = useTheme();

  // Current session info
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userFullName, setUserFullName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // 5. Champs obligatoires : username, birthdate (age >= 13), interests
  const [username, setUsername] = useState('');
  const [birthdate, setBirthdate] = useState('2004-01-01');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Kinshasa & RDC Vibes',
    'Musique & Afrobeats',
  ]);

  // Validation States
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [usernameFeedback, setUsernameFeedback] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load session from Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || '');
        const fullName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          '';
        setUserFullName(fullName);
        const avatar =
          session.user.user_metadata?.avatar_url ||
          session.user.user_metadata?.picture ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
        setAvatarUrl(avatar);

        // Suggest clean username
        const base = (session.user.email?.split('@')[0] || fullName || 'kx')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 15);
        if (base) {
          setUsername(base);
        }
      }
    });
  }, []);

  // Age calculation (age >= 13)
  const calculateAge = (dateString: string): number => {
    if (!dateString) return 0;
    const birth = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(birthdate);
  const isAgeValid = age >= 13;

  // Real-time username uniqueness check via supabase.from('profiles').select...
  useEffect(() => {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (!clean || clean.length < 3) {
      setIsUsernameAvailable(null);
      setUsernameFeedback('Au moins 3 caractères requis.');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(clean)) {
      setIsUsernameAvailable(false);
      setUsernameFeedback('Uniquement lettres, chiffres et tirets bas (_).');
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        let query = supabase.from('profiles').select('id, username').eq('username', clean);
        if (userId) {
          query = query.neq('id', userId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          setIsUsernameAvailable(false);
          setUsernameFeedback('Ce nom d’utilisateur est déjà pris.');
        } else {
          setIsUsernameAvailable(true);
          setUsernameFeedback('Nom d’utilisateur disponible');
        }
      } catch {
        setIsUsernameAvailable(true);
        setUsernameFeedback(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username, userId]);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter((i) => i !== interest));
      }
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  // Submit profile to Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage('Nom d’utilisateur invalide (minimum 3 caractères).');
      return;
    }

    if (!isAgeValid) {
      setErrorMessage('Vous devez avoir au moins 13 ans pour continuer.');
      return;
    }

    if (selectedInterests.length === 0) {
      setErrorMessage('Veuillez sélectionner au moins un centre d’intérêt.');
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const activeUid = session?.user?.id || userId;
      if (!activeUid) {
        setErrorMessage('Session expirée. Veuillez vous reconnecter.');
        setIsSubmitting(false);
        return;
      }

      // 5. Apres validation, fais supabase.from('profiles').update({ username, birthdate, interests }).eq('id', session.user.id)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: cleanUsername,
          birthdate,
          birth_date: birthdate,
          interests: selectedInterests,
        })
        .eq('id', activeUid);

      // If the row was not existing in profiles yet, upsert it
      if (updateError) {
        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: activeUid,
          username: cleanUsername,
          birthdate,
          birth_date: birthdate,
          interests: selectedInterests,
          email: session?.user?.email || userEmail,
          name: session?.user?.user_metadata?.full_name || userFullName || cleanUsername,
          avatar_url: avatarUrl,
          bio: 'Membre certifié NNECXY ✨',
          status: 'active',
          updated_at: new Date().toISOString(),
        });

        if (upsertError) {
          console.warn('Supabase upsert profile fallback notice:', upsertError);
        }
      }

      // Build and sync local User object
      const user: User = {
        id: activeUid,
        name: userFullName || cleanUsername,
        surname: '',
        email: userEmail,
        handle: cleanUsername,
        avatar: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        bio: 'Membre certifié NNECXY ✨',
        birthDate: birthdate,
        followersCount: 0,
        followingCount: 0,
        totalLikes: 0,
        isVerified: false,
        authProvider: 'google',
        createdAt: new Date().toISOString(),
      };

      dataService.setCurrentUser(user);

      // Navigate to /feed
      onSuccess(user);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erreur lors de l’enregistrement du profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="screen-finish-profile"
      className="min-h-full w-full flex flex-col justify-between p-6 select-none overflow-y-auto"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <NnecxyLogo size="sm" watermark={true} transparent={true} />
          <span className="text-xs font-black tracking-widest uppercase">NNECXY</span>
        </div>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 transition-colors py-1 px-2.5 rounded-lg border border-transparent hover:border-zinc-700"
          title="Annuler"
        >
          <LogOut size={13} />
          <span>Annuler</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="my-auto py-6 max-w-sm w-full mx-auto">
        <div className="text-center space-y-1.5 mb-6">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold text-blue-400 mb-1">
            <Sparkles size={12} />
            <span>Nouveau compte</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Finaliser votre profil</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Configurez votre nom d’utilisateur et vos préférences pour accéder au feed vidéo.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-600/15 border border-red-500/40 text-red-500 text-xs flex items-start gap-2 animate-shake">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Champ Obligatoire: Username avec vérification unicité */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Nom d’utilisateur unique <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <AtSign size={16} className="absolute left-3 text-blue-500" />
              <input
                id="input-finish-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                required
                maxLength={24}
                placeholder="ex: kx_kinshasa"
                className={`w-full pl-9 pr-10 py-3 rounded-xl border-2 text-xs font-bold outline-hidden transition-all ${
                  isUsernameAvailable === true
                    ? 'border-green-500 ring-1 ring-green-500/30'
                    : isUsernameAvailable === false
                    ? 'border-red-500 ring-1 ring-red-500/30'
                    : isDark
                    ? 'bg-zinc-900 border-zinc-700 text-white'
                    : 'bg-zinc-100 border-zinc-300 text-black'
                }`}
              />
              <div className="absolute right-3 flex items-center">
                {isCheckingUsername ? (
                  <Loader2 size={16} className="animate-spin text-blue-400" />
                ) : isUsernameAvailable === true ? (
                  <CheckCircle2 size={16} className="text-green-500" />
                ) : isUsernameAvailable === false ? (
                  <XCircle size={16} className="text-red-500" />
                ) : null}
              </div>
            </div>
            {usernameFeedback && (
              <p
                className={`text-[11px] mt-1 font-semibold ${
                  isUsernameAvailable === true
                    ? 'text-green-500'
                    : isUsernameAvailable === false
                    ? 'text-red-500'
                    : 'text-zinc-400'
                }`}
              >
                {usernameFeedback}
              </p>
            )}
          </div>

          {/* 2. Champ Obligatoire: Date de naissance (age >= 13) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Date de naissance <span className="text-red-500">*</span>
              </label>
              <span className={`text-[11px] font-bold ${isAgeValid ? 'text-green-500' : 'text-red-500'}`}>
                {age > 0 ? `${age} ans` : ''} {isAgeValid ? '(Valide >= 13)' : '(Minimum 13 ans requis)'}
              </span>
            </div>
            <div className="relative flex items-center">
              <Calendar size={16} className="absolute left-3 text-blue-500" />
              <input
                id="input-finish-birthdate"
                type="date"
                value={birthdate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setBirthdate(e.target.value)}
                required
                className={`w-full pl-9 pr-3 py-3 rounded-xl border-2 text-xs font-semibold outline-hidden transition-all ${
                  !isAgeValid
                    ? 'border-red-500'
                    : isDark
                    ? 'bg-zinc-900 border-zinc-700 text-white'
                    : 'bg-zinc-100 border-zinc-300 text-black'
                }`}
              />
            </div>
            {!isAgeValid && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">
                Conformément aux règles de sécurité, vous devez avoir au moins 13 ans.
              </p>
            )}
          </div>

          {/* 3. Champ Obligatoire: Centres d'intérêt (interests) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Centres d’intérêt <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-zinc-500">
                {selectedInterests.length} sélectionné(s)
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 rounded-xl border border-zinc-800/40">
              {AVAILABLE_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isDark
                        ? 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                        : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-finish-profile-submit"
              type="submit"
              disabled={isSubmitting || !isAgeValid || isUsernameAvailable === false || selectedInterests.length === 0}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <span>Accéder au Feed</span>
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="text-center text-[10px] text-zinc-500 pb-2">
        En validant votre profil, vous acceptez les conditions de la communauté NNECXY.
      </div>
    </div>
  );
};
