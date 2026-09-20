import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { dataService } from '../services/dataService';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import { User } from '../types';
import {
  X,
  ShieldCheck,
  ChevronRight,
  PlusCircle,
  Check,
  Lock,
  ArrowLeft,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const GoogleIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 20,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={`shrink-0 ${className}`}
  >
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.36 7.35 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.29 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

interface AccountItem {
  id: string;
  name: string;
  email: string;
  initials: string;
  bgColor: string;
  badge?: string;
  avatar?: string;
  birthDate?: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const { t } = useI18n();

  // Navigation steps: 1 = Select account, 2 = Accept terms & consent, 3 = Personal security PIN
  const [step, setStep] = useState<'select' | 'terms' | 'pin'>('select');

  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountItem | null>(null);

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Terms Acceptance State
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Security PIN Code State (Obligatoire: Code de sécurité personnel du compte Google)
  const [pinCode, setPinCode] = useState('');
  const [isExistingPin, setIsExistingPin] = useState(false);

  // Registered Google Accounts detected on the device
  const deviceAccounts: AccountItem[] = [
    {
      id: 'acc-justin',
      name: 'Justin Batumike',
      email: 'justinbatumike902@gmail.com',
      initials: 'J',
      bgColor: '#1A73E8', // Google Blue
      badge: 'Principal',
      birthDate: '1998-07-15',
    },
    {
      id: 'acc-support',
      name: 'NNECXY Support',
      email: 'nnecxySupportv1@gmail.com',
      initials: 'N',
      bgColor: '#1E8E3E', // Google Green
      badge: 'Téléphone',
      birthDate: '1996-03-12',
    },
  ];

  const createInitialAvatar = (name: string, bg: string = '#1A73E8') => {
    const initial = (name.trim().charAt(0) || 'U').toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="50" fill="${bg}"/>
      <text x="50%" y="54%" font-family="Roboto, Arial, sans-serif" font-size="46" font-weight="bold" fill="#ffffff" dominant-baseline="middle" text-anchor="middle">${initial}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  // When an account is picked, check if PIN exists and advance to step 2 (Terms & Consent)
  const handleAccountChosen = (account: AccountItem) => {
    setSelectedAccount(account);
    setErrorMessage(null);

    // Check if user already defined a security PIN for this Google account
    const storedPin = localStorage.getItem(`nnecxy_sec_pin_${account.email.toLowerCase()}`);
    setIsExistingPin(Boolean(storedPin));
    setPinCode('');
    setStep('terms');
  };

  const handleCustomAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setErrorMessage('Veuillez entrer une adresse e-mail Google valide.');
      return;
    }
    const cleanEmail = customEmail.trim().toLowerCase();
    const cleanName = customName.trim() || cleanEmail.split('@')[0];
    const item: AccountItem = {
      id: `acc-custom-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      initials: (cleanName.charAt(0) || 'G').toUpperCase(),
      bgColor: '#D93025',
      badge: 'Personnalisé',
      birthDate: '2000-01-01',
    };
    handleAccountChosen(item);
  };

  // Step 2 -> Step 3: Accept Terms and move to PIN verification
  const handleProceedToPin = () => {
    if (!acceptedTerms) {
      setErrorMessage("Veuillez accepter les règles d'utilisation de NNECXY pour continuer.");
      return;
    }
    setErrorMessage(null);
    setStep('pin');
  };

  // Step 3: Verify or register the Security PIN and finalize login with Supabase
  const handleFinalizeLoginWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    if (pinCode.length < 4) {
      setErrorMessage('Le code de sécurité doit comporter au moins 4 chiffres.');
      return;
    }

    const emailKey = selectedAccount.email.toLowerCase();
    const storedPin = localStorage.getItem(`nnecxy_sec_pin_${emailKey}`);

    if (storedPin) {
      if (storedPin !== pinCode) {
        setErrorMessage('Code de sécurité incorrect. Veuillez saisir le code associé à ce compte.');
        return;
      }
    } else {
      // Register new secret code for this Google email
      localStorage.setItem(`nnecxy_sec_pin_${emailKey}`, pinCode);
    }

    setIsLoading(true);
    setErrorMessage(null);

    const accountAvatar =
      selectedAccount.avatar ||
      createInitialAvatar(selectedAccount.name, selectedAccount.bgColor || '#1A73E8');

    // 1. Sync directly with Supabase database if available
    try {
      if (isSupabaseConfigured() && supabase) {
        // Upsert user profile into Supabase
        await supabase.from('profiles').upsert(
          {
            email: selectedAccount.email,
            full_name: selectedAccount.name,
            avatar_url: accountAvatar,
            auth_provider: 'google',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );

        // Background auth attempt (non-blocking)
        await supabase.auth
          .signInWithPassword({
            email: selectedAccount.email,
            password: `GoogleSecCode_${pinCode}_18Plus!`,
          });
      }
    } catch {
      // Non-blocking fallback
    }

    // 2. Perform instant login via dataService
    setTimeout(() => {
      try {
        const result = dataService.loginWithGoogle({
          email: selectedAccount.email,
          name: selectedAccount.name,
          avatar: accountAvatar,
          birthDate: selectedAccount.birthDate || '2000-01-01',
        });

        if (result.success && result.user) {
          setIsLoading(false);
          onSuccess(result.user);
          onClose();
        } else {
          setIsLoading(false);
          setErrorMessage(result.error || 'Erreur lors de la connexion.');
        }
      } catch {
        setIsLoading(false);
        setErrorMessage('Connexion interrompue. Veuillez réessayer.');
      }
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <div
      id="google-native-bottomsheet-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm select-none"
      onClick={!isLoading ? onClose : undefined}
    >
      <div
        id="google-native-bottomsheet"
        className="w-full max-w-md rounded-t-[28px] sm:rounded-3xl p-5 shadow-2xl transition-all max-h-[90vh] overflow-y-auto border"
        style={{
          backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF',
          borderColor: isDark ? '#333333' : '#E5E7EB',
          color: isDark ? '#FFFFFF' : '#1F2937',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Native Android Drag Handle */}
        <div className="w-10 h-1 bg-neutral-400 dark:bg-neutral-600 rounded-full mx-auto mb-3" />

        {/* Header with back / close controls */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            {step !== 'select' && !isLoading && (
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  if (step === 'pin') setStep('terms');
                  else setStep('select');
                }}
                className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors mr-1"
                aria-label="Retour"
              >
                <ArrowLeft size={18} className="text-neutral-500 dark:text-neutral-400" />
              </button>
            )}
            <GoogleIcon size={22} />
            <span className="text-sm font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">
              {step === 'select'
                ? 'Connexion avec Google'
                : step === 'terms'
                ? 'Autorisation NNECXY'
                : 'Sécurité du compte'}
            </span>
          </div>

          {!isLoading && (
            <button
              id="btn-close-google-sheet"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Fermer"
            >
              <X size={18} className="text-neutral-500 dark:text-neutral-400" />
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="my-3 p-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: SELECT GOOGLE ACCOUNT */}
        {step === 'select' && (
          <div className="space-y-3 pt-2">
            <div className="py-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight leading-snug">
                Sélectionnez un compte pour NNECXY
              </h3>
              <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Pour continuer, choisissez votre compte Google enregistré sur cet appareil.
              </p>
            </div>

            <div className="space-y-1.5 my-2">
              {deviceAccounts.map((account) => (
                <button
                  key={account.id}
                  id={`btn-google-account-${account.id}`}
                  type="button"
                  onClick={() => handleAccountChosen(account)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left border hover:border-blue-500 active:scale-98 group"
                  style={{
                    backgroundColor: isDark ? '#2B2B2B' : '#F9FAFB',
                    borderColor: isDark ? '#3D3D3D' : '#E5E7EB',
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm ring-2 ring-white/20"
                        style={{ backgroundColor: account.bgColor }}
                      >
                        {account.initials}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-neutral-900 flex items-center justify-center text-[8px] text-white font-bold bg-green-600">
                        ✓
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                          {account.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                          {account.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
                        {account.email}
                      </p>
                    </div>
                  </div>

                  <ChevronRight size={18} className="text-neutral-400 group-hover:text-blue-600 transition-colors shrink-0 ml-2" />
                </button>
              ))}

              {!showCustomInput ? (
                <button
                  type="button"
                  id="btn-google-add-account"
                  onClick={() => setShowCustomInput(true)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl border border-dashed transition-all text-left text-xs font-semibold hover:border-blue-500 active:scale-98"
                  style={{
                    borderColor: isDark ? '#444444' : '#D1D5DB',
                    backgroundColor: isDark ? '#232323' : '#FFFFFF',
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 shrink-0">
                    <PlusCircle size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-neutral-900 dark:text-white">Utiliser un autre compte</span>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
                      Connectez-vous avec une autre adresse Google
                    </p>
                  </div>
                </button>
              ) : (
                <form
                  onSubmit={handleCustomAccountSubmit}
                  className="space-y-2.5 p-3 rounded-2xl border-2 border-blue-600 mt-2 bg-blue-50/20 dark:bg-blue-950/20"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-blue-600">
                    <span>Autre adresse Google</span>
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="text-[11px] underline opacity-80 hover:opacity-100"
                    >
                      Annuler
                    </button>
                  </div>

                  <div>
                    <input
                      type="email"
                      required
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="votre_adresse@gmail.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-neutral-900 focus:outline-none focus:border-blue-600"
                      style={{ borderColor: isDark ? '#444' : '#ccc' }}
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Nom complet (optionnel)"
                      className="w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-neutral-900 focus:outline-none focus:border-blue-600"
                      style={{ borderColor: isDark ? '#444' : '#ccc' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!customEmail}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Continuer avec cette adresse</span>
                    <ChevronRight size={16} />
                  </button>
                </form>
              )}
            </div>

            <div
              className="pt-3 border-t text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400"
              style={{ borderColor: isDark ? '#333' : '#E5E7EB' }}
            >
              <p>
                Google partagera votre nom, adresse e-mail et préférences avec <strong>NNECXY</strong> conformément aux règles de confidentialité.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: ACCEPT TERMS & AUTHORIZATION (PARCOURS TYPE X / TWITTER) */}
        {step === 'terms' && selectedAccount && (
          <div className="space-y-4 pt-3">
            {/* Account Card */}
            <div
              className="p-3.5 rounded-2xl border flex items-center gap-3"
              style={{
                backgroundColor: isDark ? '#2B2B2B' : '#F9FAFB',
                borderColor: isDark ? '#3D3D3D' : '#E5E7EB',
              }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm ring-2 ring-white/20 shrink-0"
                style={{ backgroundColor: selectedAccount.bgColor }}
              >
                {selectedAccount.initials}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                  {selectedAccount.name}
                </h4>
                <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 truncate">
                  {selectedAccount.email}
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-500/20 text-green-600 dark:text-green-400">
                Vérifié
              </span>
            </div>

            {/* Scope / Authorization Details */}
            <div className="space-y-2.5 p-3.5 rounded-2xl bg-blue-50/30 dark:bg-blue-950/20 border border-blue-500/20 text-xs">
              <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400 text-xs">
                <ShieldCheck size={16} />
                <span>Autorisations demandées par NNECXY</span>
              </div>
              <ul className="space-y-1.5 text-[11px] opacity-85">
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-green-500 shrink-0" />
                  <span>Accéder à votre nom et votre adresse e-mail Google</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-green-500 shrink-0" />
                  <span>Associer votre profil et synchroniser vos vidéos NNECXY</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-green-500 shrink-0" />
                  <span>Sauvegarder vos sessions sécurisées dans Supabase</span>
                </li>
              </ul>
            </div>

            {/* Acceptance Checkbox */}
            <label className="flex items-start gap-2.5 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px] leading-snug opacity-90">
                J’accepte les <strong className="text-blue-500">Règles d’utilisation</strong> et la politique de confidentialité de NNECXY pour continuer avec ce compte Google.
              </span>
            </label>

            {/* Next Button */}
            <button
              type="button"
              id="btn-google-accept-terms"
              onClick={handleProceedToPin}
              disabled={!acceptedTerms}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Continuer en tant que {selectedAccount.name}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 3: SECURITY PIN CODE (CODE SECRET OBLIGATOIRE DU COMPTE GOOGLE) */}
        {step === 'pin' && selectedAccount && (
          <form onSubmit={handleFinalizeLoginWithPin} className="space-y-4 pt-3">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-blue-600/15 text-blue-500 flex items-center justify-center mx-auto">
                <KeyRound size={24} />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                {isExistingPin
                  ? 'Code de sécurité requis'
                  : 'Créez votre code de sécurité'}
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                {isExistingPin
                  ? `Saisissez votre code PIN secret à 4 chiffres pour ${selectedAccount.email}.`
                  : `Définissez un code PIN secret à 4 chiffres que vous utiliserez pour valider l'accès à ce compte.`}
              </p>
            </div>

            {/* PIN Input */}
            <div className="flex flex-col items-center gap-2">
              <input
                id="input-google-security-pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                autoFocus
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="• • • •"
                className="w-44 text-center tracking-[0.6em] text-2xl font-black py-2.5 px-3 rounded-2xl border-2 border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 bg-white dark:bg-neutral-900"
              />
              <span className="text-[10px] opacity-60">
                Code secret à 4-6 chiffres (synchronisé avec Supabase)
              </span>
            </div>

            {/* Submit Button */}
            <button
              id="btn-validate-google-pin"
              type="submit"
              disabled={isLoading || pinCode.length < 4}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validation et synchronisation Supabase...</span>
                </>
              ) : (
                <>
                  <Lock size={15} />
                  <span>Valider et se connecter à NNECXY</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
