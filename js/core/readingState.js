/**
 * ReadingState Module
 * Manages local storage progress persistence, theme, and language configuration.
 */

export const ReadingState = {
    getLang() {
        try {
            return localStorage.getItem('lang') || 'tr';
        } catch (e) {
            console.warn('Error reading lang from localStorage:', e);
            return 'tr';
        }
    },
    
    setLang(lang) {
        const validLangs = ['tr', 'en'];
        const validatedLang = validLangs.includes(lang) ? lang : 'tr';
        try {
            localStorage.setItem('lang', validatedLang);
        } catch (e) {
            console.warn('Error saving lang to localStorage:', e);
        }
    },
    
    getTheme() {
        try {
            return localStorage.getItem('theme') || 'dark';
        } catch (e) {
            console.warn('Error reading theme from localStorage:', e);
            return 'dark';
        }
    },
    
    setTheme(theme) {
        const validThemes = ['dark', 'light'];
        const validatedTheme = validThemes.includes(theme) ? theme : 'dark';
        try {
            localStorage.setItem('theme', validatedTheme);
        } catch (e) {
            console.warn('Error saving theme to localStorage:', e);
        }
    },
    
    saveProgress(folder, pageIdx) {
        try {
            const history = JSON.parse(localStorage.getItem('manga_reader_history') || '{}');
            history[folder] = pageIdx;
            localStorage.setItem('manga_reader_history', JSON.stringify(history));
            localStorage.setItem('last_read_folder', folder);
            
            // Update URL hash for sharing / deep linking
            window.location.hash = `#/${encodeURIComponent(folder)}/${pageIdx}`;
        } catch (e) {
            console.warn('Error saving reading history:', e);
        }
    },
    
    getProgress(folder) {
        try {
            const history = JSON.parse(localStorage.getItem('manga_reader_history') || '{}');
            if (history[folder] !== undefined) {
                const val = parseInt(history[folder], 10);
                return isNaN(val) ? 0 : val;
            }
        } catch (e) {
            console.warn('Error reading reading history:', e);
        }
        return null;
    }
};
