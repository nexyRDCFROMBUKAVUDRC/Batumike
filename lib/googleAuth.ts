import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

// Gives cd.nnecxy.app://auth-callback in native app or appropriate callback in web
const rawRedirectUrl = Linking.createURL('auth-callback');
export const redirectTo = rawRedirectUrl.includes('://') && !rawRedirectUrl.startsWith('http')
  ? rawRedirectUrl
  : 'cd.nnecxy.app://auth-callback';

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { prompt: 'select_account' }
    }
  });

  if (error) throw error;
  if (!data?.url) return null;

  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type === 'success') {
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData;
  }
  return null;
}
