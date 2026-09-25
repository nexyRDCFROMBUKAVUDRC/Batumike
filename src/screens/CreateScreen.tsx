import React, { useEffect, useRef } from 'react';
import { VideoDraft, NNECXY_CATEGORIES } from '../types';

interface CreateScreenProps {
  onSelectVideo?: (draft: VideoDraft) => void;
  onClose?: () => void;
}

/**
 * NNECXY - Sélection de média direct depuis la galerie native
 * - Aucune galerie personnalisée dans NNECXY
 * - Aucune image ou vidéo de démonstration
 * - Aucun enregistrement en base de données avant publication explicite
 */
export const CreateScreen: React.FC<CreateScreenProps> = ({ onSelectVideo, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Ouvre immédiatement la galerie native du téléphone / sélecteur système
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSelectVideo) {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|m4v)$/i.test(file.name);
      const isPhoto = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);

      if (isVideo || isPhoto) {
        const objectUrl = URL.createObjectURL(file);
        onSelectVideo({
          uri: objectUrl,
          file,
          name: file.name,
          size: file.size,
          type: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
          duration: isVideo ? 15 : undefined,
          category: NNECXY_CATEGORIES[0], // Choix numéro 1 par défaut
          audioTrack: 'Son original',
          audioVolume: 100,
          textOverlays: [],
          stickers: [],
        });
        return;
      }
    }
    onClose?.();
  };

  return (
    <input
      ref={fileInputRef}
      type="file"
      accept="video/*,image/*"
      className="hidden"
      onChange={handleFileChange}
    />
  );
};

export default CreateScreen;
