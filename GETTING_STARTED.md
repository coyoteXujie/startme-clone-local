# 快速开始指南

## 1. 安装依赖

首先安装项目依赖：

```bash
npm install
```

## 2. 开发模式

启动开发服务器：

```bash
npm dev
```

这会在 `dist` 目录中生成开发版本。

## 3. 加载到 Chrome

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目中的 `dist` 文件夹

## 4. 构建生产版本

```bash
npm run build
```

## 注意事项

### 背景图片
点击右上角的"🖼️ 背景"按钮，输入图片 URL 即可设置背景。
推荐使用的图片源：
- Unsplash Source: `https://source.unsplash.com/1920x1080/?nature,landscape`
- 或使用其他图床服务的直接图片链接

### 图标
当前使用 SVG 图标作为占位符。如果需要 PNG 图标，可以：
1. 使用设计工具创建 16x16, 48x48, 128x128 的 PNG 图标
2. 或使用在线工具将 SVG 转换为 PNG
3. 更新 manifest.json 中的图标路径

### RSS 功能
RSS 功能使用 rss2json.com API，该服务有调用限制。如果需要更多调用次数：
1. 在 https://rss2json.com/ 注册获取 API key
2. 修改 RSSWidget.tsx 中的 API URL

### 天气功能
当前使用模拟数据。要使用真实数据：
1. 注册天气 API（如 OpenWeatherMap 或和风天气）
2. 修改 WeatherWidget.tsx 中的 fetchWeather 函数

## 故障排除

### 图标不显示
确保 manifest.json 中的图标路径正确，并且图标文件存在。

### RSS 无法加载
检查网络请求，可能需要配置 CORS 代理。

### 数据丢失
数据存储在 Chrome Storage Local 中，清除浏览器数据会导致数据丢失。
