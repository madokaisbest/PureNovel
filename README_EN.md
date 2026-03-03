# PureNovel - Novel Content Comparison

English | [简体中文](./README.md)

[![Live Demo](https://img.shields.io/badge/Live-Demo-A78BFA?style=for-the-badge&logo=cloudflare&logoColor=white)](https://purenovel.pages.dev/)

A high-performance, **local-first** text comparison tool designed specifically for novel enthusiasts and book proofreaders.

![PureNovel UI](https://via.placeholder.com/800x450/141432/A78BFA?text=PureNovel+-+Text+Comparison+Tool)

## 📖 Introduction

**PureNovel** addresses the challenges of proofreading novels downloaded from various sources (where versions often differ due to ads, metadata, or formatting). Through **Format Normalization** and **Parallel Computing**, it precisely identifies differences in chapters and text while stripping away clutter—all within your browser to ensure 100% privacy.

### Key Features

- **🚀 Multi-thread Acceleration**: Uses `Web Workers` for multi-core parallel calculation, ensuring smooth performance even with massive novels (tens of thousands of lines).
- **🧹 Smart Normalization**: Automatically strips website metadata from TXT files, navigation artifacts from EPUBs, and common advertising slogans.
- **📄 Multi-format Support**: Native support for `.txt` and `.epub` files, including cross-format comparisons.
- **🔒 Local-first Architecture**: A pure client-side application where file content **never leaves your device**.
- **🌍 Multilingual**: Supports English, Simplified Chinese, Traditional Chinese, and Japanese.
- **💎 Modern Aesthetic**: Glassmorphism design optimized for high-resolution screens with fluid UI interactions.

## 🛠️ Technical Stack

- **Framework**: [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Core Algorithms**: Myers Diff + Block-based Parallel Diffing
- **Infrastructure**: Web Workers (Worker Pool)
- **Styling**: Vanilla CSS (Modern CSS Variables & Glassmorphism)
- **Processing**: [JSZip](https://stuk.github.io/jszip/) (for EPUB parsing)

## 🚀 Getting Started

### Local Development

1. **Clone the project**:
   ```bash
   git clone https://github.com/madokaisbest/PureNovel.git
   cd PureNovel/frontend
   ```

2. **Install dependencies**:
   ```bash
   # Requires Node.js >= 18
   npm install
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```
   Access at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

## 🌐 Deployment

This is a static (SPA) application, ideal for deployment on Cloudflare Pages or GitHub Pages.

**Deploy to Cloudflare Pages**:
```bash
npx wrangler pages deploy dist --project-name pure-novel
```

## 🤖 AI-Driven Development

This project is a product of AI-assisted development:
- **Core Comparison Engine (JS)**: Developed and optimized by **Claude Sonnet 4.6**, ensuring the efficiency and rigor of the Myers Diff algorithm and parallel computing.
- **Frontend UI & Localization (i18n)**: Driven by **Gemini 3.0 Flash**, achieving premium glassmorphism visuals and seamless multilingual switching.

## 🛡️ Privacy Policy

PureNovel insists on data sovereignty for users:
- No registration or login required.
- **Files are never uploaded to any server**.
- Processing occurs entirely within your browser's memory and Web Workers.

## 📄 License

[MIT License](LICENSE)
