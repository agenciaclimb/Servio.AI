import React from 'react';
import Toast from './Toast';
import { ToastMessage } from '../contexts/ToastContext';

interface ToastContainerProps {
  messages: ToastMessage[];
  removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ messages, removeToast }) => {
  return (
    <div className="fixed top-5 right-5 z-[100] w-full max-w-xs space-y-3">
      {messages.map((message) => (
        <Toast key={message.id} message={message} removeToast={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;