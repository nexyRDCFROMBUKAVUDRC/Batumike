import { PhoneMediaAsset } from '../types';

export const MediaType = {
  photo: 'photo',
  video: 'video',
  audio: 'audio',
  unknown: 'unknown',
} as const;

export const SortBy = {
  creationTime: 'creationTime',
  modificationTime: 'modificationTime',
  mediaType: 'mediaType',
  duration: 'duration',
  default: 'default',
} as const;

export interface Asset {
  id: string;
  uri: string;
  localUri: string;
  filename: string;
  mediaType: 'photo' | 'video' | 'audio' | 'unknown';
  width: number;
  height: number;
  creationTime: number;
  modificationTime: number;
  duration: number;
  thumbnail?: string;
  size?: number;
}

export interface PagedInfo<T> {
  assets: T[];
  endCursor: string;
  hasNextPage: boolean;
  totalCount: number;
}

// Device gallery media items (empty by default - no demo media)
export const DEFAULT_DEVICE_ASSETS: PhoneMediaAsset[] = [];

let customUserAssets: PhoneMediaAsset[] = [];

export function addCustomUserAsset(asset: PhoneMediaAsset) {
  customUserAssets = [asset, ...customUserAssets];
}

export async function requestPermissionsAsync(): Promise<{ status: string; granted: boolean; canAskAgain: boolean }> {
  return { status: 'granted', granted: true, canAskAgain: true };
}

export async function getPermissionsAsync(): Promise<{ status: string; granted: boolean; canAskAgain: boolean }> {
  return { status: 'granted', granted: true, canAskAgain: true };
}

export async function getAssetsAsync(options?: {
  first?: number;
  mediaType?: Array<'photo' | 'video' | 'audio' | 'unknown'> | string[];
  sortBy?: Array<'creationTime' | 'modificationTime' | 'mediaType' | 'duration' | 'default'> | string[];
}): Promise<PagedInfo<Asset>> {
  let list: PhoneMediaAsset[] = [...customUserAssets, ...DEFAULT_DEVICE_ASSETS];

  if (options?.mediaType && options.mediaType.length > 0) {
    const types = new Set(options.mediaType);
    list = list.filter((a) => types.has(a.mediaType));
  }

  if (options?.sortBy && options.sortBy.includes('creationTime')) {
    list.sort((a, b) => (b.creationTime || 0) - (a.creationTime || 0));
  }

  const limit = options?.first || 100;
  const sliced = list.slice(0, limit);

  const mappedAssets: Asset[] = sliced.map((item) => ({
    id: item.id,
    uri: item.uri,
    localUri: item.localUri || item.uri,
    filename: item.filename,
    mediaType: item.mediaType,
    duration: item.duration || 0,
    width: item.width || 1080,
    height: item.height || 1920,
    creationTime: item.creationTime || Date.now(),
    modificationTime: item.creationTime || Date.now(),
    thumbnail: item.thumbnail || item.uri,
    size: item.size,
  }));

  return {
    assets: mappedAssets,
    endCursor: String(mappedAssets.length),
    hasNextPage: false,
    totalCount: mappedAssets.length,
  };
}

export async function getAssetInfoAsync(asset: any): Promise<{ localUri: string; uri: string }> {
  return {
    localUri: asset?.localUri || asset?.uri || '',
    uri: asset?.uri || asset?.localUri || '',
  };
}

export default {
  MediaType,
  SortBy,
  requestPermissionsAsync,
  getPermissionsAsync,
  getAssetsAsync,
  getAssetInfoAsync,
};
