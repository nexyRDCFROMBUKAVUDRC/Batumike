import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { dataService } from '../services/dataService';
import { User } from '../types';
import { GoogleIcon, GoogleAuthModal } from './GoogleAuthModal';
import { NnecxyLogo } from './NnecxyLogo';
import {
  ArrowLeft,
  X,
  HelpCircle,
  User as UserIcon,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ChevronDown,
  RotateCw,
} from 'lucide-react';

export interface AuthViewProps {
  initialMode?: 'login' | 'signup';
  logoutNotice?: string | null;
  onSuccess: (user: User) => void;
  onBack?: () => void;
  onOpenRules?: (tab?: 'terms' | 'safety' | 'privacy') => void;
}

type SubScreen = 'methods' | 'form' | 'help';
type FormTab = 'phone' | 'email';

const COUNTRY_CODES = [
  { flag: '🇫🇷', code: '+33', country: 'France' },
  { flag: '🇨🇩', code: '+243', country: 'RDC' },
  { flag: '🇧🇪', code: '+32', country: 'Belgique' },
  { flag: '🇨🇭', code: '+41', country: 'Suisse' },
  { flag: '🇨🇦', code: '+1', country: 'Canada' },
  { flag: '🇺🇸', code: '+1', country: 'USA' },
  { flag: '🇨🇲', code: '+237', country: 'Cameroun' },
  { flag: '🇨🇮', code: '+225', country: 'Côte d’Ivoire' },
  { flag: '🇸🇳', code: '+221', country: 'Sénégal' },
];

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'login',
  logoutNotice,
  onSuccess,
  onBack,
  onOpenRules,
}) => {
  const { isDark, theme } = useTheme();
  const { t } = useI18n();

  // Primary mode: 'login' | 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [subScreen, setSubScreen] = useState<SubScreen>('methods');
  const [formTab, setFormTab] = useState<FormTab>('phone');

  // Google Modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Form State
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [timer, setTimer] = useState(0);

  const [identifier, setIdentifier] = useState('demo@nnecxy.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  // Sign up birthday verification (NNECXY 18+ requirement)
  const [birthYear, setBirthYear] = useState('2000');
  const [birthMonth, setBirthMonth] = useState('06');
  const [birthDay, setBirthDay] = useState('15');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Countdown timer for phone code
  React.useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendCode = () => {
    if (!phoneNumber.trim()) {
      setErrorMessage('Veuillez saisir votre numéro de téléphone.');
      return;
    }
    setErrorMessage(null);
    setCodeSent(true);
    setTimer(59);
    // Preset mock code for instant UX
    setVerificationCode('839201');
  };

  const handlePhoneSubmit = () => {
    setErrorMessage(null);
    if (!phoneNumber.trim()) {
      setErrorMessage('Numéro de téléphone requis.');
      return;
    }
    if (!verificationCode.trim()) {
      setErrorMessage('Code de vérification requis.');
      return;
    }

    setIsLoading(true);
    const fullPhone = `${selectedCountry.code}${phoneNumber.replace(/^0+/, '')}`;
    const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;
    const result = dataService.loginWithPhone(fullPhone, undefined, birthDate);
    setIsLoading(false);

    if (result.success && result.user) {
      onSuccess(result.user);
    } else {
      setErrorMessage(result.error || 'Erreur lors de la connexion par téléphone.');
    }
  };

  const handleEmailSubmit = () => {
    setErrorMessage(null);
    if (!identifier.trim() || !password) {
      setErrorMessage('Veuillez renseigner votre identifiant et mot de passe.');
      return;
    }

    setIsLoading(true);
    if (mode === 'login') {
      const result = dataService.login(identifier, password);
      setIsLoading(false);
      if (result.success && result.user) {
        onSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Identifiants incorrects.');
      }
    } else {
      // Sign up mode
      const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;
      const isEmail = identifier.includes('@');
      const cleanName = isEmail ? identifier.split('@')[0] : identifier;
      const result = dataService.register({
        name: cleanName,
        surname: 'Membre',
        email: isEmail ? identifier.trim() : `${identifier.trim()}@nnecxy.com`,
        password,
        birthDate,
      });
      setIsLoading(false);
      if (result.success && result.user) {
        onSuccess(result.user);
      } else {
        if (result.error === 'underage') {
          setErrorMessage('Vous devez avoir au moins 18 ans pour vous inscrire.');
        } else if (result.error === 'email_taken') {
          setErrorMessage('Cet e-mail est déjà associé à un compte.');
        } else {
          setErrorMessage(result.error || 'Erreur lors de l’inscription.');
        }
      }
    }
  };

  // Auth Button styling
  const authBtnClass = `relative w-full h-[46px] px-4 rounded-xl border-2 flex items-center justify-center transition-all duration-150 active:scale-[0.99] select-none text-[13px] font-semibold tracking-tight shadow-xs ${
    isDark
      ? 'bg-black border-white text-white hover:opacity-90'
      : 'bg-white border-black text-black hover:opacity-90'
  }`;

  return (
    <div
      id="nnecxy-auth-screen"
      className="relative flex flex-col justify-between h-full w-full max-w-md mx-auto select-none overflow-hidden"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* 1. NNECXY Top Navigation Bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0 z-10">
        {subScreen !== 'methods' ? (
          <button
            id="btn-auth-sub-back"
            onClick={() => {
              setSubScreen('methods');
              setErrorMessage(null);
            }}
            className="p-1 rounded-full hover:opacity-75 active:scale-95 transition-transform"
            aria-label="Retour"
          >
            <ArrowLeft size={22} style={{ color: theme.text }} />
          </button>
        ) : onBack ? (
          <button
            id="btn-auth-close"
            onClick={onBack}
            className="p-1 rounded-full hover:opacity-75 active:scale-95 transition-transform"
            aria-label="Fermer"
          >
            <X size={22} style={{ color: theme.text }} />
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Center label when in sub-form */}
        {subScreen === 'form' && (
          <span className="text-sm font-bold tracking-tight">
            {mode === 'login' ? 'Connexion' : 'Inscription'}
          </span>
        )}
        {subScreen === 'help' && (
          <span className="text-sm font-bold tracking-tight">Aide et support</span>
        )}
        {subScreen === 'methods' && <div className="w-1" />}

        {/* Right Help Button */}
        <button
          id="btn-auth-help"
          onClick={() => setSubScreen(subScreen === 'help' ? 'methods' : 'help')}
          className="p-1 rounded-full hover:opacity-80 active:scale-95 transition-transform"
          aria-label="Aide"
          title="Besoin d'aide ?"
          style={{ color: theme.text }}
        >
          <HelpCircle size={21} />
        </button>
      </div>

      {/* 2. Scrollable Body Content */}
      <div className="flex-1 overflow-y-auto px-6 py-2 scrollbar-none flex flex-col">
        {/* Optional Logout Notification Notice */}
        {logoutNotice && subScreen === 'methods' && (
          <div
            id="auth-logout-alert"
            className="mb-4 p-3 rounded-lg border-2 border-blue-600 bg-black text-white text-xs flex items-center gap-2.5 animate-fade-in"
          >
            <Check size={16} className="text-blue-500 shrink-0" />
            <span className="text-[12px] leading-snug">
              Session révoquée avec succès. Choisissez une méthode pour vous reconnecter.
            </span>
          </div>
        )}

        {/* ========================================================
            VIEW A: NNECXY AUTH METHODS
            (Exclusively: Téléphone/Email + Continuer avec Google)
           ======================================================== */}
        {subScreen === 'methods' && (
          <div className="my-auto space-y-6 py-2 animate-fade-in">
            {/* Header: Title & Subtitle */}
            <div className="text-center space-y-2 flex flex-col items-center">
              <NnecxyLogo size="lg" className="mb-1" />
              <h2 className="text-2xl font-bold tracking-tight">
                {mode === 'signup' ? 'Inscription à NNECXY' : 'Connexion à NNECXY'}
              </h2>
              <p className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: theme.text }}>
                {mode === 'signup'
                  ? 'Créez un profil, suivez d’autres comptes, créez vos propres vidéos et plus encore.'
                  : 'Gérez votre compte, consultez les notifications, commentez des vidéos et plus encore.'}
              </p>
            </div>

            {/* Exact Methods Kept: Téléphone/Email + Google Only */}
            <div className="space-y-3 pt-2">
              {/* 1. Phone / Email / Username */}
              <button
                id="btn-auth-method-phone-email"
                onClick={() => setSubScreen('form')}
                className={authBtnClass}
              >
                <div className="absolute left-4 flex items-center">
                  <UserIcon size={19} className={isDark ? 'text-white' : 'text-black'} />
                </div>
                <span>
                  {mode === 'signup'
                    ? 'Utiliser un téléphone ou une adresse e-mail'
                    : 'Utiliser un téléphone / e-mail / nom d’utilisateur'}
                </span>
              </button>

              {/* 2. Continue with Google */}
              <button
                id="btn-auth-method-google"
                onClick={() => setShowGoogleModal(true)}
                className={authBtnClass}
              >
                <div className="absolute left-4 flex items-center">
                  <GoogleIcon size={19} />
                </div>
                <span>Continuer avec Google</span>
              </button>
            </div>

            {/* NNECXY Legal Terms & Privacy Notice */}
            <div className="pt-3 text-center">
              <p className="text-[11px] leading-relaxed max-w-xs mx-auto" style={{ color: theme.text }}>
                {mode === 'signup' ? (
                  <>
                    En continuant, vous acceptez nos{' '}
                    <button
                      type="button"
                      id="btn-auth-link-terms"
                      onClick={() => onOpenRules?.('terms')}
                      className="font-bold underline text-blue-600 inline hover:opacity-80 active:scale-95 transition-transform"
                    >
                      Conditions d’utilisation
                    </button>{' '}
                    et confirmez avoir lu notre{' '}
                    <button
                      type="button"
                      id="btn-auth-link-privacy"
                      onClick={() => onOpenRules?.('safety')}
                      className="font-bold underline text-blue-600 inline hover:opacity-80 active:scale-95 transition-transform"
                    >
                      Politique d’utilisation & Sécurité
                    </button>
                    .
                  </>
                ) : (
                  <>
                    En continuant, vous acceptez les{' '}
                    <button
                      type="button"
                      id="btn-auth-link-terms"
                      onClick={() => onOpenRules?.('terms')}
                      className="font-bold underline text-blue-600 inline hover:opacity-80 active:scale-95 transition-transform"
                    >
                      Conditions d’utilisation
                    </button>{' '}
                    et confirmez avoir lu et compris notre{' '}
                    <button
                      type="button"
                      id="btn-auth-link-privacy"
                      onClick={() => onOpenRules?.('safety')}
                      className="font-bold underline text-blue-600 inline hover:opacity-80 active:scale-95 transition-transform"
                    >
                      Politique d’utilisation & Sécurité
                    </button>
                    .
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW B: DEDICATED PHONE / EMAIL SUB-FORM
           ======================================================== */}
        {subScreen === 'form' && (
          <div className="py-2 space-y-5 animate-fade-in flex-1 flex flex-col justify-between">
            <div>
              {/* Sub-tabs: [ Téléphone ] | [ E-mail / Nom d'utilisateur ] */}
              <div className="flex border-b mb-5" style={{ borderColor: theme.border }}>
                <button
                  type="button"
                  id="tab-auth-phone"
                  onClick={() => {
                    setFormTab('phone');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-3 text-[13px] font-bold transition-all relative ${
                    formTab === 'phone'
                      ? 'text-blue-600'
                      : ''
                  }`}
                  style={{ color: formTab === 'phone' ? undefined : theme.text }}
                >
                  <span>Téléphone</span>
                  {formTab === 'phone' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
                  )}
                </button>

                <button
                  type="button"
                  id="tab-auth-email"
                  onClick={() => {
                    setFormTab('email');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-3 text-[13px] font-bold transition-all relative ${
                    formTab === 'email'
                      ? 'text-blue-600'
                      : ''
                  }`}
                  style={{ color: formTab === 'email' ? undefined : theme.text }}
                >
                  <span>
                    {mode === 'signup' ? 'E-mail' : 'E-mail / Nom d’utilisateur'}
                  </span>
                  {formTab === 'email' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
                  )}
                </button>
              </div>

              {/* TAB 1: PHONE LOGIN / SIGNUP */}
              {formTab === 'phone' && (
                <div className="space-y-4">
                  {/* Country + Phone input */}
                  <div
                    className="flex items-center rounded-xl border-2 overflow-hidden"
                    style={{ borderColor: theme.border, backgroundColor: theme.card }}
                  >
                    {/* Country code selector */}
                    <div
                      className="relative flex items-center px-3 py-3 border-r shrink-0 gap-1.5 cursor-pointer"
                      style={{ borderColor: theme.border }}
                    >
                      <span className="text-base">{selectedCountry.flag}</span>
                      <span className="text-xs font-bold">{selectedCountry.code}</span>
                      <ChevronDown size={14} style={{ color: theme.text }} />
                      <select
                        value={selectedCountry.code}
                        onChange={(e) => {
                          const found = COUNTRY_CODES.find((c) => c.code === e.target.value);
                          if (found) setSelectedCountry(found);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code + c.country} value={c.code} style={{ backgroundColor: theme.background, color: theme.text }}>
                            {c.flag} {c.country} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Phone Number Input */}
                    <input
                      type="tel"
                      id="input-auth-phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Numéro de téléphone"
                      className="flex-1 px-3.5 py-3 bg-transparent text-xs focus:outline-none font-medium"
                      style={{ color: theme.text }}
                    />
                  </div>

                  {/* Verification Code Box (SMS Verification) */}
                  <div
                    className="flex items-center rounded-xl border-2 overflow-hidden"
                    style={{ borderColor: theme.border, backgroundColor: theme.card }}
                  >
                    <input
                      type="text"
                      id="input-auth-code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Saisir le code à 6 chiffres"
                      maxLength={6}
                      className="flex-1 px-3.5 py-3 bg-transparent text-xs focus:outline-none font-medium tracking-wider"
                      style={{ color: theme.text }}
                    />
                    <button
                      type="button"
                      id="btn-auth-send-code"
                      onClick={handleSendCode}
                      disabled={timer > 0 || !phoneNumber.trim()}
                      className="px-3.5 py-2 mr-1 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition-all shrink-0 bg-blue-600"
                    >
                      {timer > 0 ? `Renvoyer (${timer}s)` : 'Envoyer un code'}
                    </button>
                  </div>

                  {/* If signing up: Date of Birth step (NNECXY 18+ requirement) */}
                  {mode === 'signup' && (
                    <div className="pt-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: theme.text }}>
                          Date de naissance
                        </span>
                        <span className="text-[11px] font-bold text-blue-600">18 ans et plus requis</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={birthDay}
                          onChange={(e) => setBirthDay(e.target.value)}
                          className="px-2.5 py-2.5 rounded-xl border-2 text-xs font-semibold"
                          style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.text }}
                        >
                          {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                            <option key={d} value={d} style={{ backgroundColor: theme.background, color: theme.text }}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <select
                          value={birthMonth}
                          onChange={(e) => setBirthMonth(e.target.value)}
                          className="px-2.5 py-2.5 rounded-xl border-2 text-xs font-semibold"
                          style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.text }}
                        >
                          {[
                            '01 - Jan', '02 - Fév', '03 - Mar', '04 - Avr',
                            '05 - Mai', '06 - Juin', '07 - Juil', '08 - Aoû',
                            '09 - Sep', '10 - Oct', '11 - Nov', '12 - Déc'
                          ].map((m, idx) => (
                            <option key={m} value={String(idx + 1).padStart(2, '0')} style={{ backgroundColor: theme.background, color: theme.text }}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <select
                          value={birthYear}
                          onChange={(e) => setBirthYear(e.target.value)}
                          className="px-2.5 py-2.5 rounded-xl border-2 text-xs font-semibold"
                          style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.text }}
                        >
                          {Array.from({ length: 70 }, (_, i) => String(2007 - i)).map((y) => (
                            <option key={y} value={y} style={{ backgroundColor: theme.background, color: theme.text }}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-3 rounded-xl border-2 border-red-600 bg-red-600 text-white text-xs flex items-center gap-2 font-bold">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Submit Button (Strict 4 Colors: Bleu Action) */}
                  <button
                    id="btn-auth-phone-submit"
                    type="button"
                    onClick={handlePhoneSubmit}
                    disabled={isLoading || !phoneNumber.trim() || !verificationCode.trim()}
                    className="w-full h-11 mt-4 rounded-sm font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-40 transition-all flex items-center justify-center shadow-md shadow-blue-600/20"
                  >
                    {isLoading ? (
                      <RotateCw size={16} className="animate-spin" />
                    ) : mode === 'login' ? (
                      'Connexion'
                    ) : (
                      'S’inscrire'
                    )}
                  </button>
                </div>
              )}

              {/* TAB 2: EMAIL / USERNAME LOGIN */}
              {formTab === 'email' && (
                <div className="space-y-4">
                  {/* Email / Username Input */}
                  <div
                    className="rounded-xl border-2 overflow-hidden"
                    style={{ borderColor: theme.border, backgroundColor: theme.card }}
                  >
                    <input
                      type="text"
                      id="input-auth-email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={
                        mode === 'signup'
                          ? 'Adresse e-mail'
                          : 'E-mail ou nom d’utilisateur'
                      }
                      className="w-full px-3.5 py-3 bg-transparent text-xs focus:outline-none font-medium"
                      style={{ color: theme.text }}
                    />
                  </div>

                  {/* Password Input with Eye */}
                  <div
                    className="relative rounded-xl border-2 overflow-hidden"
                    style={{ borderColor: theme.border, backgroundColor: theme.card }}
                  >
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="input-auth-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mot de passe"
                      className="w-full px-3.5 py-3 bg-transparent text-xs focus:outline-none font-medium pr-10"
                      style={{ color: theme.text }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80"
                      style={{ color: theme.text }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Forgot Password Link in Login mode */}
                  {mode === 'login' && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('Pour réinitialiser votre mot de passe, utilisez la connexion par SMS ou Google.');
                        }}
                        className="text-xs hover:underline"
                        style={{ color: theme.text }}
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                  )}

                  {/* If signing up: Date of Birth step */}
                  {mode === 'signup' && (
                    <div className="pt-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: theme.text }}>
                          Date de naissance
                        </span>
                        <span className="text-[11px] font-bold text-blue-600">18 ans et plus requis</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={birthDay}
                          onChange={(e) => setBirthDay(e.target.value)}
                          className="px-2.5 py-2.5 rounded-xl border-2 text-xs font-semibold"
                          style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.text }}
                        >
                          {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                            <option key={d} value={d} style={{ backgroundColor: theme.background, color: theme.text }}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <select
                          value={birthMonth}
                          onChange={(e) => setBirthMonth(e.target.value)}
                          className="px-2.5 py-2.5 rounded-xl border-2 text-xs font-semibold"
                          style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.text }}
                        >
                          {[
                            '01 - Jan', '02 - Fév', '03 - Mar', '04 - Avr',
                            '05 - Mai', '06 - Juin', '07 - Juil', '08 - Aoû',
                            '09 - Sep', '10 - Oct', '11 - Nov', '12 - Déc'
                          ].map((m, idx) => (
                            <option key={m} value={String(idx + 1).padStart(2, '0')} style={{ backgroundColor: theme.background, color: theme.text }}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <select
                          value={birthYear}
                          onChange={(e) => setBirthYear(e.target.value)}
                          className="px-2.5 py-2.5 rounded-xl border-2 text-xs font-semibold"
                          style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.text }}
                        >
                          {Array.from({ length: 70 }, (_, i) => String(2007 - i)).map((y) => (
                            <option key={y} value={y} style={{ backgroundColor: theme.background, color: theme.text }}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-3 rounded-xl border-2 border-red-600 bg-red-600 text-white text-xs flex items-center gap-2 font-bold">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Submit Button (Strict 4 Colors: Bleu Action) */}
                  <button
                    id="btn-auth-email-submit"
                    type="button"
                    onClick={handleEmailSubmit}
                    disabled={isLoading || !identifier.trim() || !password}
                    className="w-full h-11 mt-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-40 transition-all flex items-center justify-center shadow-md"
                  >
                    {isLoading ? (
                      <RotateCw size={16} className="animate-spin" />
                    ) : mode === 'login' ? (
                      'Connexion'
                    ) : (
                      'S’inscrire'
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Hint at bottom */}
            <div className="text-center pt-4 pb-2">
              <button
                type="button"
                onClick={() => setSubScreen('methods')}
                className="text-xs underline hover:opacity-80"
                style={{ color: theme.text }}
              >
                Retour aux options
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW C: HELP & SUPPORT MODAL
           ======================================================== */}
        {subScreen === 'help' && (
          <div className="py-3 space-y-4 animate-fade-in">
            <h3 className="text-base font-bold">Besoin d’aide pour vous connecter ?</h3>
            <p className="text-xs" style={{ color: theme.text }}>
              Consultez les solutions courantes aux problèmes d’authentification :
            </p>

            <div className="space-y-2.5">
              <div
                onClick={() => {
                  setSubScreen('form');
                  setFormTab('phone');
                }}
                className="p-3.5 rounded-xl border-2 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ borderColor: theme.border, backgroundColor: theme.card }}
              >
                <h4 className="text-xs font-bold text-blue-600">Connexion par code SMS</h4>
                <p className="text-[11px] mt-0.5" style={{ color: theme.text }}>
                  Recevez un code à 6 chiffres sur votre numéro de téléphone pour vous connecter immédiatement sans mot de passe.
                </p>
              </div>

              <div
                onClick={() => setShowGoogleModal(true)}
                className="p-3.5 rounded-xl border-2 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ borderColor: theme.border, backgroundColor: theme.card }}
              >
                <h4 className="text-xs font-bold text-blue-600">Connexion Google One-Tap</h4>
                <p className="text-[11px] mt-0.5" style={{ color: theme.text }}>
                  Utilisez le compte Google synchronisé avec votre téléphone pour une connexion sécurisée en un clic.
                </p>
              </div>

              <div
                onClick={() => onOpenRules?.('safety')}
                className="p-3.5 rounded-xl border-2 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ borderColor: theme.border, backgroundColor: theme.card }}
              >
                <h4 className="text-xs font-bold text-blue-600">Règles de sécurité & 18+</h4>
                <p className="text-[11px] mt-0.5" style={{ color: theme.text }}>
                  Consulter les conditions d’utilisation, la politique de protection des mineurs et la gestion des sessions.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSubScreen('methods')}
              className="w-full py-2.5 rounded-xl border-2 text-xs font-bold hover:opacity-80"
              style={{ borderColor: theme.border, color: theme.text }}
            >
              Retour à l’authentification
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          3. NNECXY STICKY FOOTER BAR
          (Allows instant toggle between Connexion and Inscription)
         ======================================================== */}
      <div
        id="nnecxy-auth-footer"
        className="shrink-0 border-t-2 py-4 px-6 text-center text-xs select-none"
        style={{
          borderColor: theme.border,
          backgroundColor: isDark ? '#000000' : '#ffffff',
          color: theme.text,
        }}
      >
        {mode === 'signup' ? (
          <p>
            Vous avez déjà un compte ?{' '}
            <button
              type="button"
              id="btn-auth-switch-to-login"
              onClick={() => {
                setMode('login');
                setSubScreen('methods');
                setErrorMessage(null);
              }}
              className="font-bold text-blue-600 hover:underline ml-1"
            >
              Connexion
            </button>
          </p>
        ) : (
          <p>
            Vous n’avez pas de compte ?{' '}
            <button
              type="button"
              id="btn-auth-switch-to-signup"
              onClick={() => {
                setMode('signup');
                setSubScreen('methods');
                setErrorMessage(null);
              }}
              className="font-bold text-blue-600 hover:underline ml-1"
            >
              Inscription
            </button>
          </p>
        )}
      </div>

      {/* Google Auth Modal (Device Account Selection) */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={onSuccess}
      />
    </div>
  );
};
