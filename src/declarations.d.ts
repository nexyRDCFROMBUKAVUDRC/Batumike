declare module 'expo-web-browser' {
  export function maybeCompleteAuthSession(): any;
  export function openAuthSessionAsync(url: string, redirectUrl?: string): Promise<any>;
}

declare module 'expo-linking' {
  export function createURL(path: string): string;
}

declare module 'expo-media-library' {
  export function requestPermissionsAsync(): Promise<any>;
  export function getAssetsAsync(options?: any): Promise<any>;
  export function getAssetInfoAsync(asset: any): Promise<any>;
}
