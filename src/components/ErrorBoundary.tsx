import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('MetaFlux ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-5">
            <AlertTriangle className="h-7 w-7 text-danger" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Algo deu errado
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-[400px]">
            Ocorreu um erro inesperado. Tente recarregar a página.
            Se o problema persistir, entre em contato com o suporte.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Recarregar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
