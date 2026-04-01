# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # 启动 Vite 开发服务器
npm run build     # TypeScript 编译 + Vite 构建到 dist 目录
npm run preview   # 预览生产构建
npm run lint      # ESLint 检查
```

### 开发流程
1. `npm run dev` 启动开发服务器
2. 打开 Chrome 访问 `chrome://extensions/`
3. 开启"开发者模式"，点击"加载已解压的扩展程序"
4. 选择 `dist` 文件夹
5. 打开新标签页即可看到扩展

## 架构概述

**Chrome 扩展架构 (Manifest V3)**
- 入口点：`newtab.html` → `src/newtab.tsx` → `App.tsx`
- 使用 `chrome_url_overrides` 替代默认新标签页
- 权限：`storage` (本地存储), `geolocation` (天气定位), `tabs`

**数据流**
- 所有数据通过 `chrome.storage` 持久化（sync 优先，超限自动降级到 local）
- `src/utils/storage.ts` 封装 Chrome Storage API，提供完整的 CRUD 操作和异常处理
- 存储键：`startme_data` (主数据), `startme_bg_image` (背景图片单独存储)
- 数据结构：`Tab[]` → `Column[]` (4 列) → `Widget[]` (垂直堆叠) → 特定类型数据

**组件层次**
```
App.tsx (状态管理：tabs, activeTabId, bgImage, searchEngine)
├── TabBar.tsx (标签页导航)
├── AddWidgetModal.tsx (添加小组件弹窗)
├── ToastContainer.tsx (消息提示)
├── ErrorBoundary.tsx (错误边界)
└── components/widgets/
    ├── TaskWidget.tsx      (任务管理)
    ├── WeatherWidget.tsx   (天气信息 - Open-Meteo API)
    ├── RSSWidget.tsx       (RSS 订阅 - rss2json 转换)
    ├── LinksWidget.tsx     (书签 - 云图/网格视图)
    └── PomodoroWidget.tsx  (番茄钟)
```

**布局结构**
- 4 列网格布局 (`columns-grid`)，每列可垂直堆叠多个小组件
- 每列底部有 "添加小组件" 按钮（悬停显示）
- 响应式：1400px 以下 3 列，1000px 以下 2 列，600px 以下单列

**技术栈**
- React 18 + TypeScript (严格模式)
- Vite 5 (构建工具)
- lucide-react (图标库)
- Chrome Storage API (数据持久化)

**关键配置**
- `tsconfig.json`: 严格模式，路径别名 `@/*` → `src/*`
- `vite.config.ts`: 入口 `newtab.html`，输出到 `dist/`
- `public/manifest.json`: Manifest V3, `chrome_url_overrides.newtab`

**外部 API**
- 天气：Open-Meteo (免费，无需 API Key) - `https://api.open-meteo.com/v1/forecast`
- RSS: rss2json.com 转换服务
- 书签图标：Google Favicon 服务 - `https://www.google.com/s2/favicons`

## 小组件类型

6 种小组件类型 (`WidgetType`):
- `tasks` - 任务管理（待办清单）
- `weather` - 天气信息（多城市，7 天预报）
- `rss` - RSS 订阅源
- `links` - 自定义书签链接（云图/网格视图）
- `pomodoro` - 番茄钟计时器

## 类型定义

核心类型定义在 `src/types/index.ts`：
- `Tab` → `Column[]` (4 列) → `Widget[]` (垂直堆叠)
- WidgetType: `tasks` | `weather` | `rss` | `links` | `pomodoro`
- 所有小组件共享 `Widget` 基础接口，通过 `data` 字段区分

## 自定义 Hooks

- `useToast` - 消息提示管理（success/error/info/dismissToast）
- `useKeyboardShortcuts` - 键盘快捷键处理

## 注意事项

- 无测试框架 - 通过手动测试验证功能
- 背景图片单独存储在 `startme_bg_image` 键，不包含在数据导出中
- 路径别名 `@/*` 指向 `src/*`
