# PureNovel - 小说内容对比

[English Version](./README_EN.md) | 简体中文

[![Live Demo](https://img.shields.io/badge/Live-Demo-A78BFA?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pure-novel.pages.dev/)

一个专为小说爱好者和文档校对者设计的**极致性能、本地优先**的文本比对工具。

![PureNovel UI](https://via.placeholder.com/800x450/141432/A78BFA?text=PureNovel+-+Text+Comparison+Tool)

## 📖 项目简介

**PureNovel** 旨在解决由于从不同网站下载的小说版本不一带来的校对难题。通过**文件格式归一化 (Normalization)** 和**多线程并行计算 (Parallel Computing)**，它能精准识别出不同版本间的章节差异、文字增删以及可能存在的广告干扰，且所有操作均在浏览器本地完成，确保隐私安全。

### 核心功能

- **🚀 多线程加速**: 利用 `Web Workers` 开启多核并行计算，处理数万行的长篇小说依然流畅不卡顿。
- **🧹 智能归一化**: 自动剔除 TXT 中的网站元数据、EPUB 中的导航残留及常见的广告提示词。
- **📄 多格式支持**: 原生支持 `.txt` 和 `.epub` 格式，支持跨格式直接比对。
- **🔒 本地优先**: 采用纯客户端架构，文件内容**绝不上传**服务器，100% 隐私保护。
- **🌍 多语言适配**: 支持简体中文、繁體中文、English 及 日本語。
- **💎 现代审美**: 深色玻璃态（Glassmorphism）设计，适配高分屏，极致丝滑的 UI 交互。

## 🛠️ 技术架构

- **Framework**: [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Core Algorithms**: Myers Diff + Block-based Parallel Diffing
- **Infrastructure**: Web Workers (Worker Pool)
- **Styling**: Vanilla CSS (Modern CSS Variables & Glassmorphism)
- **Processing**: [JSZip](https://stuk.github.io/jszip/) (for EPUB parsing)

## 🚀 快速启动

### 本地开发

1. **克隆项目**:
   ```bash
   git clone https://github.com/madokaisbest/PureNovel.git
   cd PureNovel/frontend
   ```

2. **安装依赖**:
   ```bash
   # 确保 Node.js 版本 >= 18
   npm install
   ```

3. **运行开发服务器**:
   ```bash
   npm run dev
   ```
   访问 `http://localhost:5173`。

### 生产构建

```bash
npm run build
```

## 🌐 部署

本项目是一个纯静态（SPA）应用，非常适合部署在 Cloudflare Pages 或 GitHub Pages。

**部署至 Cloudflare Pages**:
```bash
npx wrangler pages deploy dist --project-name pure-novel
```

## 🤖 AI 驱动开发

本项目是 AI 辅助开发的实践成果：
- **核心比对引擎 (JS)**: 由 **Claude Sonnet 4.6** 开发与优化，确保了 Meyers Diff 算法及并行计算的高效与严谨。
- **前端 UI & 国际化 (i18n)**: 由 **Gemini 3.0 Flash** 驱动完成，实现了极致的玻璃拟态视觉效果及流畅的多语言切换。

## 🛡️ 隐私声明

PureNovel 始终坚持数据主权归用户所有：
- 不需要注册，不需要登录。
- **文件不会离开您的设备**。
- 处理过程仅发生在您的浏览器内存和 Web Worker 中。

## 📄 开源协议

[MIT License](LICENSE)
