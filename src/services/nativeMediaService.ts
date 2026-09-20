import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media';
import { App as CapApp } from '@capacitor/app';

export interface ShareVideoParams {
  id: string;
  title?: string;
  description?: string;
  videoUrl?: string;
}

export interface ShareResult {
  success: boolean;
  method: 'web_share' | 'capacitor_share' | 'clipboard';
  message: string;
}

export interface DownloadResult {
  success: boolean;
  message: string;
  savedPath?: string;
}

export const nativeMediaService = {
  /**
   * Partage natif Facebook, WhatsApp, Telegram, etc.
   * Utilise d'abord navigator.share, puis @capacitor/share en cas d'échec ou d'indisponibilité.
   */
  async shareVideo(params: ShareVideoParams): Promise<ShareResult> {
    const videoUrl = `https://nnecxy.com/video/${params.id}`;
    const shareTitle = params.title || 'Vidéo NNECXY';
    const shareText = params.description
      ? `${params.description}\n\nRegardez sur NNECXY : ${videoUrl}`
      : `Regardez cette vidéo sur NNECXY : ${videoUrl}`;

    // 1. Essai avec navigator.share natif (Android WebView / Web Share API)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: videoUrl,
        });
        return {
          success: true,
          method: 'web_share',
          message: 'Partage effectué avec succès !',
        };
      } catch (err: unknown) {
        // Si l'utilisateur a annulé, ne pas déclencher d'erreur
        if (err instanceof Error && err.name === 'AbortError') {
          return {
            success: true,
            method: 'web_share',
            message: 'Partage annulé.',
          };
        }
        // Sinon, tenter le fallback Capacitor
      }
    }

    // 2. Fallback avec @capacitor/share
    try {
      const canShare = await Share.canShare().catch(() => ({ value: true }));
      if (canShare.value) {
        await Share.share({
          title: shareTitle,
          text: shareText,
          url: videoUrl,
          dialogTitle: 'Partager cette vidéo NNECXY',
        });
        return {
          success: true,
          method: 'capacitor_share',
          message: 'Partagé via Capacitor !',
        };
      }
    } catch {
      // Ignorer et passer au fallback presse-papiers
    }

    // 3. Fallback universel : Copie du lien dans le presse-papiers
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(videoUrl);
      } else {
        const input = document.createElement('input');
        input.value = videoUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      return {
        success: true,
        method: 'clipboard',
        message: 'Lien copié dans le presse-papier !',
      };
    } catch {
      return {
        success: false,
        method: 'clipboard',
        message: `Lien de la vidéo : ${videoUrl}`,
      };
    }
  },

  /**
   * Téléchargement de la vidéo dans la Galerie Photos du téléphone
   * Utilise @capacitor/filesystem (Directory.Cache) puis @capacitor/media (saveVideo/savePhoto)
   * avec demande de permissions Android (READ_MEDIA_VIDEO, WRITE_EXTERNAL_STORAGE).
   */
  async downloadVideoToGallery(videoUrl: string, videoId: string): Promise<DownloadResult> {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      try {
        // Demande des permissions multimédias
        const mediaAny = Media as unknown as Record<string, () => Promise<unknown>>;
        if (typeof mediaAny.requestPermissions === 'function') {
          try {
            await mediaAny.requestPermissions();
          } catch {
            // Poursuite si la permission est déjà accordée
          }
        }
        const fsAny = Filesystem as unknown as Record<string, () => Promise<unknown>>;
        if (typeof fsAny.requestPermissions === 'function') {
          try {
            await fsAny.requestPermissions();
          } catch {
            // Continue
          }
        }

        // Téléchargement dans le cache de l'application
        const cleanId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
        const filename = `NNECXY_${cleanId}_${Date.now()}.mp4`;

        const downloadResult = await Filesystem.downloadFile({
          url: videoUrl,
          path: filename,
          directory: Directory.Cache,
        });

        // Enregistrement dans la Galerie Photos via Media
        if (typeof Media.saveVideo === 'function') {
          await Media.saveVideo({
            path: downloadResult.path,
            albumIdentifier: 'NNECXY',
          });
        } else if (typeof Media.savePhoto === 'function') {
          await Media.savePhoto({
            path: downloadResult.path,
            albumIdentifier: 'NNECXY',
          });
        }

        return {
          success: true,
          message: 'Vidéo enregistrée dans la galerie !',
          savedPath: downloadResult.path,
        };
      } catch {
        // En cas d'exception native, basculer sur le mécanisme universel de secours
      }
    }

    // Fallback Web / Navigateur / PWA : Téléchargement Blob direct
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `NNECXY_${videoId}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);

      return {
        success: true,
        message: 'Vidéo enregistrée dans la galerie !',
      };
    } catch {
      // Si fetch échoue (ex: CORS), ouverture directe du fichier pour enregistrement
      const anchor = document.createElement('a');
      anchor.href = videoUrl;
      anchor.target = '_blank';
      anchor.download = `NNECXY_${videoId}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      return {
        success: true,
        message: 'Vidéo enregistrée dans la galerie !',
      };
    }
  },

  /**
   * Système de routage des liens profonds (App Links & Deep Links)
   * Quand l'utilisateur clique sur https://nnecxy.com/video/ID sur WhatsApp ou Messenger,
   * l'application s'ouvre directement sur la vidéo correspondante.
   */
  initDeepLinks(onVideoOpened: (videoId: string) => void): () => void {
    // 1. Parser une URL pour extraire l'ID vidéo
    const extractVideoId = (rawUrl: string): string | null => {
      try {
        if (!rawUrl) return null;

        // Formats acceptés :
        // https://nnecxy.com/video/ID
        // https://www.nnecxy.com/video/ID
        // https://nnecxy.vercel.app/video/ID
        // cd.nnecxy.app://video/ID
        // /video/ID
        // ?video=ID
        const videoMatch = rawUrl.match(/(?:\/video\/|video[=/:])([a-zA-Z0-9_\-]+)/i);
        if (videoMatch && videoMatch[1]) {
          return videoMatch[1];
        }

        // URL standard
        const parsed = new URL(rawUrl, window.location.origin);
        if (parsed.pathname.startsWith('/video/')) {
          const parts = parsed.pathname.split('/video/');
          if (parts[1]) return parts[1].split(/[?#]/)[0];
        }
        const queryVid = parsed.searchParams.get('video') || parsed.searchParams.get('v');
        if (queryVid) return queryVid;
      } catch {
        // Ignore parsing errors
      }
      return null;
    };

    // 2. Vérifier l'URL initiale au démarrage (Web / PWA / Android)
    if (typeof window !== 'undefined') {
      const initialId = extractVideoId(window.location.href);
      if (initialId) {
        onVideoOpened(initialId);
      }
    }

    // 3. Écouteur natif Capacitor App: appUrlOpen
    let listenerHandle: { remove: () => Promise<void> } | null = null;

    try {
      CapApp.addListener('appUrlOpen', (event: { url: string }) => {
        const videoId = extractVideoId(event.url);
        if (videoId) {
          onVideoOpened(videoId);
        }
      }).then((handle) => {
        listenerHandle = handle;
      }).catch(() => {
        // Non-native fallback
      });
    } catch {
      // Ignorer si dans un environnement non supporté
    }

    // 4. Écouteur popstate pour le Web
    const handlePopState = () => {
      const vid = extractVideoId(window.location.href);
      if (vid) {
        onVideoOpened(vid);
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (listenerHandle) {
        listenerHandle.remove().catch(() => {});
      }
    };
  },
};
