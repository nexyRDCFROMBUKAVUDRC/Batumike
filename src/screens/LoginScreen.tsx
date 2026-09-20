import React from 'react';
import { User } from '../types';
import { AuthView } from '../components/AuthView';

interface LoginScreenProps {
  onSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
  onBack: () => void;
  onOpenRules?: (tab?: 'terms' | 'safety' | 'privacy') => void;
  logoutNotice?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
  onBack,
  onOpenRules,
  logoutNotice,
}) => {
  return (
    <AuthView
      initialMode="login"
      logoutNotice={logoutNotice}
      onSuccess={onSuccess}
      onBack={onBack}
      onOpenRules={onOpenRules}
    />
  );
};
