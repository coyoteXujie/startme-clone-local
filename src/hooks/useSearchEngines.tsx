import React, { useCallback, useState } from 'react';
import { SearchEngine } from '../types';
import { storage } from '../utils/storage';
import { buildSearchUrl, normalizeHttpUrl } from '../utils/url';
import { createSearchEngineInitialIcon, withSearchEngineIcon } from '../components/SearchEngineIcons';

interface UseSearchEnginesOptions {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * 管理搜索引擎的运行时状态和持久化。
 * App 只负责把这些状态接到 UI 上，搜索模板校验和默认引擎切换集中在这里。
 */
export const useSearchEngines = ({ onSuccess, onError }: UseSearchEnginesOptions) => {
  const [searchEngine, setSearchEngine] = useState<string>('baidu');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchEngines, setSearchEngines] = useState<SearchEngine[]>([]);
  const [showEngineSelect, setShowEngineSelect] = useState(false);
  const [showEngineSettings, setShowEngineSettings] = useState(false);
  const [newEngineName, setNewEngineName] = useState('');
  const [newEngineUrl, setNewEngineUrl] = useState('');
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);

  const loadSearchEngines = useCallback(async () => {
    const storedEngines = await storage.getSearchEngines();
    setSearchEngines(storedEngines.map((engine) => withSearchEngineIcon(engine)));
  }, []);

  const loadSearchEngine = useCallback(async () => {
    const storedSearchEngine = await storage.getSearchEngine();
    setSearchEngine(storedSearchEngine);
  }, []);

  const handleSetSearchEngine = useCallback(async (engine: string) => {
    try {
      await storage.setSearchEngine(engine);
      setSearchEngine(engine);
      setShowEngineSelect(false);
    } catch (err) {
      console.error('保存搜索引擎失败:', err);
      onError('保存搜索引擎失败，请重试');
    }
  }, [onError]);

  const handleSearch = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;

    const engine = searchEngines.find((candidate) => candidate.id === searchEngine);
    const url = buildSearchUrl(engine?.url, searchQuery.trim());

    window.open(url, '_blank');
    setSearchQuery('');
  }, [searchEngine, searchEngines, searchQuery]);

  const handleAddEngine = useCallback(async () => {
    if (!newEngineName.trim() || !newEngineUrl.trim()) return;

    const normalizedUrl = normalizeHttpUrl(newEngineUrl);
    if (!normalizedUrl) {
      onError('请输入有效的 http/https 搜索 URL');
      return;
    }

    const trimmedName = newEngineName.trim();
    const newEngine: SearchEngine = {
      id: `engine-${Date.now()}`,
      name: trimmedName,
      url: normalizedUrl,
      icon: createSearchEngineInitialIcon(trimmedName),
    };
    const updatedEngines = [...searchEngines, newEngine];

    try {
      await storage.setSearchEngines(updatedEngines);
      setSearchEngines(updatedEngines);
      setNewEngineName('');
      setNewEngineUrl('');
      onSuccess('搜索引擎已添加');
    } catch (err) {
      console.error('添加搜索引擎失败:', err);
      onError('添加搜索引擎失败，请重试');
    }
  }, [newEngineName, newEngineUrl, onError, onSuccess, searchEngines]);

  const handleDeleteEngine = useCallback(async (engineId: string) => {
    const updatedEngines = searchEngines.filter((engine) => engine.id !== engineId);
    if (updatedEngines.length === 0) {
      onError('至少保留一个搜索引擎');
      return;
    }

    const nextSearchEngine = searchEngine === engineId ? updatedEngines[0].id : searchEngine;
    try {
      await storage.setSearchEngines(updatedEngines);
      if (searchEngine === engineId) {
        await storage.setSearchEngine(nextSearchEngine);
      }
      setSearchEngines(updatedEngines);
      setSearchEngine(nextSearchEngine);
      onSuccess('搜索引擎已删除');
    } catch (err) {
      console.error('删除搜索引擎失败:', err);
      onError('删除搜索引擎失败，请重试');
    }
  }, [onError, onSuccess, searchEngine, searchEngines]);

  return {
    searchEngine,
    searchQuery,
    searchEngines,
    showEngineSelect,
    showEngineSettings,
    newEngineName,
    newEngineUrl,
    searchInputRef,
    setSearchQuery,
    setShowEngineSelect,
    setShowEngineSettings,
    setNewEngineName,
    setNewEngineUrl,
    setSearchInputRef,
    loadSearchEngine,
    loadSearchEngines,
    handleSetSearchEngine,
    handleSearch,
    handleAddEngine,
    handleDeleteEngine,
  };
};
