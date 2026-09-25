import React, { useState } from 'react';
import { User, SupportedLanguage } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useI18n, LANGUAGE_LABELS } from '../context/I18nContext';
import { dataService } from '../services/dataService';
import { GoogleIcon } from '../components/GoogleAuthModal';
import { NnecxyLogo } from '../components/NnecxyLogo';
import {
  Sun,
  Moon,
  Globe,
  LogOut,
  Trash2,
  ArrowLeft,
  Shield,
  Clock,
  Check,
  Mail,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
  Info,
  AlertTriangle,
  Lock,
  FileText,
  X,
} from 'lucide-react';

interface SettingsScreenProps {
  currentUser: User | null;
  onBack: () => void;
  onLogout: () => void;
  onOpenRules: (tab?: 'terms' | 'safety' | 'privacy') => void;
  onUpdateUser: (u: User) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  currentUser,
  onBack,
  onLogout,
  onOpenRules,
  onUpdateUser,
}) => {
  const { theme, isDark, mode, setThemeMode } = useTheme();
  const { language, setLanguage, t } = useI18n();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteSecurityCode, setDeleteSecurityCode] = useState('');
  const [showDeleteCode, setShowDeleteCode] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Handle Logout
  const handleConfirmLogout = () => {
    setShowLogoutDialog(false);
    dataService.logout();
    onLogout();
  };

  // Handle 14-day deletion schedule with signup security code
  const handleScheduleDeletion = () => {
    if (!currentUser) return;
    if (!deleteSecurityCode.trim()) {
      setDeleteError('Veuillez fournir le code de sécurité reçu ou saisi lors de la création de votre compte.');
      return;
    }

    const res = dataService.scheduleAccountDeletion(currentUser.id, deleteSecurityCode);
    if (res.success) {
      onUpdateUser({ ...currentUser, deletionScheduledAt: res.scheduledDate });
      setShowDeleteDialog(false);
      setDeleteSecurityCode('');
      setDeleteError(null);
    } else {
      setDeleteError(res.error || 'Code invalide. Vérifiez le code fourni lors de votre inscription.');
    }
  };

  const handleCancelDeletion = () => {
    if (!currentUser) return;
    dataService.cancelAccountDeletion(currentUser.id);
    onUpdateUser({ ...currentUser, deletionScheduledAt: null });
  };

  return (
    <div
      id="settings-screen"
      className="flex flex-col h-full w-full max-w-md mx-auto select-none overflow-y-auto scrollbar-none"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* Header Sticky */}
      <div
        className="flex items-center justify-between px-4 py-3.5 border-b sticky top-0 z-20 backdrop-blur-md"
        style={{ borderColor: theme.border, backgroundColor: theme.background + 'EE' }}
      >
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:opacity-80 active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} style={{ color: theme.text }} />
        </button>
        <h2 className="text-base font-bold tracking-tight">{t.settings}</h2>
        <div className="w-8" />
      </div>

      {/* Main Scrollable Content: Layout linéaire, scrollable et visible sans 'petits carreaux' */}
      <div className="p-4 space-y-7 pb-28">
        {/* Active Account Overview */}
        {currentUser && (
          <div className="border-b pb-5" style={{ borderColor: theme.border }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-600"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-base">
                    {currentUser.name[0]}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold">{currentUser.name} {currentUser.surname}</span>
                    {currentUser.isVerified && (
                      <span className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-[9px] font-black">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono opacity-70">@{currentUser.handle}</p>
                  {currentUser.email && (
                    <p className="text-[11px] opacity-60 mt-0.5">{currentUser.email}</p>
                  )}
                </div>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600/10 text-[10px] font-bold text-blue-500">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>Connecté</span>
              </div>
            </div>

            <p className="text-[11px] opacity-70 mt-3 leading-relaxed">
              Votre session reste active sur cet appareil. Toute déconnexion exigera une ré-authentification
              complète avant d'accéder au flux.
            </p>
          </div>
        )}

        {/* Account in deletion pending notice */}
        {currentUser?.deletionScheduledAt && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <Clock size={18} />
              <span>{t.deletionScheduled14Days}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Votre compte sera supprimé définitivement à l'issue de la période de grâce de 14 jours.
            </p>
            <button
              onClick={handleCancelDeletion}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow"
            >
              {t.cancelAccountDeletion}
            </button>
          </div>
        )}

        {/* 1. SECTION THÈME : Bascule propre Sombre / Clair */}
        <div className="space-y-3 border-b pb-6" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">{t.themeTitle}</span>
            <span className="text-[11px] font-medium opacity-70">
              {isDark ? 'Mode Sombre actif' : 'Mode Clair actif'}
            </span>
          </div>

          <div
            className="flex p-1 rounded-xl border"
            style={{ borderColor: theme.border, backgroundColor: isDark ? '#111111' : '#F4F4F5' }}
          >
            <button
              id="theme-btn-dark"
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                mode === 'dark'
                  ? 'bg-black text-white shadow-sm border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Moon size={15} className={mode === 'dark' ? 'text-blue-500' : ''} />
              <span>Sombre</span>
            </button>

            <button
              id="theme-btn-light"
              type="button"
              onClick={() => setThemeMode('light')}
              className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                mode === 'light'
                  ? 'bg-white text-black shadow-sm border border-neutral-200'
                  : 'text-neutral-500 hover:text-black'
              }`}
            >
              <Sun size={15} className={mode === 'light' ? 'text-blue-600' : ''} />
              <span>Clair</span>
            </button>
          </div>
        </div>

        {/* 2. SECTION LANGUE : Bouton interactif ouvrant le sélecteur */}
        <div className="space-y-2 border-b pb-6" style={{ borderColor: theme.border }}>
          <span className="text-xs font-bold uppercase tracking-wider">{t.language}</span>
          <button
            id="settings-language-btn"
            type="button"
            onClick={() => setShowLanguageModal(true)}
            className="w-full py-3.5 px-4 rounded-2xl border flex items-center justify-between text-xs font-semibold hover:opacity-90 active:scale-98 transition-all"
            style={{
              borderColor: theme.border,
              backgroundColor: isDark ? '#111111' : '#F4F4F5',
              color: theme.text,
            }}
          >
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-blue-500" />
              <span className="font-bold">{t.language}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-500">
                {LANGUAGE_LABELS[language]?.name}
              </span>
              <ChevronRight size={16} className="opacity-50" />
            </div>
          </button>
        </div>

        {/* 3. SECTION CONDITIONS, SÉCURITÉ & CONFIDENTIALITÉ : Boutons d'accès directs conformes Google Play Store */}
        <div className="space-y-3 border-b pb-6" style={{ borderColor: theme.border }}>
          <span className="text-xs font-bold uppercase tracking-wider">
            Conditions & Confidentialité
          </span>

          <div className="space-y-2.5">
            {/* Bouton Politique de Confidentialité & Période de grâce 14 jours */}
            <button
              id="settings-btn-privacy"
              type="button"
              onClick={() => onOpenRules('privacy')}
              className="w-full py-3.5 px-4 rounded-2xl border flex items-center justify-between text-xs font-semibold hover:opacity-90 active:scale-98 transition-all"
              style={{
                borderColor: theme.border,
                backgroundColor: isDark ? '#111111' : '#F4F4F5',
                color: theme.text,
              }}
            >
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-blue-500" />
                <div className="text-left">
                  <p className="font-bold">Politique de Confidentialité</p>
                  <p className="text-[10px] opacity-60">Protection des données & Période de grâce de 14 jours</p>
                </div>
              </div>
              <ChevronRight size={16} className="opacity-50" />
            </button>

            {/* Bouton Conditions Générales d'Utilisation */}
            <button
              id="settings-btn-terms"
              type="button"
              onClick={() => onOpenRules('terms')}
              className="w-full py-3.5 px-4 rounded-2xl border flex items-center justify-between text-xs font-semibold hover:opacity-90 active:scale-98 transition-all"
              style={{
                borderColor: theme.border,
                backgroundColor: isDark ? '#111111' : '#F4F4F5',
                color: theme.text,
              }}
            >
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-blue-500" />
                <div className="text-left">
                  <p className="font-bold">Conditions Générales d'Utilisation</p>
                  <p className="text-[10px] opacity-60">Règles du service & publications 25 Mo max</p>
                </div>
              </div>
              <ChevronRight size={16} className="opacity-50" />
            </button>

            {/* Bouton Règles de Sécurité & Modération */}
            <button
              id="settings-btn-safety"
              type="button"
              onClick={() => onOpenRules('safety')}
              className="w-full py-3.5 px-4 rounded-2xl border flex items-center justify-between text-xs font-semibold hover:opacity-90 active:scale-98 transition-all"
              style={{
                borderColor: theme.border,
                backgroundColor: isDark ? '#111111' : '#F4F4F5',
                color: theme.text,
              }}
            >
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-red-500" />
                <div className="text-left">
                  <p className="font-bold">Règles de Sécurité & Modération</p>
                  <p className="text-[10px] opacity-60">Tolérance zéro pornographie, âge 18+ & signalement</p>
                </div>
              </div>
              <ChevronRight size={16} className="opacity-50" />
            </button>
          </div>
        </div>

        {/* 4. SECTION GESTION DU COMPTE & SUPPRESSION */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-red-500">
            Gestion du Compte
          </span>

          {/* Déconnexion */}
          <button
            id="settings-logout-btn"
            onClick={() => setShowLogoutDialog(true)}
            className="w-full py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold active:scale-98 transition-all"
            style={{
              borderColor: theme.border,
              backgroundColor: isDark ? '#111111' : '#F4F4F5',
              color: theme.text,
            }}
          >
            <LogOut size={16} />
            <span>{t.logout}</span>
          </button>

          {/* Suppression de compte */}
          {!currentUser?.deletionScheduledAt && (
            <button
              id="settings-delete-account-btn"
              onClick={() => {
                setDeleteSecurityCode('');
                setDeleteError(null);
                setShowDeleteDialog(true);
              }}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 text-xs font-bold active:scale-98 transition-all shadow-md shadow-red-600/20"
            >
              <Trash2 size={16} />
              <span>{t.deleteMyAccount}</span>
            </button>
          )}
        </div>

        {/* App Version & Branding */}
        <div className="flex flex-col items-center justify-center pt-4 pb-4 text-center select-none space-y-1 opacity-70">
          <NnecxyLogo size="sm" />
          <span className="text-[11px] font-bold tracking-wider">NNECXY V1 Mobile</span>
          <span className="text-[10px] opacity-60">Version 1.0.0</span>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div
            className="w-full max-w-xs rounded-2xl p-5 border space-y-4 shadow-2xl text-center animate-scale-up"
            style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text }}
          >
            <LogOut size={36} className="mx-auto text-blue-500" />
            <div>
              <h4 className="text-sm font-bold">{t.logout}</h4>
              <p className="text-xs mt-1" style={{ color: theme.text }}>{t.logoutConfirmQuestion}</p>
              <p className="text-[11px] text-red-500 mt-2 bg-red-500/10 border border-red-500/30 rounded-lg p-2 font-semibold">
                Vous devrez vous reconnecter ou vous inscrire pour accéder au flux vidéo.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                id="btn-cancel-logout"
                onClick={() => setShowLogoutDialog(false)}
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
                id="btn-confirm-logout"
                onClick={handleConfirmLogout}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                Oui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal: Exige le code fourni lors de la création du compte */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div
            className="w-full max-w-sm rounded-3xl p-5 border space-y-4 shadow-2xl animate-scale-up"
            style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text }}
          >
            <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
              <Trash2 size={20} />
              <h4>Suppression de compte sécurisée</h4>
            </div>

            <p className="text-xs leading-relaxed opacity-90">
              Conformément au protocole de sécurité NNECXY, pour planifier la suppression de votre compte,
              vous devez obligatoirement fournir le code de sécurité ou de vérification que vous aviez reçu ou
              fourni lors de la création de votre compte.
            </p>

            {/* Input code avec icône œil pour afficher / masquer */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold">
                Code de création / Code de sécurité :
              </label>
              <div
                className="relative flex items-center rounded-xl border overflow-hidden"
                style={{ borderColor: deleteError ? '#EF4444' : theme.border }}
              >
                <input
                  type={showDeleteCode ? 'text' : 'password'}
                  id="input-delete-security-code"
                  value={deleteSecurityCode}
                  onChange={(e) => {
                    setDeleteSecurityCode(e.target.value);
                    setDeleteError(null);
                  }}
                  placeholder="Ex: code à 6 chiffres ou mot de passe"
                  className="w-full px-3 py-2.5 bg-transparent text-xs focus:outline-none pr-10 font-mono"
                  style={{ color: theme.text }}
                />
                <button
                  type="button"
                  onClick={() => setShowDeleteCode(!showDeleteCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white transition-colors"
                  aria-label="Afficher ou masquer le code"
                >
                  {showDeleteCode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[10px] opacity-60">
                Code de test par défaut : <span className="font-mono font-bold text-blue-500">123456</span>
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-xl bg-red-600/15 border border-red-600/30 text-red-500 text-[11px] font-medium leading-tight">
                {deleteError}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteSecurityCode('');
                  setDeleteError(null);
                }}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl border transition-all"
                style={{
                  borderColor: theme.border,
                  backgroundColor: isDark ? '#111111' : '#FFFFFF',
                  color: theme.text,
                }}
              >
                {t.cancel}
              </button>
              <button
                id="btn-confirm-schedule-delete"
                onClick={handleScheduleDeletion}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/25"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-xs rounded-3xl p-5 border space-y-4 shadow-2xl animate-scale-up"
            style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-blue-500" />
                <h4 className="text-sm font-bold">{t.language}</h4>
              </div>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="p-1 rounded-full hover:opacity-70"
              >
                <X size={18} />
              </button>
            </div>

            <div className="divide-y max-h-60 overflow-y-auto scrollbar-none" style={{ borderColor: theme.border }}>
              {(Object.keys(LANGUAGE_LABELS) as SupportedLanguage[]).map((langKey) => {
                const item = LANGUAGE_LABELS[langKey];
                const isSelected = language === langKey;
                return (
                  <button
                    key={langKey}
                    onClick={() => {
                      setLanguage(langKey);
                      setShowLanguageModal(false);
                    }}
                    className={`w-full px-3 py-3 text-xs flex items-center justify-between transition-colors ${
                      isSelected ? 'font-bold text-blue-500' : 'hover:bg-neutral-500/10'
                    }`}
                    style={{ color: isSelected ? '#3B82F6' : theme.text }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-500/20">
                        {item.code}
                      </span>
                      <span>{item.name}</span>
                    </div>
                    {isSelected && <Check size={16} className="text-blue-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
