import React, { useState, useEffect } from 'react';
import { Widget } from './types';
import { useToast } from './hooks/useToast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSearchEngines } from './hooks/useSearchEngines';
import { useBackgroundImage } from './hooks/useBackgroundImage';
import { useWidgetDrag } from './hooks/useWidgetDrag';
import { useBackupData } from './hooks/useBackupData';
import { useDashboardData } from './hooks/useDashboardData';
import TabBar from './components/TabBar';
import AddWidgetModal from './components/AddWidgetModal';
import HeaderMenu from './components/HeaderMenu';
import LinkModal from './components/LinkModal';
import SearchBar from './components/SearchBar';
import SearchEngineSettingsModal from './components/SearchEngineSettingsModal';
import ToastContainer from './components/ToastContainer';
import WidgetGrid from './components/WidgetGrid';
import WidgetRenderer from './components/WidgetRenderer';

const App: React.FC = () => {
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);

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
  const {
    tabs,
    activeTabId,
    activeTab,
    showAddTabInput,
    newTabName,
    pendingWidgetType,
    newWidgetTitle,
    showLinkModal,
    editingLink,
    newLinkName,
    newLinkUrl,
    setTabs,
    setNewTabName,
    setNewWidgetTitle,
    setNewLinkName,
    setNewLinkUrl,
    loadData,
    handleSetActiveTab,
    handleAddTab,
    handleConfirmAddTab,
    handleCancelAddTab,
    handleDeleteTab,
    handleStartAddWidget,
    handleSetActiveAddColumnId,
    handleCancelAddWidget,
    handleConfirmAddWidget,
    handleDeleteWidget,
    handleToggleWidgetCollapsed,
    handleWidgetDataChange,
    handleOpenLinkModal,
    closeLinkModal,
    handleSaveLink,
    handleAddBookmark,
  } = useDashboardData({
    onSuccess: success,
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

  useEffect(() => {
    loadData().catch((err) => {
      console.error('加载数据失败:', err);
      error('加载数据失败，请刷新页面重试');
    });
    loadBgImage().catch((err) => {
      console.error('加载背景失败:', err);
    });
    loadSearchEngine().catch((err) => {
      console.error('加载搜索引擎失败:', err);
    });
    loadSearchEngines().catch((err) => {
      console.error('加载搜索引擎列表失败:', err);
    });

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
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
        closeLinkModal();
        handleCancelAddTab();
        handleCancelAddWidget();
      },
    },
    {
      key: 'f',
      action: () => {
        const nextState = !showFocusMode;
        setShowFocusMode(nextState);
        info(nextState ? '已进入专注模式' : '已退出专注模式');
      },
    },
  ]);

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

  const closeAddWidget = () => {
    setShowAddWidget(false);
    handleCancelAddWidget();
  };

  const confirmAddWidget = async () => {
    const result = await handleConfirmAddWidget();
    if (result.ok) {
      setShowAddWidget(false);
    }
  };

  const renderWidget = (widget: Widget, columnId: string) => {
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

  const openWidgetPanel = (columnId: string) => {
    handleSetActiveAddColumnId(columnId);
    setShowAddWidget(true);
  };

  const openWidgetPanelForGlobal = () => {
    handleSetActiveAddColumnId(null);
    setShowAddWidget(true);
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
            onCancelAddTab={handleCancelAddTab}
          />
        </div>
        <HeaderMenu
          bgImage={bgImage}
          showMenu={showHeaderMenu}
          onToggleMenu={() => setShowHeaderMenu(!showHeaderMenu)}
          onUploadBgImage={handleUploadBgImage}
          onSetBgImageUrl={(url) => {
            void handleSetBgImage(url);
          }}
          onClearBgImage={() => {
            void handleClearBgImage();
          }}
          onExportData={() => {
            void handleExportData();
          }}
          onImportData={handleImportData}
          onAddWidget={() => {
            openWidgetPanelForGlobal();
          }}
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
        onRequestAddWidget={openWidgetPanel}
      />

      {showAddWidget && (
        <AddWidgetModal
          onSelect={handleStartAddWidget}
          onClose={closeAddWidget}
          pendingWidgetType={pendingWidgetType}
          newWidgetTitle={newWidgetTitle}
          onNewWidgetTitleChange={setNewWidgetTitle}
          onConfirmAddWidget={confirmAddWidget}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

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
