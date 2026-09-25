import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { GoogleIcon } from './GoogleAuthModal';
import { supabase } from '../services/supabase';

interface GoogleSignInButtonProps {
  onClick?: () => void;
  onPress?: () => void;
  text?: string;
  variant?: 'primary' | 'outline';
  className?: string;
  id?: string;
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onClick,
  onPress,
  text = 'Continuer avec Google',
  variant = 'primary',
  className = '',
  id = 'google-signin-btn',
  disabled = false,
}) => {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    if (onPress) return onPress();
    if (onClick) return onClick();

    try {
      setIsLoading(true);
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
    } catch (e) {
      console.error('Google OAuth error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      id={id}
      type="button"
      onClick={handlePress}
      disabled={disabled || isLoading}
      className={`relative w-full py-3.5 px-5 rounded-full font-bold text-xs flex items-center justify-center gap-3 transition-all duration-150 active:scale-98 shadow-sm ${
        isDark
          ? 'bg-white text-black border-2 border-white hover:opacity-95'
          : 'bg-white text-black border-2 border-black hover:opacity-95'
      } ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <GoogleIcon size={18} />
      <span className="tracking-tight">{isLoading ? 'Connexion en cours...' : text}</span>
    </button>
  );
};
