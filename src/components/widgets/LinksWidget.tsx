import { useState } from 'react';
import { Widget, LinkItem } from '../../types';
import { ChevronDown, Edit2, Plus, X, Grid, Cloud } from 'lucide-react';

interface LinksWidgetProps {
  widget: Widget;
  tabId: string;
  columnId: string;
  onDataChange: (data: any) => void;
  onToggleCollapsed: () => void;
  onRequestOpenModal: (link: { linkId?: string; isEdit: boolean }, linkData?: LinkItem | null) => void;
  onAddBookmark?: (widgetId: string, name: string, url: string) => Promise<void>;
}

const LinksWidget: React.FC<LinksWidgetProps> = ({ widget, onDataChange, onToggleCollapsed, onRequestOpenModal, onAddBookmark }) => {
  const [links, setLinks] = useState<LinkItem[]>(widget.data.links || []);
  const [viewMode, setViewMode] = useState<'cloud' | 'grid'>(widget.data.viewMode || 'grid');
  const [failedIcons, setFailedIcons] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // 从 URL 提取域名
  const getDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      return domain;
    } catch {
      return '';
    }
  };

  // 获取 favicon URL - 使用 Yandex 图标服务（国内可用）
  const getFaviconUrl = (url: string): string => {
    const domain = getDomainFromUrl(url);
    return `https://favicon.yandex.net/favicon/${domain}`;
  };

  // 生成默认图标（使用首字母）- 模仿 start.me 风格
  const getDefaultIcon = (name: string): string => {
    const firstChar = name.trim().charAt(0).toUpperCase() || 'L';
    // 更丰富的颜色 palette，灵感来自 start.me
    const gradients = [
      ['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)'],
      ['rgba(240, 147, 251, 0.9)', 'rgba(245, 86, 158, 0.9)'],
      ['rgba(79, 172, 254, 0.9)', 'rgba(0, 242, 234, 0.9)'],
      ['rgba(67, 233, 123, 0.9)', 'rgba(56, 190, 118, 0.9)'],
      ['rgba(250, 112, 154, 0.9)', 'rgba(254, 191, 119, 0.9)'],
      ['rgba(53, 92, 125, 0.9)', 'rgba(108, 91, 123, 0.9)'],
      ['rgba(255, 118, 117, 0.9)', 'rgba(254, 185, 86, 0.9)'],
      ['rgba(107, 141, 61, 0.9)', 'rgba(53, 102, 82, 0.9)'],
    ];
    const colorIndex = name.length % gradients.length;
    const [color1, color2] = gradients[colorIndex];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="grad${colorIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color1}"/>
          <stop offset="100%" stop-color="${color2}"/>
        </linearGradient>
      </defs>
      <rect fill="url(#grad${colorIndex})" width="100" height="100" rx="22"/>
      <text x="50" y="65" fontSize="50" text-anchor="middle" fill="white" font-weight="600" font-family="Arial, sans-serif">${firstChar}</text>
    </svg>`;
  };

  // 将 SVG 字符串转换为 Data URL - 使用安全的 Base64 编码
  const getDataUrlIcon = (svgString: string): string => {
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(svgString);
    let binary = '';
    uint8Array.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    return 'data:image/svg+xml;base64,' + btoa(binary);
  };

  // 获取图标 URL - 优先使用真实 favicon，失败时使用字母图标
  const getIconUrl = (link: LinkItem): string => {
    if (failedIcons.has(link.id)) {
      return getDataUrlIcon(getDefaultIcon(link.name));
    }
    return getFaviconUrl(link.url);
  };

  // 图标加载失败时的处理
  const handleIconError = (link: LinkItem) => {
    setFailedIcons(prev => new Set(prev).add(link.id));
  };

  // 切换视图模式
  const handleToggleViewMode = async () => {
    const newMode = viewMode === 'cloud' ? 'grid' : 'cloud';
    setViewMode(newMode);
    await onDataChange({ links, viewMode: newMode });
  };

  const syncData = async (newLinks: LinkItem[]) => {
    setLinks(newLinks);
    await onDataChange({ links: newLinks, viewMode });
  };

  const handleDeleteLink = async (linkId: string) => {
    if (linkId === 'all') {
      await syncData([]);
    } else {
      const updatedLinks = links.filter((link) => link.id !== linkId);
      await syncData(updatedLinks);
    }
  };

  const openEditModal = (link: LinkItem) => {
    onRequestOpenModal({ linkId: link.id, isEdit: true }, link);
  };

  // 根据名称长度获取分类 (1-8 或 long)
  const getNameLengthCategory = (name: string): string => {
    const len = name.length;
    if (len <= 1) return '1';
    if (len <= 8) return String(len);
    return 'long';
  };

  const handleAddLink = async () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) return;

    const url = newLinkUrl.trim().startsWith('http')
      ? newLinkUrl.trim()
      : `https://${newLinkUrl.trim()}`;

    if (onAddBookmark) {
      await onAddBookmark(widget.id, newLinkName.trim(), url);
      setNewLinkName('');
      setNewLinkUrl('');
      setShowAddForm(false);
    }
  };

  const openAddForm = () => {
    setShowAddForm(true);
    setNewLinkName('');
    setNewLinkUrl('');
  };

  return (
    <div className="links-widget widget-content">
      <h3 className="widget-title" onClick={onToggleCollapsed}>
        <span>{widget.title}</span>
        <div className="widget-title-actions" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleToggleViewMode}
            className="view-mode-toggle"
            title={viewMode === 'grid' ? '切换到云图' : '切换到网格'}
          >
            {viewMode === 'grid' ? <Cloud size={16} /> : <Grid size={16} />}
          </button>
          <ChevronDown className="collapse-icon" size={16} style={{ transform: widget.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} />
        </div>
      </h3>

      {widget.collapsed ? (
        <div className="collapsed-content">
          <span className="collapsed-summary">{links.length} 个书签</span>
        </div>
      ) : (
        <>
          <div className={`links-list ${viewMode}`}>
            {links.length === 0 ? (
              <div className="empty-state">暂无书签</div>
            ) : (
              links.map((link) => (
                <div
                  key={link.id}
                  className={`link-item-wrapper ${viewMode}`}
                  data-name-length={getNameLengthCategory(link.name)}
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-item"
                  >
                    <img
                      src={getIconUrl(link)}
                      alt=""
                      className="link-icon"
                      loading="lazy"
                      onError={() => handleIconError(link)}
                    />
                    <span className="link-name">{link.name}</span>
                  </a>
                  <div className="link-actions">
                    <button
                      onClick={() => openEditModal(link)}
                      className="link-edit"
                      title="编辑"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="link-delete"
                      title="删除"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {showAddForm ? (
            <div className="add-rss-form" style={{ marginTop: '12px' }}>
              <input
                type="text"
                placeholder="📛 书签名称"
                value={newLinkName}
                onChange={(e) => setNewLinkName(e.target.value)}
                autoFocus
              />
              <input
                type="text"
                placeholder="🔗 网址链接 (例如：baidu.com)"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
              />
              <button onClick={handleAddLink}>➕ 添加</button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewLinkName('');
                  setNewLinkUrl('');
                }}
                type="button"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={openAddForm}
              style={{
                marginTop: '12px',
                padding: '10px 16px',
                width: '100%',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--color-primary)',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary-gradient)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)';
                e.currentTarget.style.color = 'var(--color-primary)';
                e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <Plus size={16} />
              添加书签
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default LinksWidget;
