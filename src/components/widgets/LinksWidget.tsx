import { useState, useEffect } from 'react';
import { Widget, LinkItem } from '../../types';
import { ChevronDown, Edit2, Plus, X } from 'lucide-react';

interface LinksWidgetProps {
  widget: Widget;
  tabId: string;
  columnId: string;
  onDataChange: (data: any) => void;
  onToggleCollapsed: () => void;
  onRequestOpenModal: (link: { linkId?: string; isEdit: boolean }, linkData?: LinkItem | null) => void;
}

const LinksWidget: React.FC<LinksWidgetProps> = ({ widget, onDataChange, onToggleCollapsed, onRequestOpenModal }) => {
  const [links, setLinks] = useState<LinkItem[]>(widget.data.links || []);
  const [viewMode] = useState<'cloud' | 'grid'>(widget.data.viewMode || 'grid');

  // 从 URL 提取域名
  const getDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      return domain;
    } catch {
      return '';
    }
  };

  // 获取 Google favicon 服务生成的图标 URL
  const getFaviconUrl = (url: string): string => {
    const domain = getDomainFromUrl(url);
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
  };

  // 监听 widget.data.links 变化，自动补充缺失的图标
  useEffect(() => {
    const currentLinks = widget.data.links || [];
    const linksNeedUpdate = currentLinks.some((link: LinkItem) => !link.icon || link.icon.trim() === '');

    if (linksNeedUpdate) {
      const linksWithIcons = currentLinks.map((link: LinkItem) => {
        const icon = !link.icon || link.icon.trim() === '' ? getFaviconUrl(link.url) : link.icon;
        return { ...link, icon };
      });
      setLinks(linksWithIcons);
      onDataChange({ links: linksWithIcons, viewMode });
    } else {
      setLinks(currentLinks);
    }
  }, [widget.data.links]);

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

  // 根据名称长度获取字体大小分类
  const getNameLengthCategory = (name: string): string => {
    const len = name.length;
    if (len <= 1) return '1';
    if (len <= 8) return String(len);
    return 'long';
  };

  const openAddModal = () => {
    onRequestOpenModal({ isEdit: false }, null);
  };

  return (
    <div className="links-widget widget-content">
      <h3 className="widget-title" onClick={onToggleCollapsed}>
        <span>{widget.title}</span>
        <ChevronDown className="collapse-icon" size={16} style={{ transform: widget.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} />
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
                      src={link.icon}
                      alt=""
                      className="link-icon"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const domain = getDomainFromUrl(link.url);
                        if (target.src.includes('google.com')) {
                          target.src = `https://api.iconify.design/${domain}.svg`;
                        } else {
                          target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23667eea" width="100" height="100" rx="20"/><text x="50" y="68" fontSize="50" text-anchor="middle" fill="white">🔗</text></svg>';
                        }
                      }}
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

          {/* 添加书签按钮 - 与其他组件保持一致 */}
          <button
            onClick={openAddModal}
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
        </>
      )}
    </div>
  );
};

export default LinksWidget;
