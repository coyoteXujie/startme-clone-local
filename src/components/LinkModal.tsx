import React from 'react';
import { Close } from '@icon-park/react';

export interface EditingLinkState {
  widgetId: string;
  linkId?: string;
  isEdit: boolean;
}

interface LinkModalProps {
  editingLink: EditingLinkState | null;
  name: string;
  url: string;
  onNameChange: (name: string) => void;
  onUrlChange: (url: string) => void;
  onSave: () => void;
  onClose: () => void;
}

const LinkModal: React.FC<LinkModalProps> = ({
  editingLink,
  name,
  url,
  onNameChange,
  onUrlChange,
  onSave,
  onClose,
}) => (
  <div
    className="link-modal-overlay"
    onClick={onClose}
  >
    <div
      className="link-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="link-modal-header">
        <h3 className="link-modal-title">
          <span className="link-modal-title-icon">
            🔖
          </span>
          {editingLink?.isEdit ? '编辑书签' : '添加书签'}
        </h3>
        <button
          className="modal-close-btn"
          onClick={onClose}
        >
          <Close size={20} />
        </button>
      </div>
      <div className="link-modal-body">
        <div className="form-group">
          <label>📛 书签名称</label>
          <input
            type="text"
            placeholder="例如：百度、GitHub、知乎"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="form-input"
            autoFocus
          />
        </div>
        <div className="form-group form-group-last">
          <label>🔗 网址链接</label>
          <input
            type="text"
            placeholder="例如：baidu.com 或 https://github.com"
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            className="form-input"
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSave();
            }}
          />
        </div>
        <p className="link-modal-hint">
          💡 提示：可直接输入域名，无需 https:// 前缀
        </p>
      </div>
      <div className="link-modal-footer">
        <button
          className="btn-cancel"
          onClick={onClose}
        >
          取消
        </button>
        <button
          className="btn-confirm"
          onClick={onSave}
        >
          {editingLink?.isEdit ? '💾 保存' : '➕ 添加'}
        </button>
      </div>
    </div>
  </div>
);

export default LinkModal;
