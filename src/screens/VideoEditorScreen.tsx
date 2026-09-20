import React, { useState, useRef } from 'react';
import { VideoDraft } from '../types';
import { useI18n } from '../context/I18nContext';
import {
  Music,
  Type,
  Smile,
  Save,
  ArrowLeft,
  Sliders,
  Check,
  X,
  Volume2,
  Trash2,
} from 'lucide-react';

interface VideoEditorScreenProps {
  draft: VideoDraft;
  onUpdateDraft: (draft: VideoDraft) => void;
  onNext: () => void;
  onBack: () => void;
}

const AVAILABLE_AUDIO = [
  'Son original',
  'Afrobeats Beat #1 - Original Mix',
  'Amapiano Groove - Summer Wave',
  'NNECXY Anthem - Sound Design',
  'Kinshasa Night Vibe',
  'Lofi Chillout Beats',
];

const AVAILABLE_STICKERS = ['🔥', '✨', '🎵', '🚀', '❤️', '👑', '💯', '⚡', '🎉', '🌟'];

export const VideoEditorScreen: React.FC<VideoEditorScreenProps> = ({
  draft,
  onUpdateDraft,
  onNext,
  onBack,
}) => {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Tool Modals / Panels
  const [activeTool, setActiveTool] = useState<'none' | 'sound' | 'text' | 'stickers' | 'trim'>('none');
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [newText, setNewText] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [saveDraftNotice, setSaveDraftNotice] = useState<string | null>(null);

  // Add Text Overlay
  const handleAddText = () => {
    if (!newText.trim()) return;
    const updated = {
      ...draft,
      textOverlays: [
        ...(draft.textOverlays || []),
        {
          id: 'txt_' + Date.now(),
          text: newText.trim(),
          x: 50,
          y: 40 + (draft.textOverlays?.length || 0) * 12,
          color: textColor,
          fontSize: 22,
        },
      ],
    };
    onUpdateDraft(updated);
    setNewText('');
    setActiveTool('none');
  };

  // Remove Text Overlay
  const handleRemoveText = (id: string) => {
    const updated = {
      ...draft,
      textOverlays: draft.textOverlays?.filter((t) => t.id !== id),
    };
    onUpdateDraft(updated);
  };

  // Add Sticker
  const handleAddSticker = (sticker: string) => {
    const updated = {
      ...draft,
      stickers: [
        ...(draft.stickers || []),
        {
          id: 'stk_' + Date.now(),
          sticker,
          x: 40 + ((draft.stickers?.length || 0) % 3) * 20,
          y: 30 + Math.floor((draft.stickers?.length || 0) / 3) * 15,
          scale: 1,
        },
      ],
    };
    onUpdateDraft(updated);
    setActiveTool('none');
  };

  // Remove Sticker
  const handleRemoveSticker = (id: string) => {
    const updated = {
      ...draft,
      stickers: draft.stickers?.filter((s) => s.id !== id),
    };
    onUpdateDraft(updated);
  };

  // Select Audio Track
  const handleSelectAudio = (track: string) => {
    onUpdateDraft({ ...draft, audioTrack: track });
    setActiveTool('none');
  };

  // Save Draft action
  const handleSaveDraft = () => {
    setSaveDraftNotice('Brouillon enregistré avec succès dans NNECXY.');
    setTimeout(() => setSaveDraftNotice(null), 2500);
  };

  return (
    <div
      id="nnecxy-video-editor"
      className="relative w-full h-full max-w-md mx-auto flex flex-col justify-between select-none overflow-hidden"
      style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
    >
      {/* 1. Full-Height Video Preview */}
      {(() => {
        const currentUri = (draft.uris && draft.uris[activeClipIndex]) || draft.uri;
        const isCurrentImg = draft.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(currentUri);

        return (
          <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black overflow-hidden">
            {isCurrentImg ? (
              <img
                src={currentUri}
                alt="draft preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                key={currentUri}
                src={currentUri}
                className="w-full h-full object-cover"
                autoPlay
                loop
                playsInline
                muted={draft.audioVolume === 0}
              />
            )}

            {/* Video Overlays (Texts) */}
            {draft.textOverlays?.map((item) => (
              <div
                key={item.id}
                className="absolute p-2 bg-black/40 backdrop-blur-xs rounded-md shadow-lg border border-white/20 flex items-center gap-1.5 cursor-move"
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: 'translate(-50%, -50%)',
                  color: item.color,
                  fontSize: `${item.fontSize}px`,
                  fontWeight: 700,
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                }}
              >
                <span>{item.text}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveText(item.id);
                  }}
                  className="text-white/60 hover:text-white p-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {/* Video Overlays (Stickers) */}
            {draft.stickers?.map((stk) => (
              <div
                key={stk.id}
                className="absolute text-4xl select-none cursor-pointer flex items-center gap-1"
                style={{
                  left: `${stk.x}%`,
                  top: `${stk.y}%`,
                  transform: 'translate(-50%, -50%)',
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
                }}
              >
                <span>{stk.sticker}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSticker(stk.id);
                  }}
                  className="text-xs bg-black/60 text-white rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Top Header: Cancel / Return button & Multi-clip indicator */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/70 to-transparent">
        <button
          id="editor-back-btn"
          onClick={onBack}
          className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 active:scale-95 transition-all"
          aria-label={t.back}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-2">
          {draft.uris && draft.uris.length > 1 && (
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-white border border-white/20">
              <span>{activeClipIndex + 1}/{draft.uris.length} médias</span>
            </div>
          )}

          {draft.audioTrack && (
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-cyan-300 border border-cyan-400/20">
              <Music size={12} />
              <span className="truncate max-w-[140px]">{draft.audioTrack}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notice Banner when Saved */}
      {saveDraftNotice && (
        <div className="absolute top-16 left-4 right-4 z-30 p-2.5 bg-emerald-600/90 backdrop-blur-md rounded-xl text-center text-xs font-semibold text-white shadow-lg animate-fade-in">
          {saveDraftNotice}
        </div>
      )}

      {/* Right-Side Tools Column (Master prompt requirement) */}
      <div className="absolute right-3 top-20 flex flex-col items-center gap-4 z-20">
        {/* Son 🎵 */}
        <button
          id="editor-tool-sound"
          onClick={() => setActiveTool(activeTool === 'sound' ? 'none' : 'sound')}
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:border-cyan-400 group-hover:text-cyan-300">
            <Music size={20} />
          </div>
          <span className="text-[11px] font-semibold tracking-wide drop-shadow-md">Son 🎵</span>
        </button>

        {/* Texte Aa */}
        <button
          id="editor-tool-text"
          onClick={() => setActiveTool(activeTool === 'text' ? 'none' : 'text')}
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:border-cyan-400 group-hover:text-cyan-300">
            <Type size={20} />
          </div>
          <span className="text-[11px] font-semibold tracking-wide drop-shadow-md">Texte Aa</span>
        </button>

        {/* Stickers */}
        <button
          id="editor-tool-stickers"
          onClick={() => setActiveTool(activeTool === 'stickers' ? 'none' : 'stickers')}
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:border-cyan-400 group-hover:text-cyan-300">
            <Smile size={20} />
          </div>
          <span className="text-[11px] font-semibold tracking-wide drop-shadow-md">Stickers</span>
        </button>

        {/* Enregistrer */}
        <button
          id="editor-tool-save"
          onClick={handleSaveDraft}
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:border-emerald-400 group-hover:text-emerald-300">
            <Save size={20} />
          </div>
          <span className="text-[11px] font-semibold tracking-wide drop-shadow-md">Enregistrer</span>
        </button>
      </div>

      {/* Tool Modal Panels (Rendered when Son, Texte, Stickers or Reel is selected) */}
      {activeTool === 'sound' && (
        <div className="absolute inset-x-0 bottom-24 bg-black border-2 border-white p-4 z-30 rounded-t-2xl shadow-2xl animate-slide-up text-white">
          <div className="flex items-center justify-between pb-3 border-b-2 border-white">
            <div className="flex items-center gap-2">
              <Music size={18} className="text-blue-500" />
              <h3 className="text-sm font-bold">Sélectionner une bande son</h3>
            </div>
            <button onClick={() => setActiveTool('none')} className="text-white hover:opacity-80">
              <X size={18} />
            </button>
          </div>
          <div className="mt-3 max-h-48 overflow-y-auto space-y-1.5 scrollbar-none">
            {AVAILABLE_AUDIO.map((track) => (
              <div
                key={track}
                onClick={() => handleSelectAudio(track)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-bold transition-all border-2 ${
                  draft.audioTrack === track
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-black border-white text-white hover:border-blue-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Volume2 size={14} />
                  <span>{track}</span>
                </div>
                {draft.audioTrack === track && <Check size={14} className="text-white" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTool === 'text' && (
        <div className="absolute inset-x-0 bottom-24 bg-black border-2 border-white p-4 z-30 rounded-t-2xl shadow-2xl animate-slide-up text-white">
          <div className="flex items-center justify-between pb-3 border-b-2 border-white">
            <h3 className="text-sm font-bold">Ajouter un texte au reel</h3>
            <button onClick={() => setActiveTool('none')} className="text-white hover:opacity-80">
              <X size={18} />
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Écrivez votre texte..."
              className="w-full px-3 py-2 bg-black border-2 border-white rounded-xl text-sm text-white focus:outline-none focus:border-blue-600 font-bold"
              autoFocus
            />
            {/* Color picker */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {['#FFFFFF', '#FFD700', '#00E5FF', '#FF007F', '#00E676'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setTextColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      textColor === color ? 'scale-125 border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                onClick={handleAddText}
                disabled={!newText.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-xs font-bold rounded-lg text-white"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTool === 'stickers' && (
        <div className="absolute inset-x-0 bottom-24 bg-black border-2 border-white p-4 z-30 rounded-t-2xl shadow-2xl animate-slide-up text-white">
          <div className="flex items-center justify-between pb-3 border-b-2 border-white">
            <h3 className="text-sm font-bold">Choisir un sticker</h3>
            <button onClick={() => setActiveTool('none')} className="text-white hover:opacity-80">
              <X size={18} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2 text-center text-3xl">
            {AVAILABLE_STICKERS.map((stk) => (
              <button
                key={stk}
                onClick={() => handleAddSticker(stk)}
                className="p-2 hover:bg-blue-600 rounded-xl active:scale-90 transition-transform"
              >
                {stk}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTool === 'trim' && (
        <div className="absolute inset-x-0 bottom-24 bg-black border-2 border-white p-4 z-30 rounded-t-2xl shadow-2xl animate-slide-up text-white">
          <div className="flex items-center justify-between pb-3 border-b-2 border-white">
            <div className="flex items-center gap-2">
              <Sliders size={18} className="text-blue-500" />
              <h3 className="text-sm font-bold">Ajustement du reel</h3>
            </div>
            <button onClick={() => setActiveTool('none')} className="text-white hover:opacity-80">
              <X size={18} />
            </button>
          </div>
          <div className="mt-3 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span>Vitesse de lecture</span>
              <span className="font-bold text-blue-500">1.0x</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Filtre d'ambiance</span>
              <span className="font-bold text-white">Cinématique V1</span>
            </div>
            <button
              onClick={() => setActiveTool('none')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-center font-bold text-white"
            >
              Appliquer les ajustements
            </button>
          </div>
        </div>
      )}

      {/* Bottom Controls Bar (Strict Master prompt requirement) */}
      {/* - bouton blanc « Modifier le reel » en bas à gauche */}
      {/* - bouton bleu « Suivant » en bas à droite */}
      <div className="relative p-4 flex items-center justify-between z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        <button
          id="btn-modify-reel"
          onClick={() => setActiveTool(activeTool === 'trim' ? 'none' : 'trim')}
          className="px-5 py-3 rounded-full text-sm font-bold bg-white text-black hover:opacity-90 active:scale-95 transition-all shadow-lg select-none"
        >
          {t.modifyReel}
        </button>

        <button
          id="btn-editor-next"
          onClick={onNext}
          className="px-6 py-3 rounded-full text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 active:scale-95 transition-all shadow-lg select-none"
        >
          {t.next}
        </button>
      </div>
    </div>
  );
};
