# 📖 MangaFlip — Modern Web Manga & Comic Reader

<div align="center">

![JavaScript](https://img.shields.io/badge/Vanilla_JS-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![Firebase](https://img.shields.io/badge/Hosting-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A high-performance, responsive, zero-dependency web reader engine tailored for manga, manhwa, and comics.**

[Features](#-key-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Deployment](#-deployment)

</div>

---

## 📌 Overview

**MangaFlip** is a client-side web application designed to deliver an uninterrupted, native-app-like reading experience for digital comics and manga collections. Built entirely with modern vanilla JavaScript and lightweight web APIs, it eliminates framework overhead while offering advanced features like dynamic memory-bounded image preloading, dual-mode desktop and touch-first mobile interfaces, and offline-ready service worker caching.

---

## ✨ Key Features

### 1. 🚀 Memory-Bounded Image Preloader
* **Zero Latency Page Turns:** Implements an asynchronous image preloader (`ImagePreloader`) that fetches upcoming pages ahead of time.
* **LRU Memory Protection:** Maintains an internal bounded cache to prevent mobile and low-RAM browser tab crashes during long reading sessions.

### 2. 📱 Dual Architecture: Desktop & Dedicated Mobile UI
* **Desktop Reader (`index.html`):** Fullscreen reading, keyboard shortcuts, single/dual-page view configurations, and custom zoom controls.
* **Mobile-First Interface (`mobile.html`):** Bottom navigation sheet, swipe gestures, auto-hiding toolbars, and touch-optimized chapter drawers.

### 3. 💾 State Persistence & Progress Tracking
* **Automatic Progress Saving:** Remembers the active manga, chapter, and page position automatically via `localStorage`.
* **Reading History & Resumption:** Users can seamlessly resume where they left off across browser refreshes.

### 4. ⚡ Progressive Web App (PWA) & Service Worker
* **Offline Resiliency:** Built-in Service Worker (`sw.js`) caches core assets and stylesheets for near-instant cold starts.
* **Installable:** Includes a configured `manifest.json` for home screen installation on iOS and Android.

### 5. 🛠️ Automated Content Pipeline
* **Catalog Generator (`generate_pages.js`):** Automatically scans directories, indexes chapters and images, and builds the `mangas.json` schema.
* **Cache-Busting Automation (`bump_version.js`):** Injects fresh revision hashes into scripts and styles before deployment to bypass aggressive browser caching.

---

## 🏗️ Architecture

```
MangaFlip/
├── css/
│   ├── style.css             # Desktop reader styles & layout
│   └── mobile.css            # Mobile touch-first responsive styles
├── js/
│   ├── app.js                # Desktop reader application logic
│   ├── mobile.js             # Mobile interface controller
│   └── core/
│       ├── eventManager.js   # Event delegation & shortcut bindings
│       ├── imagePreloader.js # LRU-bounded async preloader
│       ├── readingState.js   # Persistent state & history manager
│       └── readingGuideLoader.js # Chapter metadata and timeline parser
├── generate_pages.js         # Content crawler and JSON catalog builder
├── bump_version.js           # Automated versioning and cache-busting tool
├── deploy.bat                # One-click build and deploy pipeline
├── firebase.json             # Firebase Hosting headers and CDN rules
├── manifest.json             # PWA web app manifest
└── sw.js                     # Cache-first service worker
```

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher)
* Any modern web browser (Chrome, Firefox, Safari, Edge)

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/Kraiser61/MangaFlip.git
   cd MangaFlip
   ```

2. Generate/update the manga catalog:
   ```bash
   node generate_pages.js
   ```

3. Run a local static file server (using any lightweight server, e.g. Python or `npx serve`):
   ```bash
   npx serve .
   ```

---

## ☁️ Deployment

MangaFlip is static-hosting ready and configured out-of-the-box for **Firebase Hosting**:

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

*(Or simply execute `deploy.bat` on Windows for automated catalog rebuilding, version bumping, and publishing.)*

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
