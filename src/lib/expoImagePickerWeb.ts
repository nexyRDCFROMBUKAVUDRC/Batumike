export interface ImagePickerAsset {
  uri: string;
  assetId?: string | null;
  width?: number;
  height?: number;
  type?: 'image' | 'video';
  fileName?: string | null;
  fileSize?: number;
  mimeType?: string;
  duration?: number | null;
  file?: File;
}

export interface ImagePickerResult {
  canceled: boolean;
  assets: ImagePickerAsset[] | null;
}

export interface ImagePickerOptions {
  mediaTypes?: string[] | string;
  allowsMultipleSelection?: boolean;
  quality?: number;
  selectionLimit?: number;
}

export const MediaTypeOptions = {
  All: 'All',
  Videos: 'Videos',
  Images: 'Images',
} as const;

export async function requestMediaLibraryPermissionsAsync(): Promise<{
  status: string;
  granted: boolean;
  canAskAgain: boolean;
}> {
  return { status: 'granted', granted: true, canAskAgain: true };
}

export async function getMediaLibraryPermissionsAsync(): Promise<{
  status: string;
  granted: boolean;
  canAskAgain: boolean;
}> {
  return { status: 'granted', granted: true, canAskAgain: true };
}

export async function launchImageLibraryAsync(
  options: ImagePickerOptions = {}
): Promise<ImagePickerResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';

    // File format accept
    const mediaTypes = options.mediaTypes;
    if (Array.isArray(mediaTypes)) {
      const wantsImages = mediaTypes.some((t) => t.includes('image') || t === 'Images' || t === 'All');
      const wantsVideos = mediaTypes.some((t) => t.includes('video') || t === 'Videos' || t === 'All');
      if (wantsImages && wantsVideos) {
        input.accept = 'image/*,video/*';
      } else if (wantsVideos) {
        input.accept = 'video/*';
      } else {
        input.accept = 'image/*';
      }
    } else {
      input.accept = 'image/*,video/*';
    }

    if (options.allowsMultipleSelection) {
      input.multiple = true;
    }

    document.body.appendChild(input);

    let isResolved = false;

    const cleanup = () => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };

    input.onchange = (e: any) => {
      if (isResolved) return;
      isResolved = true;
      const files: FileList | null = e.target.files;

      if (!files || files.length === 0) {
        cleanup();
        resolve({ canceled: true, assets: null });
        return;
      }

      const assets: ImagePickerAsset[] = Array.from(files).map((file) => {
        const isVid = file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|m4v)$/i.test(file.name);
        return {
          uri: URL.createObjectURL(file),
          assetId: 'asset_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || (isVid ? 'video/mp4' : 'image/jpeg'),
          type: isVid ? 'video' : 'image',
          duration: isVid ? 15000 : null,
          file,
        };
      });

      cleanup();
      resolve({
        canceled: false,
        assets,
      });
    };

    // Si l'utilisateur annule le sélecteur natif
    window.addEventListener(
      'focus',
      () => {
        setTimeout(() => {
          if (!isResolved && (!input.files || input.files.length === 0)) {
            isResolved = true;
            cleanup();
            resolve({ canceled: true, assets: null });
          }
        }, 1000);
      },
      { once: true }
    );

    // Déclenchement immédiat de la vraie galerie du téléphone / explorateur système
    input.click();
  });
}

export default {
  MediaTypeOptions,
  requestMediaLibraryPermissionsAsync,
  getMediaLibraryPermissionsAsync,
  launchImageLibraryAsync,
};
