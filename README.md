# StartMe - 自定义起始页

这是一个纯纯的由AI完成的前端项目（可能是前端项目，希望可以验证模型真的是能在不熟悉的领域帮助人完成一个有用的工程项目，希望大家可以一起维护，最好是用 AI 维护）

一个美观实用的 Chrome 浏览器扩展，将你的新标签页打造成个性化的起始页。支持多标签页管理、RSS 订阅、书签、任务清单、天气、番茄钟等功能。完全本地存储，无需注册登录。

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/chrome-Manifest%20V3-blue.svg)

## ✨ 功能特性

### 📑 标签页管理
- 支持创建多个标签页，每个标签页独立配置
- 快速切换不同场景（如：工作、学习、娱乐）

### 📐 四列网格布局
- 每列可垂直堆叠多个小组件
- 支持拖拽排序，可跨列移动
- 响应式设计，自适应不同屏幕尺寸

### 📡 RSS 订阅
- 添加任意 RSS 源，实时获取最新资讯
- 支持多源管理，分页浏览
- 自动刷新，只显示最新内容

### 🔖 书签管理
- 云图/网格两种视图模式
- 自动获取网站 favicon 图标
- 快速访问常用网站

### ✓ 任务清单
- 待办事项管理
- 标记完成状态
- 简洁高效，专注当下

### ☀️ 天气信息
- 使用 Open-Meteo API（免费无需 Key）
- 支持多城市切换
- 显示当前温度、天气状况和 7 天预报

### 🍅 番茄钟
- 内置专注计时器
- 25 分钟工作 + 5 分钟休息模式
- 提升工作效率

### 🖼️ 自定义背景
- 支持本地上传背景图片
- 支持 URL 设置网络图片
- 可随时清除恢复默认

### 🔍 自定义搜索引擎
- 预设百度、Bing、Google、搜狗
- 支持添加自定义搜索引擎
- 快速切换默认搜索源

### 💾 数据备份
- 一键导出/导入数据
- 所有数据本地存储
- 隐私安全，无云端同步

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式

```bash
npm run dev
```

启动开发服务器后，Vite 会自动监听文件变化并热更新。

### 3. 加载到 Chrome 浏览器

**步骤详解：**

1. **打开扩展管理页面**
   - 在 Chrome 地址栏输入 `chrome://extensions/` 并回车
   - 或者：菜单 → 更多工具 → 扩展程序

2. **开启开发者模式**
   - 在页面右上角找到 "开发者模式" 开关
   - 将其打开（开关变蓝）

3. **加载扩展**
   - 点击出现的 **"加载已解压的扩展程序"** 按钮
   - 选择项目根目录下的 `dist` 文件夹
   - 扩展即加载成功

4. **使用扩展**
   - 打开新标签页（Ctrl+T）
   - 即可看到你的自定义起始页

> **注意：** 开发模式下，每次修改代码后需要：
> - 在扩展管理页面点击扩展卡片上的 **刷新** 按钮
> - 重新打开新标签页查看效果

### 4. 构建生产版本

```bash
npm run build
```

构建完成后，`dist` 目录包含可直接加载的生产版本。

---

## 📋 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器（热更新） |
| `npm run build` | TypeScript 编译 + Vite 构建到 dist 目录 |
| `npm run preview` | 预览生产构建（本地服务器） |
| `npm run lint` | ESLint 代码检查 |

---

## 🏗️ 项目结构

```
startme-local-clone/
├── public/
│   └── manifest.json          # Chrome 扩展清单文件
├── src/
│   ├── assets/                # 静态资源（默认背景图等）
│   ├── components/
│   │   ├── widgets/
│   │   │   ├── TaskWidget.tsx    # 任务管理组件
│   │   │   ├── WeatherWidget.tsx # 天气组件
│   │   │   ├── RSSWidget.tsx     # RSS 订阅组件
│   │   │   ├── LinksWidget.tsx   # 书签组件
│   │   │   └── PomodoroWidget.tsx # 番茄钟组件
│   │   ├── AddWidgetModal.tsx    # 添加组件弹窗
│   │   ├── TabBar.tsx            # 标签页导航
│   │   ├── ToastContainer.tsx    # 通知提示组件
│   │   └── ErrorBoundary.tsx     # 错误边界组件
│   ├── hooks/
│   │   ├── useToast.ts           # Toast 通知 Hook
│   │   ├── useKeyboardShortcuts.ts # 键盘快捷键 Hook
│   │   └── useStorageCache.ts    # 存储缓存 Hook
│   ├── types/
│   │   └── index.ts              # TypeScript 类型定义
│   ├── utils/
│   │   └── storage.ts            # Chrome Storage 封装
│   ├── styles/
│   │   └── index.css             # 全局样式
│   ├── App.tsx                   # 主应用组件
│   └── newtab.tsx                # 入口文件
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🛠️ 技术栈

- **React 18** + **TypeScript** - 类型安全的现代前端开发
- **Vite 5** - 快速的开发和构建工具
- **Chrome Extension Manifest V3** - 最新的扩展 API
- **lucide-react** - 精美的图标库
- **Chrome Storage API** - 本地数据持久化

---

## 📊 数据架构

### 存储结构

所有数据通过 `chrome.storage` 持久化，主要存储在 `startme_data` 键下：

```typescript
interface StorageData {
  tabs: Tab[];              // 标签页列表
  activeTabId: string;      // 当前激活的标签页 ID
  searchEngine: string;     // 默认搜索引擎 ID
  searchEngines: SearchEngine[];  // 自定义搜索引擎列表
}

interface Tab {
  id: string;
  name: string;
  columns: Column[];  // 4 列布局
  createdAt: number;
}

interface Column {
  id: string;
  widgets: Widget[];  // 垂直堆叠的小组件
}
```

### 小组件类型

| 类型 | 说明 | 数据格式 |
|------|------|----------|
| `tasks` | 任务管理 | `{ tasks: Task[] }` |
| `weather` | 天气信息 | `{ cities: string[] }` |
| `rss` | RSS 订阅 | `{ feeds: RSSFeed[] }` |
| `links` | 书签链接 | `{ links: LinkItem[], viewMode: 'cloud' | 'grid' }` |
| `pomodoro` | 番茄钟 | `{ workTime: number, breakTime: number }` |

---

## 🌐 外部 API

### 天气 API
使用 [Open-Meteo](https://open-meteo.com/) 免费天气 API，无需 API Key：
```
https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}
```

### RSS 解析
使用 [rss2json](https://rss2json.com/) 将 RSS XML 转换为 JSON 格式
> 免费版每月限 10000 次请求

### 书签图标
使用 Google Favicon 服务自动获取网站图标：
```
https://www.google.com/s2/favicons?domain={domain}&sz=64
```

---

## 📖 使用指南

### 添加小组件
1. 鼠标悬停到任意列的底部
2. 点击出现的 **"+ 添加小组件"** 按钮
3. 选择小组件类型
4. 输入标题确认

### 拖拽排序
- 按住小组件标题栏拖动可调整位置
- 可跨列拖拽移动小组件到其他列
- 拖动时显示放置位置指示器

### 书签管理
- 点击 **"+"** 按钮添加书签
- 输入书签名称和网址
- 图标自动获取
- 支持云图和网格视图切换

### 任务管理
- 输入任务内容，按回车添加
- 点击复选框标记完成/未完成
- 鼠标悬停时点击 **×** 删除

### 天气信息
- 点击城市名称切换显示
- 点击 **×** 可删除城市
- 输入新城市名添加

### 背景设置
1. 点击右上角菜单按钮
2. 选择 **"选择本地图片"** 或 **"输入图片 URL"**
3. 可随时清除背景

### 数据备份
1. 点击右上角菜单
2. 选择 **"导出备份数据"** 保存 JSON 文件
3. 需要时使用 **"导入备份数据"** 恢复

---

## ❓ 常见问题

### Q: 修改代码后如何查看效果？
**A:** 开发模式下：
1. 在 `chrome://extensions/` 页面点击扩展卡片的 **刷新** 按钮
2. 重新打开新标签页

### Q: 天气组件无法获取位置？
**A:** 需要授予扩展地理位置权限：
1. 访问 `chrome://extensions/`
2. 点击扩展的 **"详情"**
3. 确保 **"地理位置"** 权限已开启

### Q: RSS 源添加失败？
**A:** 可能原因：
- RSS 链接格式不正确（必须是完整的 http/https URL）
- rss2json 服务暂时不可用
- RSS 源不被支持（部分需要认证或有反爬措施）

### Q: 数据会同步到其他设备吗？
**A:** 优先使用 `chrome.storage.sync` 跨设备同步，但数据超过 90KB 时会自动切换到 `chrome.storage.local`（仅本地）。

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- 灵感来源于 [Start.me](https://start.me/)
- 图标来自 [lucide-react](https://lucide.dev/)
- 天气数据来自 [Open-Meteo](https://open-meteo.com/)
- RSS 解析由 [rss2json](https://rss2json.com/) 提供
