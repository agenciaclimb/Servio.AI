import React, { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface PublicLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout público com header/footer consistente para todas páginas não-autenticadas
 */
const PublicLayout: React.FC<PublicLayoutProps> = memo(({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header consistente */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-blue-600">
            <span className="text-xl">SERVIO.AI</span>
            <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">BETA</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm">
            <Link to="/servicos/reparos" className="text-gray-600 hover:text-gray-900">Encontrar Profissionais</Link>
            <Link to="/login" className="text-gray-600 hover:text-gray-900">Seja um Prestador</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md">Entrar</Link>
            <Link to="/login" className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md">Cadastre-se</Link>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer consistente */}
      <footer className="text-center py-6 border-t dark:border-gray-700">
        <div className="space-x-6 text-sm text-gray-500 dark:text-gray-400">
          <Link to="/terms" className="hover:underline">Termos de Serviço</Link>
          <Link to="/privacy" className="hover:underline">Política de Privacidade</Link>
          <span>© {new Date().getFullYear()} SERVIO.AI. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
});

export default PublicLayout;
