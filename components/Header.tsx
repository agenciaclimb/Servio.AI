// FIX: Create the Header component
import React from 'react';
import { User, Notification } from '../types';
import NotificationsBell from './NotificationsBell';

interface HeaderProps {
  user: User | null;
  notifications: Notification[];
  onLoginClick: (type: User['type']) => void;
  onRegisterClick: (type: User['type']) => void;
  onLogoutClick: () => void;
  onSetView: (
    view:
      | 'home'
      | 'find-providers'
      | 'provider-landing'
      | 'dashboard'
      | 'profile'
      | 'service-landing'
      | 'payment-success'
      | 'products'
      | 'cart'
      | 'checkout'
      | 'order-tracking'
      | 'analytics',
    data?: Record<string, unknown>
  ) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  notifications,
  onLoginClick,
  onRegisterClick,
  onLogoutClick,
  onSetView,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <button onClick={() => onSetView('home')} className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-blue-600">SERVIO.AI</span>
              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                BETA
              </span>
            </button>
          </div>
          <nav className="hidden sm:flex sm:items-center sm:space-x-4">
            <button
              onClick={() => onSetView('find-providers')}
              className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              Encontrar Profissionais
            </button>
            <button
              onClick={() => onSetView('products')}
              className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              Loja
            </button>
            {!user && (
              <button
                onClick={() => onSetView('provider-landing')}
                className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
              >
                Seja um Prestador
              </button>
            )}
          </nav>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <NotificationsBell
                  notifications={notifications}
                  onMarkAsRead={onMarkAsRead}
                  onMarkAllAsRead={onMarkAllAsRead}
                />
                <button
                  onClick={() => onSetView('cart', { userId: user.email })}
                  className="relative px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  title="Ir para carrinho"
                >
                  🛒 Carrinho
                </button>
                <button
                  onClick={() => onSetView('order-tracking')}
                  className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  title="Rastrear pedidos"
                >
                  📦 Meus Pedidos
                </button>
                <span className="hidden sm:block text-sm text-gray-600">Olá, {user.name}!</span>
                <button
                  onClick={() => onSetView('dashboard')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Painel
                </button>
                {user && ['admin', 'prospector'].includes(user.type) && (
                  <button
                    onClick={() => onSetView('analytics')}
                    className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200"
                    title="Visualizar análises"
                  >
                    📊 Analytics
                  </button>
                )}
                <button
                  onClick={onLogoutClick}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                  data-testid="header-logout-button"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onLoginClick('cliente')}
                  className="px-4 py-2 text-sm font-medium text-blue-600 rounded-md hover:bg-blue-50"
                  data-testid="header-login-button"
                >
                  Entrar
                </button>
                <button
                  onClick={() => onRegisterClick('cliente')}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  data-testid="header-register-button"
                >
                  Cadastre-se
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
