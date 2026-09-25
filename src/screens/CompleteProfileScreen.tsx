import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { dataService } from '../services/dataService';
import { User } from '../types';
import { NnecxyLogo } from '../components/NnecxyLogo';
import { ModernDatePicker } from '../components/ModernDatePicker';
import {
  Camera,
  CheckCircle2,
  XCircle,
  Loader2,
  AtSign,
  User as UserIcon,
  ShieldCheck,
  AlertCircle,
  LogOut,
} from 'lucide-react';

export interface ProfilePrefillData {
  id: string;
  email: string;
  name: string;
  surname: string;
  avatarUrl: string;
  suggestedUsername: string;
}

interface CompleteProfileScreenProps {
  prefill: ProfilePrefillData;
  onComplete: (user: User) => void;
  onCancel: () => void;
}

export const CompleteProfileScreen: React.FC<CompleteProfileScreenProps> = ({
  prefill,
  onComplete,
  onCancel,
}) => {
  const { theme, isDark } = useTheme();
  const { t } = useI18n();

  const [avatarUrl, setAvatarUrl] = useState(prefill.avatarUrl || '');
  const [lastName, setLastName] = useState(prefill.surname || ''); // Nom de famille
  const [postNom, setPostNom] = useState(''); // Post-nom (poste nim)
  const [firstName, setFirstName] = useState(prefill.name || ''); // Prénom (pre nom)
  const [username, setUsername] = useState(prefill.suggestedUsername || '');

  // Date of Birth
  const [birthDate, setBirthDate] = useState('2000-01-01');

  // Username validation state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [usernameFeedback, setUsernameFeedback] = useState<string | null>(null);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Calculate age dynamically
  const age = dataService.calculateAge(birthDate);
  const isAdult = age >= 18;

  // Real-time username availability debounce check
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
        const available = await dataService.isUsernameAvailable(clean, prefill.id);
        setIsUsernameAvailable(available);
        setUsernameFeedback(available ? 'Nom d’utilisateur disponible' : 'Ce nom est déjà pris.');
      } catch {
        setIsUsernameAvailable(true);
        setUsernameFeedback(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, prefill.id]);

  // Handle local avatar upload
  const handleAvatarPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  // Submit profile completion to Supabase profiles table
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!lastName.trim() || !postNom.trim() || !firstName.trim()) {
      setErrorMessage('Le Nom, le Post-nom et le Prénom sont obligatoires.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage('Nom d’utilisateur invalide.');
      return;
    }

    if (!isAdult) {
      setErrorMessage('Vous devez avoir au moins 18 ans pour vous inscrire sur NNECXY.');
      return;
    }

    if (!isUsernameAvailable) {
      setErrorMessage('Veuillez choisir un nom d’utilisateur disponible.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await dataService.completeUserProfile({
        id: prefill.id,
        username: cleanUsername,
        name: firstName.trim(),
        postNom: postNom.trim(),
        surname: lastName.trim(),
        birthDate,
        avatarUrl,
        email: prefill.email,
      });

      if (result.success && result.user) {
        onComplete(result.user);
      } else {
        setErrorMessage(result.error || 'Erreur lors de la création du profil.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erreur inattendue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="screen-complete-profile"
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
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400 transition-colors"
          title="Se déconnecter"
        >
          <LogOut size={14} />
          <span>Annuler</span>
        </button>
      </div>

      {/* Main Form Content */}
      <div className="my-auto py-6 max-w-sm w-full mx-auto">
        <div className="text-center space-y-1.5 mb-6">
          <h1 className="text-2xl font-black tracking-tight">Finaliser votre profil</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Bienvenue sur NNECXY ! Personnalisez votre identité officielle pour rejoindre la communauté.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-600/15 border border-red-500/40 text-red-500 text-xs flex items-start gap-2 animate-shake">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Picker */}
          <div className="flex flex-col items-center justify-center mb-2">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-xl group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 text-white shadow-lg active:scale-95 transition-transform"
                aria-label="Modifier la photo de profil"
              >
                <Camera size={14} />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarPicked}
            />
            <span className="text-[11px] text-zinc-400 mt-2">
              Photo synchronisée depuis Google (cliquez pour modifier)
            </span>
          </div>

          {/* Nom, Post-nom, Prénom */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 pb-1 border-b" style={{ borderColor: theme.border }}>
              <UserIcon size={14} className="text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.text }}>
                Identité officielle
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="ex: BATUMIKE"
                  className={`w-full px-3 py-2.5 rounded-xl border-2 text-xs font-bold uppercase outline-hidden transition-all ${
                    isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-zinc-100 border-zinc-300 text-black'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Post-nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={postNom}
                  onChange={(e) => setPostNom(e.target.value)}
                  required
                  placeholder="ex: KABAZI"
                  className={`w-full px-3 py-2.5 rounded-xl border-2 text-xs font-bold uppercase outline-hidden transition-all ${
                    isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-zinc-100 border-zinc-300 text-black'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="ex: Justin"
                  className={`w-full px-3 py-2.5 rounded-xl border-2 text-xs font-semibold capitalize outline-hidden transition-all ${
                    isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-zinc-100 border-zinc-300 text-black'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Unique Username Field */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Nom d’utilisateur unique NNECXY
            </label>
            <div className="relative flex items-center">
              <AtSign size={16} className="absolute left-3 text-blue-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                required
                maxLength={20}
                placeholder="ex: batumike_902"
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-xs font-bold outline-hidden transition-all ${
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

          {/* Date of Birth (Format: Jour | Mois | Année) */}
          <div className="pt-1">
            <ModernDatePicker
              value={birthDate}
              onChange={(d) => setBirthDate(d)}
              requiredAge={18}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              id="btn-complete-profile-submit"
              type="submit"
              disabled={
                isSubmitting ||
                !isAdult ||
                !lastName.trim() ||
                !postNom.trim() ||
                !firstName.trim() ||
                isUsernameAvailable !== true
              }
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Enregistrement du profil...</span>
                </>
              ) : (
                <>
                  <span>Commencer sur NNECXY</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
          <ShieldCheck size={14} className="text-blue-500 shrink-0" />
          <span>Profil sécurisé lié à votre compte Google unique</span>
        </div>
      </div>

      <div className="text-center text-[10px] text-zinc-500 pb-2">
        En cliquant sur Commencer, vous confirmez l'exactitude de vos informations et votre adhésion aux règles communautaires NNECXY.
      </div>
    </div>
  );
};
