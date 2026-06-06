import React from 'react';
import { Close, Download, MenuFold, Pic, Plus, Search, Upload } from '@icon-park/react';

interface HeaderMenuProps {
  bgImage: string;
  showMenu: boolean;
  onToggleMenu: () => void;
  onUploadBgImage: () => void;
  onSetBgImageUrl: (url: string) => void;
  onClearBgImage: () => void;
  onExportData: () => void;
  onImportData: () => void;
  onAddWidget: () => void;
  onCloseMenu: () => void;
}

const HeaderMenu: React.FC<HeaderMenuProps> = ({
  bgImage,
  showMenu,
  onToggleMenu,
  onUploadBgImage,
  onSetBgImageUrl,
  onClearBgImage,
  onExportData,
  onImportData,
  onAddWidget,
  onCloseMenu,
}) => {
  const runMenuAction = (action: () => void) => {
    action();
    onCloseMenu();
  };

  return (
    <div className="header-right">
      <button
        className="menu-toggle-btn"
        onClick={onToggleMenu}
      >
        <MenuFold size={22} />
        <span className="menu-btn-text">菜单</span>
      </button>
      {showMenu && (
        <div className="header-menu">
          <button
            className="header-menu-item"
            onClick={() => runMenuAction(onUploadBgImage)}
          >
            <Pic className="header-menu-icon" size={18} colors={['#00809d', '#2932e1']} />
            <span>选择本地图片</span>
          </button>
          <button
            className="header-menu-item"
            onClick={() => runMenuAction(() => {
              const url = prompt('输入背景图片 URL:', bgImage || 'https://source.unsplash.com/1920x1080/?nature,landscape');
              if (url) onSetBgImageUrl(url);
            })}
          >
            <Search className="header-menu-icon" size={18} colors={['#00809d', '#2932e1']} />
            <span>输入图片 URL</span>
          </button>
          {bgImage && (
            <button
              className="header-menu-item"
              onClick={() => runMenuAction(onClearBgImage)}
            >
              <Close className="header-menu-icon" size={18} colors={['#ef4444', '#f87171']} />
              <span>清除背景</span>
            </button>
          )}
          <div className="header-menu-divider" />
          <button
            className="header-menu-item"
            onClick={() => runMenuAction(onExportData)}
          >
            <Download className="header-menu-icon" size={18} colors={['currentColor', 'currentColor']} />
            <span>导出备份数据</span>
          </button>
          <button
            className="header-menu-item"
            onClick={() => runMenuAction(onImportData)}
          >
            <Upload className="header-menu-icon" size={18} colors={['currentColor', 'currentColor']} />
            <span>导入备份数据</span>
          </button>
          <div className="header-menu-divider" />
          <button
            className="header-menu-item"
            onClick={() => runMenuAction(onAddWidget)}
          >
            <Plus className="header-menu-icon" size={18} colors={['currentColor', 'currentColor']} />
            <span>添加小组件</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default HeaderMenu;
