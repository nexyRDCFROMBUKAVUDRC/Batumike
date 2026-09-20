import React from 'react';
import { User } from '../types';
import { AuthView } from '../components/AuthView';

interface WelcomeScreenProps {
  onLogin: () => void;
  onRegister: () => void;
  onOpenRules: (tab?: 'terms' | 'safety' | 'privacy') => void;
  onAuthSuccess?: (user: User) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onLogin,
  onOpenRules,
  onAuthSuccess,
}) => {
  return (
    <AuthView
      initialMode="login"
      onSuccess={(user) => {
        if (onAuthSuccess) onAuthSuccess(user);
        else onLogin();
      }}
      onOpenRules={onOpenRules}
    />
  );
};
