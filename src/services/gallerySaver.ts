import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media';

/**
 * Custom event helper to display in-app toast notification
 */
export const showGalleryToast = (message: string) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('nnecxy:toast', {
        detail: { message },
      })
    );
  }
};

/**
 * Saves a video directly to the device's native Gallery.
 * Uses @capacitor/filesystem (Directory.Cache) + @capacitor-community/media (Media.savePhoto / Media.saveVideo).
 * Includes permission requests and cleanup of temporary cache files.
 * Falls back to browser direct download if not in a native container or if native saving fails.
 *
 * @param videoUrl - Full URL to the video file (e.g. video.videoUrl or video.video_url)
 */
export async function saveVideoToGallery(videoUrl: string): Promise<void> {
  if (!videoUrl) {
    showGalleryToast('URL de la vidéo introuvable');
    return;
  }

  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    let cachePath = '';
    try {
      // 1. First request permissions: Media & Filesystem if available
      try {
        const mediaAny = Media as unknown as Record<string, () => Promise<unknown>>;
        if (typeof mediaAny.requestPermissions === 'function') {
          await mediaAny.requestPermissions();
        }
      } catch (permErr) {
        console.warn('Media permission request warning:', permErr);
      }

      try {
        if (typeof Filesystem.requestPermissions === 'function') {
          await Filesystem.requestPermissions();
        }
      } catch (fsPermErr) {
        console.warn('Filesystem permission request warning:', fsPermErr);
      }

      // 2. Download video from videoUrl using Filesystem.downloadFile into Directory.Cache
      const filename = `nnecxy_${Date.now()}.mp4`;
      const downloadResult = await Filesystem.downloadFile({
        url: videoUrl,
        path: filename,
        directory: Directory.Cache,
      });

      cachePath = downloadResult.path;

      // 3. Save to gallery using Media.savePhoto({ path: downloadedFile.path, album: 'NNECXY' })
      // On Android / iOS, Media.savePhoto or Media.saveVideo places the MP4 in the phone Gallery under the album
      let saved = false;
      const mediaAny = Media as unknown as Record<string, (opts: unknown) => Promise<unknown>>;

      if (typeof Media.savePhoto === 'function') {
        try {
          await Media.savePhoto({
            path: downloadResult.path,
            album: 'NNECXY',
            albumIdentifier: 'NNECXY',
          } as unknown as Parameters<typeof Media.savePhoto>[0]);
          saved = true;
        } catch (savePhotoErr) {
          console.warn('Media.savePhoto failed, trying saveVideo:', savePhotoErr);
        }
      }

      if (!saved && typeof mediaAny.saveVideo === 'function') {
        await mediaAny.saveVideo({
          path: downloadResult.path,
          album: 'NNECXY',
          albumIdentifier: 'NNECXY',
        });
        saved = true;
      }

      // 4. After success, delete cache file with Filesystem.deleteFile
      try {
        await Filesystem.deleteFile({
          path: filename,
          directory: Directory.Cache,
        });
      } catch (delErr) {
        console.warn('Cache cleanup warning:', delErr);
      }

      // 5. Show toast "Vidéo enregistrée dans la galerie"
      showGalleryToast('Vidéo enregistrée dans la galerie');
      return;
    } catch (nativeErr) {
      console.error('Native gallery save failed, falling back to browser download:', nativeErr);

      // Clean up cache file if left over
      if (cachePath) {
        try {
          await Filesystem.deleteFile({
            path: cachePath,
          });
        } catch {
          // ignore cleanup error
        }
      }
    }
  }

  // Fallback for web / PWA / browser: create <a> tag with download attribute to trigger browser download
  try {
    const response = await fetch(videoUrl);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `nnecxy_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    showGalleryToast('Vidéo enregistrée dans la galerie');
  } catch (fallbackErr) {
    console.warn('Blob download failed, trying direct link download:', fallbackErr);
    const a = document.createElement('a');
    a.href = videoUrl;
    a.target = '_blank';
    a.download = `nnecxy_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showGalleryToast('Vidéo enregistrée dans la galerie');
  }
}
