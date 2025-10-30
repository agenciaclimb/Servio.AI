import React from 'react';
import { Notification } from '../types';

interface NotificationsPopoverProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "agora";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days}d`;
};

const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ notifications, onMarkAsRead, onMarkAllAsRead }) => {
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div 
            className="origin-top-right absolute right-0 mt-2 w-80 max-h-[70vh] flex flex-col rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 z-30"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu-button"
        >
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Notificações</h3>
                {unreadCount > 0 && (
                    <button onClick={onMarkAllAsRead} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        Marcar todas como lidas
                    </button>
                )}
            </div>
            <div className="flex-grow overflow-y-auto">
                {notifications.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                        {notifications.map(notification => (
                            <li 
                                key={notification.id} 
                                onClick={() => onMarkAsRead(notification.id)}
                                className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className={`flex-shrink-0 h-2.5 w-2.5 rounded-full mt-1.5 ${!notification.isRead ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700">{notification.text}</p>
                                        <p className="text-xs text-gray-500 mt-1">{timeAgo(notification.createdAt)}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center p-10">
                        <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        <p className="mt-4 text-sm text-gray-600">Você não tem nenhuma notificação.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPopover;
