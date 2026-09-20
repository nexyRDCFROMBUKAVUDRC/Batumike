import React from 'react';
import { User } from '../types';
import { AuthView } from '../components/AuthView';

interface RegisterScreenProps {
  onSuccess: (user: User) => void;
  onNavigateToLogin: () => void;
  onOpenRules: (tab?: 'terms' | 'safety' | 'privacy') => void;
  onBack: () => void;
  logoutNotice?: string | null;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onSuccess,
  onOpenRules,
  onBack,
  logoutNotice,
}) => {
  return (
    <AuthView
      initialMode="signup"
      logoutNotice={logoutNotice}
      onSuccess={onSuccess}
      onBack={onBack}
      onOpenRules={onOpenRules}
    />
  );
};
