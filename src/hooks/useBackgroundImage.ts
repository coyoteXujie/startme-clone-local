import { useCallback, useState } from 'react';
import type { ChangeEvent } from 'react';
import { storage } from '../utils/storage';
import defaultBg from '../assets/background.jpg';

interface UseBackgroundImageOptions {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * 管理背景图片加载和写入。
 * 背景图片单独存在 chrome.storage.local，这里统一处理默认值、上传校验和保存错误。
 */
export const useBackgroundImage = ({ onSuccess, onError }: UseBackgroundImageOptions) => {
  const [bgImage, setBgImage] = useState<string>('');
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);

  const loadBgImage = useCallback(async () => {
    const storedBgImage = await storage.getBgImage();
    if (storedBgImage === undefined) {
      setBgImage(defaultBg);
    } else {
      setBgImage(storedBgImage);
    }
  }, []);

  const handleSetBgImage = useCallback(async (url: string): Promise<boolean> => {
    try {
      await storage.setBgImage(url);
      setBgImage(url);
      return true;
    } catch (err) {
      console.error('保存背景失败:', err);
      onError('保存背景失败，请重试');
      return false;
    }
  }, [onError]);

  const handleClearBgImage = useCallback(async () => {
    if (await handleSetBgImage('')) {
      onSuccess('背景已清除');
    }
  }, [handleSetBgImage, onSuccess]);

  const handleUploadBgImage = useCallback(() => {
    fileInputRef?.click();
  }, [fileInputRef]);

  const handleBgImageChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      onError('图片大小请勿超过 2MB');
      event.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      onError('请选择图片文件');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (readerEvent) => {
      const base64 = readerEvent.target?.result;
      if (typeof base64 !== 'string') {
        onError('读取图片失败，请重试');
        return;
      }

      if (await handleSetBgImage(base64)) {
        onSuccess('背景图片已设置');
      }
    };
    reader.onerror = () => {
      onError('读取图片失败，请重试');
    };
    reader.readAsDataURL(file);

    event.target.value = '';
  }, [handleSetBgImage, onError, onSuccess]);

  return {
    bgImage,
    setFileInputRef,
    loadBgImage,
    handleSetBgImage,
    handleClearBgImage,
    handleUploadBgImage,
    handleBgImageChange,
  };
};
