import React, { useState, useEffect } from 'react';
import { Tab, Widget, WidgetType, LinkItem } from './types';
import { storage } from './utils/storage';
import { normalizeHttpUrl } from './utils/url';
import { createWidget, getDefaultWidgetTitle } from './utils/widgetDefaults';
import { useToast } from './hooks/useToast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSearchEngines } from './hooks/useSearchEngines';
import { useBackgroundImage } from './hooks/useBackgroundImage';
import { useWidgetDrag } from './hooks/useWidgetDrag';
import { useBackupData } from './hooks/useBackupData';
import TabBar from './components/TabBar';
import AddWidgetModal from './components/AddWidgetModal';
import HeaderMenu from './components/HeaderMenu';
import LinkModal, { EditingLinkState } from './components/LinkModal';
import SearchBar from './components/SearchBar';
import SearchEngineSettingsModal from './components/SearchEngineSettingsModal';
import ToastContainer from './components/ToastContainer';
import WidgetGrid from './components/WidgetGrid';
import WidgetRenderer, { WidgetDataChangeHandler } from './components/WidgetRenderer';

const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showAddTabInput, setShowAddTabInput] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [newWidgetTitle, setNewWidgetTitle] = useState('');
  const [pendingWidgetType, setPendingWidgetType] = useState<WidgetType | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [activeAddColumnId, setActiveAddColumnId] = useState<string | null>(null);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingLink, setEditingLink] = useState<EditingLinkState | null>(null);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // 初始化 Toast
  const { toasts, success, error, info, dismissToast } = useToast();
  const {
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
  } = useSearchEngines({ onSuccess: success, onError: error });
  const {
    bgImage,
    setFileInputRef,
    loadBgImage,
    handleSetBgImage,
    handleClearBgImage,
    handleUploadBgImage,
    handleBgImageChange,
  } = useBackgroundImage({ onSuccess: success, onError: error });

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

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const {
    dragOverColumn,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useWidgetDrag({
    activeTab,
    activeTabId,
    setTabs,
    reloadData: loadData,
    onError: error,
  });
  const {
    setImportInputRef,
    handleExportData,
    handleImportData,
    handleImportFileChange,
  } = useBackupData({
    reloadData: loadData,
    reloadBackground: loadBgImage,
    reloadSearchEngine: loadSearchEngine,
    reloadSearchEngines: loadSearchEngines,
    onSuccess: success,
    onError: error,
  });

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
          void handleSetSearchEngine(engineId);
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
