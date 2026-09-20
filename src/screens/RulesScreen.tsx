import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { NnecxyLogo } from '../components/NnecxyLogo';
import {
  ArrowLeft,
  UserCheck,
  AlertTriangle,
  Video,
  Lock,
  FileText,
  ShieldCheck,
  EyeOff,
  Flame,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export type LegalSectionTab = 'terms' | 'safety' | 'privacy';

interface RulesScreenProps {
  onBack: () => void;
  initialTab?: LegalSectionTab;
}

export const RulesScreen: React.FC<RulesScreenProps> = ({
  onBack,
  initialTab = 'terms',
}) => {
  const { theme, isDark } = useTheme();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<LegalSectionTab>(initialTab);

  return (
    <div
      id="rules-screen"
      className="flex flex-col h-full w-full max-w-md mx-auto select-none overflow-y-auto scrollbar-none"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-20 backdrop-blur-md"
        style={{ borderColor: theme.border, backgroundColor: theme.background + 'EE' }}
      >
        <button
          id="btn-rules-back"
          onClick={onBack}
          className="p-1.5 rounded-full hover:opacity-80 active:scale-95 transition-transform"
          aria-label="Retour"
        >
          <ArrowLeft size={20} style={{ color: theme.text }} />
        </button>
        <h2 className="text-base font-bold">Conditions & Politique NNECXY</h2>
        <div className="w-8" />
      </div>

      {/* Tabs Selector */}
      <div
        className="flex border-b px-2 sticky top-[49px] z-10 backdrop-blur-md"
        style={{ borderColor: theme.border, backgroundColor: theme.background + 'F5' }}
      >
        <button
          type="button"
          id="tab-legal-terms"
          onClick={() => setActiveTab('terms')}
          className={`flex-1 py-2.5 text-center text-xs font-bold transition-all relative ${
            activeTab === 'terms' ? 'text-blue-600' : 'opacity-70 hover:opacity-100'
          }`}
        >
          Conditions
          {activeTab === 'terms' && (
            <span className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-blue-600 rounded-full" />
          )}
        </button>

        <button
          type="button"
          id="tab-legal-safety"
          onClick={() => setActiveTab('safety')}
          className={`flex-1 py-2.5 text-center text-xs font-bold transition-all relative ${
            activeTab === 'safety' ? 'text-blue-600' : 'opacity-70 hover:opacity-100'
          }`}
        >
          Sécurité & Règles
          {activeTab === 'safety' && (
            <span className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-blue-600 rounded-full" />
          )}
        </button>

        <button
          type="button"
          id="tab-legal-privacy"
          onClick={() => setActiveTab('privacy')}
          className={`flex-1 py-2.5 text-center text-xs font-bold transition-all relative ${
            activeTab === 'privacy' ? 'text-blue-600' : 'opacity-70 hover:opacity-100'
          }`}
        >
          Confidentialité
          {activeTab === 'privacy' && (
            <span className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-blue-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-5 pb-24 animate-fade-in">
        <div className="flex flex-col items-center text-center space-y-1.5 pt-1">
          <NnecxyLogo size="sm" />
          <h3 className="text-xs font-bold text-blue-600">
            {activeTab === 'terms' && 'Conditions d’Utilisation Générales'}
            {activeTab === 'safety' && 'Politique de Contenu & Modération (Tolérance Zéro)'}
            {activeTab === 'privacy' && 'Politique de Confidentialité & Données Personnelles'}
          </h3>
          <p className="text-[11px] opacity-60">
            Plateforme NNECXY V1 • Version officielle en vigueur
          </p>
        </div>

        {/* ========================================================
            TAB 1: CONDITIONS D'UTILISATION (Fonctionnement de NNECXY)
           ======================================================== */}
        {activeTab === 'terms' && (
          <div className="space-y-4">
            {/* 1.1 Fonctionnement général */}
            <div
              className="p-4 rounded-2xl border space-y-2"
              style={{ backgroundColor: theme.card, borderColor: theme.border }}
            >
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                <Flame size={16} />
                <h4>1. Fonctionnement de la plateforme NNECXY</h4>
              </div>
              <p className="text-xs opacity-85 leading-relaxed">
                NNECXY est une application sociale de courtes vidéos verticales interactives. Elle permet
                aux utilisateurs majeurs de visionner un flux immersif, d’interagir via des likes, des
                commentaires et des partages, et de s’abonner à leurs créateurs favoris.
              </p>
            </div>

            {/* 1.2 Publication de vidéos */}
            <div
              className="p-4 rounded-2xl border space-y-2"
              style={{ backgroundColor: theme.card, borderColor: theme.border }}
            >
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                <Video size={16} />
                <h4>2. Création et Publication (Vidéos 25 Mo max)</h4>
              </div>
              <p className="text-xs opacity-85 leading-relaxed">
                Les vidéos publiées sur NNECXY proviennent directement des médias de votre appareil.
                Pour garantir une lecture fluide et rapide :
              </p>
              <ul className="text-xs opacity-85 space-y-1.5 list-disc pl-4">
                <li>Les vidéos sont limitées à une taille maximale de <strong>25 Mo</strong> par publication.</li>
                <li>Formats autorisés : MP4, MOV, WebM.</li>
                <li>Les photos statiques ne sont pas éligibles à la publication.</li>
                <li>L’utilisateur doit détenir les droits d’auteur ou autorisations nécessaires sur tout média diffusé.</li>
              </ul>
            </div>

            {/* 1.3 Engagements et responsabilité */}
            <div
              className="p-4 rounded-2xl border space-y-2"
              style={{ backgroundColor: theme.card, borderColor: theme.border }}
            >
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                <ShieldCheck size={16} />
                <h4>3. Engagements de l'utilisateur</h4>
              </div>
              <p className="text-xs opacity-85 leading-relaxed">
                En créant un compte sur NNECXY, vous vous engagez à fournir des informations exactes,
                à préserver la confidentialité de vos accès, et à ne pas utiliser la plateforme à des fins
                commerciales trompeuses, frauduleuses ou malveillantes.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: SÉCURITÉ & MODÉRATION (Interdictions strictes / Pornographie)
           ======================================================== */}
        {activeTab === 'safety' && (
          <div className="space-y-4">
            {/* 2.1 Interdiction absolue : Pornographie & Nudité (Rouge Danger) */}
            <div
              className="p-4 rounded-2xl border-2 space-y-2"
              style={{ backgroundColor: theme.card, borderColor: '#DC2626' }}
            >
              <div className="flex items-center gap-2 text-red-600 font-bold text-xs">
                <AlertTriangle size={17} />
                <h4>1. Tolérance Zéro : Pornographie & Nudité Explicite</h4>
              </div>
              <p className="text-xs opacity-90 leading-relaxed font-semibold text-red-500">
                Il est formellement interdit de publier, partager ou diffuser tout contenu à caractère pornographique,
                sexuellement explicite, de nudité, d'actes sexuels réels ou simulés.
              </p>
              <p className="text-xs opacity-85 leading-relaxed">
                Tout manquement à cette règle entraîne la suppression instantanée de la vidéo et le
                <strong> bannissement définitif et sans préavis</strong> du compte auteur.
              </p>
            </div>

            {/* 2.2 Âge légal 18+ */}
            <div
              className="p-4 rounded-2xl border space-y-2"
              style={{ backgroundColor: theme.card, borderColor: theme.border }}
            >
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                <UserCheck size={16} />
                <h4>2. Âge Minimum Obligatoire (18 ans et plus)</h4>
              </div>
              <p className="text-xs opacity-85 leading-relaxed">
                NNECXY est strictement réservée aux adultes de 18 ans révolus. La date de naissance
                saisie lors de l'inscription est vérifiée. La protection des mineurs est une priorité absolue :
                toute tentative d’accès ou d'exploitation impliquant des mineurs est immédiatement signalée
                et bannie.
              </p>
            </div>

            {/* 2.3 Violence, harcèlement & escroqueries */}
            <div
              className="p-4 rounded-2xl border space-y-2"
              style={{ backgroundColor: theme.card, borderColor: theme.border }}
            >
              <div className="flex items-center gap-2 text-red-600 font-bold text-xs">
                <EyeOff size={16} />
                <h4>3. Violence, Harcèlement & Haine</h4>
              </div>
              <p className="text-xs opacity-85 leading-relaxed">
                Sont strictement prohibés :
              </p>
              <ul className="text-xs opacity-85 space-y-1 list-disc pl-4">
                <li>Le harcèlement moral, l’intimidation ou le doxxing.</li>
                <li>Les incitations à la violence, à la haine raciale ou discriminatoire.</li>
                <li>La promotion d’armes, de substances illicites ou d'actes d'automutilation.</li>
                <li>Les escroqueries, arnaques financières ou faux profils d’usurpation.</li>
              </ul>
            </div>

            {/* 2.4 Signalement en 1 clic */}
            <div
              className="p-4 rounded-2xl border space-y-2"
              style={{ backgroundColor: theme.card, borderColor: theme.border }}
            >
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                <CheckCircle2 size={16} />
                <h4>4. Signalement instantané & Modération active</h4>
              </div>
              <p className="text-xs opacity-85 leading-relaxed">
                Chaque publication dispose d’un bouton de signalement accessible à tout moment. Les signalements
                sont analysés par notre équipe de modération sous les plus brefs délais afin de maintenir un
                espace sain, créatif et sécurisé pour tous.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: CONFIDENTIALITÉ & DONNÉES (14 jours de grâce)
           ======================================================== */}
        {activeTab === 'privacy' && (
          <div className="space-y-4">
            {/* 3.1 Données collectées */}
            <div
              className="p-4 rounded-2xl border space-y-2"
              style={{ backgroundColor: theme.card, borderColor: theme.border }}
            >
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                <Lock size={16} />
                <h4>1. Vos Données Personnelles</h4>
              </div>
              <p className="text-xs opacity-85 leading-relaxed">
                NNECXY collecte uniquement les données nécessaires au bon fonctionnement de votre compte :
                numéro de téléphone ou e-mail de connexion, pseudonyme, photo de profil et historique de vos
                publications. Vos données privées ne sont ni cédées ni revendues.
              </p>
            </div>

            {/* 3.2 Session active */}
            <div
              className="p-4 rounded-2xl border space-y-2"
              style={{ backgroundColor: theme.card, borderColor: theme.border }}
            >
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                <FileText size={16} />
                <h4>2. Gestion de Session Sécurisée</h4>
              </div>
              <p className="text-xs opacity-85 leading-relaxed">
                Votre session reste active sur votre appareil pour vous éviter de saisir constamment vos
                identifiants. Si vous choisissez de vous déconnecter manuellement depuis les Paramètres, une
                authentification complète sera obligatoirement requise pour réaccéder au flux.
              </p>
            </div>

            {/* 3.3 Droit à l'oubli et période de grâce de 14 jours */}
            <div
              className="p-4 rounded-2xl border space-y-2"
              style={{ backgroundColor: theme.card, borderColor: theme.border }}
            >
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                <Lock size={16} />
                <h4>3. Droit à l'oubli & Période de grâce de 14 jours</h4>
              </div>
              <p className="text-xs opacity-85 leading-relaxed">
                Vous avez le plein contrôle sur votre compte. En demandant la suppression de votre compte dans les
                Paramètres :
              </p>
              <ul className="text-xs opacity-85 space-y-1.5 list-disc pl-4">
                <li>Une période de grâce de <strong>14 jours</strong> est automatiquement enclenchée.</li>
                <li>Durant ce délai, vous pouvez annuler la suppression à tout moment par simple reconnexion.</li>
                <li>À l'expiration des 14 jours, l’ensemble de vos vidéos, likes, commentaires et profil sont purgés définitivement et sans recours possible.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          id="btn-rules-confirm"
          onClick={onBack}
          className="w-full py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow"
        >
          J'ai compris et j'accepte
        </button>
      </div>
    </div>
  );
};
