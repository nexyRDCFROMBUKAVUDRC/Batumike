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
  FileText,
  AlertTriangle,
  Clock,
  Check,
  Smartphone,
  Mail,
  Lock,
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

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Handle Logout (Section 23)
  const handleConfirmLogout = () => {
    setShowLogoutDialog(false);
    dataService.logout();
    onLogout();
  };

  // Handle 14-day deletion schedule (Section 22)
  const handleScheduleDeletion = () => {
    if (!currentUser) return;
    if (!deletePassword.trim()) {
      setDeleteError('Veuillez entrer votre mot de passe pour confirmer.');
      return;
    }

    const res = dataService.scheduleAccountDeletion(currentUser.id);
    if (res.success) {
      onUpdateUser({ ...currentUser, deletionScheduledAt: res.scheduledDate });
      setShowDeleteDialog(false);
      setDeletePassword('');
      setDeleteError(null);
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
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-20 backdrop-blur-md"
        style={{ borderColor: theme.border, backgroundColor: theme.background + 'EE' }}
      >
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:opacity-80 active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} style={{ color: theme.text }} />
        </button>
        <h2 className="text-base font-bold">{t.settings}</h2>
        <div className="w-8" />
      </div>

      <div className="p-4 space-y-6 pb-28">
        {/* Connected Account & Active Session Overview */}
        {currentUser && (
          <div
            className="p-4 rounded-2xl border space-y-3"
            style={{ backgroundColor: theme.card, borderColor: theme.border }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Session active & Compte
              </span>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-600/15 border border-blue-600 text-[10px] font-bold text-blue-500">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>Session active</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-600"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                    {currentUser.name[0]}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">{currentUser.name} {currentUser.surname}</span>
                    {currentUser.isVerified && (
                      <span className="w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[8px] font-black">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono">@{currentUser.handle}</p>
                </div>
              </div>

              {currentUser.authProvider === 'google' || currentUser.email?.endsWith('@gmail.com') ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-600 text-[10px] font-bold text-blue-600">
                  <GoogleIcon size={13} />
                  <span>Google</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold" style={{ borderColor: theme.border }}>
                  <Mail size={12} />
                  <span>Email</span>
                </div>
              )}
            </div>

            {currentUser.email && (
              <div className="text-[11px] border-t pt-2 flex items-center gap-1.5" style={{ borderColor: theme.border }}>
                <Mail size={12} className="text-blue-500" />
                <span className="truncate">{currentUser.email}</span>
              </div>
            )}

            <div
              className="text-[10px] rounded-xl p-2.5 leading-relaxed border"
              style={{
                borderColor: theme.border,
                backgroundColor: isDark ? '#000000' : '#FFFFFF',
              }}
            >
              ℹ️ Conformément aux règles de session, votre compte reste connecté sur cet appareil. Si vous vous déconnectez, vous devrez obligatoirement vous reconnecter ou vous inscrire pour accéder au flux.
            </div>
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
              Votre compte sera supprimé définitivement à l'issue des 14 jours. Vous pouvez annuler
              à tout moment avant cette date.
            </p>
            <button
              onClick={handleCancelDeletion}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow"
            >
              {t.cancelAccountDeletion}
            </button>
          </div>
        )}

        {/* 1. Theme Section: Boutons Sombre et Clair directs (Section 9) */}
        <div
          className="p-4 rounded-2xl border space-y-3"
          style={{ backgroundColor: theme.card, borderColor: theme.border }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDark ? <Moon size={18} className="text-blue-500" /> : <Sun size={18} className="text-blue-500" />}
              <span className="text-xs font-bold">{t.themeTitle}</span>
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
              style={{
                borderColor: theme.border,
                backgroundColor: isDark ? '#111111' : '#F4F4F5',
                color: theme.text,
              }}
            >
              {isDark ? 'Mode Sombre actif' : 'Mode Clair actif'}
            </span>
          </div>

          {/* Boutons Sombre / Clair avec changement direct de l'interface */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Bouton Sombre */}
            <button
              id="theme-btn-dark"
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 shadow-xs ${
                mode === 'dark'
                  ? 'bg-black text-white border-2 border-blue-600 ring-2 ring-blue-600/50'
                  : 'bg-black text-white border border-white hover:border-blue-600'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Moon size={16} className={mode === 'dark' ? 'text-blue-500' : 'text-white'} />
                <span>Sombre</span>
              </div>
              <span className="text-[10px] font-normal text-white">
                Fond noir, texte blanc
              </span>
              {mode === 'dark' && (
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">
                  Sélectionné
                </span>
              )}
            </button>

            {/* Bouton Clair */}
            <button
              id="theme-btn-light"
              type="button"
              onClick={() => setThemeMode('light')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 shadow-xs ${
                mode === 'light'
                  ? 'bg-white text-black border-2 border-blue-600 ring-2 ring-blue-600/50'
                  : 'bg-white text-black border border-black hover:border-blue-600'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Sun size={16} className={mode === 'light' ? 'text-blue-600' : 'text-black'} />
                <span>Clair</span>
              </div>
              <span className="text-[10px] font-normal text-black">
                Fond blanc, texte noir
              </span>
              {mode === 'light' && (
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">
                  Sélectionné
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 2. Languages Section: 10 languages (Section 10) */}
        <div
          className="p-4 rounded-2xl border space-y-3"
          style={{ backgroundColor: theme.card, borderColor: theme.border }}
        >
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-blue-500" />
            <span className="text-xs font-bold">{t.language}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(LANGUAGE_LABELS) as SupportedLanguage[]).map((langKey) => {
              const item = LANGUAGE_LABELS[langKey];
              const isSelected = language === langKey;

              return (
                <button
                  key={langKey}
                  onClick={() => setLanguage(langKey)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all active:scale-95 ${
                    isSelected
                      ? 'border-2 border-blue-600 bg-blue-600 text-white font-bold'
                      : isDark
                      ? 'border-white bg-black text-white hover:border-blue-600'
                      : 'border-black bg-white text-black hover:border-blue-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor: isDark ? '#000000' : '#FFFFFF',
                        borderColor: isDark ? '#FFFFFF' : '#000000',
                        color: isDark ? '#FFFFFF' : '#000000',
                      }}
                    >
                      {item.code}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </div>
                  {isSelected && <Check size={14} className="text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Security, Terms & Privacy Section */}
        <div
          className="p-4 rounded-2xl border space-y-2.5"
          style={{ backgroundColor: theme.card, borderColor: theme.border }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} className="text-blue-500" />
            <span className="text-xs font-bold">Conditions & Sécurité NNECXY</span>
          </div>

          {/* Direct Link 1: Conditions d'utilisation */}
          <button
            id="settings-btn-terms"
            type="button"
            onClick={() => onOpenRules('terms')}
            className="w-full py-2.5 px-3 rounded-xl hover:opacity-80 flex items-center justify-between text-xs text-left transition-all border active:scale-98"
            style={{
              borderColor: theme.border,
              backgroundColor: isDark ? '#111111' : '#F9F9F9',
              color: theme.text,
            }}
          >
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-blue-500" />
              <div>
                <span className="font-bold">Conditions d’utilisation</span>
                <p className="text-[10px] opacity-70">Fonctionnement du flux, création & vidéos 25 Mo</p>
              </div>
            </div>
            <span className="text-xs opacity-60">→</span>
          </button>

          {/* Direct Link 2: Politique de Sécurité & Règles communautaires */}
          <button
            id="settings-btn-safety"
            type="button"
            onClick={() => onOpenRules('safety')}
            className="w-full py-2.5 px-3 rounded-xl hover:opacity-80 flex items-center justify-between text-xs text-left transition-all border active:scale-98"
            style={{
              borderColor: theme.border,
              backgroundColor: isDark ? '#111111' : '#F9F9F9',
              color: theme.text,
            }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500" />
              <div>
                <span className="font-bold">Règles & Sécurité (Tolérance Zéro)</span>
                <p className="text-[10px] opacity-70">Interdiction pornographie, violence, 18+ obligatoire</p>
              </div>
            </div>
            <span className="text-xs opacity-60">→</span>
          </button>

          {/* Direct Link 3: Politique de Confidentialité */}
          <button
            id="settings-btn-privacy"
            type="button"
            onClick={() => onOpenRules('privacy')}
            className="w-full py-2.5 px-3 rounded-xl hover:opacity-80 flex items-center justify-between text-xs text-left transition-all border active:scale-98"
            style={{
              borderColor: theme.border,
              backgroundColor: isDark ? '#111111' : '#F9F9F9',
              color: theme.text,
            }}
          >
            <div className="flex items-center gap-2">
              <Lock size={15} className="text-blue-500" />
              <div>
                <span className="font-bold">Politique de confidentialité</span>
                <p className="text-[10px] opacity-70">Protection des données, sessions & grâce de 14 jours</p>
              </div>
            </div>
            <span className="text-xs opacity-60">→</span>
          </button>
        </div>

        {/* 4. Danger Zone: Logout & Account Deletion (Rouge) */}
        <div
          className="p-4 rounded-2xl border space-y-3"
          style={{ backgroundColor: theme.card, borderColor: '#DC2626' }}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-red-600" />
            <span>Zone Danger : Gestion du compte</span>
          </span>

          {/* Logout Button */}
          <button
            id="settings-logout-btn"
            onClick={() => setShowLogoutDialog(true)}
            className="w-full py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold active:scale-95 transition-all"
            style={{
              borderColor: theme.border,
              backgroundColor: isDark ? '#111111' : '#F4F4F5',
              color: theme.text,
            }}
          >
            <LogOut size={15} />
            <span>{t.logout}</span>
          </button>

          {/* Delete Account Button (Danger zone: Rouge) */}
          {!currentUser?.deletionScheduledAt && (
            <button
              id="settings-delete-account-btn"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 text-xs font-bold active:scale-95 transition-all shadow-md"
            >
              <Trash2 size={15} />
              <span>{t.deleteMyAccount}</span>
            </button>
          )}
        </div>

        {/* App Version & Branding with Official Logo */}
        <div className="flex flex-col items-center justify-center pt-2 pb-6 text-center select-none space-y-1 opacity-80">
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
              <p className="text-[11px] text-red-600 mt-2 bg-red-600/10 border border-red-600 rounded-lg p-2 font-semibold">
                Conformément à la gestion de session, vous devrez obligatoirement vous reconnecter ou vous inscrire pour accéder à nouveau à l'application.
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

      {/* Delete Account Modal (Section 22: 14 days recovery period) */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div
            className="w-full max-w-sm rounded-2xl p-5 border space-y-4 shadow-2xl animate-scale-up"
            style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text }}
          >
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertTriangle size={20} />
              <h4>{t.deleteMyAccount}</h4>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: theme.text }}>
              {t.deleteAccountWarning}
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold" style={{ color: theme.text }}>
                Mot de passe de confirmation :
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                className="w-full px-3 py-2 text-xs rounded-xl border bg-transparent focus:outline-none focus:border-red-600"
                style={{ borderColor: theme.border, color: theme.text }}
              />
            </div>

            {deleteError && (
              <p className="text-[11px] text-red-600 font-medium">{deleteError}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletePassword('');
                  setDeleteError(null);
                }}
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
                id="btn-confirm-schedule-delete"
                onClick={handleScheduleDeletion}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
