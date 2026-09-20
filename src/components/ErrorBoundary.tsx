import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export interface ErrorBoundaryProps {
  children?: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NNECXY ErrorBoundary caught error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          id="error-boundary-fallback"
          className="flex flex-col items-center justify-center min-h-[300px] h-full p-6 text-center select-none bg-neutral-950 text-white"
        >
          <div className="w-14 h-14 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center mb-4">
            <AlertTriangle size={28} />
          </div>

          <h2 className="text-base font-bold mb-2">
            {this.props.fallbackTitle || 'Un problème inattendu est survenu'}
          </h2>

          <p className="text-xs text-neutral-400 max-w-xs mb-6 leading-relaxed">
            {this.state.error?.message ||
              "L'écran a rencontré une anomalie d'affichage. Vous pouvez recharger pour revenir directement à votre fil."}
          </p>

          <div className="flex items-center gap-3">
            <button
              id="error-boundary-reload-btn"
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
            >
              <RefreshCw size={14} />
              <span>Actualiser l'écran</span>
            </button>

            <button
              id="error-boundary-home-btn"
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="px-4 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Home size={14} />
              <span>Accueil</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
