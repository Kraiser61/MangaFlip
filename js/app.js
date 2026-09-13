/**
 * Sleek 3D Page Flip Manga Reader
 * Developed using StPageFlip & Vanilla JS
 * Supports multiple mangas with 3D Book Layout
 */

import { ReadingState } from './core/readingState.js';
import { EventManager } from './core/eventManager.js';
import { ImagePreloader } from './core/imagePreloader.js';
import { ReadingGuideLoader } from './core/readingGuideLoader.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Containers
    let bookContainer = document.getElementById('book');
    const bookWrapper = document.getElementById('book-wrapper');
    
    // DOM Elements - Sidebar
    const librarySidebar = document.getElementById('library-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const mangaListContainer = document.getElementById('manga-list');
    const searchInput = document.getElementById('search-manga');

    // Reading Order Sidebar Elements
    const readingOrderSidebar = document.getElementById('reading-order-sidebar');
    const btnReadingOrder = document.getElementById('btn-reading-order');
    const btnCloseReadingOrder = document.getElementById('btn-close-reading-order');
    const readingOrderList = document.getElementById('reading-order-list');
    const searchReadingOrderInput = document.getElementById('search-reading-order');
    
    // Buttons
    const btnLibrary = document.getElementById('btn-library');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    
    // Zoom Controls
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');
    const zoomValueText = document.getElementById('zoom-value');
    
    // Indicators & Navigation (Editable page input)
    const currentPageInput = document.getElementById('current-page-input');
    const totalPagesNumText = document.getElementById('total-pages-num');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const loadingOverlay = document.getElementById('loading-overlay');
    const mangaTitleBadge = document.getElementById('manga-title-badge');
    const mangaTitleText = document.getElementById('manga-title');
    const pagesGalleryModal = document.getElementById('pages-gallery-modal');
    
    function updatePageIndicatorValue(val) {
        if (!currentPageInput) return;
        currentPageInput.value = val;
        const len = String(val).length || 1;
        currentPageInput.style.setProperty('width', `calc(${len}ch + 20px)`, 'important');
    }
    
    
    // State Variables
    let pageFlip = null;
    let mangaLibrary = []; // Contains list of mangas loaded from mangas.json
    let readingGuide = []; // Contains chronological reading order metadata
    let activeManga = null; // Current loaded manga object
    let currentLang = ReadingState.getLang(); // Default to Turkish
    
    // Zoom panning state variables
    let panOffsetX = 0;
    let panOffsetY = 0;
    let startPanOffsetX = 0;
    let startPanOffsetY = 0;
    
    const i18n = {
        tr: {
            mangaList: "Manga Listesi",
            readingOrder: "Zaman Çizelgesi",
            loading: "Sayfalar Yükleniyor...",
            welcomeTitle: "MANGAFLIP",
            welcomeDesc: "Avatar: The Last Airbender ve The Legend of Korra kronolojik manga okuyucu.",
            startReading: "Okumaya Başla",
            searchPlaceholder: "Manga ara...",
            searchGuidePlaceholder: "Okuma rehberinde ara...",
            exitReader: "Ana Sayfaya Dön",
            themeLight: "Açık Temaya Geç",
            themeDark: "Koyu Temaya Geç",
            readingGuideHeader: "Okuma Rehberi",
            labelOrder: "Okuma Sırası:",
            labelGroup: "Zaman Dilimi:",
            labelWhen: "Ne Zaman Okunmalı?",
            labelPeriod: "Belirli Dönem:",
            labelSpoiler: "Spoiler Uyarısı / Gerekçe:",
            keyboardHint: "Sayfaları çevirmek için klavyedeki yön tuşlarını veya fare tekerleğini kullanabilirsiniz. Doğrudan sayfaya gitmek için üstteki sayfa numarasına tıklayıp yazabilirsiniz.",
            switchLangTitle: "Switch to English",
            switchLangLabel: "EN",
            guideLoadError: "Okuma rehberi verileri yüklenemedi.",
            readNow: "Şimdi Oku",
            notInLibrary: "Kütüphanede Yok",
            whenToRead: "Ne Zaman Okunmalı:",
            timePeriod: "Zaman Dilimi:",
            spoilerWarning: "Spoiler Uyarısı:",
            noMangasFound: "Manga bulunamadı.",
            galleryHeader: "Sayfa Galerisi",
            galleryCount: "Sayfa Sayısı"
        },
        en: {
            mangaList: "Manga List",
            readingOrder: "Reading Order",
            loading: "Loading Pages...",
            welcomeTitle: "MANGAFLIP",
            welcomeDesc: "Chronological reader interface for Avatar: The Last Airbender and The Legend of Korra comics.",
            startReading: "Start Reading",
            searchPlaceholder: "Search manga...",
            searchGuidePlaceholder: "Search reading guide...",
            exitReader: "Exit Reader",
            themeLight: "Switch to Light Mode",
            themeDark: "Switch to Dark Mode",
            readingGuideHeader: "Reading Guide",
            labelOrder: "Reading Order:",
            labelGroup: "Timeline Group:",
            labelWhen: "When to Read?",
            labelPeriod: "Specific Period:",
            labelSpoiler: "Spoiler Warning / Reason:",
            keyboardHint: "Use Arrow keys or Mouse Wheel to flip pages smoothly. Click the page number at the top to type and jump directly.",
            switchLangTitle: "Türkçe'ye Geç",
            switchLangLabel: "TR",
            guideLoadError: "Reading guide data could not be loaded.",
            readNow: "Read Now",
            notInLibrary: "Not in Library",
            whenToRead: "When to Read:",
            timePeriod: "Time Period:",
            spoilerWarning: "Spoiler Warning:",
            noMangasFound: "No mangas found.",
            galleryHeader: "Pages Gallery",
            galleryCount: "Pages Count"
        }
    };
    
    let currentZoom = 1;
    const zoomStep = 0.2;
    const minZoom = 1;
    const maxZoom = 2.5;
    let bookState = 'read'; // 'read' or 'flipping'
    let lastWheelTime = 0;
    const wheelCooldown = 800; // ms
    
    // Flip direction tracking: 'next' or 'prev'
    // Set BEFORE calling flipNext/flipPrev so we know where the page is going
    let pendingFlipDirection = null;
    
    // Drag tracking variables for manual flips and zoom panning overlay scope
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartTime = 0;
    
    // Check if we are loading fallback setup instructions
    let isFallbackMode = false;
    let isInstantTurn = false; // Flag to skip animation on programmatic jumps
    let activePageRatio = 2 / 3; // Dynamic vertical manga page ratio (width / height)

    // Reader lifecycle generation counter to prevent race conditions during rapid manga transitions
    let readerGeneration = 0;

    // Mouse hover LERP smoothing state for corner curl previews (delta-time calibrated)
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isMouseDown = false;
    let mouseSmoothFrameId = null;
    let mouseLoopRunning = false;
    let lastMouseTimestamp = 0;

    function startSmoothMouseLoop() {
        if (mouseLoopRunning || document.hidden || !pageFlip) return;
        mouseLoopRunning = true;
        lastMouseTimestamp = 0;
        mouseSmoothFrameId = requestAnimationFrame(smoothMouseMoveLoop);
    }

    function stopSmoothMouseLoop() {
        mouseLoopRunning = false;
        if (mouseSmoothFrameId) {
            cancelAnimationFrame(mouseSmoothFrameId);
            mouseSmoothFrameId = null;
        }
    }

    function smoothMouseMoveLoop(timestamp) {
        if (!mouseLoopRunning || document.hidden || !pageFlip) {
            stopSmoothMouseLoop();
            return;
        }

        const deltaMs = lastMouseTimestamp
            ? Math.min(50, timestamp - lastMouseTimestamp)
            : 16.67;
        lastMouseTimestamp = timestamp;

        // Frame-rate independent exponential damping
        const frameFactor = 1 - Math.pow(1 - 0.08, deltaMs / 16.67);
        const dx = targetX - currentX;
        const dy = targetY - currentY;
        
        currentX += dx * frameFactor;
        currentY += dy * frameFactor;
        
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
            currentX = targetX;
            currentY = targetY;
            stopSmoothMouseLoop();
            dispatchSmoothedMouseMove(currentX, currentY);
            return;
        }
        
        dispatchSmoothedMouseMove(currentX, currentY);
        mouseSmoothFrameId = requestAnimationFrame(smoothMouseMoveLoop);
    }

    function dispatchSmoothedMouseMove(x, y) {
        const evt = new MouseEvent('mousemove', {
            clientX: x,
            clientY: y,
            screenX: x,
            screenY: y,
            bubbles: true,
            cancelable: true
        });
        evt.isSmoothed = true;
        if (bookContainer) {
            bookContainer.dispatchEvent(evt);
        }
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopSmoothMouseLoop();
        }
    });

    // Reader ResizeObserver for dynamic zoom/pan boundary recalculations
    let readerResizeObserver = null;

    function observeReaderResize() {
        disconnectReaderResizeObserver();
        if (!bookWrapper || typeof ResizeObserver === 'undefined') return;

        readerResizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => {
                if (currentZoom > 1.05) {
                    constrainPanToCurrentBounds();
                }
            });
        });
        readerResizeObserver.observe(bookWrapper);
    }

    function disconnectReaderResizeObserver() {
        if (readerResizeObserver) {
            readerResizeObserver.disconnect();
            readerResizeObserver = null;
        }
    }

    function constrainPanToCurrentBounds() {
        if (!bookWrapper || !bookContainer) return;
        const wrapperWidth = bookWrapper.clientWidth;
        const wrapperHeight = bookWrapper.clientHeight;
        const bookWidth = parseFloat(bookContainer.style.width) || bookContainer.clientWidth;
        const bookHeight = parseFloat(bookContainer.style.height) || bookContainer.clientHeight;

        const maxPanX = Math.max(0, ((bookWidth * currentZoom) - wrapperWidth) / 2) + 150;
        const maxPanY = Math.max(0, ((bookHeight * currentZoom) - wrapperHeight) / 2) + 150;

        panOffsetX = Math.max(-maxPanX, Math.min(maxPanX, panOffsetX));
        panOffsetY = Math.max(-maxPanY, Math.min(maxPanY, panOffsetY));
        applyZoom();
    }

    function clampPageIndex(index, pageCount) {
        const total = Math.max(0, Number(pageCount) || 0);
        if (total === 0) return 0;
        const maxIdx = Math.max(0, total - 1);
        const parsed = parseInt(index, 10);
        if (isNaN(parsed)) return 0;
        return Math.min(Math.max(0, parsed), maxIdx);
    }

    // Helper functions
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Register Service Worker for PWA (Issue #39)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => {
                    console.log('Service Worker registered successfully:', reg.scope);
                    
                    // Force update check on page load
                    reg.update();
                    
                    // Listen for updates (Issue #AutoUpdate)
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed') {
                                    console.log('New service worker content installed.');
                                }
                            });
                        }
                    });
                })
                .catch(err => console.warn('Service Worker registration failed:', err));

            // Reload page when new service worker takes control (only if we already had a controller)
            let refreshing = false;
            const hadController = !!navigator.serviceWorker.controller;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing && hadController) {
                    refreshing = true;
                    console.log('New controller activated. Reloading page to apply updates...');
                    window.location.reload();
                }
            });
        });
    }

    // Initialize application
    init();

    async function init() {
        showLoading(true);

        // Restore theme configuration (Issue #44)
        const savedTheme = ReadingState.getTheme();
        if (savedTheme === 'light') {
            document.documentElement.classList.add('light-mode');
            document.body.classList.add('light-mode');
        } else {
            document.documentElement.classList.remove('light-mode');
            document.body.classList.remove('light-mode');
        }
        updateThemeUI();
        // Load Reading Guide dynamically based on selected language
        try {
            const guides = await ReadingGuideLoader.load(currentLang);
            readingGuide = guides.currentGuide;
            window.readingGuideEn = guides.enGuide;
        } catch (e) {
            console.warn('Reading guide could not be loaded.', e);
        }

        // Load Scanned Mangas
        try {
            const response = await fetch('mangas.json?t=' + Date.now());
            if (response.ok) {
                mangaLibrary = await response.json();
            }
        } catch (e) {
            console.warn('mangas.json could not be loaded. Falling back to instruction pages.', e);
        }

        try {
            if (!mangaLibrary || mangaLibrary.length === 0) {
                isFallbackMode = true;
                mangaTitleBadge.classList.add('hidden');
                setupInstructionsPages();
            } else {
                isFallbackMode = false;
                mangaTitleBadge.classList.remove('hidden');
                
                // Populate sidebar list
                renderMangaList();
                
                // Load from URL Hash Routing first, fallback to last read page
                const route = parseURLHash();
                if (route) {
                    loadManga(route.manga, route.pageIndex);
                } else {
                    try {
                        const lastReadFolder = localStorage.getItem('last_read_folder');
                        if (lastReadFolder) {
                            const lastManga = mangaLibrary.find(m => m.folder === lastReadFolder);
                            if (lastManga) {
                                const savedPageIndex = ReadingState.getProgress(lastReadFolder);
                                if (savedPageIndex !== null && savedPageIndex !== undefined) {
                                    loadManga(lastManga, savedPageIndex);
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('Error restoring last read state:', e);
                    }
                }
            }
        } catch (error) {
            console.error('Error during library initialization:', error);
        }

        updateLanguage();
        setupEventListeners();

        // Restore reading order sidebar state if active
        try {
            if (localStorage.getItem('readingOrderOpen') === 'true') {
                openReadingOrderSidebar();
            }
        } catch (e) {
            console.warn('Error restoring readingOrderOpen state:', e);
        }

        showLoading(false);
    }

    // Displays beautiful fallback instructions within the flipbook in English
    function setupInstructionsPages() {
        const pagesHTML = `
            <!-- Cover Page -->
            <div class="page cover-front" data-density="hard">
                <div class="welcome-page cover">
                    <div class="welcome-logo"><i class="fa-solid fa-book-open"></i></div>
                    <h1>MangaFlip</h1>
                    <p>Advanced 3D page flip manga reading interface</p>
                    <span class="badge">Library is Empty</span>
                    <div class="pulse-chevron"><i class="fa-solid fa-chevron-right"></i></div>
                </div>
            </div>

            <!-- Page 1: Welcome -->
            <div class="page">
                <div class="welcome-page">
                    <h2>Multi-Folder Support!</h2>
                    <p>Your manga reader site is ready. You can now load multiple mangas by folder and read them side-by-side.</p>
                    <ul>
                        <li><strong>Folder Support:</strong> Upload 18 or more mangas</li>
                        <li><strong>Library Drawer:</strong> Switch easily from the left menu</li>
                        <li><strong>Dynamic Search:</strong> Filter mangas instantly by title</li>
                        <li><strong>Real Book View:</strong> Covers are single, inside pages are double!</li>
                    </ul>
                </div>
            </div>

            <!-- Page 2: Step 1 -->
            <div class="page">
                <div class="welcome-page">
                    <h2>Step 1: Add Manga Folders</h2>
                    <p>Copy your manga folders into the <strong>mangas/</strong> directory on your desktop project folder.</p>
                    <div class="step-box" style="margin-bottom: 8px;">
                        <i class="fa-regular fa-folder-open"></i> Correct Folder Tree:<br>
                        <code>MangaFlip/mangas/Manga Title 1/001.jpg</code><br>
                        <code>MangaFlip/mangas/Manga Title 2/001.jpg</code>
                    </div>
                    <p><small>Ensure images (JPG/PNG) are stored directly inside each subfolder.</small></p>
                </div>
            </div>

            <!-- Page 3: Step 2 -->
            <div class="page">
                <div class="welcome-page">
                    <h2>Step 2: Deploy to Firebase</h2>
                    <p>Once folders are added, double-click the <strong>deploy.bat</strong> file in the root directory.</p>
                    <div class="step-box">
                        <i class="fa-solid fa-terminal"></i> File to Run:<br>
                        <code>deploy.bat</code>
                    </div>
                    <p><small>This automatically scans directories, builds the library index, and deploys it live.</small></p>
                </div>
            </div>

            <!-- Page 4: Back Cover -->
            <div class="page cover-back" data-density="hard">
                <div class="welcome-page cover" style="background: linear-gradient(135deg, #2a2421 0%, #4a3e36 100%);">
                    <h2>Ready to Read!</h2>
                    <p>After uploading your folders, click the <strong>"Manga List"</strong> button at the top left to switch titles and start reading.</p>
                    <i class="fa-solid fa-circle-check" style="font-size: 3rem; color: var(--accent); margin-top: 10px;"></i>
                </div>
            </div>
        `;
        
        // Safely destroy existing flipbook if present
        destroyFlipBookSafely();
        
        bookContainer.innerHTML = pagesHTML;
        
        // Append book stack edge elements
        const leftStack = document.createElement('div');
        leftStack.id = 'book-stack-left';
        leftStack.className = 'book-side-stack left';
        
        const rightStack = document.createElement('div');
        rightStack.id = 'book-stack-right';
        rightStack.className = 'book-side-stack right';
        
        bookContainer.appendChild(leftStack);
        bookContainer.appendChild(rightStack);
        
        initializeFlipBook(0); // Start on page 0 (the cover)
        
        // Sync navigation arrows in fallback mode
        updateNavigationArrows(0);
        
        // Total pages in fallback mode
        totalPagesNumText.textContent = 5;
        currentPageInput.max = 5;
        updatePageIndicatorValue(1);
    }

    function renderMangaList(filter = '') {
        mangaListContainer.innerHTML = '';
        const lastReadFolder = localStorage.getItem('last_read_folder');
        
        const displayItems = getDisplayLibrary();
        
        // Filter display items by search query (restricted to original titles - Issue #4)
        const searchFiltered = displayItems.filter(item => 
            item.title.toLowerCase().includes(filter.toLowerCase())
        );

        if (searchFiltered.length === 0) {
            mangaListContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 0.9rem;">
                    ${i18n[currentLang].noMangasFound}
                </div>
            `;
            return;
        }

        // Group by timeline_group
        const groups = {};
        searchFiltered.forEach(item => {
            const groupName = item.timeline_group || (currentLang === 'tr' ? 'Diğer Albümler' : 'Other Albums');
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(item);
        });

        // Define a strict order of groups for logical flow
        const groupOrder = currentLang === 'tr' ? [
            'Ana Seri Sırasında',
            'Aang Dönemi - Dizi Sonrası',
            'Korra Dönemi Geçişi',
            'Korra Dönemi - Dizi Sonrası',
            'Diğer Albümler',
            'Other Albums'
        ] : [
            'During the Main Series',
            'Aang Era - Post-Series',
            'Korra Era Transition',
            'Korra Era - Post-Series',
            'Other Albums',
            'Diğer Albümler'
        ];

        const renderedGroups = new Set();

        groupOrder.forEach(groupName => {
            if (!groups[groupName] || groups[groupName].length === 0) return;
            renderedGroups.add(groupName);
            renderGroup(groupName);
        });

        // Fallback for any other groups in data
        Object.keys(groups).forEach(groupName => {
            if (renderedGroups.has(groupName)) return;
            renderGroup(groupName);
        });

        function renderGroup(groupName) {
            // Render Timeline Header
            const headerDiv = document.createElement('div');
            headerDiv.className = 'timeline-header';
            let iconClass = 'fa-clock-rotate-left';
            if (groupName.includes('Post-Series') || groupName.includes('Dizi Sonrası')) iconClass = 'fa-calendar-check';
            if (groupName.includes('Transition') || groupName.includes('Geçişi')) iconClass = 'fa-shuffle';
            if (groupName.includes('Other') || groupName.includes('Diğer')) iconClass = 'fa-folder-open';
            
            headerDiv.innerHTML = `<i class="fa-solid ${iconClass}"></i> ${groupName}`;
            mangaListContainer.appendChild(headerDiv);

            // Render Items in this group
            groups[groupName].forEach(item => {
                const isMultiPart = item.parts.length > 1;
                const totalPages = item.parts.reduce((sum, p) => sum + p.pages.length, 0);

                const itemDiv = document.createElement('div');
                itemDiv.className = 'manga-item';
                // Mark active if current active folder is one of this item's parts
                const hasActivePart = activeManga && item.parts.some(p => p.folder === activeManga.folder);
                if (hasActivePart) {
                    itemDiv.classList.add('active');
                    if (isMultiPart) {
                        itemDiv.classList.add('expanded');
                    }
                }
                

                
                itemDiv.dataset.order = item.order;
                
                let countHTML = "";
                if (item.title.indexOf("Lost Adventures") !== -1) {
                    const line1 = currentLang === 'tr' ? `36 Hikaye` : `36 Stories`;
                    const line2 = currentLang === 'tr' ? `${totalPages} Sayfa` : `${totalPages} Pages`;
                    countHTML = `<span>${line1}</span><span>${line2}</span>`;
                } else if (item.title.indexOf("Patterns in Time") !== -1) {
                    const line1 = currentLang === 'tr' ? `6 Hikaye` : `6 Stories`;
                    const line2 = currentLang === 'tr' ? `${totalPages} Sayfa` : `${totalPages} Pages`;
                    countHTML = `<span>${line1}</span><span>${line2}</span>`;
                } else if (isMultiPart) {
                    const line1 = currentLang === 'tr' ? `${item.parts.length} Bölüm` : `${item.parts.length} Parts`;
                    const line2 = currentLang === 'tr' ? `${totalPages} Sayfa` : `${totalPages} Pages`;
                    countHTML = `<span>${line1}</span><span>${line2}</span>`;
                } else {
                    const line2 = currentLang === 'tr' ? `${totalPages} Sayfa` : `${totalPages} Pages`;
                    countHTML = `<span>${line2}</span>`;
                }

                const escapedTitle = escapeHTML(item.title);
                itemDiv.innerHTML = `
                    <span class="manga-item-title" title="${escapedTitle}"><span class="manga-title-inner">${escapedTitle}</span></span>
                    <span class="manga-item-count">${countHTML}</span>
                `;

                mangaListContainer.appendChild(itemDiv);

                // If multi-part, render sub-list
                if (isMultiPart) {
                    const subListContainer = document.createElement('div');
                    subListContainer.className = 'manga-sub-list';
                    
                    item.parts.forEach(part => {
                        const subItemDiv = document.createElement('div');
                        subItemDiv.className = 'sub-manga-item';
                        subItemDiv.dataset.folder = part.folder;
                        if (activeManga && part.folder === activeManga.folder) {
                            subItemDiv.classList.add('active');
                        }


                        // Clean up part title to look nice in the dropdown
                        let partName = part.title;
                        const matchPart = part.title.match(/Part\s*\d+|Bölüm\s*\d+/i);
                        if (matchPart) {
                            partName = matchPart[0];
                        } else if (part.title.includes(' - ')) {
                            partName = part.title.split(' - ').pop();
                        }

                        const escapedPartTitle = escapeHTML(part.title);
                        const escapedPartName = escapeHTML(partName);
                        subItemDiv.innerHTML = `
                            <span class="sub-manga-item-title" title="${escapedPartTitle}"><span class="manga-title-inner">${escapedPartName}</span></span>
                            <span class="sub-manga-item-pages">${part.pages.length} ${currentLang === 'tr' ? 'Sayfa' : 'Pages'}</span>
                        `;

                        subItemDiv.addEventListener('click', (e) => {
                            e.stopPropagation(); // Prevent parent toggle
                            const resolvedGroup = resolveMangaGroup(part);
                            const partOffset = getPartPageOffset(resolvedGroup, part);
                            loadManga(part, partOffset);
                            closeSidebar();
                        });

                        subListContainer.appendChild(subItemDiv);
                    });

                    mangaListContainer.appendChild(subListContainer);

                    // Add toggle expand/collapse behavior on click
                    itemDiv.addEventListener('click', () => {
                        itemDiv.classList.toggle('expanded');
                        // Load the first part if not already active
                        const firstPart = item.parts[0];
                        if (!activeManga || !item.parts.some(p => p.folder === activeManga.folder)) {
                            loadManga(firstPart);
                            closeSidebar();
                        }
                    });
                } else {
                    // Single part load on click
                    itemDiv.addEventListener('click', () => {
                        loadManga(item.parts[0]);
                        closeSidebar();
                    });
                }
            });
        }
    }

    // Destroys StPageFlip instance safely and resets reader state
    function destroyFlipBookSafely() {
        readerGeneration++;
        stopSmoothMouseLoop();
        disconnectReaderResizeObserver();

        const leftStack = document.getElementById('book-stack-left');
        const rightStack = document.getElementById('book-stack-right');
        if (leftStack) {
            leftStack.style.transition = 'none';
            leftStack.style.width = '0px';
            leftStack.style.opacity = '0';
            leftStack.style.height = '';
            leftStack.style.top = '';
        }
        if (rightStack) {
            rightStack.style.transition = 'none';
            rightStack.style.width = '0px';
            rightStack.style.opacity = '0';
            rightStack.style.height = '';
            rightStack.style.top = '';
        }

        if (pageFlip) {
            try {
                pageFlip.destroy();
            } catch (e) {
                console.warn('Error destroying pageFlip:', e);
            } finally {
                pageFlip = null;
            }
        }

        currentZoom = 1;
        panOffsetX = 0;
        panOffsetY = 0;
        if (bookWrapper) {
            bookWrapper.classList.remove('zoomed', 'grabbing');
        }
        
        // StPageFlip.destroy() removes the container element from the DOM.
        // We must recreate it if it has been removed.
        let bookEl = document.getElementById('book');
        if (!bookEl) {
            bookEl = document.createElement('div');
            bookEl.id = 'book';
            bookEl.className = 'flip-book';
            bookWrapper.appendChild(bookEl);
        }
        bookContainer = bookEl;
        bookContainer.classList.remove('ready');
    }

    async function loadReadingGuide() {
        try {
            const guides = await ReadingGuideLoader.load(currentLang);
            readingGuide = guides.currentGuide;
            window.readingGuideEn = guides.enGuide;
        } catch (e) {
            console.warn('Reading guide could not be loaded.', e);
        }
    }

    function updateLanguage() {
        const tr = i18n[currentLang];
        document.documentElement.lang = currentLang;

        const btnLang = document.getElementById('btn-lang');
        if (btnLang) {
            btnLang.title = tr.switchLangTitle;
            btnLang.setAttribute('aria-label', tr.switchLangTitle);
            const label = btnLang.querySelector('#lang-label');
            if (label) {
                label.textContent = tr.switchLangLabel;
            }
        }

        const btnLib = document.getElementById('btn-library');
        if (btnLib) {
            const span = btnLib.querySelector('span');
            if (span) span.textContent = tr.mangaList;
            btnLib.title = tr.mangaList;
            btnLib.setAttribute('aria-label', tr.mangaList);
        }

        if (btnReadingOrder) {
            const span = btnReadingOrder.querySelector('span');
            if (span) span.textContent = tr.readingOrder;
            btnReadingOrder.title = tr.readingOrder;
            btnReadingOrder.setAttribute('aria-label', tr.readingOrder);
        }
        
        const btnExitReader = document.getElementById('btn-exit-reader');
        if (btnExitReader) {
            btnExitReader.title = tr.exitReader;
            btnExitReader.setAttribute('aria-label', tr.exitReader);
        }
        
        const btnGallery = document.getElementById('btn-gallery');
        if (btnGallery) {
            btnGallery.title = tr.galleryHeader;
            btnGallery.setAttribute('aria-label', tr.galleryHeader);
        }
        
        // 3. Search inputs
        const searchManga = document.getElementById('search-manga');
        if (searchManga) searchManga.placeholder = tr.searchPlaceholder;
        
        const searchGuide = document.getElementById('search-reading-order');
        if (searchGuide) searchGuide.placeholder = tr.searchGuidePlaceholder;
        
        // 4. Sidebar headers
        const libHeader = document.querySelector('#library-sidebar .sidebar-header h2');
        if (libHeader) libHeader.innerHTML = `<i class="fa-solid fa-folder-open"></i> ` + tr.mangaList;
        
        const timelineHeader = document.querySelector('#reading-order-sidebar .sidebar-header h2');
        if (timelineHeader) timelineHeader.innerHTML = `<i class="fa-solid fa-timeline"></i> ` + tr.readingOrder;
        
        // 5. Welcome/Landing panel
        const landingTitle = document.querySelector('#welcome-landing h1');
        if (landingTitle) landingTitle.innerHTML = `MANGA<span class="highlight">FLIP</span>`;
        
        const landingDesc = document.querySelector('#welcome-landing p');
        if (landingDesc) landingDesc.textContent = tr.welcomeDesc;
        
        const landingStart = document.getElementById('btn-landing-start');
        if (landingStart) landingStart.innerHTML = `<i class="fa-solid fa-list-ul"></i> ` + tr.startReading;
        
        // 6. Loading overlay
        const loadingText = document.querySelector('#loading-overlay p');
        if (loadingText) loadingText.textContent = tr.loading;
        
        // 7. Keyboard Hint (Desktop only)
        const kbHint = document.querySelector('.keyboard-hint span');
        if (kbHint) kbHint.innerHTML = tr.keyboardHint;
        
        // 8. Info Panel Labels
        const infoTitle = document.querySelector('#manga-info-panel .info-panel-header h2') || document.querySelector('#manga-info-panel .info-panel-header h3');
        if (infoTitle) infoTitle.innerHTML = `<i class="fa-solid fa-timeline"></i> ` + tr.readingGuideHeader;
        
        const lblOrder = document.getElementById('lbl-info-order');
        if (lblOrder) lblOrder.textContent = tr.labelOrder;
        
        const lblGroup = document.getElementById('lbl-info-group');
        if (lblGroup) lblGroup.textContent = tr.labelGroup;
        
        const lblWhen = document.getElementById('lbl-info-when');
        if (lblWhen) {
            const icon = lblWhen.querySelector('i');
            if (icon) {
                lblWhen.innerHTML = '';
                lblWhen.appendChild(icon);
                lblWhen.appendChild(document.createTextNode(' ' + tr.labelWhen));
            } else {
                lblWhen.textContent = tr.labelWhen;
            }
        }
        
        const lblPeriod = document.getElementById('lbl-info-period');
        if (lblPeriod) {
            const icon = lblPeriod.querySelector('i');
            if (icon) {
                lblPeriod.innerHTML = '';
                lblPeriod.appendChild(icon);
                lblPeriod.appendChild(document.createTextNode(' ' + tr.labelPeriod));
            } else {
                lblPeriod.textContent = tr.labelPeriod;
            }
        }
        
        const lblSpoiler = document.getElementById('lbl-info-spoiler');
        if (lblSpoiler) {
            const icon = lblSpoiler.querySelector('i');
            if (icon) {
                lblSpoiler.innerHTML = '';
                lblSpoiler.appendChild(icon);
                lblSpoiler.appendChild(document.createTextNode(' ' + tr.labelSpoiler));
            } else {
                lblSpoiler.textContent = tr.labelSpoiler;
            }
        }
        
        // 9. Pages Gallery Modal Header & Count Label
        const galleryModalHeader = document.querySelector('#pages-gallery-modal .gallery-modal-header h2');
        if (galleryModalHeader) {
            galleryModalHeader.innerHTML = `<i class="fa-solid fa-grip"></i> ` + tr.galleryHeader;
        }
        const galleryCountLabel = document.getElementById('gallery-count-label');
        if (galleryCountLabel) {
            galleryCountLabel.textContent = tr.galleryCount;
        }

        // 10. Close buttons title/aria-label
        const closeBtnManga = document.getElementById('btn-close-sidebar');
        if (closeBtnManga) {
            closeBtnManga.title = currentLang === 'tr' ? 'Kapat' : 'Close';
            closeBtnManga.setAttribute('aria-label', currentLang === 'tr' ? 'Manga Kütüphanesini Kapat' : 'Close Manga Library');
        }
        const closeBtnRO = document.getElementById('btn-close-reading-order');
        if (closeBtnRO) {
            closeBtnRO.title = currentLang === 'tr' ? 'Kapat' : 'Close';
            closeBtnRO.setAttribute('aria-label', currentLang === 'tr' ? 'Okuma Sırasını Kapat' : 'Close Reading Order');
        }
        const closeBtnGal = document.getElementById('btn-close-gallery');
        if (closeBtnGal) {
            closeBtnGal.title = currentLang === 'tr' ? 'Kapat' : 'Close';
            closeBtnGal.setAttribute('aria-label', currentLang === 'tr' ? 'Sayfalar Galerisini Kapat' : 'Close Pages Gallery');
        }
        const closeBtnInfo = document.getElementById('btn-close-info');
        if (closeBtnInfo) {
            closeBtnInfo.title = currentLang === 'tr' ? 'Kapat' : 'Close';
            closeBtnInfo.setAttribute('aria-label', currentLang === 'tr' ? 'Bilgi Panelini Kapat' : 'Close Information Panel');
        }

        // 11. Zoom controls title/aria-label
        const btnZoomOut = document.getElementById('btn-zoom-out');
        if (btnZoomOut) {
            btnZoomOut.title = currentLang === 'tr' ? 'Uzaklaştır' : 'Zoom Out';
            btnZoomOut.setAttribute('aria-label', currentLang === 'tr' ? 'Uzaklaştır' : 'Zoom Out');
        }
        const btnZoomIn = document.getElementById('btn-zoom-in');
        if (btnZoomIn) {
            btnZoomIn.title = currentLang === 'tr' ? 'Yakınlaştır' : 'Zoom In';
            btnZoomIn.setAttribute('aria-label', currentLang === 'tr' ? 'Yakınlaştır' : 'Zoom In');
        }
        const btnZoomReset = document.getElementById('btn-zoom-reset');
        if (btnZoomReset) {
            btnZoomReset.title = currentLang === 'tr' ? 'Yakınlaştırmayı Sıfırla' : 'Reset Zoom';
            btnZoomReset.setAttribute('aria-label', currentLang === 'tr' ? 'Yakınlaştırmayı Sıfırla' : 'Reset Zoom');
        }

        // 12. Re-render timelines/guides to match language
        renderReadingOrderTimeline();
        if (activeManga) {
            updateInfoPanel(activeManga.title);
        }
    }

    function exitReader() {
        document.body.classList.remove('reading-mode');
        activeManga = null;
        EventManager.clearReaderEvents(); // Clear window key/mouse events
        destroyFlipBookSafely();
        if (bookContainer) {
            bookContainer.innerHTML = '';
        }
        document.querySelectorAll('.manga-item, .sub-manga-item').forEach(item => {
            item.classList.remove('active');
        });
        if (mangaTitleBadge) {
            mangaTitleBadge.classList.add('hidden');
        }
        const landingCard = document.getElementById('welcome-landing');
        if (landingCard) {
            landingCard.classList.remove('hidden');
        }
        updateThemeUI();
        history.pushState("", document.title, window.location.pathname + window.location.search);
    }

    function resolveMangaGroup(mangaObject) {
        if (!mangaObject) return null;
        if (mangaObject.parts && mangaObject.parts.length > 1) {
            return mangaObject;
        }
        const displayLibrary = getDisplayLibrary();
        const foundGroup = displayLibrary.find(item => 
            item.parts.some(p => p.folder === mangaObject.folder)
        );
        if (foundGroup) {
            return foundGroup;
        }
        return {
            title: mangaObject.title,
            folder: mangaObject.folder,
            parts: [mangaObject]
        };
    }

    function getPartPageOffset(group, part) {
        if (!group || !part) return 0;
        let offset = 0;
        for (let i = 0; i < group.parts.length; i++) {
            if (group.parts[i].folder === part.folder) {
                return offset;
            }
            offset += group.parts[i].pages.length;
        }
        return 0;
    }

    function syncSidebarActiveState(pageIdx) {
        if (!activeManga) return;
        const pageObj = activeManga.pages[pageIdx];
        const currentPartFolder = pageObj ? pageObj.folder : null;
        const lastReadFolder = localStorage.getItem('last_read_folder');
        
        document.querySelectorAll('.manga-item').forEach(item => {
            const itemTitle = item.querySelector('.manga-item-title')?.title;
            const isGroupActive = itemTitle === activeManga.title;
            if (isGroupActive) {
                item.classList.add('active');
                if (activeManga.parts.length > 1) {
                    item.classList.add('expanded');
                }
            } else {
                item.classList.remove('active');
                item.classList.remove('expanded');
            }
            

        });
        
        document.querySelectorAll('.sub-manga-item').forEach(subItem => {
            if (currentPartFolder && subItem.dataset.folder === currentPartFolder) {
                subItem.classList.add('active');
            } else {
                subItem.classList.remove('active');
            }
            

        });
    }

    function bindReaderEvents() {
        // Clear any existing reader events just in case
        EventManager.clearReaderEvents();

        // 1. Mouse/Touch tracking for corner curl hover LERP
        EventManager.addReaderEvent(window, 'mousemove', (e) => {
            if (e.isSmoothed || !pageFlip || currentZoom > 1 || isMouseDown) return;
            
            // Only intercept events targeting elements inside the book container
            if (!bookContainer.contains(e.target) && e.target !== bookContainer) return;
            
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            targetX = e.clientX;
            targetY = e.clientY;
            
            if (!mouseLoopRunning) {
                currentX = e.clientX;
                currentY = e.clientY;
                startSmoothMouseLoop();
            }
        }, { capture: true });

        EventManager.addReaderEvent(window, 'mousedown', () => { isMouseDown = true; }, { capture: true });
        EventManager.addReaderEvent(window, 'mouseup', () => { isMouseDown = false; }, { capture: true });
        EventManager.addReaderEvent(window, 'touchstart', () => { isMouseDown = true; }, { capture: true, passive: true });
        EventManager.addReaderEvent(window, 'touchend', () => { isMouseDown = false; }, { capture: true, passive: true });

        // 2. Dragging page opacity updates near container edges
        EventManager.addReaderEvent(window, 'mousemove', (e) => {
            if (!pageFlip || currentZoom > 1 || !isMouseDown) return;
            updateDraggingPageOpacity(e.clientX);
        }, { passive: true });

        EventManager.addReaderEvent(window, 'touchmove', (e) => {
            if (!pageFlip || currentZoom > 1 || !isMouseDown || e.touches.length !== 1) return;
            updateDraggingPageOpacity(e.touches[0].clientX);
        }, { passive: true });

        // 3. Zoom Touch/Click and Pan handling (window captures)
        let isPanning = false;
        let panStartX = 0;
        let panStartY = 0;

        const stopPanning = () => {
            if (isPanning) {
                isPanning = false;
                bookWrapper.classList.remove('grabbing');
            }
        };

        EventManager.addReaderEvent(window, 'mousedown', (e) => {
            if (e.target.closest('.navbar, .footer-controls, .sidebar, #manga-info-panel')) return;

            if (bookWrapper.contains(e.target)) {
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                dragStartTime = Date.now();

                if (currentZoom > 1) {
                    isPanning = true;
                    bookWrapper.classList.add('grabbing');
                    panStartX = e.clientX;
                    panStartY = e.clientY;
                    startPanOffsetX = panOffsetX;
                    startPanOffsetY = panOffsetY;
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        }, { capture: true });

        EventManager.addReaderEvent(window, 'mousemove', (e) => {
            if (currentZoom > 1) {
                if (e.target.closest('.navbar, .footer-controls, .sidebar, #manga-info-panel')) return;
                e.stopPropagation();

                if (isPanning) {
                    const dx = e.clientX - panStartX;
                    const dy = e.clientY - panStartY;
                    
                    panOffsetX = startPanOffsetX + dx;
                    panOffsetY = startPanOffsetY + dy;
                    
                    const bookWidth = parseFloat(bookContainer.style.width) || bookContainer.clientWidth;
                    const bookHeight = parseFloat(bookContainer.style.height) || bookContainer.clientHeight;
                    const wrapperWidth = bookWrapper.clientWidth;
                    const wrapperHeight = bookWrapper.clientHeight;
                    
                    const maxPanX = Math.max(0, ((bookWidth * currentZoom) - wrapperWidth) / 2) + 150;
                    const maxPanY = Math.max(0, ((bookHeight * currentZoom) - wrapperHeight) / 2) + 150;
                    
                    panOffsetX = Math.max(-maxPanX, Math.min(maxPanX, panOffsetX));
                    panOffsetY = Math.max(-maxPanY, Math.min(maxPanY, panOffsetY));
                    
                    applyZoom();
                }
            }
        }, { capture: true });

        EventManager.addReaderEvent(window, 'mouseup', (e) => {
            if (currentZoom > 1) {
                if (e.target.closest('.navbar, .footer-controls, .sidebar, #manga-info-panel')) return;
                e.stopPropagation();

                if (isPanning) {
                    const dx = e.clientX - dragStartX;
                    const dy = e.clientY - dragStartY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const duration = Date.now() - dragStartTime;
                    const isTap = dist < 8 && duration < 300;

                    stopPanning();

                    if (isTap && pageFlip) {
                        if (bookWrapper.contains(e.target)) {
                            const rect = bookWrapper.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const width = rect.width;

                            if (clickX < width * 0.3) {
                                pendingFlipDirection = 'prev';
                                pageFlip.flipPrev();
                            } else if (clickX > width * 0.7) {
                                pendingFlipDirection = 'next';
                                pageFlip.flipNext();
                            }
                        }
                    }
                }
            }
        }, { capture: true });

        // Pinch and touch pan handling for mobile touch screens
        let initialPinchDistance = 0;
        let initialZoomOnPinch = 1;

        EventManager.addReaderEvent(window, 'touchstart', (e) => {
            if (e.target.closest('.navbar, .footer-controls, .sidebar, #manga-info-panel')) return;

            if (bookWrapper.contains(e.target)) {
                if (e.touches.length === 1) {
                    dragStartX = e.touches[0].clientX;
                    dragStartY = e.touches[0].clientY;
                    dragStartTime = Date.now();

                    if (currentZoom > 1) {
                        isPanning = true;
                        panStartX = e.touches[0].clientX;
                        panStartY = e.touches[0].clientY;
                        startPanOffsetX = panOffsetX;
                        startPanOffsetY = panOffsetY;
                        e.stopPropagation();
                    }
                } else if (e.touches.length === 2 && currentZoom > 1) {
                    initialPinchDistance = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                    );
                    initialZoomOnPinch = currentZoom;
                    e.stopPropagation();
                }
            }
        }, { capture: true, passive: false });

        EventManager.addReaderEvent(window, 'touchmove', (e) => {
            if (currentZoom > 1) {
                if (e.target.closest('.navbar, .footer-controls, .sidebar, #manga-info-panel')) return;
                e.stopPropagation();

                if (e.touches.length === 2 && initialPinchDistance > 0) {
                    e.preventDefault();
                    const currentDistance = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                    );
                    const scale = currentDistance / initialPinchDistance;
                    currentZoom = Math.min(maxZoom, Math.max(minZoom, initialZoomOnPinch * scale));
                    applyZoom();
                } else if (isPanning && e.touches.length === 1) {
                    e.preventDefault();
                    const dx = e.touches[0].clientX - panStartX;
                    const dy = e.touches[0].clientY - panStartY;
                    
                    panOffsetX = startPanOffsetX + dx;
                    panOffsetY = startPanOffsetY + dy;
                    
                    const bookWidth = parseFloat(bookContainer.style.width) || bookContainer.clientWidth;
                    const bookHeight = parseFloat(bookContainer.style.height) || bookContainer.clientHeight;
                    const wrapperWidth = bookWrapper.clientWidth;
                    const wrapperHeight = bookWrapper.clientHeight;
                    
                    const maxPanX = Math.max(0, ((bookWidth * currentZoom) - wrapperWidth) / 2) + 150;
                    const maxPanY = Math.max(0, ((bookHeight * currentZoom) - wrapperHeight) / 2) + 150;
                    
                    panOffsetX = Math.max(-maxPanX, Math.min(maxPanX, panOffsetX));
                    panOffsetY = Math.max(-maxPanY, Math.min(maxPanY, panOffsetY));
                    
                    applyZoom();
                }
            }
        }, { capture: true, passive: false });

        EventManager.addReaderEvent(window, 'touchend', (e) => {
            if (currentZoom > 1) {
                if (e.target.closest('.navbar, .footer-controls, .sidebar, #manga-info-panel')) return;
                e.stopPropagation();

                if (e.touches.length < 2) {
                    initialPinchDistance = 0;
                }

                if (isPanning) {
                    isPanning = false;

                    if (pageFlip && e.changedTouches.length === 1) {
                        const dx = e.changedTouches[0].clientX - dragStartX;
                        const dy = e.changedTouches[0].clientY - dragStartY;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const duration = Date.now() - dragStartTime;
                        const isTap = dist < 8 && duration < 300;

                        if (isTap) {
                            const rect = bookWrapper.getBoundingClientRect();
                            const clickX = e.changedTouches[0].clientX - rect.left;
                            const width = rect.width;

                            if (clickX < width * 0.3) {
                                pendingFlipDirection = 'prev';
                                pageFlip.flipPrev();
                            } else if (clickX > width * 0.7) {
                                pendingFlipDirection = 'next';
                                pageFlip.flipNext();
                            }
                        }
                    }
                }
            }
        }, { capture: true, passive: false });

        // 4. Keyboard page turns & wheel scroll
        EventManager.addReaderEvent(window, 'wheel', handleMouseWheel, { passive: false });
        EventManager.addReaderEvent(window, 'keydown', handleKeyboardInput);

        // 5. General Escape hotkey
        EventManager.addReaderEvent(window, 'keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                if (librarySidebar.classList.contains('active')) {
                    closeSidebar();
                }
                if (readingOrderSidebar && readingOrderSidebar.classList.contains('active')) {
                    closeReadingOrderSidebar();
                }
                const infoPanel = document.getElementById('manga-info-panel');
                if (infoPanel && !infoPanel.classList.contains('hidden')) {
                    infoPanel.classList.add('hidden');
                }
            }
        });
    }

    function loadManga(mangaObject, startPage = null) {
        if (!mangaObject) return;
        const currentGen = ++readerGeneration;
        showLoading(true);
        
        // Enter reading mode and hide landing page
        document.body.classList.add('reading-mode');
        const landingCard = document.getElementById('welcome-landing');
        if (landingCard) {
            landingCard.classList.add('hidden');
        }
        
        // Use setTimeout to allow the browser to paint the loading overlay before doing heavy DOM work
        setTimeout(() => {
            if (currentGen !== readerGeneration) return;

            const resolvedGroup = resolveMangaGroup(mangaObject);
            if (!resolvedGroup) {
                showLoading(false);
                return;
            }

            const pages = [];
            resolvedGroup.parts.forEach(part => {
                part.pages.forEach(file => {
                    pages.push({
                        file: file,
                        folder: part.folder
                    });
                });
            });

            activeManga = {
                title: resolvedGroup.title,
                folder: resolvedGroup.parts[0].folder, // Use first part folder for dynamic highlights/hash key compatibility
                pages: pages,
                parts: resolvedGroup.parts,
                originalGroup: resolvedGroup
            };

            // Bind reader events on demand
            bindReaderEvents();

            let savedPageIndex = null;
            if (startPage !== null && !isNaN(startPage)) {
                savedPageIndex = startPage;
            } else {
                savedPageIndex = ReadingState.getProgress(activeManga.folder);
                
                if (savedPageIndex === null) {
                    if (mangaObject.folder && !mangaObject.parts) {
                        savedPageIndex = getPartPageOffset(resolvedGroup, mangaObject);
                    } else {
                        savedPageIndex = 0;
                    }
                }
            }
            savedPageIndex = clampPageIndex(savedPageIndex, activeManga.pages.length);

            // Sync sidebar indicators using current page index
            syncSidebarActiveState(savedPageIndex);

            // Set Top-bar Titles and range values
            mangaTitleText.textContent = activeManga.title;
            if (mangaTitleBadge) {
                mangaTitleBadge.classList.remove('hidden');
            }
            const total = activeManga.pages.length;
            totalPagesNumText.textContent = total;
            
            currentPageInput.max = total;
            updatePageIndicatorValue(getVisiblePagesRange(savedPageIndex, total));

            // Load timeline details
            updateInfoPanel(activeManga.title);

            try {
                // 1. Destroy existing pageFlip BEFORE touching the DOM!
                destroyFlipBookSafely();

                // 2. Clear previous configurations safely
                bookContainer.innerHTML = '';
                
                // 3. Generate pages directly — NO blank page needed
                activeManga.pages.forEach((pageObj, index) => {
                    const pageFile = pageObj.file;
                    const folderPath = pageObj.folder.split('/').map(encodeURIComponent).join('/');
                    const pageDiv = document.createElement('div');
                    pageDiv.className = 'page';
                    
                    // Mark cover pages for CSS 3D edge curl styling and set data-density directly
                    if (index === 0) {
                        pageDiv.classList.add('cover-front');
                        pageDiv.setAttribute('data-density', 'hard');
                    } else if (index === activeManga.pages.length - 1) {
                        pageDiv.classList.add('cover-back');
                        pageDiv.setAttribute('data-density', 'hard');
                    } else {
                        pageDiv.setAttribute('data-density', 'soft');
                        if (index % 2 === 1) {
                            pageDiv.classList.add('page-left');
                        } else {
                            pageDiv.classList.add('page-right');
                        }
                    }
                    
                    // Calculate visible indices at start to eager load them (eager loads full initial spread)
                    const initialVisible = [];
                    if (savedPageIndex === 0) {
                        initialVisible.push(0);
                    } else if (savedPageIndex === total - 1 && total % 2 === 0) {
                        initialVisible.push(savedPageIndex);
                    } else {
                        const startIdx = savedPageIndex % 2 === 1 ? savedPageIndex : savedPageIndex - 1;
                        initialVisible.push(startIdx);
                        if (startIdx + 1 < total) {
                            initialVisible.push(startIdx + 1);
                        }
                    }
                    
                    const isEager = initialVisible.some(vIdx => Math.abs(index - vIdx) <= 4);
                    const srcAttr = isEager ? `src="mangas/${folderPath}/${encodeURIComponent(pageFile)}"` : '';
                    const classList = isEager ? 'lazy-image' : 'lazy-image hidden';
                    const spinnerStyle = isEager ? 'style="display: none;"' : '';
                    
                    pageDiv.innerHTML = `
                        <div class="page-content" data-index="${index}">
                            <div class="manga-spinner" ${spinnerStyle}></div>
                            <img ${isEager ? '' : `data-src="mangas/${folderPath}/${encodeURIComponent(pageFile)}"`} ${srcAttr} alt="${activeManga.title} - Page ${index + 1}" class="${classList}">
                        </div>
                    `;
                    bookContainer.appendChild(pageDiv);
                });
                
                // Reset zoom
                resetZoom();

                // 4. Initialize StPageFlip with showCover:true — page indices are direct (no offset)
                initializeFlipBook(savedPageIndex);
                
                // Sync navigation arrows initially
                updateNavigationArrows(savedPageIndex);
                
                // Load initial pages in book view (direct index, no offset)
                lazyLoadBookPages(savedPageIndex);
                

            } catch (error) {
                console.error('Error loading manga:', error);
                showLoading(false);
            } finally {
                // Wait for starting page image to load before hiding overlay (Issue #23)
                const startImg = bookContainer.querySelector(`.page-content[data-index="${savedPageIndex}"] img`);
                if (startImg) {
                    if (startImg.complete) {
                        showLoading(false);
                        updateBookLayout();
                    } else {
                        const originalOnload = startImg.onload;
                        startImg.onload = (e) => {
                            if (originalOnload) originalOnload(e);
                            showLoading(false);
                            updateBookLayout();
                        };
                        const originalOnerror = startImg.onerror;
                        startImg.onerror = (e) => {
                            if (originalOnerror) originalOnerror(e);
                            showLoading(false);
                            updateBookLayout();
                        };
                        
                        // Fallback timeout in case loading is stuck
                        setTimeout(() => {
                            showLoading(false);
                            updateBookLayout();
                        }, 5000);
                    }
                } else {
                    showLoading(false);
                    updateBookLayout();
                }
            }
        }, 50);
    }

    // Recalculates book dimensions keeping perfect vertical aspect ratio dynamically matched to active page images
    // Uses wrapper layout aspect ratio to avoid calling uninitialized getOrientation()
    function resizeBookContainer() {
        const wrapperWidth = bookWrapper.clientWidth;
        const wrapperHeight = bookWrapper.clientHeight;
        
        // If width < height, we display portrait (single page). Else landscape (double page)
        const isPortrait = wrapperWidth < wrapperHeight;
        
        const pageRatio = activePageRatio; // Dynamic vertical manga page ratio (width / height)
        const targetRatio = isPortrait ? pageRatio : (pageRatio * 2); // 2:3 or 4:3 dynamically adjusted
        
        const scaleFactor = !!document.fullscreenElement ? 0.985 : 0.95;
        
        let bookWidth = wrapperWidth * scaleFactor;
        let bookHeight = bookWidth / targetRatio;
        
        if (bookHeight > wrapperHeight * scaleFactor) {
            bookHeight = wrapperHeight * scaleFactor;
            bookWidth = bookHeight * targetRatio;
        }
        
        bookContainer.style.width = `${bookWidth}px`;
        bookContainer.style.height = `${bookHeight}px`;
    }

    function updateBookLayout() {
        if (pageFlip) {
            // Dynamically update activePageRatio from the first visible page image if loaded
            const activeIdx = pageFlip.getCurrentPageIndex();
            const activeImg = bookContainer.querySelector(`.page-content[data-index="${activeIdx}"] img`);
            if (activeImg && activeImg.naturalWidth > 0 && activeImg.naturalHeight > 0) {
                const imgRatio = activeImg.naturalWidth / activeImg.naturalHeight;
                // Only update and trigger resize if the ratio is significantly different (to avoid layout shake)
                if (Math.abs(activePageRatio - imgRatio) > 0.01) {
                    activePageRatio = imgRatio;
                }
            }
            
            resizeBookContainer();
            pageFlip.update();
            updateWrapperPosition(pageFlip.getCurrentPageIndex(), true);
            updateBookPageStacks(pageFlip.getCurrentPageIndex(), true);
        }
    }

    // ======================================================================
    // WRAPPER-LEVEL COVER CENTERING SYSTEM
    // StPageFlip with showCover:true places the cover at the right half of
    // its 2-page-wide container. We shift the WRAPPER (not the book) to
    // visually center the cover in the viewport. When flipping away from
    // the cover, we animate the wrapper back to center.
    // This approach never touches #book's transform, so StPageFlip's
    // internal spine/axis calculations remain completely undisturbed.
    // ======================================================================

    // Formats visible page numbers into range strings (e.g. "1", "2-3", "4-5")
    function getVisiblePagesRange(pageIdx, totalPages) {
        if (pageIdx === 0) {
            return "1";
        }
        if (pageIdx === totalPages - 1 && totalPages % 2 === 0) {
            return `${totalPages}`;
        }
        
        const orientation = pageFlip ? pageFlip.getOrientation() : 'landscape';
        if (orientation === 'portrait') {
            return `${pageIdx + 1}`;
        }
        
        let leftPage, rightPage;
        if (pageIdx % 2 === 1) {
            leftPage = pageIdx + 1;
            rightPage = pageIdx + 2;
        } else {
            leftPage = pageIdx;
            rightPage = pageIdx + 1;
        }
        
        if (rightPage > totalPages) {
            return `${leftPage}`;
        }
        return `${leftPage}-${rightPage}`;
    }

    // Updates the visual thickness of the left and right page stacks
    function updateBookPageStacks(pageIdx, instant = false) {
        const leftStack = document.getElementById('book-stack-left');
        const rightStack = document.getElementById('book-stack-right');
        if (!leftStack || !rightStack || !pageFlip) return;
        
        if (instant) {
            leftStack.style.transition = 'none';
            rightStack.style.transition = 'none';
        } else {
            leftStack.style.transition = '';
            rightStack.style.transition = '';
        }
        
        const orientation = pageFlip.getOrientation();
        const totalPages = Math.max(0, pageFlip.getPageCount() || 0);
        
        // In portrait mode (single page), zero/single page total, or on the cover spreads (book closed), page stack edges are not displayed
        if (orientation === 'portrait' || totalPages <= 1 || pageIdx === 0 || pageIdx >= totalPages - 1) {
            leftStack.style.transition = 'none';
            rightStack.style.transition = 'none';
            leftStack.style.width = '0px';
            leftStack.style.opacity = '0';
            rightStack.style.width = '0px';
            rightStack.style.opacity = '0';
            return;
        }
        
        const maxThickness = 24; // Maximum stack thickness in pixels
        const safeIdx = Math.min(Math.max(0, pageIdx), totalPages - 1);
        const divisor = Math.max(1, totalPages - 1);
        
        // Calculate page stack ratio
        const leftRatio = safeIdx / divisor;
        const rightRatio = (totalPages - 1 - safeIdx) / divisor;
        
        let leftWidth = Math.max(0, Math.min(maxThickness, Math.round(leftRatio * maxThickness)));
        let rightWidth = Math.max(0, Math.min(maxThickness, Math.round(rightRatio * maxThickness)));
        
        // Remove stacking effect when adjacent to covers (only 1 page or cover remains on that side)
        if (safeIdx <= 1) {
            leftWidth = 0;
        }
        if (safeIdx >= totalPages - 2) {
            rightWidth = 0;
        }
        
        leftStack.style.width = `${leftWidth}px`;
        leftStack.style.opacity = leftWidth > 0 ? '1' : '0';
        
        rightStack.style.width = `${rightWidth}px`;
        rightStack.style.opacity = rightWidth > 0 ? '1' : '0';

        const bounds = pageFlip.getBoundsRect();
        if (bounds) {
            leftStack.style.top = `${bounds.top}px`;
            leftStack.style.height = `${bounds.height}px`;
            rightStack.style.top = `${bounds.top}px`;
            rightStack.style.height = `${bounds.height}px`;
        }
    }

    // Updates the visual thickness of the left and right page stacks asymmetrically during flips
    function updateBookPageStacksAsymmetric(currentIdx, targetIdx, direction, instant = false) {
        const leftStack = document.getElementById('book-stack-left');
        const rightStack = document.getElementById('book-stack-right');
        if (!leftStack || !rightStack || !pageFlip) return;
        
        if (instant) {
            leftStack.style.transition = 'none';
            rightStack.style.transition = 'none';
        } else {
            leftStack.style.transition = '';
            rightStack.style.transition = '';
        }
        
        const orientation = pageFlip.getOrientation();
        const totalPages = Math.max(0, pageFlip.getPageCount() || 0);
        
        // If any of the pages is a cover or in portrait mode, hide both stacks immediately
        if (orientation === 'portrait' || totalPages <= 1 || currentIdx === 0 || currentIdx >= totalPages - 1 || targetIdx === 0 || targetIdx >= totalPages - 1) {
            leftStack.style.transition = 'none';
            rightStack.style.transition = 'none';
            leftStack.style.width = '0px';
            leftStack.style.opacity = '0';
            rightStack.style.width = '0px';
            rightStack.style.opacity = '0';
            return;
        }
        
        const maxThickness = 24; // Maximum stack thickness in pixels
        const divisor = Math.max(1, totalPages - 1);
        
        // Determine page index for left stack and right stack
        let leftPageIdx = targetIdx;
        let rightPageIdx = targetIdx;
        
        if (direction === 'next') {
            // Flipping next (right to left): left side hasn't received the page yet, right side has revealed target page
            leftPageIdx = currentIdx;
            rightPageIdx = targetIdx;
        } else if (direction === 'prev') {
            // Flipping prev (left to right): left side has revealed target page, right side hasn't received page yet
            leftPageIdx = targetIdx;
            rightPageIdx = currentIdx;
        }
        
        leftPageIdx = Math.min(Math.max(0, leftPageIdx), totalPages - 1);
        rightPageIdx = Math.min(Math.max(0, rightPageIdx), totalPages - 1);

        // Calculate ratios
        const leftRatio = leftPageIdx / divisor;
        const rightRatio = (totalPages - 1 - rightPageIdx) / divisor;
        
        let leftWidth = Math.max(0, Math.min(maxThickness, Math.round(leftRatio * maxThickness)));
        let rightWidth = Math.max(0, Math.min(maxThickness, Math.round(rightRatio * maxThickness)));
        
        // Remove stacking effect when adjacent to covers
        if (leftPageIdx <= 1) {
            leftWidth = 0;
        }
        if (rightPageIdx >= totalPages - 2) {
            rightWidth = 0;
        }
        
        leftStack.style.width = `${leftWidth}px`;
        leftStack.style.opacity = leftWidth > 0 ? '1' : '0';
        
        rightStack.style.width = `${rightWidth}px`;
        rightStack.style.opacity = rightWidth > 0 ? '1' : '0';

        const bounds = pageFlip.getBoundsRect();
        if (bounds) {
            leftStack.style.top = `${bounds.top}px`;
            leftStack.style.height = `${bounds.height}px`;
            rightStack.style.top = `${bounds.top}px`;
            rightStack.style.height = `${bounds.height}px`;
        }
    }

    // Dynamically hides the underlying page being covered when dragging close to the edge to prevent 1px bleeding artifacts
    function updateDraggingPageOpacity(clientX) {
        if (!pageFlip || !bookContainer || (bookState !== 'user_fold' && bookState !== 'flipping')) return;
        
        const rect = bookContainer.getBoundingClientRect();
        if (rect.width === 0) return;
        
        const mouseX = clientX - rect.left;
        const currentIdx = pageFlip.getCurrentPageIndex();
        
        const pages = pageFlip.getPageCollection().getPages();
        if (!pages || pages.length === 0) return;
        
        if (pendingFlipDirection === 'next') {
            // Left page of the current spread is being covered
            const leftPageIdx = currentIdx;
            if (leftPageIdx >= 0 && leftPageIdx < pages.length) {
                const leftPage = pages[leftPageIdx];
                if (leftPage && leftPage.getElement()) {
                    if (mouseX < 40) {
                        leftPage.getElement().style.opacity = '0';
                    } else {
                        leftPage.getElement().style.opacity = '1';
                    }
                }
            }
        } else if (pendingFlipDirection === 'prev') {
            // Right page of the current spread is being covered
            const rightPageIdx = currentIdx + 1;
            if (rightPageIdx >= 0 && rightPageIdx < pages.length) {
                const rightPage = pages[rightPageIdx];
                if (rightPage && rightPage.getElement()) {
                    if (rect.width - mouseX < 40) {
                        rightPage.getElement().style.opacity = '0';
                    } else {
                        rightPage.getElement().style.opacity = '1';
                    }
                }
            }
        }
    }

    // Determines if a page index is on a cover spread (single-page display)
    function isCoverSpread(pageIdx) {
        if (!pageFlip) return false;
        const totalPages = pageFlip.getPageCount();
        // Page 0 = front cover, last page = back cover
        return pageIdx === 0 || pageIdx === totalPages - 1;
    }

    // Applies wrapper-level horizontal offset to center cover pages
    function updateWrapperPosition(pageIdx, instant = false) {
        if (!pageFlip) return;
        
        const wrapperWidth = bookWrapper.clientWidth;
        const wrapperHeight = bookWrapper.clientHeight;
        const orientation = (wrapperWidth > 0 && wrapperHeight > 0)
            ? (wrapperWidth < wrapperHeight ? 'portrait' : 'landscape')
            : 'landscape';
        
        // In portrait mode, covers are naturally centered — no shift needed
        if (orientation === 'portrait') {
            setWrapperTranslate(0, instant);
            return;
        }

        const bookWidth = parseFloat(bookContainer.style.width) || bookContainer.clientWidth;
        const shiftAmount = bookWidth * 0.25;

        const totalPages = pageFlip.getPageCount();
        if (pageIdx === 0) {
            // Front cover: StPageFlip renders it on the right half → shift wrapper left
            setWrapperTranslate(-shiftAmount, instant);
        } else if (pageIdx === totalPages - 1 && totalPages % 2 === 0) {
            // Back cover on even index: rendered on left half → shift wrapper right
            setWrapperTranslate(shiftAmount, instant);
        } else {
            // Normal double-page spread: centered naturally
            setWrapperTranslate(0, instant);
        }
    }

    // Low-level: sets translateX on #book-wrapper in pixels
    function setWrapperTranslate(pxAmount, instant = false) {
        if (instant) {
            bookWrapper.style.transition = 'none';
        } else {
            bookWrapper.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
        }
        
        bookWrapper.style.transform = `translate(${panOffsetX}px, ${panOffsetY}px) scale(${currentZoom}) translateX(${pxAmount}px)`;
    }

    // Predicts which page index we'll land on after a flip
    function predictTargetPage(currentIdx, direction) {
        if (!pageFlip) return currentIdx;
        const totalPages = pageFlip.getPageCount();
        
        let targetIdx = currentIdx;
        if (direction === 'next') {
            // From cover (single page): advance by 1 to get to first spread
            if (currentIdx === 0) {
                targetIdx = 1;
            } else {
                targetIdx = currentIdx + 2;
            }
        } else if (direction === 'prev') {
            // Going back to cover from first spread
            if (currentIdx <= 2) {
                targetIdx = 0;
            } else {
                targetIdx = currentIdx - 2;
            }
        }
        
        return Math.max(0, Math.min(totalPages - 1, targetIdx));
    }

    // Initializes StPageFlip library with configuration
    function initializeFlipBook(startIndex = 0) {
        // Save current pages DOM structure to prevent destroy() from deleting them during window resize/fullscreen
        const savedPages = Array.from(bookContainer.querySelectorAll('.page'));

        // Destroy previous instance
        destroyFlipBookSafely();
        
        // Re-append the saved pages, cleaning any inline properties StPageFlip might have attached
        bookContainer.innerHTML = '';
        savedPages.forEach(page => {
            const density = page.getAttribute('data-density');
            page.className = 'page';
            page.removeAttribute('style');
            if (density) page.setAttribute('data-density', density);
            bookContainer.appendChild(page);
        });

        // --- Desktop Mode ---
        bookContainer.classList.remove('mobile-mode');
        bookWrapper.classList.remove('mobile-mode');

        // 1. Set dimensions on container before loading PageFlip
        resizeBookContainer();

        // 2. Instantiate StPageFlip — showCover:true lets the library handle
        //    cover layout natively. We compensate the visual offset at the
        //    WRAPPER level, never touching #book's transform.
        try {
            if (typeof St === 'undefined' || !St.PageFlip) {
                throw new Error("StPageFlip library not loaded from CDN");
            }
            pageFlip = new St.PageFlip(bookContainer, {
                width: 500, // base page width
                height: 750, // base page height
                size: "stretch", // stretch canvas to fit bookContainer dimensions
                drawShadow: true,
                maxShadowOpacity: 0.3, // Soften shadow edge lines
                flippingTime: 300,
                usePortrait: true, // switch automatically between portrait and landscape
                startPage: startIndex,
                showCover: true, // Native cover support — wrapper handles centering
                mobileScrollSupport: true,
                swipeDistance: 30
            });
        } catch (e) {
            console.error("Failed to initialize 3D FlipBook, falling back to simple layout:", e);
            setupSimpleFallbackLayout();
            return;
        }

        // 3. Load pages from generated HTML elements (Issue #22)
        pageFlip.loadFromHTML(bookContainer.querySelectorAll('.page'));
        
        // Append book stack edge elements if they don't exist
        let leftStack = document.getElementById('book-stack-left');
        if (!leftStack) {
            leftStack = document.createElement('div');
            leftStack.id = 'book-stack-left';
            leftStack.className = 'book-side-stack left';
            bookContainer.appendChild(leftStack);
        }
        
        let rightStack = document.getElementById('book-stack-right');
        if (!rightStack) {
            rightStack = document.createElement('div');
            rightStack.id = 'book-stack-right';
            rightStack.className = 'book-side-stack right';
            bookContainer.appendChild(rightStack);
        }
        
        bookContainer.classList.add('ready');
        
        // Reset #book transform — we NEVER touch this, wrapper handles positioning
        bookContainer.style.transform = 'none';
        bookContainer.style.transition = 'opacity 0.3s';
        
        // Position the wrapper for the initial page (instant, no animation)
        updateWrapperPosition(startIndex, true);
        updateBookPageStacks(startIndex, true);
        observeReaderResize();
        
        // Backup timeouts for layout calculation edge cases as stylesheets and fonts render
        setTimeout(() => {
            updateBookLayout();
        }, 150);
        
        setTimeout(() => {
            updateBookLayout();
        }, 500);
        
        // 'flip' event fires AFTER the animation completes — final state sync
        pageFlip.on('flip', (e) => {
            const pageIdx = e.data;
            const total = pageFlip.getPageCount();
            
            // Update nav arrows visibility
            updateNavigationArrows(pageIdx);
            
            // Display page range (e.g., "2-3") instead of single page index
            updatePageIndicatorValue(getVisiblePagesRange(pageIdx, total));
            
            // Restore opacity of all pages
            const pages = pageFlip.getPageCollection().getPages();
            if (pages && pages.length > 0) {
                pages.forEach(page => {
                    if (page.getElement()) page.getElement().style.opacity = '1';
                });
            }
            
            // Ensure wrapper is at final correct position (instant if programmatically turned)
            updateWrapperPosition(pageIdx, isInstantTurn);
            updateBookPageStacks(pageIdx, isInstantTurn);
            
            // Clear direction and reset instant turn flag after flip completes
            pendingFlipDirection = null;
            isInstantTurn = false;
            
            if (!isFallbackMode) {
                lazyLoadBookPages(pageIdx);
                

                
                // Save reading history (Issue #40)
                if (activeManga) {
                    ReadingState.saveProgress(activeManga.folder, pageIdx);
                    // Update info panel on page change
                    updateInfoPanel(activeManga.title);
                }
            }
        });
        
        // 'changeState' fires when the animation STARTS — begin wrapper shift
        pageFlip.on('changeState', (e) => {
            bookState = e.data;
            
            if (e.data === 'flipping' || e.data === 'user_fold') {
                // Reset zoom to 1 before the flip starts to prevent shaking/flickering and layout corruption
                if (currentZoom > 1) {
                    resetZoom();
                }
                
                // If it's a manual drag (no pending direction), detect direction from drag start position
                if (!pendingFlipDirection && dragStartX > 0) {
                    const rect = bookWrapper.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    pendingFlipDirection = dragStartX > centerX ? 'next' : 'prev';
                }

                const currentIdx = pageFlip.getCurrentPageIndex();
                const targetIdx = predictTargetPage(currentIdx, pendingFlipDirection);
                updateWrapperPosition(targetIdx, isInstantTurn);
                
                // Call asymmetric stack updates during the flip
                updateBookPageStacksAsymmetric(currentIdx, targetIdx, pendingFlipDirection, isInstantTurn);
                
                // Determine the page indices belonging to the turning sheet to hide them and prevent double-rendering
                const turningIndices = [];
                if (pendingFlipDirection === 'next') {
                    if (currentIdx === 0) {
                        turningIndices.push(0, 1);
                    } else {
                        turningIndices.push(currentIdx + 1, currentIdx + 2);
                    }
                } else if (pendingFlipDirection === 'prev') {
                    if (currentIdx > 0) {
                        turningIndices.push(currentIdx - 1, currentIdx);
                    }
                }

                // Hide all page elements currently turning (cloned copy is animated in air)
                const pages = pageFlip.getPageCollection().getPages();
                if (pages && pages.length > 0) {
                    turningIndices.forEach(idx => {
                        if (pages[idx] && pages[idx].getElement()) {
                            pages[idx].getElement().style.opacity = '0';
                        }
                    });
                }
            } else if (e.data === 'read') {
                // Always restore opacity of all pages when returned to read state
                const pages = pageFlip.getPageCollection().getPages();
                if (pages && pages.length > 0) {
                    pages.forEach(page => {
                        if (page.getElement()) page.getElement().style.opacity = '1';
                    });
                }
                
                // Ensure wrapper is at correct page position if drag was cancelled
                if (pageFlip) {
                    updateWrapperPosition(pageFlip.getCurrentPageIndex());
                    updateBookPageStacks(pageFlip.getCurrentPageIndex());
                }
                
                pendingFlipDirection = null;
                dragStartX = 0;
            }
        });

        // Listen for orientation changes to adjust layout aspect ratio dynamically
        pageFlip.on('changeOrientation', (e) => {
            resizeBookContainer();
            updateWrapperPosition(pageFlip.getCurrentPageIndex(), true);
            updateBookPageStacks(pageFlip.getCurrentPageIndex());
        });
    }

    // Fallback layout when StPageFlip library fails to load from CDN (Issue #20)
    function setupSimpleFallbackLayout() {
        destroyFlipBookSafely();
        
        bookContainer.className = 'flip-book simple-fallback-layout';
        bookContainer.style.display = 'flex';
        bookContainer.style.flexDirection = 'column';
        bookContainer.style.alignItems = 'center';
        bookContainer.style.gap = '20px';
        bookContainer.style.width = '100%';
        bookContainer.style.height = 'auto';
        bookContainer.style.overflowY = 'auto';
        bookWrapper.style.overflowY = 'auto';
        
        const pages = bookContainer.querySelectorAll('.page');
        pages.forEach((page) => {
            page.style.display = 'block';
            page.style.position = 'relative';
            page.style.width = '100%';
            page.style.maxWidth = '600px';
            page.style.height = 'auto';
            page.style.aspectRatio = '2/3';
            page.style.margin = '10px auto';
            
            const img = page.querySelector('img');
            const spinner = page.querySelector('.manga-spinner');
            if (img) {
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                }
                img.onload = () => {
                    img.classList.remove('hidden');
                    if (spinner) spinner.style.display = 'none';
                };
            }
        });
        
        // Hide paging UI elements that are no longer meaningful
        btnPrev.style.display = 'none';
        btnNext.style.display = 'none';
        const indicator = document.querySelector('.page-indicator');
        if (indicator) indicator.style.display = 'none';
        
        // Display a nice alert banner informing the user
        let alertBanner = document.getElementById('cdn-error-banner');
        if (!alertBanner) {
            alertBanner = document.createElement('div');
            alertBanner.id = 'cdn-error-banner';
            alertBanner.style.cssText = 'position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: var(--accent-pink); color: white; padding: 10px 20px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; z-index: 1000; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(var(--accent-pink-rgb), 0.3);';
            alertBanner.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> 3D Flip book could not load. Switched to Scroll Mode.`;
            document.body.appendChild(alertBanner);
            setTimeout(() => alertBanner.remove(), 6000);
        }
    }

    // Optimized lazy loader for flipbook mode with error handling (Issue #11 & #18)
    // Prioritizes current page first, then future pages, then past pages to prevent visual spinner blocks
    function lazyLoadBookPages(currentIndex) {
        if (isFallbackMode) return;
        
        const range = 6;
        const total = activeManga.pages.length;
        const mangaCurrentIdx = currentIndex;
        
        // Collect page indices to load in buffer range
        const indices = [];
        for (let i = mangaCurrentIdx - range; i <= mangaCurrentIdx + range; i++) {
            if (i >= 0 && i < total) {
                indices.push(i);
            }
        }
        
        // Sort indices by loading priority
        const visibleIndices = getVisibleIndices(mangaCurrentIdx);
        indices.sort((a, b) => {
            const aVisible = visibleIndices.includes(a);
            const bVisible = visibleIndices.includes(b);
            
            if (aVisible && !bVisible) return -1;
            if (!aVisible && bVisible) return 1;
            
            // Prefer future pages (ahead of current) over past pages
            const aFuture = a > mangaCurrentIdx;
            const bFuture = b > mangaCurrentIdx;
            if (aFuture && !bFuture) return -1;
            if (!aFuture && bFuture) return 1;
            
            // Otherwise, sort by proximity
            return Math.abs(a - mangaCurrentIdx) - Math.abs(b - mangaCurrentIdx);
        });
        
        // Perform prioritized loading
        indices.forEach((i) => {
            const img = document.querySelector(`.page-content[data-index="${i}"] img`);
            const spinner = document.querySelector(`.page-content[data-index="${i}"] .manga-spinner`);
            
            if (img && img.dataset.src && !img.src) {
                const src = img.dataset.src;
                
                // If it is already in memory cache, load synchronously to avoid flicker
                if (ImagePreloader.isCached(src)) {
                    img.src = src;
                    img.classList.remove('hidden');
                    if (spinner) spinner.style.display = 'none';
                    const errDiv = document.querySelector(`.page-content[data-index="${i}"] .load-error`);
                    if (errDiv) errDiv.remove();
                } else {
                    // Set temporary blank page source to prevent double load requests
                    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E';
                    
                    ImagePreloader.preload(src)
                        .then(() => {
                            img.src = src;
                            img.classList.remove('hidden');
                            if (spinner) spinner.style.display = 'none';
                            const errDiv = document.querySelector(`.page-content[data-index="${i}"] .load-error`);
                            if (errDiv) errDiv.remove();
                        })
                        .catch(() => {
                            img.src = ''; // reset source
                            if (spinner) spinner.style.display = 'none';
                            let errDiv = document.querySelector(`.page-content[data-index="${i}"] .load-error`);
                            if (!errDiv) {
                                errDiv = document.createElement('div');
                                errDiv.className = 'load-error';
                                errDiv.innerHTML = `
                                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; color: var(--accent-pink); margin-bottom: 8px;"></i>
                                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;">Failed to load page</p>
                                    <button class="retry-btn" style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); padding: 6px 16px; border-radius: 20px; font-size: 0.75rem; color: var(--text-primary); cursor: pointer; transition: 0.2s;">Retry</button>
                                `;
                                
                                const retryBtn = errDiv.querySelector('.retry-btn');
                                retryBtn.addEventListener('click', () => {
                                    errDiv.remove();
                                    if (spinner) spinner.style.display = 'block';
                                    const baseSrc = img.dataset.src;
                                    const retryUrl = baseSrc + (baseSrc.includes('?') ? '&' : '?') + 't=' + Date.now();
                                    
                                    ImagePreloader.preload(retryUrl).then(() => {
                                        img.src = retryUrl;
                                        img.classList.remove('hidden');
                                        if (spinner) spinner.style.display = 'none';
                                    }).catch(() => {
                                        if (spinner) spinner.style.display = 'none';
                                        img.src = '';
                                        img.parentElement.appendChild(errDiv);
                                    });
                                });
                                
                                img.parentElement.appendChild(errDiv);
                            }
                        });
                }
            }
        });
    }

    // Setup event listeners for user controls
    function setupEventListeners() {
        // Prevent background flipbook mouse/touch tracking when sidebars or gallery is open
        const blockEventsWhenUIOpen = (e) => {
            const isSidebarOpen = (librarySidebar && librarySidebar.classList.contains('active')) || 
                                  (readingOrderSidebar && readingOrderSidebar.classList.contains('active'));
            const isGalleryOpen = pagesGalleryModal && !pagesGalleryModal.classList.contains('hidden');
            
            if (isSidebarOpen || isGalleryOpen) {
                const inLibrary = librarySidebar && librarySidebar.contains(e.target);
                const inReadingOrder = readingOrderSidebar && readingOrderSidebar.contains(e.target);
                const inGallery = pagesGalleryModal && pagesGalleryModal.contains(e.target);
                const inHeader = e.target.closest('.navbar');
                const inOverlay = (e.target === sidebarOverlay) || (e.target === pagesGalleryModal);
                
                // Block mousemove/touchmove unconditionally when UI is open to shield StPageFlip window listener
                if (e.type === 'mousemove' || e.type === 'touchmove') {
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return;
                }
                
                if (!inLibrary && !inReadingOrder && !inGallery && !inHeader && !inOverlay) {
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }
            }
        };
        
        ['mousemove', 'mousedown', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'pointerdown', 'pointerup'].forEach(eventName => {
            window.addEventListener(eventName, blockEventsWhenUIOpen, { capture: true, passive: false });
        });

        // Library Sidebar Navigation
        btnLibrary.addEventListener('click', openSidebar);
        btnCloseSidebar.addEventListener('click', closeSidebar);
        
        // Reading Order Sidebar Navigation
        if (btnReadingOrder) btnReadingOrder.addEventListener('click', openReadingOrderSidebar);
        if (btnCloseReadingOrder) btnCloseReadingOrder.addEventListener('click', closeReadingOrderSidebar);
        
        sidebarOverlay.addEventListener('click', () => {
            closeSidebar();
            closeReadingOrderSidebar();
        });
        
        // Debounce search input to avoid heavy re-rendering on every keypress (Issue #9)
        searchInput.addEventListener('input', debounce((e) => {
            renderMangaList(e.target.value);
        }, 250));



        // Chronological Reading Order Sidebar search logic (Autocomplete & Scroll) (Issue #5)
        if (searchReadingOrderInput) {
            const resultsContainer = document.getElementById('search-reading-order-results');
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (resultsContainer && !resultsContainer.contains(e.target) && e.target !== searchReadingOrderInput) {
                    resultsContainer.classList.add('hidden');
                }
            });

            // Helper to parse season and episode from query text (Issue #1)
            function parseSeasonEpisode(text) {
                const clean = text.toLowerCase().trim();
                let season = null;
                let episode = null;
                
                // 1. Check for S02E05 / S2E5 style
                let match = clean.match(/s\s*(\d+)\s*e\s*(\d+)/i);
                if (match) {
                    return { season: parseInt(match[1], 10), episode: parseInt(match[2], 10) };
                }
                
                // 2. Check for 2x10 style
                match = clean.match(/(\d+)\s*x\s*(\d+)/i);
                if (match) {
                    return { season: parseInt(match[1], 10), episode: parseInt(match[2], 10) };
                }
                
                // 3. Check for season/sezon/s prefix/suffix
                let sMatch = clean.match(/(\d+)\s*\_?\.?\s*(?:season|sezon)/i);
                if (!sMatch) {
                    sMatch = clean.match(/(?:season|sezon|s)\s*\_?\.?\s*(\d+)/i);
                }
                if (sMatch) {
                    season = parseInt(sMatch[1], 10);
                }
                
                // 4. Check for episode/bölüm/ep/e prefix/suffix
                let eMatch = clean.match(/(\d+)\s*\_?\.?\s*(?:episode|ep|b\u00f6l\u00fcm|bolum)/i);
                if (!eMatch) {
                    eMatch = clean.match(/(?:episode|ep|e|b\u00f6l\u00fcm|bolum|b)\s*\_?\.?\s*(\d+)/i);
                }
                if (eMatch) {
                    episode = parseInt(eMatch[1], 10);
                }
                
                // 5. Check for 2.10 style (Season 2, Episode 10)
                if (season === null && episode === null) {
                    const dotMatch = clean.match(/(\d+)\.(\d+)/);
                    if (dotMatch) {
                        return { season: parseInt(dotMatch[1], 10), episode: parseInt(dotMatch[2], 10) };
                    }
                }
                
                // 6. Fallback if no keywords matched, check for multiple numbers
                if (season === null || episode === null) {
                    const numbers = clean.match(/\d+/g);
                    if (numbers && numbers.length >= 2) {
                        if (season === null && episode === null) {
                            season = parseInt(numbers[0], 10);
                            episode = parseInt(numbers[1], 10);
                        } else if (season === null) {
                            const epStr = numbers.find(n => parseInt(n, 10) !== episode);
                            if (epStr) season = parseInt(epStr, 10);
                        } else if (episode === null) {
                            const sStr = numbers.find(n => parseInt(n, 10) !== season);
                            if (sStr) episode = parseInt(sStr, 10);
                        }
                    }
                }
                return { season, episode };
            }

            // Helper to check if a reading guide item matches parsed season & episode (Issue #1)
            function matchGuideItem(guide, querySeason, queryEpisode) {
                const title = guide.title.toLowerCase();
                const isWatch = title.includes('watch') || 
                                title.includes('izle') || 
                                title.includes('i\u0307zle') ||
                                title.includes('dizi');
                
                if (isWatch) {
                    const seasonMatches = [];
                    const rxSeason = /(\d+)\s*\.?\s*Sezon|Season\s*(\d+)/gi;
                    let match;
                    while ((match = rxSeason.exec(guide.title)) !== null) {
                        const sNum = parseInt(match[1] || match[2], 10);
                        if (!isNaN(sNum)) {
                            seasonMatches.push(sNum);
                        }
                    }
                    
                    if (seasonMatches.length === 0) return false;
                    if (querySeason !== null && !seasonMatches.includes(querySeason)) return false;
                    if (queryEpisode === null) return true;
                    
                    let titleWithoutSeason = guide.title.replace(/(\d+)\s*\.?\s*Sezon|Season\s*(\d+)/gi, '');
                    titleWithoutSeason = titleWithoutSeason.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
                    
                    const epNumbers = (titleWithoutSeason.match(/\d+/g) || []).map(num => parseInt(num, 10));
                    if (epNumbers.length === 0) return true;
                    if (epNumbers.length === 1) return queryEpisode === epNumbers[0];
                    
                    const startEp = epNumbers[0];
                    const endEp = epNumbers[1];
                    return queryEpisode >= startEp && queryEpisode <= endEp;
                } else {
                    // For manga (read steps), check Part / Bölüm / Book numbers
                    const partMatch = guide.title.match(/(?:part|b\u00f6l\u00fcm|k\u0131s\u0131m|book|cilt)\s*\_?\.?\s*(\d+)/i) || 
                                      guide.title.match(/(\d+)\s*\_?\.?\s*(?:part|b\u00f6l\u00fcm|k\u0131s\u0131m|book|cilt)/i);
                                      
                    if (partMatch) {
                        const partNum = parseInt(partMatch[1], 10);
                        const queryNum = queryEpisode !== null ? queryEpisode : querySeason;
                        return queryNum === partNum;
                    }
                    
                    // Fallback: check if any number in the title matches the query
                    const numbers = guide.title.match(/\d+/g);
                    if (numbers && numbers.length > 0) {
                        const queryNum = queryEpisode !== null ? queryEpisode : querySeason;
                        return numbers.map(n => parseInt(n, 10)).includes(queryNum);
                    }
                }
                return false;
            }
            
            searchReadingOrderInput.addEventListener('input', () => {
                const query = searchReadingOrderInput.value.toLowerCase().trim();
                
                if (!resultsContainer) return;
                resultsContainer.innerHTML = '';
                
                if (query === '') {
                    resultsContainer.classList.add('hidden');
                    return;
                }
                
                const { season, episode } = parseSeasonEpisode(query);
                
                // Filter guide steps (support text search and structured season/episode search)
                const matches = readingGuide.filter(guide => {
                    const isWatch = guide.title.toLowerCase().includes('watch') || 
                                    guide.title.toLowerCase().includes('izle') || 
                                    guide.title.toLowerCase().includes('i\u0307zle') ||
                                    guide.title.toLowerCase().includes('dizi');
                                    
                    const formatted = formatTimelineTitle(guide.title, isWatch, guide.timeline_group);
                    if (formatted.toLowerCase().includes(query)) {
                        return true;
                    }
                    if (season !== null && matchGuideItem(guide, season, episode)) {
                        return true;
                    }
                    return false;
                });
                
                if (matches.length === 0) {
                    resultsContainer.classList.add('hidden');
                    return;
                }
                
                matches.forEach(guide => {
                    const item = document.createElement('div');
                    item.className = 'autocomplete-item';
                    
                    const isWatch = guide.title.toLowerCase().includes('watch') || 
                                    guide.title.toLowerCase().includes('izle') || 
                                    guide.title.toLowerCase().includes('i\u0307zle') ||
                                    guide.title.toLowerCase().includes('dizi');
                    const formatted = formatTimelineTitle(guide.title, isWatch, guide.timeline_group);
                    
                    item.textContent = formatted;
                    item.addEventListener('click', () => {
                        searchReadingOrderInput.value = formatted;
                        resultsContainer.classList.add('hidden');
                        
                        // Scroll to the card
                        const targetCard = readingOrderList.querySelector(`.timeline-item-card[data-order="${guide.order}"]`);
                        if (targetCard) {
                            readingOrderList.scrollTo({ top: targetCard.offsetTop - readingOrderList.offsetTop - 10, behavior: 'smooth' });
                            targetCard.classList.add('search-highlight');
                            
                            // Highlight just this card and remove from others
                            readingOrderList.querySelectorAll('.timeline-item-card').forEach(c => {
                                if (c !== targetCard) c.classList.remove('search-highlight');
                            });
                        }
                    });
                    resultsContainer.appendChild(item);
                });
                
                resultsContainer.classList.remove('hidden');
            });
        }

        // Zoom touch/click navigation overlay support (Issue #2)
        dragStartX = 0;
        dragStartY = 0;
        dragStartTime = 0;

        // Theme toggle button logic (Issue #44)
        const btnTheme = document.getElementById('btn-theme');
        if (btnTheme) {
            btnTheme.addEventListener('click', () => {
                document.documentElement.classList.toggle('light-mode');
                document.body.classList.toggle('light-mode');
                const isLight = document.body.classList.contains('light-mode');
                ReadingState.setTheme(isLight ? 'light' : 'dark');
                updateThemeUI();
            });
        }

        // Welcome Landing Page click listener
        const btnLandingStart = document.getElementById('btn-landing-start');
        if (btnLandingStart) {
            btnLandingStart.addEventListener('click', () => {
                openSidebar();
            });
        }

        // Logo and exit button home actions
        const siteLogo = document.getElementById('site-logo');
        if (siteLogo) {
            siteLogo.addEventListener('click', () => {
                exitReader();
            });
        }

        const btnExitReader = document.getElementById('btn-exit-reader');
        if (btnExitReader) {
            btnExitReader.addEventListener('click', () => {
                exitReader();
            });
        }

        const btnLang = document.getElementById('btn-lang');
        if (btnLang) {
            btnLang.addEventListener('click', async () => {
                const prevScroll = readingOrderList ? readingOrderList.scrollTop : 0;
                currentLang = currentLang === 'tr' ? 'en' : 'tr';
                ReadingState.setLang(currentLang);
                showLoading(true);
                await loadReadingGuide();
                updateLanguage();
                renderMangaList();
                showLoading(false);

                requestAnimationFrame(() => {
                    if (readingOrderList) {
                        readingOrderList.scrollTop = Math.min(prevScroll, readingOrderList.scrollHeight);
                    }
                });
            });
        }



        // Reading Guide Info Panel Controls -> Changed to Reading Order Sidebar trigger (Issue #12)
        const btnMangaInfo = document.getElementById('btn-manga-info');

        if (btnMangaInfo) {
            btnMangaInfo.addEventListener('click', (e) => {
                e.stopPropagation();
                openReadingOrderSidebar();
                
                if (activeManga) {
                    const targetOrder = getActiveMangaGuideOrder();
                    if (targetOrder) {
                        setTimeout(() => {
                            const targetCard = readingOrderList.querySelector(`.timeline-item-card[data-order="${targetOrder}"]`);
                            if (targetCard) {
                                readingOrderList.scrollTo({ top: targetCard.offsetTop - readingOrderList.offsetTop - 10, behavior: 'smooth' });
                                targetCard.classList.add('search-highlight');
                                
                                // Remove highlights from other cards
                                readingOrderList.querySelectorAll('.timeline-item-card').forEach(c => {
                                    if (c !== targetCard) c.classList.remove('search-highlight');
                                });
                            }
                        }, 350);
                    }
                }
            });
        }

        // Track hover to scroll long titles dynamically (marquee effect)
        document.addEventListener('mouseenter', (e) => {
            const item = e.target.closest('.manga-item, .sub-manga-item');
            if (!item) return;

            const titleContainer = item.querySelector('.manga-item-title, .sub-manga-item-title');
            const titleInner = item.querySelector('.manga-title-inner');
            if (titleContainer && titleInner) {
                const containerWidth = titleContainer.clientWidth;
                const innerWidth = titleInner.scrollWidth;
                if (innerWidth > containerWidth) {
                    const scrollDist = innerWidth - containerWidth + 6;
                    titleInner.style.setProperty('--scroll-dist', `-${scrollDist}px`);
                } else {
                    titleInner.style.removeProperty('--scroll-dist');
                }
            }
        }, { capture: true, passive: true });

        // Next & Previous Page buttons — set direction BEFORE calling flip
        btnPrev.addEventListener('click', () => {
            if (pageFlip) {
                pendingFlipDirection = 'prev';
                pageFlip.flipPrev();
            }
        });
        
        btnNext.addEventListener('click', () => {
            if (pageFlip) {
                pendingFlipDirection = 'next';
                pageFlip.flipNext();
            }
        });

        // Editable Page Indicator Input logic
        currentPageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                currentPageInput.blur(); // Trigger change
            }
        });

        currentPageInput.addEventListener('input', () => {
            const len = currentPageInput.value.length || 1;
            currentPageInput.style.setProperty('width', `calc(${len}ch + 20px)`, 'important');
        });

        currentPageInput.addEventListener('change', () => {
            if (!pageFlip) return;
            
            const maxPages = activeManga.pages.length;
            const inputVal = currentPageInput.value.trim();
            
            // Parse first page number from input (e.g. "2-3" -> 2, "4" -> 4)
            let targetPageNum = parseInt(inputVal.split('-')[0]);
            
            if (isNaN(targetPageNum) || targetPageNum < 1) {
                targetPageNum = pageFlip.getCurrentPageIndex() + 1;
            } else if (targetPageNum > maxPages) {
                targetPageNum = maxPages;
            }
            
            // turnToPage uses direct StPageFlip index (0-based)
            const targetIdx = targetPageNum - 1;
            isInstantTurn = true;
            
            // Temporarily set flippingTime to 0 to bypass StPageFlip turn animation
            let originalFlippingTime = 300;
            if (pageFlip.getSettings) {
                originalFlippingTime = pageFlip.getSettings().flippingTime;
                pageFlip.getSettings().flippingTime = 0;
            }
            
            pageFlip.turnToPage(targetIdx);
            updateWrapperPosition(targetIdx, true);
            
            if (pageFlip.getSettings) {
                setTimeout(() => {
                    if (pageFlip && pageFlip.getSettings()) {
                        pageFlip.getSettings().flippingTime = originalFlippingTime;
                    }
                }, 50);
            }
            
            // Refresh input to match correct spread range format
            updatePageIndicatorValue(getVisiblePagesRange(targetIdx, maxPages));
        });

        // Zoom functionality
        btnZoomIn.addEventListener('click', () => adjustZoom(zoomStep));
        btnZoomOut.addEventListener('click', () => adjustZoom(-zoomStep));
        btnZoomReset.addEventListener('click', () => resetZoom());

        // Fullscreen Toggle
        btnFullscreen.addEventListener('click', toggleFullscreen);

        // Use ResizeObserver on bookWrapper for perfect resize/scrollbar/orientation tracking (fixes initial alignment bugs)
        if (window.ResizeObserver) {
            const wrapperObserver = new ResizeObserver(debounce(() => {
                updateBookLayout();
            }, 80));
            wrapperObserver.observe(bookWrapper);
        } else {
            window.addEventListener('resize', debounce(handleWindowResize, 150));
        }

        // Window fully loaded event handler to fix initial layout sizing issues
        window.addEventListener('load', () => {
            updateBookLayout();
        });

        // Listen to URL hash change for back/forward navigation or manual URL updates (Issue #HashRouting)
        window.addEventListener('hashchange', () => {
            const route = parseURLHash();
            if (route) {
                // If it's the already active manga, just turn to the page if different
                if (activeManga && activeManga.folder === route.manga.folder) {
                    if (pageFlip && pageFlip.getCurrentPageIndex() !== route.pageIndex) {
                        isInstantTurn = true;
                        
                        // Temporarily set flippingTime to 0 to bypass StPageFlip turn animation
                        let originalFlippingTime = 300;
                        if (pageFlip.getSettings) {
                            originalFlippingTime = pageFlip.getSettings().flippingTime;
                            pageFlip.getSettings().flippingTime = 0;
                        }
                        
                        pageFlip.turnToPage(route.pageIndex);
                        updateWrapperPosition(route.pageIndex, true);

                        
                        if (pageFlip.getSettings) {
                            setTimeout(() => {
                                if (pageFlip && pageFlip.getSettings()) {
                                    pageFlip.getSettings().flippingTime = originalFlippingTime;
                                }
                            }, 50);
                        }
                    }
                } else {
                    // Load the new manga at the specified page
                    loadManga(route.manga, route.pageIndex);
                }
            } else {
                // No route (hash is empty) -> return to homepage empty state!
                if (activeManga) {
                    exitReader();
                }
            }
        });

        // Fullscreen Change event listener (only updates UI icons, layout updates are handled by ResizeObserver)
        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
                btnFullscreen.innerHTML = '<i class="fa-solid fa-compress"></i>';
                btnFullscreen.title = 'Exit Fullscreen';
                btnFullscreen.setAttribute('aria-label', 'Exit Fullscreen');
                document.body.classList.add('fullscreen-active');
            } else {
                btnFullscreen.innerHTML = '<i class="fa-solid fa-expand"></i>';
                btnFullscreen.title = 'Fullscreen';
                btnFullscreen.setAttribute('aria-label', 'Fullscreen');
                document.body.classList.remove('fullscreen-active');
            }
            // Trigger a quick layout update just in case
            setTimeout(() => {
                updateBookLayout();
            }, 50);
        });

        // Close sidebar and pages gallery on Escape key press (Issue #26)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                if (librarySidebar.classList.contains('active')) {
                    closeSidebar();
                }
                if (readingOrderSidebar && readingOrderSidebar.classList.contains('active')) {
                    closeReadingOrderSidebar();
                }
                const infoPanel = document.getElementById('manga-info-panel');
                if (infoPanel && !infoPanel.classList.contains('hidden')) {
                    infoPanel.classList.add('hidden');
                }

            }
        });

        // Focus trap inside sidebar (Issue #26)
        librarySidebar.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            const focusableElements = librarySidebar.querySelectorAll('button, input, [tabindex="0"]');
            if (focusableElements.length === 0) return;

            const firstEl = focusableElements[0];
            const lastEl = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstEl) {
                    lastEl.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastEl) {
                    firstEl.focus();
                    e.preventDefault();
                }
            }
        });
    }

    // Sidebar open and close actions
    function openSidebar() {
        librarySidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.classList.add('sidebar-open');
        btnLibrary.setAttribute('aria-expanded', 'true');
        searchInput.focus();
        updatePageFlipInteractionState();
    }

    function closeSidebar() {
        librarySidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        btnLibrary.setAttribute('aria-expanded', 'false');
        updatePageFlipInteractionState();
    }

    function updatePageFlipInteractionState() {
        if (pageFlip && pageFlip.getSettings) {
            const isSidebarOpen = (librarySidebar && librarySidebar.classList.contains('active')) || 
                                  (readingOrderSidebar && readingOrderSidebar.classList.contains('active'));
            if (isSidebarOpen) {
                pageFlip.getSettings().useMouseEvents = false;
                pageFlip.getSettings().showPageCorners = false;
            } else {
                pageFlip.getSettings().useMouseEvents = true;
                pageFlip.getSettings().showPageCorners = true;
            }
        }
    }

    // Handle mouse wheel scrolling for lag-free page turn (Issue #3 null-guard)
    function handleMouseWheel(e) {
        if (!pageFlip) return;
        
        // If sidebar or reading order sidebar is open, allow normal scrolling inside sidebar without turning pages
        if (librarySidebar.classList.contains('active') || (readingOrderSidebar && readingOrderSidebar.classList.contains('active'))) {
            return;
        }

        // Allow normal scrolling inside info panel without turning pages
        if (e.target.closest('#manga-info-panel')) {
            return;
        }

        // Prevent browser default scroll/zoom on page container
        e.preventDefault();

        const now = Date.now();
        if (now - lastWheelTime < wheelCooldown || bookState === 'flipping') return;

        if (e.deltaY > 0) {
            if (pageFlip.getCurrentPageIndex() < pageFlip.getPageCount() - 1) {
                pendingFlipDirection = 'next';
                pageFlip.flipNext();
                lastWheelTime = now;
            }
        } else if (e.deltaY < 0) {
            if (pageFlip.getCurrentPageIndex() > 0) {
                pendingFlipDirection = 'prev';
                pageFlip.flipPrev();
                lastWheelTime = now;
            }
        }
    }

    // Keyboard controls (Issue #7 space scroll, Issue #8 rapid animations prevention)
    function handleKeyboardInput(e) {
        if (!pageFlip || bookState === 'flipping') return;
        if (document.activeElement === searchInput || document.activeElement === currentPageInput || document.activeElement === searchReadingOrderInput) return;
        
        // Prevent background flipping if gallery is open
        if (pagesGalleryModal && !pagesGalleryModal.classList.contains('hidden')) return;

        if (e.key === 'ArrowRight' || e.key === ' ') {
            if (e.key === ' ') e.preventDefault(); // Issue #7
            pendingFlipDirection = 'next';
            pageFlip.flipNext();
        } else if (e.key === 'ArrowLeft') {
            pendingFlipDirection = 'prev';
            pageFlip.flipPrev();
        } else if (e.key === 'Home') {
            pageFlip.turnToPage(0);
            updateWrapperPosition(0, true);
        } else if (e.key === 'End') {
            const total = isFallbackMode ? 5 : activeManga.pages.length;
            const lastIdx = total - 1;
            pageFlip.turnToPage(lastIdx);
            updateWrapperPosition(lastIdx, true);
        }
    }

    // Zoom adjust helper
    function adjustZoom(factor) {
        currentZoom = Math.min(maxZoom, Math.max(minZoom, currentZoom + factor));
        applyZoom();
    }

    // Reset zoom back to original size
    function resetZoom() {
        currentZoom = 1;
        panOffsetX = 0;
        panOffsetY = 0;
        applyZoom();
    }

    // Applies CSS transforms for smooth zoom scaling
    // Must preserve the wrapper's translateX for cover centering
    function applyZoom() {
        zoomValueText.textContent = `${Math.round(currentZoom * 100)}%`;
        
        // Re-apply wrapper position with current zoom included
        if (pageFlip) {
            updateWrapperPosition(pageFlip.getCurrentPageIndex(), true);
        } else {
            bookWrapper.style.transform = `translate(${panOffsetX}px, ${panOffsetY}px) scale(${currentZoom})`;
        }
        if (currentZoom > 1) {
            bookWrapper.classList.add('zoomed');
            bookContainer.style.pointerEvents = 'none';
        } else {
            bookWrapper.classList.remove('zoomed');
            bookContainer.style.pointerEvents = 'all';
        }
    }

    // Handle Fullscreen Toggle
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                btnFullscreen.innerHTML = '<i class="fa-solid fa-compress"></i>';
            }).catch(err => {
                console.error(`Fullscreen error: ${err.message}`);
            });
        } else {
            document.exitFullscreen().then(() => {
                btnFullscreen.innerHTML = '<i class="fa-solid fa-expand"></i>';
            });
        }
    }

    // Reinitialize on resizing
    function handleWindowResize() {
        updateBookLayout();
    }

    function showLoading(show) {
        if (show) {
            loadingOverlay.classList.remove('hidden');
        } else {
            loadingOverlay.classList.add('hidden');
        }
    }



    // ==========================================================================
    // CHRONOLOGICAL READING GUIDE HELPER FUNCTIONS
    // ==========================================================================

        const manualMappings = {
        "ashes of the academy": 67,
        "azula in the spirit temple": 68,
        "imbalance": 70,
        "katara and the pirates silver": 17,
        "north and south - north and south - part 1": 69,
        "north and south - north and south - part 2": 69,
        "north and south - north and south - part 3": 69,
        "patterns in time": 72,
        "ruins of the empire": 83,
        "smoke and shadow": 66,
        "suki, alone": 49,
        "the bounty hunter and the tea brewer": 75,
        "the kyoshi warriors 01 (of 03)": 25,
        "the kyoshi warriors 01 of 03": 25,
        "the kyoshi warriors 02 (of 03)": 27,
        "the kyoshi warriors 02 of 03": 27,
        "the kyoshi warriors 03 (of 03)": 27,
        "the kyoshi warriors - the kyoshi warriors 01 (of 03)": 25,
        "the kyoshi warriors - the kyoshi warriors 01 of 03": 25,
        "the kyoshi warriors - the kyoshi warriors 02 (of 03)": 27,
        "the kyoshi warriors - the kyoshi warriors 02 of 03": 27,
        "the kyoshi warriors - the kyoshi warriors 03 (of 03)": 27,
        "the lost adventures & team avatar tales": 2,
        "the lost adventures team avatar tales": 2,
        "the mystery of penquan island": 86,
        "the promise - avatar - the last airbender - the promise part 1 (2012) (digital) (son of ultron-empire)": 57,
        "the promise - avatar - the last airbender - the promise part 2 (2012) (digital) (son of ultron-empire)": 57,
        "the promise - avatar - the last airbender - the promise part 3 (2012) (digital) (son of ultron-empire)": 57,
        "the rift - avatar - the last airbender - the rift part 1 (2014) (digital) (son of ultron-empire)": 62,
        "the rift - avatar - the last airbender - the rift part 2 (2014) (digital) (son of ultron-empire)": 62,
        "the rift - avatar - the last airbender - the rift part 3 (2014) (digital) (son of ultron-empire)": 62,
        "the search - avatar - the last airbender - the search part 1 (2013) (digital) (son of ultron-empire)": 59,
        "the search - avatar - the last airbender - the search part 2 (2013) (digital) (son of ultron-empire)": 59,
        "the search - avatar - the last airbender - the search part 3 (2013) (digital) (son of ultron-empire)": 59,
        "toph beifongs metalbending academy": 65,
        "turf wars": 81,
        "kya and the secret of the sand": 79
};

    const normalizedMappings = {};
    for (const key in manualMappings) {
        normalizedMappings[normalizeTitle(key)] = manualMappings[key];
    }

    function parseURLHash() {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#/')) {
            const parts = hash.slice(2).split('/');
            if (parts.length >= 2) {
                const folder = decodeURIComponent(parts[0]);
                const pageIndex = parseInt(parts[1]);
                const manga = mangaLibrary.find(m => m.folder === folder);
                if (manga) {
                    const resolvedGroup = resolveMangaGroup(manga);
                    const pages = [];
                    resolvedGroup.parts.forEach(part => {
                        part.pages.forEach(file => {
                            pages.push(file);
                        });
                    });
                    const maxPages = pages.length;
                    return {
                        manga: manga,
                        pageIndex: isNaN(pageIndex) ? 0 : Math.max(0, Math.min(maxPages - 1, pageIndex))
                    };
                }
            }
        }
        return null;
    }

    function normalizeTitle(str) {
        return str.toLowerCase()
            .replace(/['’]/g, '')
            .replace(/[^a-z0-9]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function findGuideItem(scannedTitle) {
        const norm = normalizeTitle(scannedTitle);
        const order = normalizedMappings[norm];
        if (order) {
            return readingGuide.find(item => item.order === order);
        }
        
        // Substring fallback
        for (const guide of readingGuide) {
            const normGuide = normalizeTitle(guide.title);
            if (norm.includes(normGuide) || normGuide.includes(norm)) {
                return guide;
            }
        }
        return null;
    }

        function getDisplayLibrary() {
        const list = typeof readingGuide !== 'undefined' ? readingGuide : (typeof readingGuideData !== 'undefined' ? readingGuideData : []);
        const grouped = [];
        const processed = new Set();
        
        // Grouping rules for multi-part mangas
        const groupsToMatch = [
            { key: "the promise", title: "The Promise" },
            { key: "the search", title: "The Search" },
            { key: "the rift", title: "The Rift" },
            { key: "north and south", title: "North and South" },
            { key: "the kyoshi warriors", title: "The Kyoshi Warriors" }
        ];
        
        groupsToMatch.forEach(gMatch => {
            const parts = mangaLibrary.filter(m => m.folder.toLowerCase().includes(gMatch.key));
            if (parts.length > 0) {
                parts.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));
                parts.forEach(p => processed.add(p.folder));
                
                // Find the minimum guide order for sorting
                let minOrder = 99;
                let timelineGroup = "Other Albums";
                parts.forEach(part => {
                    const norm = normalizeTitle(part.title);
                    const order = normalizedMappings[norm];
                    if (order && order < minOrder) {
                        minOrder = order;
                        const guideItem = list.find(g => g.order === order);
                        if (guideItem) {
                            if (minOrder === 72) {
                                timelineGroup = currentLang === 'tr' ? 'Korra Dönemi Geçişi' : 'Korra Era Transition';
                            } else if (minOrder >= 79 && guideItem.timeline_group.toLowerCase().includes('korra')) {
                                timelineGroup = currentLang === 'tr' ? 'Korra Dönemi - Dizi Sonrası' : 'Korra Era - Post-Series';
                            } else {
                                timelineGroup = guideItem.timeline_group;
                            }
                        }
                    }
                });
                
                grouped.push({
                    title: gMatch.title,
                    timeline_group: timelineGroup,
                    order: minOrder,
                    parts: parts
                });
            }
        });
        
        // Process remaining mangas as single-part items
        mangaLibrary.forEach(manga => {
            if (processed.has(manga.folder)) return;
            
            const norm = normalizeTitle(manga.title);
            const order = normalizedMappings[norm] || 99;
            const guideItem = list.find(g => g.order === order);
            
            let cleanTitle = manga.title;
            if (manga.folder === "The Lost Adventures & Team Avatar Tales") {
                cleanTitle = "The Lost Adventures & Team Avatar Tales";
            } else if (manga.folder === "Patterns in Time") {
                cleanTitle = "Patterns in Time";
            }
            
            let tGroup = guideItem ? guideItem.timeline_group : (currentLang === 'tr' ? 'Diğer Albümler' : 'Other Albums');
            if (order === 72) {
                tGroup = currentLang === 'tr' ? 'Korra Dönemi Geçişi' : 'Korra Era Transition';
            } else if (order >= 79 && tGroup.toLowerCase().includes('korra')) {
                tGroup = currentLang === 'tr' ? 'Korra Dönemi - Dizi Sonrası' : 'Korra Era - Post-Series';
            }
            
            grouped.push({
                title: cleanTitle,
                timeline_group: tGroup,
                order: order,
                parts: [manga]
            });
        });
        
        // Sort display items by order
        grouped.sort((a, b) => a.order - b.order);
        return grouped;
    }

    function updateInfoPanel(mangaTitle) {
        let guideItem = null;
        const activeOrder = getActiveMangaGuideOrder();
        if (activeOrder !== null && activeOrder !== undefined) {
            guideItem = readingGuide.find(item => item.order === activeOrder);
        }
        if (!guideItem) {
            guideItem = findGuideItem(mangaTitle);
        }
        const infoPanel = document.getElementById('manga-info-panel');
        const infoBtn = document.getElementById('btn-manga-info');
        
        if (guideItem && !isFallbackMode) {
            infoBtn.classList.remove('hidden');
            
            let orderText = `#${guideItem.order}`;
            let groupText = guideItem.timeline_group;
            let readingPointHTML = guideItem.exact_reading_point;
            let periodHTML = guideItem.specific_period;
            let spoilerHTML = guideItem.spoiler_prevention_reason;

            // Special handling for the combined folder (The Lost Adventures & Team Avatar Tales)
            if (guideItem.order === 3) {
                const guideItemLA = readingGuide.find(item => item.title === "The Lost Adventures");
                const guideItemTAT = readingGuide.find(item => item.title === "Team Avatar Tales");
                if (guideItemLA && guideItemTAT) {
                    orderText = `#3`;
                    readingPointHTML = `<strong>#3 (Lost Adventures):</strong> ${guideItemLA.exact_reading_point}<br><br><strong>#3 (Avatar Tales):</strong> ${guideItemTAT.exact_reading_point}`;
                    periodHTML = `<strong>#3 (Lost Adventures):</strong> ${guideItemLA.specific_period}<br><br><strong>#3 (Avatar Tales):</strong> ${guideItemTAT.specific_period}`;
                    spoilerHTML = `<strong>#3 (Lost Adventures):</strong> ${guideItemLA.spoiler_prevention_reason}<br><br><strong>#3 (Avatar Tales):</strong> ${guideItemTAT.spoiler_prevention_reason}`;
                }
            }

            const infoOrder = document.getElementById('info-order');
            const infoGroup = document.getElementById('info-group');
            const infoReadingPoint = document.getElementById('info-reading-point');
            const infoPeriod = document.getElementById('info-period');
            const infoSpoiler = document.getElementById('info-spoiler');
            
            if (infoOrder) infoOrder.textContent = orderText;
            if (infoGroup) infoGroup.textContent = groupText;
            if (infoReadingPoint) infoReadingPoint.innerHTML = readingPointHTML;
            if (infoPeriod) infoPeriod.innerHTML = periodHTML;
            if (infoSpoiler) infoSpoiler.innerHTML = spoilerHTML;
        } else {
            if (infoBtn) infoBtn.classList.add('hidden');
            if (infoPanel) infoPanel.classList.add('hidden');
        }
    }



    // Toggle Moon/Sun Theme Icon in Navbar (Issue #44)
    function updateThemeUI() {
        const btnTheme = document.getElementById('btn-theme');
        if (!btnTheme) return;
        
        const isLight = document.body.classList.contains('light-mode');
        const icon = btnTheme.querySelector('i');
        const tr = i18n[currentLang];
        if (icon) {
            if (isLight) {
                icon.className = 'fa-solid fa-sun';
                btnTheme.title = tr.themeDark;
                btnTheme.setAttribute('aria-label', tr.themeDark);
            } else {
                icon.className = 'fa-solid fa-moon';
                btnTheme.title = tr.themeLight;
                btnTheme.setAttribute('aria-label', tr.themeLight);
            }
        }

        // Remove existing theme-color meta tags to force iOS Safari to repaint status bar and address bar
        document.querySelectorAll('meta[name="theme-color"]').forEach(el => el.remove());
        
        // Create and append a brand-new theme-color meta tag
        const themeColorMeta = document.createElement('meta');
        themeColorMeta.setAttribute('name', 'theme-color');
        themeColorMeta.setAttribute('content', isLight ? '#f4ecd8' : '#151413');
        document.head.appendChild(themeColorMeta);
    }

    // Helper to get visible page indices (portrait vs landscape)
    function getVisibleIndices(pageIdx) {
        if (!pageFlip) return [pageIdx];
        const wrapperWidth = bookWrapper.clientWidth;
        const wrapperHeight = bookWrapper.clientHeight;
        const orientation = (wrapperWidth > 0 && wrapperHeight > 0)
            ? (wrapperWidth < wrapperHeight ? 'portrait' : 'landscape')
            : 'landscape';
            
        if (orientation === 'portrait') {
            return [pageIdx];
        }
        const total = pageFlip.getPageCount();
        if (pageIdx === 0) {
            return [0];
        }
        if (pageIdx === total - 1 && total % 2 === 0) {
            return [pageIdx];
        }
        
        const startIdx = pageIdx % 2 === 1 ? pageIdx : pageIdx - 1;
        const secondIdx = startIdx + 1;
        
        const visible = [startIdx];
        if (secondIdx < total) {
            visible.push(secondIdx);
        }
        return visible;
    }

    function updateNavigationArrows(pageIdx) {
        if (!pageFlip) return;
        const total = pageFlip.getPageCount();
        const visibleIndices = getVisibleIndices(pageIdx);
        
        // Hide left arrow if first page (0) is visible
        if (visibleIndices.includes(0)) {
            btnPrev.classList.add('hidden');
        } else {
            btnPrev.classList.remove('hidden');
        }
        
        // Hide right arrow if last page (total - 1) is visible
        if (visibleIndices.includes(total - 1)) {
            btnNext.classList.add('hidden');
        } else {
            btnNext.classList.remove('hidden');
        }
    }

    function getActiveMangaGuideOrder() {
        if (!activeManga) return null;
        
        const currentPageIdx = pageFlip ? pageFlip.getCurrentPageIndex() : 0;
        const visibleIndices = getVisibleIndices(currentPageIdx);
        
        // Check from right to left (prefer right page in double page spreads)
        for (let i = visibleIndices.length - 1; i >= 0; i--) {
            const idx = visibleIndices[i];
            
            if (activeManga.folder === "The Lost Adventures & Team Avatar Tales") {
                const chapters = mangaChapters["The Lost Adventures & Team Avatar Tales"];
                const chapter = chapters.find(c => idx >= c.start && idx <= c.end);
                if (chapter) return chapter.order;
            } else if (activeManga.folder === "Patterns in Time") {
                const chapters = mangaChapters["Patterns in Time"];
                const chapter = chapters.find(c => idx >= c.start && idx <= c.end);
                if (chapter) return chapter.order;
            }
            
            // Handle multi-part manga groups
            if (activeManga.parts && activeManga.parts.length > 1) {
                let pageOffset = 0;
                for (let j = 0; j < activeManga.parts.length; j++) {
                    const part = activeManga.parts[j];
                    const partLength = part.pages.length;
                    if (idx >= pageOffset && idx < pageOffset + partLength) {
                        const norm = normalizeTitle(part.folder);
                        const order = normalizedMappings[norm];
                        if (order) return order;
                        
                        const guideItem = findGuideItem(part.folder);
                        if (guideItem) return guideItem.order;
                    }
                    pageOffset += partLength;
                }
            }
        }
        
        // Fallback: use findGuideItem(activeManga.title)
        const guideItem = findGuideItem(activeManga.title);
        return guideItem ? guideItem.order : null;
    }

    function getCleanMangaTitle(title) {
        let clean = title;
        // 1. Remove prefixes like "Oku:", "Read:", "Oku (Kanon Dışı / Bonus):", "Read (Non-Canon / Bonus):"
        clean = clean.replace(/^[^:]+:\s*/i, '');
        // 2. Remove universe prefixes like "The Legend of Korra:", "Avatar: The Last Airbender:", etc.
        clean = clean.replace(/^(The Legend of Korra|Avatar:\s*The Last Airbender|Avatar:\s*Son Hava Bükücü|Avatar)\s*[:-]\s*/gi, '');
        // 3. Remove parenthetical explanations like "(Bölge Savaşları - 3 Parçalık Grafik Roman)", "(Turf Wars - 3-Part Graphic Novel)"
        clean = clean.replace(/\s*\([^)]*\)/g, '');
        // 4. Remove Story/Öykü parts (e.g. - Story 1)
        clean = clean.replace(/\s*-\s*(Story|Öykü)\s*\d+/gi, '');
        clean = clean.replace(/\s*(Story|Öykü)\s*\d+/gi, '');
        return clean.trim();
    }

    function getCleanTitle(mangaObject) {
        if (!mangaObject) return '';
        
        const cleanRaw = (str) => {
            return str
                .replace(/\s*\(\s*\d{4}\s*\)/gi, '') // (2012) etc
                .replace(/\s*\(\s*digital\s*\)/gi, '') // (digital)
                .replace(/\s*\(\s*Son\s+of\s+Ultron-Empire\s*\)/gi, '') // (Son of Ultron-Empire)
                .replace(/\s*\(\s*[^)]*Empire[^)]*\)/gi, '') // generic catch for Empire tags
                .trim();
        };

        const guideItem = findGuideItem(mangaObject.title);
        let baseTitle = mangaObject.title;
        if (guideItem) {
            baseTitle = guideItem.title;
        }
        
        baseTitle = getCleanMangaTitle(baseTitle);
        
        // Override compilation names if matched to any chapter
        const normBase = normalizeTitle(baseTitle);
        const isLostAdv = mangaChapters["The Lost Adventures & Team Avatar Tales"].some(ch => {
            const chNorm = normalizeTitle(ch.title);
            return normBase.includes(chNorm) || chNorm.includes(normBase);
        }) || normBase.includes("lost adventures") || normBase.includes("team avatar tales");
        
        const isPat = mangaChapters["Patterns in Time"].some(ch => {
            const chNorm = normalizeTitle(ch.title);
            return normBase.includes(chNorm) || chNorm.includes(normBase);
        }) || normBase.includes("patterns in time");
        
        if (isLostAdv) {
            baseTitle = "The Lost Adventures & Team Avatar Tales";
        } else if (isPat) {
            baseTitle = "Patterns in Time";
        }
        
        // Find all parts belonging to the same guide item order/title
        const parts = mangaLibrary.filter(manga => {
            const norm = normalizeTitle(manga.title);
            if (guideItem) {
                const mappedOrder = normalizedMappings[norm];
                if (mappedOrder === guideItem.order) return true;
            }
            const normCleanBase = normalizeTitle(baseTitle);
            return norm.includes(normCleanBase) || normCleanBase.includes(norm);
        });
        
        // Sort parts naturally to find this part's index
        parts.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));
        
        if (parts.length <= 1) {
            return cleanRaw(baseTitle);
        }
        
        // Find the index of this part to append it
        const partIndex = parts.findIndex(p => p.folder === mangaObject.folder);
        if (partIndex !== -1) {
            let partLabel = `Part ${partIndex + 1}`;
            const matchPart = mangaObject.title.match(/Part\s*(\d+)/i);
            if (matchPart) {
                partLabel = `Part ${matchPart[1]}`;
            }
            return `${cleanRaw(baseTitle)} - ${partLabel}`;
        }
        
        return cleanRaw(baseTitle);
    }

    function openReadingOrderSidebar() {
        closeSidebar();
        if (readingOrderSidebar) {
            readingOrderSidebar.classList.add('active');
            btnReadingOrder.setAttribute('aria-expanded', 'true');
        }
        sidebarOverlay.classList.add('active');
        document.body.classList.add('sidebar-open');
        try {
            localStorage.setItem('readingOrderOpen', 'true');
        } catch (e) {
            console.warn('Error saving readingOrderOpen:', e);
        }
        
        // Reset search input and highlights
        if (searchReadingOrderInput) {
            searchReadingOrderInput.value = '';
        }
        
        renderReadingOrderTimeline();
        
        // Focus the search input box
        setTimeout(() => {
            if (searchReadingOrderInput) {
                searchReadingOrderInput.focus();
            }
        }, 300);
        updatePageFlipInteractionState();
    }

    function closeReadingOrderSidebar() {
        if (readingOrderSidebar) {
            readingOrderSidebar.classList.remove('active');
            btnReadingOrder.setAttribute('aria-expanded', 'false');
        }
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        try {
            localStorage.setItem('readingOrderOpen', 'false');
        } catch (e) {
            console.warn('Error saving readingOrderOpen:', e);
        }
        updatePageFlipInteractionState();
    }

    function getMangaPartsForGuide(guide) {
        if (!guide) return [];
        
        const cleanGuideTitle = getCleanMangaTitle(guide.title);
        const normGuide = normalizeTitle(cleanGuideTitle);
        
        // 1. Check if this is a short story inside a compilation
        // Check "The Lost Adventures & Team Avatar Tales"
        const isLostAdventuresStory = mangaChapters["The Lost Adventures & Team Avatar Tales"].some(ch => {
            const chNorm = normalizeTitle(ch.title);
            return normGuide.includes(chNorm) || chNorm.includes(normGuide);
        });
        if (isLostAdventuresStory) {
            const match = mangaLibrary.filter(manga => {
                const norm = normalizeTitle(manga.title);
                return norm.includes("lost adventures") && norm.includes("team avatar tales");
            });
            if (match.length > 0) return match;
        }
        
        // Check "Patterns in Time"
        const isPatternsStory = mangaChapters["Patterns in Time"].some(ch => {
            const chNorm = normalizeTitle(ch.title);
            return normGuide.includes(chNorm) || chNorm.includes(normGuide);
        });
        if (isPatternsStory) {
            const match = mangaLibrary.filter(manga => {
                const norm = normalizeTitle(manga.title);
                return norm.includes("patterns in time");
            });
            if (match.length > 0) return match;
        }
        
        // 2. Try matching by order in manualMappings / normalizedMappings
        let parts = mangaLibrary.filter(manga => {
            const norm = normalizeTitle(manga.title);
            const mappedOrder = normalizedMappings[norm];
            return mappedOrder === guide.order;
        });
        if (parts.length > 0) return parts;
        
        // 3. Fallback: match by title inclusion
        parts = mangaLibrary.filter(manga => {
            const normFolder = normalizeTitle(manga.folder);
            const normTitle = normalizeTitle(manga.title);
            return normFolder.includes(normGuide) || normGuide.includes(normFolder) ||
                   normTitle.includes(normGuide) || normGuide.includes(normTitle);
        });
        
        // Sort parts naturally (e.g. Part 1, Part 2, Part 3)
        parts.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));
        return parts;
    }

    // Helper to format and clean timeline titles dynamically (Issue #3, #6, #8, #9)
    function formatTimelineTitle(title, isWatchStep, timelineGroup) {
        let clean = title;
        if (isWatchStep) {
            const isKorra = timelineGroup.toLowerCase().includes('korra') || clean.toLowerCase().includes('korra');
            const universe = isKorra ? "The Legend of Korra" : "Avatar: The Last Airbender";
            
            clean = clean.replace(/^(Watch Series:|Dizi İzle:|Watch:|İzle:|Dizi:)\s*/i, '');
            clean = clean.replace(/\s*\([^)]*["'][^)]*\)/g, ''); // strip episode names in quotes
            
            const hasEpisodeWord = clean.toLowerCase().includes('bölüm') || clean.toLowerCase().includes('episode') || clean.toLowerCase().includes('bölümler') || clean.toLowerCase().includes('episodes');
            
            if (hasEpisodeWord) {
                let season = null;
                const trSeasonMatch = clean.match(/(\d+)\.\s*Sezon/i);
                const enSeasonMatch = clean.match(/Season\s*(\d+)/i);
                if (trSeasonMatch) season = trSeasonMatch[1];
                else if (enSeasonMatch) season = enSeasonMatch[1];
                
                const cleanNoSeason = clean.replace(/(\d+)\.\s*Sezon|Season\s*(\d+)/gi, '');
                const episodesMatch = cleanNoSeason.match(/\d+/g);
                const episodes = episodesMatch ? episodesMatch.map(Number) : [];
                
                if (episodes.length > 0) {
                    const minEp = Math.min(...episodes);
                    const maxEp = Math.max(...episodes);
                    
                    if (currentLang === 'tr') {
                        if (minEp === maxEp) {
                            return `${universe} - ${season ? season + '. Sezon ' : ''}${minEp}. Bölüm`;
                        } else if (maxEp - minEp === 1) {
                            return `${universe} - ${season ? season + '. Sezon ' : ''}${minEp}. Bölüm ile ${maxEp}. Bölüm`;
                        } else {
                            return `${universe} - ${season ? season + '. Sezon ' : ''}${minEp}. Bölümden ${maxEp}. Bölüme kadar`;
                        }
                    } else {
                        if (minEp === maxEp) {
                            return `${universe} - ${season ? 'Season ' + season + ', ' : ''}Episode ${minEp}`;
                        } else if (maxEp - minEp === 1) {
                            return `${universe} - ${season ? 'Season ' + season + ', ' : ''}Episode ${minEp} & ${maxEp}`;
                        } else {
                            return `${universe} - ${season ? 'Season ' + season + ', ' : ''}Episodes ${minEp} to ${maxEp}`;
                        }
                    }
                }
            }
            
            // Fallback for Korra seasons or non-episode watches
            if (isKorra) {
                clean = clean.replace(/The Legend of Korra\s*/gi, '').trim();
            }
            clean = clean.replace(/^\(([^)]+)\)\.?$/, '$1').replace(/\.$/, '').trim();
            return `${universe} - ${clean}`;
        } else {
            const cleanTitle = getCleanMangaTitle(title);
            const normTitle = normalizeTitle(cleanTitle);
            
            // Check if it belongs to The Lost Adventures
            const chLost = mangaChapters["The Lost Adventures & Team Avatar Tales"].find(ch => {
                const chNorm = normalizeTitle(ch.title);
                return normTitle.includes(chNorm) || chNorm.includes(normTitle);
            });
            if (chLost) {
                return `${cleanTitle} (The Lost Adventures & Team Avatar Tales)`;
            }
            
            // Check if it belongs to Patterns in Time
            const chPat = mangaChapters["Patterns in Time"].find(ch => {
                const chNorm = normalizeTitle(ch.title);
                return normTitle.includes(chNorm) || chNorm.includes(normTitle);
            });
            if (chPat) {
                return `${cleanTitle} (Patterns in Time)`;
            }
            
            return cleanTitle;
        }
    }

    function renderReadingOrderTimeline() {
        if (!readingOrderList) return;
        readingOrderList.innerHTML = '';

        if (!readingGuide || readingGuide.length === 0) {
            readingOrderList.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 0.9rem;">
                    ${i18n[currentLang].guideLoadError}
                </div>
            `;
            return;
        }

        readingGuide.forEach((guide, index) => {
            const matchedParts = getMangaPartsForGuide(guide);
            const isAvailable = matchedParts.length > 0;
            const isWatchStep = guide.title.toLowerCase().includes('izle') || 
                                guide.title.toLowerCase().includes('watch') ||
                                guide.title.toLowerCase().includes('i\u0307zle') ||
                                guide.title.toLowerCase().includes('dizi');

            const card = document.createElement('div');
            card.className = 'timeline-item-card ' + (isWatchStep ? 'watch-step' : 'read-step');
            card.dataset.order = guide.order;

            let displayTitle = guide.title;
            if (currentLang === 'tr' && typeof readingGuideEn !== 'undefined') {
                const enGuide = readingGuideEn.find(g => g.order === guide.order);
                if (enGuide && (guide.title.startsWith("Oku") || enGuide.title.startsWith("Read"))) {
                    displayTitle = enGuide.title
                        .replace("Read (Non-Canon / Bonus):", "Oku (Kanon Dışı / Bonus):")
                        .replace("Read (Non-Canon / Bonus)", "Oku (Kanon Dışı / Bonus)")
                        .replace("Read:", "Oku:");
                }
            }

            const formattedTitle = formatTimelineTitle(displayTitle, isWatchStep, guide.timeline_group);
            const escapedGroup = escapeHTML(guide.timeline_group);
            const escapedReadingPoint = escapeHTML(guide.exact_reading_point);
            const escapedPeriod = escapeHTML(guide.specific_period);

            let titleClass = 'timeline-item-title';
            let detailHTML = '';
            let actionHTML = '';

            if (isWatchStep) {
                titleClass += ' watch-title';
                actionHTML = `
                    <div class="timeline-item-action">
                        <span class="step-role-badge watch-role">
                            <i class="fa-solid fa-tv"></i> ${currentLang === 'tr' ? 'Dizi' : 'TV Show'}
                        </span>
                    </div>
                `;
            } else {
                detailHTML = `
                    <div class="timeline-item-detail">
                        
                        <p class="timeline-item-description">${escapedPeriod}</p>
                    </div>
                `;
                const firstPart = isAvailable ? matchedParts[0] : mangaLibrary[0];
                const folderAttr = firstPart ? `data-folder="${escapeHTML(firstPart.folder)}"` : '';
                actionHTML = `
                    <div class="timeline-item-action" style="display: flex; flex-direction: row; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 8px;">
                        <button class="read-now-btn" ${folderAttr}>
                            <i class="fa-solid fa-book-open-reader"></i> ${i18n[currentLang].readNow}
                        </button>
                        <span class="step-role-badge read-role" style="margin-top: 0;">
                            <i class="fa-solid fa-book"></i> Manga
                        </span>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="timeline-item-header">
                    <span class="timeline-order-badge">#${index + 1}</span>
                    <span class="timeline-group-pill">${escapedGroup}</span>
                </div>
                <div class="${titleClass}">${isWatchStep ? `<strong>${escapeHTML(formattedTitle)}</strong>` : escapeHTML(formattedTitle)}</div>
                ${detailHTML}
                ${actionHTML}
            `;

            if (!isWatchStep) {
                const btn = card.querySelector('.read-now-btn');
                if (btn) {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const folder = btn.dataset.folder;
                        if (!folder) return;
                        const mangaObj = mangaLibrary.find(m => m.folder === folder);
                        if (mangaObj) {
                            const resolvedGroup = resolveMangaGroup(mangaObj);
                            const partOffset = getPartPageOffset(resolvedGroup, mangaObj);
                            const guidePageOffset = getMangaStartPageForGuide(guide, mangaObj);
                            const startPage = partOffset + guidePageOffset;
                            loadManga(mangaObj, startPage);
                            closeReadingOrderSidebar();
                        }
                    });
                }
            }

            readingOrderList.appendChild(card);
        });
    }

// ==========================================================================
// CHRONOLOGICAL ROADMAP & HUD SYSTEM
// ==========================================================================

const mangaChapters = {
    "The Lost Adventures & Team Avatar Tales": [
        {
            "title": "Bee Calm",
            "start": 10,
            "end": 11,
            "order": 4
        },
        {
            "title": "Water War",
            "start": 12,
            "end": 15,
            "order": 6
        },
        {
            "title": "Don't Blow It",
            "start": 16,
            "end": 19,
            "order": 8
        },
        {
            "title": "Relics",
            "start": 20,
            "end": 29,
            "order": 10
        },
        {
            "title": "Fruit-Stand Freestyle",
            "start": 30,
            "end": 31,
            "order": 2
        },
        {
            "title": "Sleepbending",
            "start": 34,
            "end": 35,
            "order": 18
        },
        {
            "title": "Lessons",
            "start": 36,
            "end": 37,
            "order": 19
        },
        {
            "title": "Sokka the Avatar",
            "start": 38,
            "end": 52,
            "order": 21
        },
        {
            "title": "Dirty is Only Skin Deep",
            "start": 53,
            "end": 56,
            "order": 24
        },
        {
            "title": "Divided We Fall",
            "start": 57,
            "end": 78,
            "order": 20
        },
        {
            "title": "Reach for the Toph",
            "start": 79,
            "end": 82,
            "order": 22
        },
        {
            "title": "It's Only Natural",
            "start": 83,
            "end": 89,
            "order": 29
        },
        {
            "title": "Going Home Again",
            "start": 90,
            "end": 99,
            "order": 30
        },
        {
            "title": "The Bridge",
            "start": 100,
            "end": 112,
            "order": 31
        },
        {
            "title": "Private Fire",
            "start": 116,
            "end": 139,
            "order": 33
        },
        {
            "title": "Night Animals",
            "start": 140,
            "end": 141,
            "order": 35
        },
        {
            "title": "Boys' Day Out",
            "start": 142,
            "end": 147,
            "order": 36
        },
        {
            "title": "Ember Island Arcade",
            "start": 148,
            "end": 153,
            "order": 40
        },
        {
            "title": "Monster Slayers",
            "start": 154,
            "end": 163,
            "order": 42
        },
        {
            "title": "Combustion Man on a Train",
            "start": 164,
            "end": 177,
            "order": 43
        },
        {
            "title": "Swordbending",
            "start": 178,
            "end": 183,
            "order": 45
        },
        {
            "title": "No Benders Allowed",
            "start": 184,
            "end": 189,
            "order": 46
        },
        {
            "title": "Love is a Battlefield",
            "start": 190,
            "end": 195,
            "order": 50
        },
        {
            "title": "Dragon Days",
            "start": 196,
            "end": 205,
            "order": 47
        },
        {
            "title": "Game Time!",
            "start": 206,
            "end": 211,
            "order": 53
        },
        {
            "title": "Bumi vs. Toph, Round 1",
            "start": 212,
            "end": 221,
            "order": 55
        },
        {
            "title": "New Recruits",
            "start": 220,
            "end": 221,
            "order": 99
        },
        {
            "title": "Gym Time",
            "start": 222,
            "end": 223,
            "order": 99
        },
        {
            "title": "Rebound",
            "start": 228,
            "end": 235,
            "order": 58
        },
        {
            "title": "The Substitute",
            "start": 236,
            "end": 242,
            "order": 38
        },
        {
            "title": "Shells",
            "start": 244,
            "end": 253,
            "order": 61
        },
        {
            "title": "Sokka's Poem",
            "start": 254,
            "end": 255,
            "order": 60
        },
        {
            "title": "Toph and the Boulder",
            "start": 257,
            "end": 268,
            "order": 56.5
        },
        {
            "title": "Origami",
            "start": 267,
            "end": 272,
            "order": 13
        },
        {
            "title": "Sisters",
            "start": 273,
            "end": 280,
            "order": 60.5
        },
        {
            "title": "The Scarecrow",
            "start": 281,
            "end": 292,
            "order": 15
        }
    ],
    "Patterns in Time": [
        {
            "title": "Wisdom",
            "start": 19,
            "end": 20,
            "order": 71
        },
        {
            "title": "Weavers Ball",
            "start": 41,
            "end": 50,
            "order": 72
        },
        {
            "title": "Friends for Life",
            "start": 5,
            "end": 14,
            "order": 73
        },
        {
            "title": "Skyscrapers",
            "start": 15,
            "end": 18,
            "order": 74
        },
        {
            "title": "Cat-Owl's Cradle",
            "start": 61,
            "end": 73,
            "order": 77
        },
        {
            "title": "Lost Pets",
            "start": 21,
            "end": 32,
            "order": 82
        },
        {
            "title": "Clearing the Air",
            "start": 51,
            "end": 60,
            "order": 84
        },
        {
            "title": "A Change in the Wind",
            "start": 33,
            "end": 40,
            "order": 85
        }
    ]
};

function getMangaStartPageForGuide(guide, mangaObj) {
    if (!mangaObj || !guide) return 0;
    
    if (mangaObj.folder === "The Lost Adventures & Team Avatar Tales") {
        const chapters = mangaChapters["The Lost Adventures & Team Avatar Tales"];
        const chapter = chapters.find(c => c.order === guide.order);
        if (chapter) {
            return chapter.start;
        }
    } else if (mangaObj.folder === "Patterns in Time") {
        const chapters = mangaChapters["Patterns in Time"];
        const chapter = chapters.find(c => c.order === guide.order);
        if (chapter) {
            return chapter.start;
        }
    }
    return 0;
}
});