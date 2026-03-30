/**
 * Toast 通知类型
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // 自动关闭时间（毫秒），0 表示不自动关闭
}

export interface UseToast {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}
