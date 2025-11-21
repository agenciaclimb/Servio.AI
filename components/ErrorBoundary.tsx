import React from 'react';

interface ErrorInfo {
  componentStack?: string;
}

interface ErrorBoundaryState { 
  hasError: boolean; 
  error?: Error; 
  info?: ErrorInfo;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Centralizado para futura telemetria; console permitido
    console.error('[ErrorBoundary] Caught error:', error, info);
    this.setState({ info: { componentStack: info.componentStack || undefined } });
    
    // Se for erro de chunk loading, recarregar automaticamente
    const hasReloaded = sessionStorage.getItem('hasReloadedForChunkError');
    const errorMsg = error.message || '';
    if ((errorMsg.includes('Failed to fetch dynamically imported module') ||
         errorMsg.includes('Importing a module script failed') ||
         errorMsg.includes('Failed to load module script') ||
         errorMsg.includes('Loading chunk')) && !hasReloaded) {
      console.log('[ErrorBoundary] Detectado erro de chunk loading, recarregando página...');
      sessionStorage.setItem('hasReloadedForChunkError', 'true');
      setTimeout(() => window.location.reload(), 100);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, info: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto">
          <h1 className="text-xl font-bold mb-2">Ocorreu um erro ao renderizar esta seção.</h1>
          <p className="text-sm text-gray-600 mb-4">Tente recarregar ou clique em "Tentar novamente". Se persistir, copie o erro para suporte.</p>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto mb-4 max-h-64 whitespace-pre-wrap">
            {String(this.state.error)}\n{this.state.info?.componentStack}
          </pre>
          <button onClick={this.handleRetry} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Tentar novamente</button>
        </div>
      );
    }
    return this.props.children;
  }
}
