import React, { useState } from 'react';
import { VideoDraft } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { dataService } from '../services/dataService';
import { ArrowLeft, Globe, Lock, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface PublishScreenProps {
  draft: VideoDraft;
  onBack: () => void;
  onComplete: () => void;
}

export const PublishScreen: React.FC<PublishScreenProps> = ({ draft, onBack, onComplete }) => {
  const { theme } = useTheme();
  const { t } = useI18n();

  const [caption, setCaption] = useState(draft.caption || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(['NNECXY', 'V1', 'Reel']);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

  const handleAddTag = () => {
    const clean = tagInput.replace('#', '').trim();
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags([...selectedTags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const handlePublish = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const currentUser = dataService.getCurrentUser();
      if (!currentUser) {
        setErrorMessage('Vous devez être connecté pour publier.');
        setIsSubmitting(false);
        return;
      }

      // Strict 25 MB limit check (Section 2, 36)
      const MAX_SIZE = 25 * 1024 * 1024;
      if (draft.size > MAX_SIZE) {
        setErrorMessage('La taille de la vidéo dépasse 25 Mo. Maximum : 25 MB.');
        setIsSubmitting(false);
        return;
      }

      // Circuit de publication réel:
      // validation -> upload -> database record -> feed actualisation
      const updatedDraft: VideoDraft = {
        ...draft,
        caption,
        tags: selectedTags,
      };

      const result = dataService.publishVideo(updatedDraft, currentUser);

      if (!result.success) {
        setErrorMessage(result.error || t.publishFailed);
        setIsSubmitting(false);
        return;
      }

      setSuccessNotice(true);
      setTimeout(() => {
        setIsSubmitting(false);
        onComplete();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err?.message || t.publishFailed);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="publish-screen"
      className="flex flex-col h-full w-full max-w-md mx-auto"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: theme.border }}
      >
        <button
          id="publish-back-btn"
          onClick={onBack}
          disabled={isSubmitting}
          className="p-1.5 rounded-full hover:opacity-80 active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} style={{ color: theme.text }} />
        </button>
        <h2 className="text-base font-bold">Nouvelle publication</h2>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Video Preview card & Caption Input */}
        <div
          className="p-3 rounded-2xl border flex gap-3.5 items-start"
          style={{ backgroundColor: theme.card, borderColor: theme.border }}
        >
          <div className="relative w-24 h-36 rounded-xl overflow-hidden bg-black shrink-0 shadow-md">
            {draft.type.startsWith('image/') ? (
              <img
                src={draft.uri}
                alt="draft preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={draft.uri}
                className="w-full h-full object-cover"
                muted
                playsInline
                autoPlay
                loop
              />
            )}
            <div className="absolute bottom-1 right-1 px-1 bg-black/70 rounded text-[9px] font-mono text-white">
              {(draft.size / (1024 * 1024)).toFixed(1)} MB
            </div>
          </div>

          <div className="flex-1 flex flex-col h-36">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t.captionPlaceholder}
              maxLength={300}
              className="w-full flex-1 bg-transparent resize-none text-xs focus:outline-none font-medium"
              style={{ color: theme.text }}
            />
            <div className="text-right text-[10px] font-mono" style={{ color: theme.text }}>
              {caption.length} / 300
            </div>
          </div>
        </div>

        {/* Hashtags section */}
        <div className="space-y-2">
          <label className="text-xs font-semibold block">{t.addHashtags}</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="#tag..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border-2 bg-transparent focus:outline-none focus:border-blue-600 font-medium"
              style={{ borderColor: theme.border, color: theme.text }}
            />
            <button
              onClick={handleAddTag}
              className="px-3 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl active:scale-95 transition-transform"
            >
              +
            </button>
          </div>

          {/* Tags Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                onClick={() => handleRemoveTag(tag)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-600 text-white cursor-pointer hover:opacity-90"
              >
                #{tag} <span className="text-xs text-white">&times;</span>
              </span>
            ))}
          </div>
        </div>

        {/* Privacy & Audience */}
        <div
          className="p-3.5 rounded-2xl border-2 space-y-2"
          style={{ backgroundColor: theme.card, borderColor: theme.border }}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-blue-600" />
              <span className="font-semibold">{t.whoCanWatch}</span>
            </div>
            <span className="text-[11px] font-bold text-blue-600">{t.everyone}</span>
          </div>
          <p className="text-[11px]" style={{ color: theme.text }}>
            Votre vidéo sera visible instantanément dans le flux social NNECXY.
          </p>
        </div>

        {/* Error message (Danger zone: Rouge) */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-600 border-2 border-red-600 text-white text-xs flex items-center gap-2 font-bold">
            <AlertCircle size={16} className="shrink-0 text-white" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success message */}
        {successNotice && (
          <div className="p-3 rounded-xl bg-blue-600/15 border border-blue-600 text-white text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-blue-500" />
            <span>{t.publishedSuccess}</span>
          </div>
        )}
      </div>

      {/* Bottom Publish Button (Action Button: Bleu) */}
      <div
        className="p-4 border-t"
        style={{ borderColor: theme.border, backgroundColor: theme.background }}
      >
        <button
          id="btn-publish-on-nnecxy"
          onClick={handlePublish}
          disabled={isSubmitting || successNotice}
          className="w-full py-3.5 px-6 rounded-full font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t.uploadingVideo}</span>
            </>
          ) : (
            <>
              <Sparkles size={16} className="text-white" />
              <span>{t.publishOnNnecxy}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
