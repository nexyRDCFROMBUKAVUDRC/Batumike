import * as MediaLibrary from 'expo-media-library';

export interface PhoneAsset {
  id: string;
  uri: string;
  filename: string;
  mediaType: 'photo' | 'video' | 'audio' | 'unknown' | string;
  width?: number;
  height?: number;
  creationTime?: number;
  modificationTime?: number;
  duration?: number;
  localUri?: string;
}

/**
 * Request device media library read permissions (Chef Justin logic)
 */
export async function requestGalleryPermissions(): Promise<string> {
  try {
    const res: any = await (MediaLibrary as any).requestPermissionsAsync();
    return res?.status || 'granted';
  } catch (err) {
    console.warn('MediaLibrary permission check failed:', err);
    return 'granted';
  }
}

/**
 * Query phone assets: photos and videos sorted by creationTime
 * const { assets } = await MediaLibrary.getAssetsAsync({ first: 100, mediaType: ['photo','video'], sortBy: ['creationTime'] })
 */
export async function getDeviceAssets(first = 100): Promise<PhoneAsset[]> {
  try {
    if (typeof (MediaLibrary as any).getAssetsAsync === 'function') {
      const res = await (MediaLibrary as any).getAssetsAsync({
        first,
        mediaType: ['photo', 'video'],
        sortBy: ['creationTime'],
      });
      return (res?.assets || []) as PhoneAsset[];
    }
    return [];
  } catch (err) {
    console.warn('MediaLibrary getAssetsAsync fallback:', err);
    return [];
  }
}

/**
 * Resolve local URIs for selected assets
 * const uris = await Promise.all(selected.map(a => MediaLibrary.getAssetInfoAsync(a).then(i => i.localUri)))
 */
export async function getSelectedAssetUris(selected: PhoneAsset[]): Promise<string[]> {
  try {
    const uris = await Promise.all(
      selected.map(async (a) => {
        try {
          if (typeof (MediaLibrary as any).getAssetInfoAsync === 'function') {
            const info = await (MediaLibrary as any).getAssetInfoAsync(a);
            return info?.localUri || a.uri;
          }
          return a.localUri || a.uri;
        } catch {
          return a.uri;
        }
      })
    );
    return uris;
  } catch (err) {
    console.warn('Error resolving asset URIs:', err);
    return selected.map((s) => s.uri);
  }
}
