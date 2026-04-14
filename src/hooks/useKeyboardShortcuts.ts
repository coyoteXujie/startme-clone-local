import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  preventDefault?: boolean;
}

/**
 * 键盘快捷键 Hook
 * 支持组合键（Ctrl+K, Alt+Shift+S 等）
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    shortcuts.forEach(shortcut => {
      const matches =
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        (shortcut.ctrl === undefined || shortcut.ctrl === event.ctrlKey) &&
        (shortcut.shift === undefined || shortcut.shift === event.shiftKey) &&
        (shortcut.alt === undefined || shortcut.alt === event.altKey) &&
        (shortcut.meta === undefined || shortcut.meta === event.metaKey);

      if (matches) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.action();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * 常用快捷键配置工厂函数
 */
export const createShortcuts = {
  /**
   * 搜索聚焦：Ctrl+K 或 Cmd+K
   */
  searchFocus: (onFocus: () => void): KeyboardShortcut => ({
    key: 'k',
    ctrl: true,
    action: onFocus,
  }),

  /**
   * 关闭弹窗：Escape
   */
  close: (onClose: () => void): KeyboardShortcut => ({
    key: 'Escape',
    action: onClose,
  }),

  /**
   * 新建项目：Ctrl+N 或 Cmd+N
   */
  createNew: (onCreate: () => void): KeyboardShortcut => ({
    key: 'n',
    ctrl: true,
    action: onCreate,
  }),

  /**
   * 删除：Delete 或 Backspace
   */
  delete: (onDelete: () => void): KeyboardShortcut => ({
    key: 'Delete',
    action: onDelete,
  }),
};
