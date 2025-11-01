
// FIX: Create the Header component
import React from 'react';
import { User, Notification } from '../../types';
import NotificationsBell from './NotificationsBell';

interface HeaderProps {
  user: User | null;
  notifications: Notification[];
  onLoginClick: (type: User['type']) => void;
  onRegisterClick: (type: User['type']) => void;
  onLogoutClick: () => void;
  onSetView: (view: string, data?: any) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, notifications, onLoginClick, onRegisterClick, onLogoutClick, onSetView, onMarkAsRead, onMarkAllAsRead }) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
             <button onClick={() => onSetView('home')} className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-blue-600">SERVIO.AI</span>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">BETA</span>
            </button>
          </div>
          <nav className="hidden sm:flex sm:items-center sm:space-x-4">
            <button onClick={() => onSetView('find-providers')} className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
                Encontrar Profissionais
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
                <span className="hidden sm:block text-sm text-gray-600">Olá, {user.name}!</span>
                 <button onClick={() => onSetView('dashboard')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                    Painel
                </button>
                <button
                  onClick={onLogoutClick}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onLoginClick('cliente')}
                  className="px-4 py-2 text-sm font-medium text-blue-600 rounded-md hover:bg-blue-50"
                >
                  Entrar
                </button>
                <button
                  onClick={() => onRegisterClick('cliente')}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
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
