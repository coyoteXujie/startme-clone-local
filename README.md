<div align="center">

# StartMe - Custom New Tab

**一个美观实用的 Chrome 新标签页扩展，将你的起始页打造成个性化工作台**

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/coyoteXujie/startme-clone-local)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/chrome-Manifest%20V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![React](https://img.shields.io/badge/react-18-61dafb?logo=react)](https://react.dev/)

[English](#english) · [中文](#中文)

</div>

---

<a id="中文"></a>

## 📸 界面预览

<table>
  <tr>
    <td align="center"><b>🏠 整体首页</b></td>
    <td align="center"><b>🔍 搜索引擎切换</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshot-home.png" alt="首页" width="480"/></td>
    <td><img src="docs/screenshot-search.png" alt="搜索" width="480"/></td>
  </tr>
  <tr>
    <td align="center"><b>🔖 书签云图模式</b></td>
    <td align="center"><b>📖 书签网格模式</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshot-cloud.png" alt="云图" width="480"/></td>
    <td><img src="docs/screenshot-grid.png" alt="网格" width="480"/></td>
  </tr>
  <tr>
    <td align="center"><b>📡 RSS 订阅</b></td>
    <td align="center"><b>☀️ 天气 + 🍅 番茄钟</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshot-rss.png" alt="RSS" width="480"/></td>
    <td><img src="docs/screenshot-weather.png" alt="天气" width="480"/></td>
  </tr>
</table>

> ⚠️ 截图需要你自行截取后放入 `docs/` 目录，详见 [截图指南](#截图指南)

---

## ✨ 功能特性

### 🔍 智能搜索

| 特性 | 说明 |
|------|------|
| 预设引擎 | 百度 / Bing / Google 三选一 |
| 品牌图标 | 百度蓝熊掌、Bing 青绿方块、Google 四色官方图标 |
| 自定义引擎 | 支持添加任意搜索引擎 URL |
| 快速切换 | 点击搜索框左侧图标即可切换 |
| 胶囊搜索框 | 圆角毛玻璃设计，聚焦时柔和上浮 |

### 📑 多标签页工作区

- 创建多个独立标签页，适配不同场景（工作 / 学习 / 娱乐）
- 每个标签页拥有独立的 Widget 布局
- 标签页数据完全隔离，互不影响
- 支持重命名和删除标签页

### 📐 四列网格布局

- 每列垂直堆叠多个小组件
- **拖拽排序** — 按住组件拖动，支持跨列移动
- 响应式自适应：
  - `>1400px` → 4 列
  - `1000~1400px` → 3 列
  - `600~1000px` → 2 列
  - `<600px` → 1 列

### 🔖 书签管理

| 模式 | 效果 |
|------|------|
| **云图模式** | 药丸形状胶囊布局，灵感来自 Start.me，紧凑美观 |
| **网格模式** | 整齐的卡片布局，图标更大更清晰 |

- 自动获取网站 favicon 图标（icon.horse / favicon.im 双源）
- 加载失败时显示渐变首字母图标
- 支持编辑、删除、快速访问
- 一键添加新书签

### 📡 RSS 订阅

- 添加任意 RSS 源，实时获取最新资讯
- 多源管理 + Tab 切换
- 分页浏览（每页 5 条）
- 加载状态 / 错误提示 / 刷新功能
- 基于 [rss2json](https://rss2json.com/) 免费代理

### ✓ 任务清单

- 待办事项管理：添加 / 完成 / 删除
- 行内编辑，双击即可修改任务内容
- 完成状态自动划线
- 时间戳记录

### ☀️ 天气信息

| 特性 | 说明 |
|------|------|
| 数据源 | [Open-Meteo](https://open-meteo.com/) 免费 API，无需 Key |
| 多城市 | 支持添加多个城市，一键切换 |
| 3 天预报 | 含高低温 + 天气图标 |
| 自动刷新 | 15 分钟自动更新 |
| 图标配色 | 晴天金黄、雨天蓝色、雪天青色等 |
| 地理定位 | 首次使用自动检测当前城市 |

### 🍅 番茄钟

- 25 分钟工作 + 5 分钟休息模式
- 可视化进度条
- 开始 / 暂停 / 重置控制
- 工作与休息状态颜色区分

### 🎨 视觉设计

| 设计特性 | 实现 |
|----------|------|
| **简约风格** | 黑白灰中性配色，透明底+细线框按钮 |
| **毛玻璃效果** | Glassmorphism，backdrop-filter: blur(16px) |
| **设计系统** | 完整的 design-system.css 令牌体系 |
| **OKLCH 色彩** | 现代 CSS 色彩空间，感知均匀 |
| **流畅动画** | fadeInUp / scaleInBounce / slideInRight |
| **触控优化** | 所有按钮符合 44px 最小触控标准 |
| **自定义背景** | 本地上传 / URL / 清除 |
| **无障碍** | focus-visible / prefers-reduced-motion / 高对比度 |

### 💾 数据安全

- 所有数据通过 `chrome.storage.local` 本地存储
- 一键导出 / 导入 JSON 备份
- 无需登录，无云端同步，隐私由你掌控
- 卸载扩展即永久删除所有数据

---

## 🚀 快速开始

### 环境要求

- Node.js >= 16
- npm >= 7
- Chrome >= 88（Manifest V3 支持）

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

浏览器打开 `http://localhost:5173` 即可预览。

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

### 加载到 Chrome

1. 打开 `chrome://extensions/`
2. 开启右上角 **「开发者模式」**
3. 点击 **「加载已解压的扩展程序」**
4. 选择项目的 `dist` 文件夹
5. 新开标签页即可使用

> 💡 修改代码后执行 `npm run build`，然后在扩展页面点击 **🔄 刷新按钮** 即可更新

---

## 📋 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | TypeScript 编译 + Vite 生产构建 |
| `npm run preview` | 预览生产版本 |
| `npm run lint` | ESLint 代码检查 |

---

## 🏗️ 项目结构

```
startme-clone-local/
├── public/
│   ├── manifest.json              # Chrome 扩展清单 (Manifest V3)
│   └── icons/                     # 扩展图标 (16/48/128/440 PNG)
├── src/
│   ├── assets/
│   │   └── background.jpg         # 默认背景图
│   ├── components/
│   │   ├── widgets/
│   │   │   ├── TaskWidget.tsx     # 任务清单组件
│   │   │   ├── WeatherWidget.tsx  # 天气预报组件
│   │   │   ├── RSSWidget.tsx      # RSS 订阅组件
│   │   │   ├── LinksWidget.tsx    # 书签链接组件
│   │   │   └── PomodoroWidget.tsx # 番茄钟组件
│   │   ├── AddWidgetModal.tsx     # 添加组件弹窗
│   │   ├── TabBar.tsx             # 标签页导航栏
│   │   ├── Toast.tsx              # Toast 消息组件
│   │   ├── ToastContainer.tsx     # Toast 容器
│   │   └── ErrorBoundary.tsx      # React 错误边界
│   ├── hooks/
│   │   ├── useToast.ts            # Toast 通知 Hook
│   │   └── useKeyboardShortcuts.ts # 键盘快捷键 Hook
│   ├── types/
│   │   ├── index.ts               # 核心类型定义
│   │   └── toast.ts               # Toast 类型
│   ├── utils/
│   │   └── storage.ts             # Chrome Storage 封装 + 数据迁移
│   ├── styles/
│   │   ├── design-system.css      # 设计系统令牌 (颜色/字体/间距/阴影/动画)
│   │   └── index.css              # 主样式文件
│   ├── App.tsx                    # 主应用组件
│   └── newtab.tsx                 # 入口文件
├── docs/                          # 截图目录
├── generate-icons.js              # PNG 图标生成脚本
├── privacy-policy.html            # 隐私政策页面
├── STORE-LISTING.md               # Chrome 商店描述文案
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18 | UI 框架 |
| TypeScript | 5 | 类型安全 |
| Vite | 5 | 构建工具 |
| Chrome Extension | Manifest V3 | 扩展 API |
| lucide-react | 1.x | 图标库 |
| @icon-park/react | 1.x | 图标库 |
| @resvg/resvg-js | 2.x | SVG → PNG 图标生成 |
| Chrome Storage API | — | 数据持久化 |
| OKLCH | — | CSS 色彩系统 |
| Glassmorphism | — | 毛玻璃视觉风格 |

---

## 🌐 外部服务

| 服务 | 用途 | 限制 | 隐私 |
|------|------|------|------|
| [Open-Meteo](https://open-meteo.com/) | 天气数据 | 免费，无需 Key | 仅传坐标 |
| [rss2json](https://rss2json.com/) | RSS 转 JSON | 免费版 10,000 次/月 | 仅传 URL |
| [icon.horse](https://icon.horse/) | 网站 Favicon | 无限制 | 仅传域名 |
| [favicon.im](https://favicon.im/) | Favicon 备用源 | 无限制 | 仅传域名 |

> 所有外部服务均不传输任何个人身份信息，详见 [隐私政策](privacy-policy.html)

---

## 📝 使用指南

### 添加小组件
点击任意列底部的 **「+ 添加小组件」** → 选择类型 → 确认

### 拖拽排序
按住小组件拖动即可调整位置，支持跨列移动

### 书签云图 / 网格切换
点击书签组件标题栏右侧的视图切换按钮

### 切换搜索引擎
点击搜索框左侧的引擎图标 → 选择目标引擎

### 设置背景图片
点击右上角 **菜单** → 选择本地上传或输入 URL

### 数据备份导出
点击右上角 **菜单** → 导出 / 导入备份数据

### 专注模式
按 `F` 键隐藏顶部导航栏，鼠标移入时自动显示

---

## ❓ FAQ

**Q: 天气不显示？**
A: 确保 Chrome 已授予地理位置权限：`chrome://extensions/` → 扩展详情 → 地理位置权限。你也可以手动搜索添加城市。

**Q: RSS 加载失败？**
A: 检查 RSS 链接格式是否正确；rss2json 免费版有月度请求限制，次月自动恢复。

**Q: 数据会同步到其他设备吗？**
A: 不会。所有数据仅存储在本地 Chrome 中，确保隐私安全。你可以通过导出功能手动备份。

**Q: 如何重置所有数据？**
A: 在 `chrome://extensions/` 页面点击扩展详情中的 **「清除数据」**，或卸载重装扩展。

**Q: 搜索引擎图标显示不对？**
A: 百度/Bing/Google 使用内联 SVG 图标，不依赖外部服务。自定义引擎使用通用搜索图标。

---

## 📦 Chrome 商店发布

项目已包含完整的商店发布素材：

| 文件 | 说明 |
|------|------|
| `startme-chrome-extension-v1.2.0.zip` | 发布包（`npm run build` 后从 dist 打包） |
| `STORE-LISTING.md` | 商店描述文案（中英文） |
| `privacy-policy.html` | 隐私政策页面（需托管到 GitHub Pages） |
| `public/icons/icon440.png` | 商店宣传图素材 |

### 发布步骤

1. 注册 [Chrome Web Store 开发者账号](https://chrome.google.com/webstore/devconsole)（一次性 $5）
2. 上传 ZIP 发布包
3. 填写商店信息（文案见 `STORE-LISTING.md`）
4. 托管隐私政策（推送到 GitHub 后开启 GitHub Pages）
5. 提交审核（通常 1-3 天）

---

## 📸 截图指南

要生成 README 中引用的截图，请按以下步骤操作：

1. 在 Chrome 中加载扩展（`dist` 目录）
2. 按 `F11` 全屏模式
3. 使用 `Win + Shift + S` 截取以下页面：
   - `screenshot-home.png` — 整体首页效果
   - `screenshot-search.png` — 搜索引擎切换下拉
   - `screenshot-cloud.png` — 书签云图模式
   - `screenshot-grid.png` — 书签网格模式
   - `screenshot-rss.png` — RSS 订阅展示
   - `screenshot-weather.png` — 天气 + 番茄钟
4. 在项目根目录创建 `docs/` 文件夹
5. 将截图保存到 `docs/` 目录

---

## ☕ 赞助支持

如果这个项目对你有帮助，欢迎请作者喝杯咖啡 ☕

**支付宝扫码打赏**

![支付宝收款码](donate-alipay.png)

> 每一份支持都是持续开发的动力，感谢你的认可 ❤️

---

## 📄 许可证

[MIT License](LICENSE)

---

## 🙏 致谢

- 设计灵感来自 [Start.me](https://start.me/)
- 搜索引擎图标：[simple-icons](https://simpleicons.org/) 官方 SVG path 数据
- UI 图标：[lucide-react](https://lucide.dev/) · [IconPark](https://iconpark.oceanengine.com/)
- 天气数据：[Open-Meteo](https://open-meteo.com/)
- RSS 解析：[rss2json](https://rss2json.com/)
- Favicon 服务：[icon.horse](https://icon.horse/) · [favicon.im](https://favicon.im/)

---

<a id="english"></a>

## StartMe - Custom New Tab (English)

A beautiful and practical Chrome extension that transforms your new tab page into a personalized dashboard. Supports multi-tab workspaces, bookmarks, RSS feeds, tasks, weather, and pomodoro timer. **All data stored locally — no login required, your privacy is protected.**

### Key Features

- **Smart Search** — Baidu / Bing / Google with brand icons, custom engine support
- **Multi-Tab Workspaces** — Separate tabs for Work, Study, Entertainment
- **4-Column Grid Layout** — Drag & drop widgets across columns, responsive design
- **Bookmarks** — Cloud view (pill layout) + Grid view, auto-fetched favicons
- **RSS Reader** — Subscribe to any feed, multi-source management with pagination
- **Task Manager** — Add / complete / delete / inline edit
- **Weather** — Open-Meteo API, multi-city, 3-day forecast, 15-min auto-refresh
- **Pomodoro Timer** — 25min work + 5min break, visual progress bar
- **Custom Backgrounds** — Upload local image or set URL
- **Data Export/Import** — JSON backup, fully local storage
- **Minimalist Design** — Glassmorphism, OKLCH color system, 44px touch targets
- **Accessibility** — focus-visible, prefers-reduced-motion, high contrast support

### Quick Start

```bash
npm install
npm run dev        # Development
npm run build      # Production build → dist/
```

Load `dist/` folder in `chrome://extensions/` with Developer Mode enabled.

### Tech Stack

React 18 · TypeScript 5 · Vite 5 · Chrome Manifest V3 · OKLCH · Glassmorphism

### License

[MIT](LICENSE)
