import React from 'react';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info';
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * StatusBadge - Componente reutilizável para exibir badges de status
 * Usado em jobs, propostas, disputas, etc.
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'md' }) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const statusClasses = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size]} ${statusClasses[status]}`}
      role="status"
      aria-label={label}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
