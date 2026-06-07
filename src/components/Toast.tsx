import React from 'react';
import { Toast as ToastType } from '../types/toast';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastId } from '../types';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: ToastId) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[toast.type];

  return (
    <div className={`toast ${toast.type}`}>
      <div className="toast-icon">
        <Icon size={20} />
      </div>
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        onClick={() => onDismiss(toast.id)}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
