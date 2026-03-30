import React from 'react';
import Toast from './Toast';
import { Toast as ToastType } from '../types/toast';

interface ToastContainerProps {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
