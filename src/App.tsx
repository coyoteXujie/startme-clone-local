import React, { useState, useEffect } from 'react';
import { Tab, Widget, DragData, SearchEngine, Column, WidgetType, LinkItem } from './types';
import { storage } from './utils/storage';
import { buildSearchUrl, normalizeHttpUrl } from './utils/url';
import { createWidget, getDefaultWidgetTitle } from './utils/widgetDefaults';
import { useToast } from './hooks/useToast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import TabBar from './components/TabBar';
import AddWidgetModal from './components/AddWidgetModal';
import HeaderMenu from './components/HeaderMenu';
import LinkModal, { EditingLinkState } from './components/LinkModal';
import SearchBar from './components/SearchBar';
import SearchEngineSettingsModal from './components/SearchEngineSettingsModal';
import ToastContainer from './components/ToastContainer';
import WidgetGrid from './components/WidgetGrid';
import WidgetRenderer, { WidgetDataChangeHandler } from './components/WidgetRenderer';
import { withSearchEngineIcon } from './components/SearchEngineIcons';
import defaultBg from './assets/background.jpg';

const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showAddTabInput, setShowAddTabInput] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [newWidgetTitle, setNewWidgetTitle] = useState('');
  const [pendingWidgetType, setPendingWidgetType] = useState<WidgetType | null>(null);
  const [bgImage, setBgImage] = useState<string>('');
  const [searchEngine, setSearchEngine] = useState<string>('baidu');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchEngines, setSearchEngines] = useState<SearchEngine[]>([]);
  const [showEngineSelect, setShowEngineSelect] = useState(false);
  const [showEngineSettings, setShowEngineSettings] = useState(false);
  const [newEngineName, setNewEngineName] = useState('');
  const [newEngineUrl, setNewEngineUrl] = useState('');
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  const [importInputRef, setImportInputRef] = useState<HTMLInputElement | null>(null);
  const [draggedWidget, setDraggedWidget] = useState<DragData | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [activeAddColumnId, setActiveAddColumnId] = useState<string | null>(null);
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingLink, setEditingLink] = useState<EditingLinkState | null>(null);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // 初始化 Toast
  const { toasts, success, error, info, dismissToast } = useToast();

  useEffect(() => {
    loadData().catch(err => {
      console.error('加载数据失败:', err);
      error('加载数据失败，请刷新页面重试');
    });
    loadBgImage().catch(err => {
      console.error('加载背景失败:', err);
    });
    loadSearchEngine().catch(err => {
      console.error('加载搜索引擎失败:', err);
    });
    loadSearchEngines().catch(err => {
      console.error('加载搜索引擎列表失败:', err);
    });

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.header-right')) {
        setShowHeaderMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 键盘快捷键
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      action: () => {
        searchInputRef?.focus();
      },
      preventDefault: true,
    },
    {
      key: 'Escape',
      action: () => {
        setShowEngineSelect(false);
        setShowEngineSettings(false);
        setShowHeaderMenu(false);
        setShowAddWidget(false);
        setShowAddTabInput(false);
        setPendingWidgetType(null);
      },
    },
    {
      key: 'f',
      action: () => {
        const newState = !showFocusMode;
        setShowFocusMode(newState);
        info(newState ? '已进入专注模式' : '已退出专注模式');
      },
    },
  ]);

  const loadSearchEngines = async () => {
    const storedEngines = await storage.getSearchEngines();
    setSearchEngines(storedEngines.map((engine) => withSearchEngineIcon(engine)));
  };

  const loadSearchEngine = async () => {
    const storedSearchEngine = await storage.getSearchEngine();
    setSearchEngine(storedSearchEngine);
  };

  const loadData = async () => {
    const storedData = await storage.getData();
    const storedTabs = storedData.tabs;
    const storedActiveTabId = storedData.activeTabId;
    setTabs(storedTabs);
    if (storedActiveTabId && storedTabs.find((t) => t.id === storedActiveTabId)) {
      setActiveTabId(storedActiveTabId);
    } else if (storedTabs.length > 0) {
      setActiveTabId(storedTabs[0].id);
      storage.setActiveTabId(storedTabs[0].id).catch(err => {
        console.error('保存当前标签页失败:', err);
      });
    } else {
      // 如果没有标签页，创建一个默认的
      const defaultTab: Tab = {
        id: `tab-${Date.now()}`,
        name: '首页',
        columns: [
          { id: `col-1-${Date.now()}`, widgets: [] },
          { id: `col-2-${Date.now()}`, widgets: [] },
          { id: `col-3-${Date.now()}`, widgets: [] },
          { id: `col-4-${Date.now()}`, widgets: [] },
        ],
        createdAt: Date.now(),
      };
      await storage.addTab(defaultTab);
      setActiveTabId(defaultTab.id);
      await storage.setActiveTabId(defaultTab.id);
      await loadData();
    }
  };

  const loadBgImage = async () => {
    const storedBgImage = await storage.getBgImage();
    if (storedBgImage === undefined) {
      setBgImage(defaultBg);
    } else {
      setBgImage(storedBgImage);
    }
  };

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleSetActiveTab = (tabId: string) => {
    setActiveTabId(tabId);
    storage.setActiveTabId(tabId).catch(err => {
      console.error('保存当前标签页失败:', err);
    });
  };

  const handleAddTab = async () => {
    setShowAddTabInput(true);
    setNewTabName('');
  };

  const handleConfirmAddTab = async () => {
    if (!newTabName.trim()) return;

    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      name: newTabName.trim(),
      columns: [
        { id: `col-1-${Date.now()}`, widgets: [] },
        { id: `col-2-${Date.now()}`, widgets: [] },
        { id: `col-3-${Date.now()}`, widgets: [] },
        { id: `col-4-${Date.now()}`, widgets: [] },
      ],
      createdAt: Date.now(),
    };

    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    setShowAddTabInput(false);
    setNewTabName('');
    success(`已创建标签页 "${newTab.name}"`);

    (async () => {
      try {
        await storage.addTab(newTab);
        await storage.setActiveTabId(newTab.id);
      } catch (err) {
        console.error('保存标签页失败:', err);
        error('保存标签页失败，请重试');
        loadData();
      }
    })();
  };

  const handleDeleteTab = async (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      error('至少需要保留一个标签页');
      return;
    }
    if (confirm('确定要删除这个标签页吗？')) {
      // 本地先更新
      const newTabs = tabs.filter(t => t.id !== tabId);
      setTabs(newTabs);
      const nextActiveTabId = activeTabId === tabId ? newTabs[0].id : activeTabId;
      if (activeTabId === tabId) {
        setActiveTabId(nextActiveTabId);
      }
      success('标签页已删除');

      // 异步保存
      (async () => {
        try {
          await storage.deleteTab(tabId);
          await storage.setActiveTabId(nextActiveTabId);
        } catch (err) {
          console.error('删除标签页失败:', err);
          error('删除标签页失败，请重试');
          loadData();
        }
      })();
    }
  };

  const handleAddWidget = async (widgetType: WidgetType) => {
    setPendingWidgetType(widgetType);
    setNewWidgetTitle(getDefaultWidgetTitle(widgetType));
  };

  const handleConfirmAddWidget = async () => {
    if (!pendingWidgetType) return;
    const title = newWidgetTitle.trim() || pendingWidgetType;
    const newWidget = createWidget(pendingWidgetType, title);

    const targetColumnId = activeAddColumnId || activeTab?.columns[0]?.id;
    if (activeTab && targetColumnId) {
      try {
        await storage.addWidgetToColumn(activeTabId, targetColumnId, newWidget);
        await loadData();
        success(`已添加 ${title} 小组件`);
      } catch (err) {
        console.error('添加小组件失败:', err);
        error('添加小组件失败，请重试');
        return;
      }
    } else {
      error('没有可用的列来添加小组件');
      return;
    }

    setActiveAddColumnId(null);
    setShowAddWidget(false);
    setPendingWidgetType(null);
    setNewWidgetTitle('');
  };

  const handleDeleteWidget = async (widgetId: string) => {
    if (activeTab) {
      const widget = activeTab.columns.flatMap(c => c.widgets).find(w => w.id === widgetId);
      const title = widget?.title || '组件';
      if (!confirm(`确定要删除「${title}」吗？`)) return;
      try {
        await storage.deleteWidget(activeTabId, widgetId);
        await loadData();
        success(`已删除「${title}」`);
      } catch (err) {
        console.error('删除小组件失败:', err);
        error('删除小组件失败，请重试');
      }
    }
  };

  const handleToggleWidgetCollapsed = async (widgetId: string) => {
    if (activeTab) {
      const currentWidget = activeTab.columns.flatMap(c => c.widgets).find(w => w.id === widgetId);
      if (!currentWidget) return;

      const nextCollapsed = !currentWidget.collapsed;
      const newTabs = tabs.map(tab => {
        if (tab.id !== activeTabId) return tab;
        return {
          ...tab,
          columns: tab.columns.map(col => ({
            ...col,
            widgets: col.widgets.map(widget =>
              widget.id === widgetId ? { ...widget, collapsed: nextCollapsed } : widget
            )
          }))
        };
      });

      setTabs(newTabs);

      storage.updateWidget(activeTabId, widgetId, { collapsed: nextCollapsed }).catch(err => {
        console.error('保存折叠状态失败:', err);
        error('保存折叠状态失败，请重试');
        loadData();
      });
    }
  };

  const handleSetBgImage = async (url: string): Promise<boolean> => {
    try {
      await storage.setBgImage(url);
      setBgImage(url);
      return true;
    } catch (err) {
      console.error('保存背景失败:', err);
      error('保存背景失败，请重试');
      return false;
    }
  };

  const handleClearBgImage = async () => {
    if (await handleSetBgImage('')) {
      success('背景已清除');
    }
  };

  const closeLinkModal = () => {
    setShowLinkModal(false);
    setEditingLink(null);
    setNewLinkName('');
    setNewLinkUrl('');
  };

  const handleOpenLinkModal = ({
    widgetId,
    linkId,
    isEdit,
    linkData,
  }: {
    widgetId: string;
    linkId?: string;
    isEdit: boolean;
    linkData?: LinkItem | null;
  }) => {
    setEditingLink({ widgetId, linkId, isEdit });
    setNewLinkName(linkData?.name || '');
    setNewLinkUrl(linkData?.url || '');
    setShowLinkModal(true);
  };

  // 处理链接书签的保存（添加/更新）
  const handleSaveLink = async () => {
    if (!newLinkName.trim() || !newLinkUrl.trim() || !editingLink) return;

    try {
      if (editingLink.isEdit) {
        // 编辑现有书签
        const widget = activeTab?.columns.flatMap((c) => c.widgets).find((w) => w.id === editingLink.widgetId);
        if (!widget || widget.type !== 'links') return;

        const links = widget.data.links || [];
        const url = normalizeHttpUrl(newLinkUrl);
        if (!url) {
          error('请输入有效的网址');
          return;
        }
        const updatedLinks = links.map((link: LinkItem) =>
          link.id === editingLink.linkId
            ? {
                ...link,
                name: newLinkName.trim(),
                url,
              }
            : link
        );

        await storage.updateWidget(activeTabId, widget.id, {
          data: { ...widget.data, links: updatedLinks },
        });
        await loadData();
        success('书签已更新');
      } else {
        // 添加新书签
        const widget = activeTab?.columns.flatMap((c) => c.widgets).find((w) => w.id === editingLink.widgetId);
        if (!widget || widget.type !== 'links') return;

        const links = widget.data.links || [];
        const url = normalizeHttpUrl(newLinkUrl);
        if (!url) {
          error('请输入有效的网址');
          return;
        }
        const newLink = {
          id: `link-${Date.now()}`,
          name: newLinkName.trim(),
          url,
        };

        await storage.updateWidget(activeTabId, widget.id, {
          data: { ...widget.data, links: [...links, newLink] },
        });
        await loadData();
        success('书签已添加');
      }
    } catch (err) {
      console.error('保存书签失败:', err);
      error('保存书签失败，请重试');
      loadData();
      return;
    }

    closeLinkModal();
  };

  // 处理添加书签（直接在组件内表单添加）
  const handleAddBookmark = async (widgetId: string, name: string, url: string) => {
    const widget = activeTab?.columns.flatMap((c) => c.widgets).find((w) => w.id === widgetId);
    if (!widget || widget.type !== 'links') return;

    const links = widget.data.links || [];
    const normalizedUrl = normalizeHttpUrl(url);
    if (!normalizedUrl) {
      error('请输入有效的网址');
      return;
    }

    const newLink = {
      id: `link-${Date.now()}`,
      name: name.trim(),
      url: normalizedUrl,
    };

    // 先更新本地 state，让 UI 立即响应
    const updatedTabs = tabs.map((tab) => {
      if (tab.id !== activeTabId) return tab;
      return {
        ...tab,
        columns: tab.columns.map((col) => ({
          ...col,
          widgets: col.widgets.map((w) => {
            if (w.id !== widgetId) return w;
            if (w.type !== 'links') return w;
            return {
              ...w,
              data: { ...w.data, links: [...(w.data.links || []), newLink] },
            };
          }),
        })),
      };
    });
    setTabs(updatedTabs);

    // 异步保存到 storage
    try {
      await storage.updateWidget(activeTabId, widgetId, {
        data: { ...widget.data, links: [...links, newLink] },
      });
      success('书签已添加');
    } catch (err) {
      console.error('保存书签失败:', err);
      error('保存书签失败，请重试');
      loadData();
    }
  };

  // 拖拽处理函数
  const handleDragStart = (e: React.DragEvent, widgetId: string, columnId: string) => {
    const dragData: DragData = {
      widgetId,
      tabId: activeTabId,
      sourceColumnId: columnId,
    };
    setDraggedWidget(dragData);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    // 设置拖拽时的半透明效果
    e.dataTransfer.setDragImage(e.currentTarget as HTMLElement, 20, 20);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const column = activeTab?.columns.find((c) => c.id === columnId);
    if (!column) return;

    const widgets = column.widgets;
    const columnEl = e.currentTarget as HTMLElement;
    const columnRect = columnEl.getBoundingClientRect();
    const scrollY = columnEl.scrollTop || 0;
    const relativeY = e.clientY - columnRect.top + scrollY;

    // 查找鼠标位置对应的 widget 索引
    let dropIndex = widgets.length;
    for (let i = 0; i < widgets.length; i++) {
      const widgetEl = columnEl.querySelector(`[data-widget-index="${i}"]`);
      if (widgetEl) {
        const widgetRect = widgetEl.getBoundingClientRect();
        const widgetMiddle = widgetRect.top - columnRect.top + widgetRect.height / 2 + scrollY;
        if (relativeY < widgetMiddle) {
          dropIndex = i;
          break;
        }
      }
    }

    setDragOverColumn(columnId);
    setDragOverIndex(dropIndex);
  };

  const handleDragLeave = (e: React.DragEvent, _columnId: string) => {
    e.preventDefault();
    // 只有当鼠标真正离开当前 column 时才清除状态
    // 使用 bounding box 检查鼠标是否还在 column 元素内
    const column = e.currentTarget as HTMLElement;
    const rect = column.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // 如果鼠标还在 column 范围内，不清除状态
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return;
    }

    setDragOverColumn(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string, targetIndex: number) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDragOverIndex(null);

    if (draggedWidget && activeTab) {
      // 先在本地更新状态，避免全量重加载
      const newTabs = tabs.map(tab => {
        if (tab.id !== draggedWidget.tabId) return tab;

        // 找到源列和小组件
        let sourceColumn: Column | undefined;
        let widgetIndex = -1;
        let widget: Widget | undefined;

        for (const col of tab.columns) {
          const idx = col.widgets.findIndex(w => w.id === draggedWidget.widgetId);
          if (idx !== -1) {
            sourceColumn = col;
            widgetIndex = idx;
            widget = col.widgets[idx];
            break;
          }
        }

        if (!sourceColumn || !widget) return tab;

        // 如果是同一个列内移动
        if (sourceColumn.id === targetColumnId) {
          const newWidgets = [...sourceColumn.widgets];
          // 先移除原来的位置
          newWidgets.splice(widgetIndex, 1);
          // 计算正确的目标索引（因为移除了一个元素，如果目标索引大于原来的索引，需要减1）
          const adjustedIndex = targetIndex > widgetIndex ? targetIndex - 1 : targetIndex;
          const safeIndex = Math.max(0, Math.min(adjustedIndex, newWidgets.length));
          // 插入到新位置
          newWidgets.splice(safeIndex, 0, widget);

          return {
            ...tab,
            columns: tab.columns.map(col => {
              if (col.id === sourceColumn?.id) {
                return { ...col, widgets: newWidgets };
              }
              return col;
            })
          };
        }

        // 不同列之间移动
        // 从源列移除
        const newSourceColumn = {
          ...sourceColumn,
          widgets: sourceColumn.widgets.filter((_: Widget, idx: number) => idx !== widgetIndex)
        };

        // 插入到目标列
        return {
          ...tab,
          columns: tab.columns.map(col => {
            if (col.id === sourceColumn?.id) return newSourceColumn;
            if (col.id === targetColumnId) {
              const safeIndex = Math.max(0, Math.min(targetIndex, col.widgets.length));
              const newWidgets = [...col.widgets];
              newWidgets.splice(safeIndex, 0, widget!);
              return { ...col, widgets: newWidgets };
            }
            return col;
          })
        };
      });

      // 更新本地状态
      setTabs(newTabs);
      setDraggedWidget(null);

      // 异步保存到存储，不阻塞UI
      storage.moveWidget(draggedWidget.tabId, draggedWidget.widgetId, targetColumnId, targetIndex).catch(err => {
        console.error('保存拖拽位置失败:', err);
        error('保存拖拽位置失败，请重试');
        // 如果保存失败，重新加载数据恢复正确状态
        loadData();
      });
    }
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
    setDragOverColumn(null);
    setDragOverIndex(null);
  };

  const handleUploadBgImage = () => {
    fileInputRef?.click();
  };

  const handleBgImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件大小（限制 2MB）
    if (file.size > 2 * 1024 * 1024) {
      error('图片大小请勿超过 2MB');
      return;
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      error('请选择图片文件');
      return;
    }

    // 转换为 base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (await handleSetBgImage(base64)) {
        success('背景图片已设置');
      }
    };
    reader.onerror = () => {
      error('读取图片失败，请重试');
    };
    reader.readAsDataURL(file);

    // 清空 input，允许重复选择同一文件
    e.target.value = '';
  };

  // 导出数据
  const handleExportData = async () => {
    try {
      const data = await storage.getData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `startme-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('数据导出成功');
    } catch (err) {
      console.error('导出失败:', err);
      error('导出失败，请重试');
    }
  };

  // 导入数据
  const handleImportData = () => {
    importInputRef?.click();
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      error('请选择 JSON 文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        // 验证数据格式
        if (!data.tabs) {
          error('无效的数据格式');
          return;
        }
        // 确认导入
        if (confirm('导入数据将覆盖当前所有数据，确定要继续吗？')) {
          const migratedData = storage.migrateData(data);
          await storage.saveData(migratedData);
          if (data.bgImage) {
            await storage.setBgImage(data.bgImage);
            await loadBgImage();
          }
          await loadData();
          await loadSearchEngine();
          await loadSearchEngines();
          success('数据导入成功');
        }
      } catch (err) {
        console.error('导入失败:', err);
        error('导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);

    // 清空 input
    e.target.value = '';
  };

  const handleSetSearchEngine = async (engine: string) => {
    try {
      await storage.setSearchEngine(engine);
      setSearchEngine(engine);
      setShowEngineSelect(false);
    } catch (err) {
      console.error('保存搜索引擎失败:', err);
      error('保存搜索引擎失败，请重试');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const engine = searchEngines.find((e) => e.id === searchEngine);
    const url = buildSearchUrl(engine?.url, searchQuery.trim());

    window.open(url, '_blank');
    setSearchQuery('');
  };

  const handleAddEngine = async () => {
    if (!newEngineName.trim() || !newEngineUrl.trim()) return;
    const normalizedUrl = normalizeHttpUrl(newEngineUrl);
    if (!normalizedUrl) {
      error('请输入有效的 http/https 搜索 URL');
      return;
    }

    const newEngine: SearchEngine = {
      id: `engine-${Date.now()}`,
      name: newEngineName.trim(),
      url: normalizedUrl,
      icon: (
        <svg viewBox="0 0 100 100" width="18" height="18">
          <circle cx="50" cy="50" r="45" fill="#00809d"/>
          <text x="50" y="65" fontSize="40" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial">
            {newEngineName.trim().charAt(0)}
          </text>
        </svg>
      ),
    };
    const updatedEngines = [...searchEngines, newEngine];
    try {
      await storage.setSearchEngines(updatedEngines);
      setSearchEngines(updatedEngines);
      setNewEngineName('');
      setNewEngineUrl('');
      success('搜索引擎已添加');
    } catch (err) {
      console.error('添加搜索引擎失败:', err);
      error('添加搜索引擎失败，请重试');
    }
  };

  const handleDeleteEngine = async (engineId: string) => {
    const updatedEngines = searchEngines.filter((e) => e.id !== engineId);
    if (updatedEngines.length === 0) {
      error('至少保留一个搜索引擎');
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
      success('搜索引擎已删除');
    } catch (err) {
      console.error('删除搜索引擎失败:', err);
      error('删除搜索引擎失败，请重试');
    }
  };

  const handleWidgetDataChange: WidgetDataChangeHandler = async (currentTabId, widget, data) => {
    try {
      await storage.saveWidgetData(currentTabId, widget.id, data);
      // 这里通过 widget.id 定位同一个实体；类型转换集中在这一处，避免各组件继续散落 any。
      setTabs(prevTabs => prevTabs.map(tab => {
        if (tab.id !== currentTabId) return tab;
        return {
          ...tab,
          columns: tab.columns.map(col => ({
            ...col,
            widgets: col.widgets.map(w =>
              w.id === widget.id ? { ...w, data } as Widget : w
            )
          }))
        };
      }));
    } catch (err) {
      console.error('保存组件数据失败:', err);
      error('保存组件数据失败，请重试');
      loadData();
    }
  };

  const renderWidget = (widget: Widget, columnId: string) => {
    // 捕获当前标签页 ID，异步回调时不会因为用户切换标签页而改变。
    return (
      <WidgetRenderer
        widget={widget}
        tabId={activeTabId}
        columnId={columnId}
        onDataChange={handleWidgetDataChange}
        onDeleteWidget={handleDeleteWidget}
        onToggleCollapsed={handleToggleWidgetCollapsed}
        onOpenLinkModal={handleOpenLinkModal}
        onAddBookmark={handleAddBookmark}
      />
    );
  };

  return (
    <div className={`app ${showFocusMode ? 'focus-mode-active' : ''}`} style={bgImage ? { backgroundImage: `url(${bgImage})` } : {}}>
      <input
        type="file"
        accept="image/*"
        ref={setFileInputRef}
        onChange={handleBgImageChange}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        accept="application/json"
        ref={setImportInputRef}
        onChange={handleImportFileChange}
        style={{ display: 'none' }}
      />
      <SearchBar
        engines={searchEngines}
        activeEngineId={searchEngine}
        query={searchQuery}
        showEngineSelect={showEngineSelect}
        inputRef={setSearchInputRef}
        onSubmit={handleSearch}
        onQueryChange={setSearchQuery}
        onToggleEngineSelect={() => setShowEngineSelect(!showEngineSelect)}
        onSelectEngine={(engineId) => {
          handleSetSearchEngine(engineId);
          setShowEngineSelect(false);
        }}
        onOpenSettings={() => {
          setShowEngineSelect(false);
          setShowEngineSettings(true);
        }}
      />

      {/* 搜索引擎设置弹窗 */}
      {showEngineSettings && (
        <SearchEngineSettingsModal
          engines={searchEngines}
          activeEngineId={searchEngine}
          newEngineName={newEngineName}
          newEngineUrl={newEngineUrl}
          onClose={() => setShowEngineSettings(false)}
          onSelectEngine={handleSetSearchEngine}
          onDeleteEngine={handleDeleteEngine}
          onNewEngineNameChange={setNewEngineName}
          onNewEngineUrlChange={setNewEngineUrl}
          onAddEngine={handleAddEngine}
        />
      )}

      <header className="header">
        <div className="header-left">
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            showAddTabInput={showAddTabInput}
            newTabName={newTabName}
            onTabClick={handleSetActiveTab}
            onAddTab={handleAddTab}
            onDeleteTab={handleDeleteTab}
            onNewTabNameChange={setNewTabName}
            onConfirmAddTab={handleConfirmAddTab}
            onCancelAddTab={() => { setShowAddTabInput(false); setNewTabName(''); }}
          />
        </div>
        <HeaderMenu
          bgImage={bgImage}
          showMenu={showHeaderMenu}
          onToggleMenu={() => setShowHeaderMenu(!showHeaderMenu)}
          onUploadBgImage={handleUploadBgImage}
          onSetBgImageUrl={(url) => { void handleSetBgImage(url); }}
          onClearBgImage={() => { void handleClearBgImage(); }}
          onExportData={() => { void handleExportData(); }}
          onImportData={handleImportData}
          onAddWidget={() => setShowAddWidget(true)}
          onCloseMenu={() => setShowHeaderMenu(false)}
        />
      </header>

      <WidgetGrid
        activeTab={activeTab}
        dragOverColumn={dragOverColumn}
        dragOverIndex={dragOverIndex}
        renderWidget={renderWidget}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDeleteWidget={handleDeleteWidget}
        onRequestAddWidget={(columnId) => {
          setActiveAddColumnId(columnId);
          setShowAddWidget(true);
        }}
      />

      {showAddWidget && (
        <AddWidgetModal
          onSelect={handleAddWidget}
          onClose={() => {
            setActiveAddColumnId(null);
            setShowAddWidget(false);
            setPendingWidgetType(null);
            setNewWidgetTitle('');
          }}
          pendingWidgetType={pendingWidgetType}
          newWidgetTitle={newWidgetTitle}
          onNewWidgetTitleChange={setNewWidgetTitle}
          onConfirmAddWidget={handleConfirmAddWidget}
        />
      )}

      {/* Toast 通知容器 */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* 链接书签全局弹窗 - 渲染在 App 层级避免堆叠上下文问题 */}
      {showLinkModal && (
        <LinkModal
          editingLink={editingLink}
          name={newLinkName}
          url={newLinkUrl}
          onNameChange={setNewLinkName}
          onUrlChange={setNewLinkUrl}
          onSave={handleSaveLink}
          onClose={closeLinkModal}
        />
      )}
    </div>
  );
};

export default App;
