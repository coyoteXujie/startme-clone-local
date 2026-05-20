# StartMe - Custom New Tab

一个美观实用的 Chrome 浏览器新标签页扩展，将你的起始页打造成个性化的工作台。支持多标签页管理、RSS 订阅、书签收藏、任务清单、天气查看、番茄钟等功能。**所有数据本地存储，无需注册登录，保护隐私安全。**

![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/chrome-Manifest%20V3-blue.svg)
![React](https://img.shields.io/badge/react-18-61dafb?logo=react)

## ✨ 功能特性

### 🔍 搜索引擎
- 预设 **百度、Bing、Google** 三个搜索引擎
- 品牌专属圆角正方形图标
- 支持添加自定义搜索引擎
- 快速切换默认搜索源

### 📑 标签页管理
- 创建多个独立标签页，适配不同场景（工作/学习/娱乐）
- 标签页数据完全隔离，互不影响

### 📐 四列网格布局
- 每列垂直堆叠多个小组件
- **拖拽排序** — 支持跨列移动小组件
- 响应式设计，自适应不同屏幕尺寸

### 🔖 书签管理
- **云图模式** — 药丸形状胶囊布局，参考 Start.me 风格
- **网格模式** — 整齐的卡片布局
- 自动获取网站 favicon 图标，加载失败时显示渐变首字母图标
- 支持编辑、删除、快速访问

### 📡 RSS 订阅
- 添加任意 RSS 源，实时获取最新资讯
- 多源管理 + 分页浏览
- 加载状态与错误提示

### ✓ 任务清单
- 待办事项管理，支持添加/完成/删除
- 简洁高效，专注当下

### ☀️ 天气信息
- 基于 [Open-Meteo](https://open-meteo.com/) 免费 API（无需 Key）
- 多城市切换，配置持久化存储
- **3 天天气预报**，含高低温
- 15 分钟自动刷新
- 天气图标自动配色（晴天金黄、雨天蓝色、雪天青色等）

### 🍅 番茄钟
- 内置专注计时器
- 25 分钟工作 + 5 分钟休息模式
- 可视化进度条

### 🎨 视觉设计
- **Glassmorphism 毛玻璃效果** — 清爽通透
- **OKLCH 色彩系统** — 统一的青绿色主题
- **流畅动画** — 微交互操作反馈
- **触控优化** — 所有按钮符合 44px 最小触控标准
- 自定义背景图片（本地上传 / URL / 清除）

### 💾 数据安全
- 所有数据通过 `chrome.storage.local` 本地存储
- 一键导出/导入 JSON 备份
- 无需登录，无云端同步，隐私由你掌控

---

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

### 加载到 Chrome

1. 打开 `chrome://extensions/`
2. 开启右上角 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择 `dist` 文件夹
5. 新开标签页即可使用

> 修改代码后点击扩展卡片的 **刷新按钮** 即可更新

---

## 📋 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | TypeScript 编译 + Vite 构建 |
| `npm run preview` | 预览生产版本 |

---

## 🏗️ 项目结构

```
startme-clone-local/
├── public/
│   ├── manifest.json          # Chrome 扩展清单 (Manifest V3)
│   └── icons/                 # 扩展图标 (16/48/128 SVG)
├── src/
│   ├── components/
│   │   ├── widgets/
│   │   │   ├── TaskWidget.tsx      # 任务管理
│   │   │   ├── WeatherWidget.tsx   # 天气预报
│   │   │   ├── RSSWidget.tsx       # RSS 订阅
│   │   │   ├── LinksWidget.tsx     # 书签链接
│   │   │   └── PomodoroWidget.tsx  # 番茄钟
│   │   ├── AddWidgetModal.tsx      # 添加组件弹窗
│   │   ├── TabBar.tsx              # 标签页导航
│   │   ├── ToastContainer.tsx      # 通知提示
│   │   └── ErrorBoundary.tsx       # 错误边界
│   ├── hooks/
│   │   ├── useToast.ts             # Toast Hook
│   │   └── useKeyboardShortcuts.ts # 键盘快捷键
│   ├── types/
│   │   ├── index.ts                # 核心类型定义
│   │   └── toast.ts                # Toast 类型
│   ├── utils/
│   │   └── storage.ts              # Chrome Storage 封装
│   ├── styles/
│   │   └── index.css               # 全局样式 (OKLCH 色彩系统)
│   ├── App.tsx                     # 主应用组件
│   └── newtab.tsx                  # 入口文件
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| React 18 | UI 框架 |
| TypeScript | 类型安全 |
| Vite 5 | 构建工具 |
| Chrome Extension Manifest V3 | 扩展 API |
| lucide-react | 图标库 |
| @icon-park/react | 图标库 |
| Chrome Storage API | 数据持久化 |
| OKLCH | CSS 色彩系统 |
| Glassmorphism | 视觉风格 |

---

## 🌐 外部服务

| 服务 | 用途 | 限制 |
|------|------|------|
| [Open-Meteo](https://open-meteo.com/) | 天气数据 | 免费，无需 Key |
| [rss2json](https://rss2json.com/) | RSS 转 JSON | 免费版 10,000 次/月 |
| [icon.horse](https://icon.horse/) | 网站 Favicon | 无限制 |
| [favicon.im](https://favicon.im/) | Favicon 备用源 | 无限制 |

---

## 📝 使用指南

### 添加小组件
点击任意列底部的 **"+ 添加小组件"** → 选择类型 → 确认

### 拖拽排序
按住小组件拖动即可调整位置，支持跨列移动

### 书签云图/网格切换
点击书签组件标题栏右侧的视图切换按钮

### 切换搜索引擎
点击搜索框左侧的引擎图标 → 选择目标引擎

### 设置背景图片
点击右上角 **菜单** → 选择本地上传或输入 URL

### 数据备份导出
点击右上角 **菜单** → 导出/导入备份数据

---

## ❓ FAQ

**Q: 天气不显示？**
A: 确保 Chrome 已授予地理位置权限：`chrome://extensions/` → 扩展详情 → 地理位置权限

**Q: RSS 加载失败？**
A: 检查 RSS 链接格式是否正确；rss2json 免费版有月度请求限制

**Q: 数据会同步到其他设备吗？**
A: 不会。所有数据仅存储在本地 Chrome 中，确保隐私安全

**Q: 如何重置所有数据？**
A: 在 `chrome://extensions/` 页面点击扩展详情中的 **清除数据**

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
- 图标来源：[lucide-react](https://lucide.dev/) · [IconPark](https://iconpark.oceanengine.com/) · [simple-icons](https://simpleicons.org/)
- 天气数据：[Open-Meteo](https://open-meteo.com/)
- RSS 解析：[rss2json](https://rss2json.com/)
