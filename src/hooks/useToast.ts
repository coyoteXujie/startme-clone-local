import { useState, useCallback } from 'react';
import { Toast, ToastType } from '../types/toast';

/**
 * Toast 通知 Hook
 * 提供全局 Toast 通知功能
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * 显示 Toast 通知
   * @param type 通知类型
   * @param message 通知消息
   * @param duration 自动关闭时间（毫秒），默认 3000ms，0 表示不自动关闭
   */
  const showToast = useCallback((type: ToastType, message: string, duration: number = 3000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newToast: Toast = { id, type, message, duration };

    setToasts(prev => [...prev, newToast]);

    // 自动关闭
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  /**
   * 关闭指定 Toast
   */
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /**
   * 关闭所有 Toast
   */
  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * 便捷方法
   */
  const success = useCallback((message: string, duration?: number) => {
    showToast('success', message, duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast('error', message, duration);
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    showToast('warning', message, duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    showToast('info', message, duration);
  }, [showToast]);

  return {
    toasts,
    showToast,
    dismissToast,
    dismissAll,
    success,
    error,
    warning,
    info,
  };
}
