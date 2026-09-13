import { ReadingState } from './core/readingState.js';
import { EventManager } from './core/eventManager.js';
import { ImagePreloader } from './core/imagePreloader.js';
import { ReadingGuideLoader } from './core/readingGuideLoader.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Containers
    const bookContainer = document.getElementById('book');
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
    const readingOrderList = document.getElementById('reading-order-timeline');
    const searchReadingOrderInput = document.getElementById('search-reading-order');
    
    // Buttons
    const btnLibrary = document.getElementById('btn-library');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar');
    
    // Indicators & Navigation
    const currentPageInput = document.getElementById('current-page-input');
    
    function updatePageIndicatorValue(val) {
        if (!currentPageInput) return;
        currentPageInput.value = val;
        const len = String(val).length || 1;
        currentPageInput.style.setProperty('width', `calc(${len}ch + 20px)`, 'important');
    }
    const totalPagesNumText = document.getElementById('total-pages-num');
    const loadingOverlay = document.getElementById('loading-overlay');
    const mangaTitleBadge = document.getElementById('manga-title-badge');
    const mangaTitleText = document.getElementById('manga-title');
    


    // Theme & Info panel
    const btnTheme = document.getElementById('btn-theme');
    const mangaInfoPanel = document.getElementById('manga-info-panel');
    const btnMangaInfo = document.getElementById('btn-manga-info');
    const btnCloseInfo = document.getElementById('btn-close-info');

    // State Variables
    let mangaLibrary = []; // Contains list of mangas loaded from mangas.json
    let readingGuide = []; // Contains chronological reading order metadata
    let activeManga = null; // Current loaded manga object
    let currentLang = ReadingState.getLang(); // Default to Turkish
    
    const i18n = {
        tr: {
            mangaList: "Manga Listesi",
            readingOrder: "Zaman Çizelgesi",
            loading: "Sayfalar Yükleniyor...",
            welcomeTitle: "MANGAFLIP",
            welcomeDesc: "Avatar ve Korra çizgi romanları kronolojik okuma platformu.<br><br><span style='font-size:0.8rem; opacity:0.85; display:block; line-height:1.5; margin-top:10px;'><i class='fa-solid fa-hand-pointer'></i> Sayfa değiştirmek için ekranın <b>sol/sağ kenarlarına</b> dokunun veya kaydırın.<br><i class='fa-solid fa-magnifying-glass-plus'></i> Yakınlaştırmak / uzaklaştırmak için ekranda <b>iki parmağınızı kıstırın (pinch zoom)</b>.</span>",
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
            welcomeDesc: "Chronological reader interface for Avatar and Korra comics.<br><br><span style='font-size:0.8rem; opacity:0.85; display:block; line-height:1.5; margin-top:10px;'><i class='fa-solid fa-hand-pointer'></i> Tap <b>left/right screen edges</b> or swipe to turn pages.<br><i class='fa-solid fa-magnifying-glass-plus'></i> <b>Pinch screen</b> with two fingers to zoom in/out.</span>",
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
    let currentPageIndex = 0; // Current active page index (0-based)
    
    // Touch tracking variables
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartTime = 0;
    let gestureStartZone = 0.5;
    let isFallbackMode = false;

    let readerGeneration = 0;

    // Zoom state variables (Pinch-to-zoom & Pan)
    let currentScale = 1.0;
    let lastScale = 1.0;
    let initialPinchDistance = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;
    let lastTranslateX = 0;
    let lastTranslateY = 0;

    // Helper functions
    function clampPageIndex(index, pageCount) {
        const total = Math.max(0, Number(pageCount) || 0);
        if (total === 0) return 0;
        const maxIdx = Math.max(0, total - 1);
        const parsed = parseInt(index, 10);
        if (isNaN(parsed)) return 0;
        return Math.min(Math.max(0, parsed), maxIdx);
    }

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

    function checkAndApplyMarquee() {
        const textEl = document.getElementById('manga-title');
        const containerEl = document.getElementById('manga-title-container');
        if (!textEl || !containerEl) return;
        
        // Reset styles first to get accurate measurements
        textEl.style.transform = 'none';
        textEl.style.animation = 'none';
        textEl.style.removeProperty('--scroll-dist');
        
        requestAnimationFrame(() => {
            const containerWidth = containerEl.clientWidth;
            const textWidth = textEl.scrollWidth;
            
            if (textWidth > containerWidth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                const scrollDistance = textWidth - containerWidth + 8;
                textEl.style.setProperty('--scroll-dist', `-${scrollDistance}px`);
                const duration = Math.max(4, textWidth / 22); // Scroll rate (~22px/sec)
                textEl.style.animation = `marqueeAnimation ${duration}s linear infinite alternate`;
            } else {
                textEl.style.transform = 'translate3d(0, 0, 0)';
            }
        });
    }

    // Initialize application
    init();

    async function init() {
        showLoading(true);

        // Restore theme configuration
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
            console.warn('mangas.json could not be loaded. Falling back to instructions.', e);
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

    // Displays simple fallback instructions if no manga exists
    function setupInstructionsPages() {
        const pagesHTML = `
            <div class="page active" data-index="0">
                <div class="welcome-page">
                    <div class="welcome-logo"><i class="fa-solid fa-book-open"></i></div>
                    <h1>MangaFlip Mobile</h1>
                    <p>Mobile-optimized reader mode is ready.</p>
                    <span class="badge">Library is Empty</span>
                    <div class="pulse-chevron"><i class="fa-solid fa-chevron-right"></i></div>
                </div>
            </div>
            <div class="page" data-index="1">
                <div class="welcome-page">
                    <h2>Step 1: Add Manga Folders</h2>
                    <p>Copy your manga folders into the <strong>mangas/</strong> directory on your project folder.</p>
                    <div class="step-box">
                        MangaFlip/mangas/Manga Title/001.jpg
                    </div>
                </div>
            </div>
            <div class="page" data-index="2">
                <div class="welcome-page">
                    <h2>Step 2: Deploy & Enjoy</h2>
                    <p>Run the deployment bat script to populate the index file and start reading offline!</p>
                </div>
            </div>
        `;
        bookContainer.innerHTML = pagesHTML;
        totalPagesNumText.textContent = 3;
        updatePageIndicatorValue(1);
        currentPageIndex = 0;
    }

    function renderMangaList(filter = '') {
        mangaListContainer.innerHTML = '';
        const lastReadFolder = localStorage.getItem('last_read_folder');
        const displayItems = getDisplayLibrary();
        
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
            const headerDiv = document.createElement('div');
            headerDiv.className = 'timeline-header';
            let iconClass = 'fa-clock-rotate-left';
            if (groupName.includes('Post-Series') || groupName.includes('Dizi Sonrası')) iconClass = 'fa-calendar-check';
            if (groupName.includes('Transition') || groupName.includes('Geçişi')) iconClass = 'fa-shuffle';
            if (groupName.includes('Other') || groupName.includes('Diğer')) iconClass = 'fa-folder-open';
            
            headerDiv.innerHTML = `<i class="fa-solid ${iconClass}"></i> ${groupName}`;
            mangaListContainer.appendChild(headerDiv);

            groups[groupName].forEach(item => {
                const isMultiPart = item.parts.length > 1;
                const totalPages = item.parts.reduce((sum, p) => sum + p.pages.length, 0);

                const itemDiv = document.createElement('div');
                itemDiv.className = 'manga-item';
                const hasActivePart = activeManga && item.parts.some(p => p.folder === activeManga.folder);
                if (hasActivePart) {
                    itemDiv.classList.add('active');
                    if (isMultiPart) itemDiv.classList.add('expanded');
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
                            e.stopPropagation();
                            const resolvedGroup = resolveMangaGroup(part);
                            const partOffset = getPartPageOffset(resolvedGroup, part);
                            loadManga(part, partOffset);
                            closeSidebar();
                        });

                        subListContainer.appendChild(subItemDiv);
                    });

                    mangaListContainer.appendChild(subListContainer);

                    itemDiv.addEventListener('click', () => {
                        itemDiv.classList.toggle('expanded');
                        const firstPart = item.parts[0];
                        if (!activeManga || !item.parts.some(p => p.folder === activeManga.folder)) {
                            loadManga(firstPart);
                            closeSidebar();
                        }
                    });
                } else {
                    itemDiv.addEventListener('click', () => {
                        loadManga(item.parts[0]);
                        closeSidebar();
                    });
                }
            });
        }
    }

    async function loadReadingGuide() {
        try {
            const guides = await ReadingGuideLoader.load(currentLang);
            readingGuide = guides.currentGuide;
            window.readingGuideEn = guides.enGuide;
            renderReadingOrderTimeline();
            if (activeManga) {
                updateInfoPanel(activeManga.title);
            }
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
        
        // 2. Buttons in Navbar
        const btnLib = document.getElementById('btn-library');
        if (btnLib) {
            btnLib.title = tr.mangaList;
            btnLib.setAttribute('aria-label', tr.mangaList);
        }
        
        const btnReadOrder = document.getElementById('btn-reading-order');
        if (btnReadOrder) {
            btnReadOrder.title = tr.readingOrder;
            btnReadOrder.setAttribute('aria-label', tr.readingOrder);
        }
        
        const btnExitReader = document.getElementById('btn-exit-reader');
        if (btnExitReader) {
            btnExitReader.title = tr.exitReader;
            btnExitReader.setAttribute('aria-label', tr.exitReader);
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
        if (landingDesc) landingDesc.innerHTML = tr.welcomeDesc;
        
        const landingStart = document.getElementById('btn-landing-start');
        if (landingStart) landingStart.innerHTML = `<i class="fa-solid fa-list-ul"></i> ` + tr.startReading;
        
        // 6. Loading overlay
        const loadingText = document.querySelector('#loading-overlay p');
        if (loadingText) loadingText.textContent = tr.loading;
        
        // 7. Info Panel Labels
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
        


        // 10. Close buttons title/aria-label
        const closeBtnManga = document.getElementById('btn-close-sidebar');
        if (closeBtnManga) {
            closeBtnManga.setAttribute('aria-label', currentLang === 'tr' ? 'Manga Kütüphanesini Kapat' : 'Close Manga Library');
        }
        const closeBtnRO = document.getElementById('btn-close-reading-order');
        if (closeBtnRO) {
            closeBtnRO.setAttribute('aria-label', currentLang === 'tr' ? 'Okuma Sırasını Kapat' : 'Close Reading Order');
        }

        const closeBtnInfo = document.getElementById('btn-close-info');
        if (closeBtnInfo) {
            closeBtnInfo.setAttribute('aria-label', currentLang === 'tr' ? 'Bilgi Panelini Kapat' : 'Close Information Panel');
        }

        // 11. Menu Dropdown translations
        const menuLib = document.getElementById('lbl-menu-library');
        if (menuLib) menuLib.textContent = tr.mangaList;

        const menuRO = document.getElementById('lbl-menu-reading-order');
        if (menuRO) menuRO.textContent = tr.readingOrder;



        const menuLang = document.getElementById('lbl-menu-lang');
        if (menuLang) {
            menuLang.textContent = currentLang === 'tr' ? 'English (EN)' : 'Türkçe (TR)';
        }

        const menuTheme = document.getElementById('lbl-menu-theme');
        if (menuTheme) {
            const isLight = document.body.classList.contains('light-mode');
            menuTheme.textContent = isLight ? tr.themeDark : tr.themeLight;
        }

        // 12. Re-render timelines/guides to match language
        renderReadingOrderTimeline();
        if (activeManga) {
            updateInfoPanel(activeManga.title);
            checkAndApplyMarquee();
        }
    }

    function exitReader() {
        readerGeneration++;
        document.body.classList.remove('reading-mode');
        activeManga = null;
        EventManager.clearReaderEvents();
        currentPageIndex = 0;
        currentScale = 1.0;
        lastScale = 1.0;
        translateX = 0;
        translateY = 0;
        lastTranslateX = 0;
        lastTranslateY = 0;
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
        EventManager.clearReaderEvents();

        // 1. Prevent bounce gestures on iOS Safari but let menus scroll naturally
        EventManager.addReaderEvent(document, 'touchmove', (e) => {
            if (!e.target.closest('.manga-list, .gallery-modal-body, .info-panel-body')) {
                if (e.cancelable) {
                    e.preventDefault();
                }
            }
        }, { passive: false });

        // 2. URL hash navigation listener
        EventManager.addReaderEvent(window, 'hashchange', () => {
            const route = parseURLHash();
            if (route) {
                if (activeManga && activeManga.folder === route.manga.folder) {
                    if (currentPageIndex !== route.pageIndex) {
                        turnToPage(route.pageIndex);
                    }
                } else {
                    loadManga(route.manga, route.pageIndex);
                }
            } else {
                if (activeManga) {
                    exitReader();
                }
            }
        });

        // 3. Escape key down
        EventManager.addReaderEvent(window, 'keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                closeSidebar();
                closeReadingOrderSidebar();
                const infoPanel = document.getElementById('manga-info-panel');
                if (infoPanel) infoPanel.classList.add('hidden');
            }
        });

        // 4. Force window to stay at scroll offset (0, 0)
        EventManager.addReaderEvent(window, 'scroll', () => {
            if (window.scrollY !== 0 || window.scrollX !== 0) {
                window.scrollTo(0, 0);
            }
        });

        // 5. Resize marquee & zoom constraints
        EventManager.addReaderEvent(window, 'resize', () => {
            if (activeManga) {
                checkAndApplyMarquee();
            }
            if (currentScale > 1.05) {
                constrainTranslation();
                applyZoomTransform();
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

            currentPageIndex = clampPageIndex(savedPageIndex, activeManga.pages.length);
            
            // Sync sidebar indicators using current page index
            syncSidebarActiveState(currentPageIndex);

            mangaTitleText.textContent = activeManga.title;
            if (mangaTitleBadge) {
                mangaTitleBadge.classList.remove('hidden');
            }
            checkAndApplyMarquee();
            const total = activeManga.pages.length;
            totalPagesNumText.textContent = total;
            updatePageIndicatorValue(currentPageIndex + 1);

            updateInfoPanel(activeManga.title);

            // Clear page container
            bookContainer.innerHTML = '';
            
            // Build new pages DOM list
            activeManga.pages.forEach((pageObj, index) => {
                const pageFile = pageObj.file;
                const folderPath = pageObj.folder.split('/').map(encodeURIComponent).join('/');
                const pageDiv = document.createElement('div');
                pageDiv.className = 'page';
                if (index === currentPageIndex) {
                    pageDiv.classList.add('active');
                }
                
                // Lazy loading check - eager load 3 pages ahead and behind to prevent swipe lag
                const isEager = Math.abs(index - currentPageIndex) <= 3;
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

            // Trigger lazy loading
            lazyLoadMobilePages(currentPageIndex);
            
            // Sync URL hash
            window.location.hash = `#/${encodeURIComponent(activeManga.folder)}/${currentPageIndex}`;

            // Wait for image loaded to remove loader overlay
            const activeImg = bookContainer.querySelector(`.page-content[data-index="${currentPageIndex}"] img`);
            if (activeImg) {
                if (activeImg.complete) {
                    showLoading(false);
                } else {
                    activeImg.onload = () => showLoading(false);
                    activeImg.onerror = () => showLoading(false);
                    setTimeout(() => showLoading(false), 3000);
                }
            } else {
                showLoading(false);
            }
        }, 50);
    }

    function lazyLoadMobilePages(currentIndex) {
        if (isFallbackMode) return;
        
        const range = 5;
        const total = activeManga.pages.length;
        
        for (let i = currentIndex - range; i <= currentIndex + range; i++) {
            if (i >= 0 && i < total) {
                const img = bookContainer.querySelector(`.page-content[data-index="${i}"] img`);
                const spinner = bookContainer.querySelector(`.page-content[data-index="${i}"] .manga-spinner`);
                
                if (img && img.dataset.src && !img.getAttribute('src')) {
                    const src = img.dataset.src;
                    
                    // If already cached, load synchronously to prevent swiping lag/flicker
                    if (ImagePreloader.isCached(src)) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        img.classList.remove('hidden');
                        if (spinner) spinner.style.display = 'none';
                        const errDiv = bookContainer.querySelector(`.page-content[data-index="${i}"] .load-error`);
                        if (errDiv) errDiv.remove();
                    } else {
                        // Set temporary source to block double requests
                        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E';
                        
                        ImagePreloader.preload(src)
                            .then(() => {
                                img.src = src;
                                img.removeAttribute('data-src');
                                img.classList.remove('hidden');
                                if (spinner) spinner.style.display = 'none';
                                const errDiv = bookContainer.querySelector(`.page-content[data-index="${i}"] .load-error`);
                                if (errDiv) errDiv.remove();
                            })
                            .catch(() => {
                                img.src = ''; // reset source
                                if (spinner) spinner.style.display = 'none';
                                
                                let errDiv = bookContainer.querySelector(`.page-content[data-index="${i}"] .load-error`);
                                if (!errDiv) {
                                    errDiv = document.createElement('div');
                                    errDiv.className = 'load-error';
                                    errDiv.style.cssText = 'position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; z-index: 5;';
                                    errDiv.innerHTML = `
                                        <i class="fa-solid fa-triangle-exclamation" style="font-size: 1.5rem; color: var(--accent-pink);"></i>
                                        <button class="retry-btn" style="background: rgba(255,255,255,0.08); border: 1px solid var(--glass-border); padding: 4px 12px; border-radius: 12px; font-size: 0.7rem; color: var(--text-primary); cursor: pointer;">Retry</button>
                                    `;
                                    errDiv.querySelector('.retry-btn').addEventListener('click', () => {
                                        errDiv.remove();
                                        if (spinner) spinner.style.display = 'block';
                                        const retryUrl = src + (src.includes('?') ? '&' : '?') + 't=' + Date.now();
                                        
                                        ImagePreloader.preload(retryUrl).then(() => {
                                            img.src = retryUrl;
                                            img.removeAttribute('data-src');
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
            }
        }
    }

    function turnToPage(index) {
        const total = activeManga ? activeManga.pages.length : 3;
        if (index < 0 || index >= total) return;

        currentPageIndex = index;
        updatePageIndicatorValue(currentPageIndex + 1);

        // Reset zoom state variables
        currentScale = 1.0;
        lastScale = 1.0;
        translateX = 0;
        translateY = 0;
        lastTranslateX = 0;
        lastTranslateY = 0;

        // Toggle active states and reset zoom
        const oldActivePages = bookContainer.querySelectorAll('.page.active');
        oldActivePages.forEach(page => {
            page.classList.remove('active');
            const pageContent = page.querySelector('.page-content');
            if (pageContent) pageContent.classList.remove('zoomed');
            const img = page.querySelector('.page-content img');
            if (img) img.style.transform = '';
        });

        const newActivePage = bookContainer.querySelector(`.page:nth-child(${currentPageIndex + 1})`);
        if (newActivePage) {
            newActivePage.classList.add('active');
        }

        // Trigger lazy loading of surrounding pages
        lazyLoadMobilePages(currentPageIndex);



        // Save history
        if (!isFallbackMode && activeManga) {
            ReadingState.saveProgress(activeManga.folder, currentPageIndex);
            updateInfoPanel(activeManga.title);
        }
    }

    function getDistance(t1, t2) {
        return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    }

    function applyZoomTransform() {
        const activePage = bookContainer.querySelector('.page.active');
        if (!activePage) return;
        const img = activePage.querySelector('.page-content img');
        if (!img) return;
        img.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${currentScale})`;
    }

    function constrainTranslation() {
        const activePage = bookContainer.querySelector('.page.active');
        if (!activePage) return;
        const img = activePage.querySelector('.page-content img');
        if (!img) return;

        const w = img.clientWidth || img.offsetWidth || 300;
        const h = img.clientHeight || img.offsetHeight || 400;

        const maxTranslateX = Math.max(0, (w * currentScale - bookWrapper.clientWidth) / 2);
        const maxTranslateY = Math.max(0, (h * currentScale - bookWrapper.clientHeight) / 2);

        translateX = Math.min(Math.max(translateX, -maxTranslateX), maxTranslateX);
        translateY = Math.min(Math.max(translateY, -maxTranslateY), maxTranslateY);
    }

    function setupEventListeners() {
        // Touch event bindings for swiping / tapping on bookContainer (with Pinch-to-Zoom & Pan)
        bookWrapper.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                // Initialize pinch zoom
                initialPinchDistance = getDistance(e.touches[0], e.touches[1]);
                lastScale = currentScale;
            } else if (e.touches.length === 1) {
                const touch = e.touches[0];
                const rect = bookWrapper.getBoundingClientRect();
                gestureStartZone = rect.width > 0 ? (touch.clientX - rect.left) / rect.width : 0.5;
                const target = e.target;
                if (target instanceof Element && target.closest("button, a, input, select, textarea, [role=\"button\"]")) return;
                // Protect iOS edge-swipe navigation and avoid accidental page turns at the bezel.
                if (gestureStartZone <= 0.08 || gestureStartZone >= 0.92) return;
                // Initialize drag pan
                dragStartX = touch.clientX;
                dragStartY = touch.clientY;
                dragStartTime = Date.now();

                if (currentScale > 1.05) {
                    isDragging = true;
                    startX = touch.clientX - translateX;
                    startY = touch.clientY - translateY;            }
            }
        }, { passive: false });

        bookWrapper.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && initialPinchDistance > 0) {
                e.preventDefault();
                const dist = getDistance(e.touches[0], e.touches[1]);
                const ratio = dist / initialPinchDistance;
                currentScale = Math.min(Math.max(lastScale * ratio, 1.0), 3.0);
                constrainTranslation();
                applyZoomTransform();
            } else if (e.touches.length === 1 && isDragging && currentScale > 1.05) {
                e.preventDefault();
                translateX = e.touches[0].clientX - startX;
                translateY = e.touches[0].clientY - startY;
                constrainTranslation();
                applyZoomTransform();
            }
        }, { passive: false });

        bookWrapper.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                initialPinchDistance = 0;
            }
            if (e.touches.length === 0) {
                isDragging = false;
                lastTranslateX = translateX;
                lastTranslateY = translateY;
                
                if (currentScale <= 1.05) {
                    currentScale = 1.0;
                    translateX = 0;
                    translateY = 0;
                    applyZoomTransform();
                }
            }

            // Swipe / Tap detection (only if not zoomed in and outside protected edge gutters)
            if (currentScale <= 1.05 && gestureStartZone > 0.08 && gestureStartZone < 0.92) {
                if (e.changedTouches.length === 1) {
                    const dx = e.changedTouches[0].clientX - dragStartX;
                    const dy = e.changedTouches[0].clientY - dragStartY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const duration = Date.now() - dragStartTime;

                    // 1. Swipe detection
                    if (Math.abs(dx) > 45 && Math.abs(dy) < 80 && duration < 300) {
                        if (dx < 0) {
                            turnToPage(currentPageIndex + 1); // Swipe left -> next
                        } else {
                            turnToPage(currentPageIndex - 1); // Swipe right -> prev
                        }
                        return;
                    }

                    // 2. Tap detection (Left / Right 30% boundary click zones)
                    if (dist < 8 && duration < 300) {
                        const rect = bookWrapper.getBoundingClientRect();
                        const clickX = e.changedTouches[0].clientX - rect.left;
                        const width = rect.width;

                        if (clickX < width * 0.3) {
                            turnToPage(currentPageIndex - 1); // Click left -> prev
                        } else if (clickX > width * 0.7) {
                            turnToPage(currentPageIndex + 1); // Click right -> next
                        }
                    }
                }
            }
        }, { passive: true });

        // Swipe-to-close gesture bindings for drawers/sidebars (with Vertical-Scroll protection)
        let sidebarDragStartX = 0;
        let sidebarDragStartY = 0;
        if (librarySidebar) {
            librarySidebar.addEventListener('touchstart', (e) => {
                sidebarDragStartX = e.touches[0].clientX;
                sidebarDragStartY = e.touches[0].clientY;
            }, { passive: true });
            librarySidebar.addEventListener('touchend', (e) => {
                const dx = e.changedTouches[0].clientX - sidebarDragStartX;
                const dy = e.changedTouches[0].clientY - sidebarDragStartY;
                if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                    if (dx < 0) { // Dragged left -> close
                        closeSidebar();
                    }
                }
            }, { passive: true });
        }

        let rightSidebarDragStartX = 0;
        let rightSidebarDragStartY = 0;
        if (readingOrderSidebar) {
            readingOrderSidebar.addEventListener('touchstart', (e) => {
                rightSidebarDragStartX = e.touches[0].clientX;
                rightSidebarDragStartY = e.touches[0].clientY;
            }, { passive: true });
            readingOrderSidebar.addEventListener('touchend', (e) => {
                const dx = e.changedTouches[0].clientX - rightSidebarDragStartX;
                const dy = e.changedTouches[0].clientY - rightSidebarDragStartY;
                if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                    if (dx > 0) { // Dragged right -> close
                        closeReadingOrderSidebar();
                    }
                }
            }, { passive: true });
        }

        // Sidebar Navigation
        btnLibrary.addEventListener('click', openSidebar);
        btnCloseSidebar.addEventListener('click', closeSidebar);
        if (btnReadingOrder) btnReadingOrder.addEventListener('click', openReadingOrderSidebar);
        if (btnCloseReadingOrder) btnCloseReadingOrder.addEventListener('click', closeReadingOrderSidebar);
        
        sidebarOverlay.addEventListener('click', () => {
            closeSidebar();
            closeReadingOrderSidebar();
        });

        // Debounce search inputs and lock window scroll on focus
        searchInput.addEventListener('focus', () => {
            window.scrollTo(0, 0);
        });
        searchInput.addEventListener('input', debounce((e) => {
            renderMangaList(e.target.value);
        }, 250));



        if (searchReadingOrderInput) {
            const resultsContainer = document.getElementById('search-reading-order-results');
            
            searchReadingOrderInput.addEventListener('focus', () => {
                window.scrollTo(0, 0);
            });
            
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

        // Editable input indicator
        currentPageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                currentPageInput.blur();
            }
        });

        currentPageInput.addEventListener('input', () => {
            const len = currentPageInput.value.length || 1;
            currentPageInput.style.setProperty('width', `calc(${len}ch + 20px)`, 'important');
        });

        currentPageInput.addEventListener('change', () => {
            const total = activeManga ? activeManga.pages.length : 3;
            let target = parseInt(currentPageInput.value);
            if (isNaN(target) || target < 1) target = 1;
            if (target > total) target = total;
            turnToPage(target - 1);
        });

        // Theme Toggle
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

        const btnExitReader = document.getElementById('btn-exit-reader');
        if (btnExitReader) {
            btnExitReader.addEventListener('click', () => {
                exitReader();
            });
        }

        const siteLogo = document.getElementById('site-logo');
        if (siteLogo) {
            siteLogo.addEventListener('click', () => {
                exitReader();
            });
        }

        // Menu Dropdown Toggles & Click Helpers
        const btnMenu = document.getElementById('btn-menu');
        const menuDropdown = document.getElementById('menu-dropdown');
        if (btnMenu && menuDropdown) {
            btnMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                menuDropdown.classList.toggle('hidden');
            });

            // Auto close menu dropdown when clicking any of its items
            menuDropdown.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', () => {
                    menuDropdown.classList.add('hidden');
                });
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!menuDropdown.classList.contains('hidden') && !menuDropdown.contains(e.target) && e.target !== btnMenu) {
                    menuDropdown.classList.add('hidden');
                }
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
                    if (activeManga) {
                        checkAndApplyMarquee();
                    }
                });
            });
        }



        // Guide details panel
        // Guide details panel -> Changed to Reading Order Sidebar trigger (Issue #12)
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

        // Listen to URL hash change for routing
        window.addEventListener('hashchange', () => {
            const route = parseURLHash();
            if (route) {
                if (activeManga && activeManga.folder === route.manga.folder) {
                    if (currentPageIndex !== route.pageIndex) {
                        turnToPage(route.pageIndex);
                    }
                } else {
                    loadManga(route.manga, route.pageIndex);
                }
            } else {
                if (window.location.hash === '' && activeManga) {
                    exitReader();
                }
            }
        });

        // Prevent Safari scroll chaining on boundary lists
        preventScrollChaining(mangaListContainer);
        preventScrollChaining(readingOrderList);

        const infoBody = document.querySelector('.info-panel-body');
        if (infoBody) {
            preventScrollChaining(infoBody);
        }
    }

    function openSidebar() {
        librarySidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.classList.add('sidebar-open');
    }

    function closeSidebar() {
        librarySidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    }

    function openReadingOrderSidebar() {
        closeSidebar();
        if (readingOrderSidebar) {
            readingOrderSidebar.classList.add('active');
        }
        sidebarOverlay.classList.add('active');
        document.body.classList.add('sidebar-open');
        try {
            localStorage.setItem('readingOrderOpen', 'true');
        } catch (e) {
            console.warn('Error saving readingOrderOpen:', e);
        }
        if (searchReadingOrderInput) {
            searchReadingOrderInput.value = '';
        }
        renderReadingOrderTimeline();
    }

    function closeReadingOrderSidebar() {
        if (readingOrderSidebar) {
            readingOrderSidebar.classList.remove('active');
        }
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        try {
            localStorage.setItem('readingOrderOpen', 'false');
        } catch (e) {
            console.warn('Error saving readingOrderOpen:', e);
        }
    }



    function updateThemeUI() {
        if (!btnTheme) return;
        const isLight = document.body.classList.contains('light-mode');
        const icon = btnTheme.querySelector('i');
        const tr = i18n[currentLang];
        if (icon) {
            icon.className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
        btnTheme.title = isLight ? tr.themeDark : tr.themeLight;
        btnTheme.setAttribute('aria-label', isLight ? tr.themeDark : tr.themeLight);
        
        // Also update dropdown labels & icons
        const menuThemeText = document.getElementById('lbl-menu-theme');
        if (menuThemeText) {
            menuThemeText.textContent = isLight ? tr.themeDark : tr.themeLight;
        }
        
        // Remove existing theme-color meta tags to force iOS Safari to repaint status bar and address bar
        document.querySelectorAll('meta[name="theme-color"]').forEach(el => el.remove());
        
        // Create and append a brand-new theme-color meta tag
        const themeColorMeta = document.createElement('meta');
        themeColorMeta.setAttribute('name', 'theme-color');
        themeColorMeta.setAttribute('content', isLight ? '#f4ecd8' : '#151413');
        document.head.appendChild(themeColorMeta);
    }

    function showLoading(show) {
        if (show) {
            loadingOverlay.classList.remove('hidden');
        } else {
            loadingOverlay.classList.add('hidden');
        }
    }

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

    function getActiveMangaGuideOrder() {
        if (!activeManga) return null;
        
        const currentPageIdx = currentPageIndex;
        
        if (activeManga.folder === "The Lost Adventures & Team Avatar Tales") {
            const chapters = mangaChapters["The Lost Adventures & Team Avatar Tales"];
            const chapter = chapters.find(c => currentPageIdx >= c.start && currentPageIdx <= c.end);
            if (chapter) return chapter.order;
        } else if (activeManga.folder === "Patterns in Time") {
            const chapters = mangaChapters["Patterns in Time"];
            const chapter = chapters.find(c => currentPageIdx >= c.start && currentPageIdx <= c.end);
            if (chapter) return chapter.order;
        }
        
        // Handle multi-part manga groups
        if (activeManga.parts && activeManga.parts.length > 1) {
            let pageOffset = 0;
            for (let i = 0; i < activeManga.parts.length; i++) {
                const part = activeManga.parts[i];
                const partLength = part.pages.length;
                if (currentPageIdx >= pageOffset && currentPageIdx < pageOffset + partLength) {
                    const norm = normalizeTitle(part.folder);
                    const order = normalizedMappings[norm];
                    if (order) return order;
                    
                    const guideItem = findGuideItem(part.folder);
                    if (guideItem) return guideItem.order;
                }
                pageOffset += partLength;
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
        
        parts.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));
        
        if (parts.length <= 1) return cleanRaw(baseTitle);
        
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

    function preventScrollChaining(element) {
        if (!element) return;
        element.addEventListener('touchstart', () => {
            const top = element.scrollTop;
            const totalScroll = element.scrollHeight;
            const currentScroll = top + element.clientHeight;

            if (top === 0) {
                element.scrollTop = 1;
            } else if (currentScroll === totalScroll) {
                element.scrollTop = top - 1;
            }
        }, { passive: true });
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