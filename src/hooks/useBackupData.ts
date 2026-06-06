import { useCallback, useState } from 'react';
import type { ChangeEvent } from 'react';
import { storage } from '../utils/storage';

interface UseBackupDataOptions {
  reloadData: () => Promise<void>;
  reloadBackground: () => Promise<void>;
  reloadSearchEngine: () => Promise<void>;
  reloadSearchEngines: () => Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const isImportPayload = (value: unknown): value is { tabs: unknown; bgImage?: unknown } => (
  typeof value === 'object' &&
  value !== null &&
  'tabs' in value
);

/**
 * 管理本地 JSON 备份导入/导出。
 * 导入会走 storage.migrateData，确保旧格式在写入前先统一到当前数据结构。
 */
export const useBackupData = ({
  reloadData,
  reloadBackground,
  reloadSearchEngine,
  reloadSearchEngines,
  onSuccess,
  onError,
}: UseBackupDataOptions) => {
  const [importInputRef, setImportInputRef] = useState<HTMLInputElement | null>(null);

  const handleExportData = useCallback(async () => {
    try {
      const data = await storage.getData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `startme-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onSuccess('数据导出成功');
    } catch (err) {
      console.error('导出失败:', err);
      onError('导出失败，请重试');
    }
  }, [onError, onSuccess]);

  const handleImportData = useCallback(() => {
    importInputRef?.click();
  }, [importInputRef]);

  const handleImportFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      onError('请选择 JSON 文件');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (readerEvent) => {
      try {
        const result = readerEvent.target?.result;
        if (typeof result !== 'string') {
          onError('导入失败，请检查文件格式');
          return;
        }

        const data: unknown = JSON.parse(result);
        if (!isImportPayload(data)) {
          onError('无效的数据格式');
          return;
        }

        if (confirm('导入数据将覆盖当前所有数据，确定要继续吗？')) {
          const migratedData = storage.migrateData(data);
          await storage.saveData(migratedData);

          if (typeof data.bgImage === 'string') {
            await storage.setBgImage(data.bgImage);
            await reloadBackground();
          }

          await reloadData();
          await reloadSearchEngine();
          await reloadSearchEngines();
          onSuccess('数据导入成功');
        }
      } catch (err) {
        console.error('导入失败:', err);
        onError('导入失败，请检查文件格式');
      }
    };
    reader.onerror = () => {
      onError('导入失败，请检查文件格式');
    };
    reader.readAsText(file);

    event.target.value = '';
  }, [
    onError,
    onSuccess,
    reloadBackground,
    reloadData,
    reloadSearchEngine,
    reloadSearchEngines,
  ]);

  return {
    setImportInputRef,
    handleExportData,
    handleImportData,
    handleImportFileChange,
  };
};
