import React from 'react';

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
}

/**
 * Avatar - Componente de avatar de usuário
 * Exibe imagem do usuário ou iniciais, com indicador de status opcional
 */
const Avatar: React.FC<AvatarProps> = ({ name, imageUrl, size = 'md', status }) => {
  const getInitials = (fullName: string): string => {
    const trimmed = fullName.trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
  };

  const statusSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  return (
    <div className="relative inline-block" data-testid="avatar-container">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold overflow-hidden ${
          imageUrl ? '' : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
        }`}
        data-testid="avatar"
      >
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span data-testid="avatar-initials">{getInitials(name)}</span>
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizes[size]} ${statusColors[status]} border-2 border-white rounded-full`}
          data-testid="avatar-status"
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};

export default Avatar;
