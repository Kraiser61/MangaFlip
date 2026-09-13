/**
 * ImagePreloader Module
 * Asynchronously downloads manga images to trigger browser/service worker cache preloading,
 * without storing heavy Image objects in memory to prevent RAM leaks.
 */

export const ImagePreloader = {
    activeLoads: new Map(),
    imageCache: new Map(),
    maxCacheSize: 60, // Keep last 60 pages in memory to cover buffer range
    
    /**
     * Checks if the image is already preloaded and cached.
     * @param {string} url 
     * @returns {boolean}
     */
    isCached(url) {
        return this.imageCache.has(url);
    },
    
    /**
     * Preloads a single image URL and caches it at the browser/service worker level.
     * @param {string} url - Absolute or relative image resource URL.
     * @returns {Promise<string>} - Resolves with the image URL when done, or rejects on error.
     */
    preload(url) {
        if (this.imageCache.has(url)) {
            return Promise.resolve(url);
        }
        if (this.activeLoads.has(url)) {
            return this.activeLoads.get(url);
        }
        
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.activeLoads.delete(url);
                // Keep cache size bounded
                if (this.imageCache.size >= this.maxCacheSize) {
                    const oldestKey = this.imageCache.keys().next().value;
                    this.imageCache.delete(oldestKey);
                }
                this.imageCache.set(url, img);
                resolve(url);
            };
            
            img.onerror = () => {
                this.activeLoads.delete(url);
                reject(new Error(`Failed to load image: ${url}`));
            };
            
            img.src = url;
        });
        
        this.activeLoads.set(url, promise);
        return promise;
    },
    
    /**
     * Preloads a list of image URLs.
     * @param {string[]} urls - Array of image URLs to load in parallel.
     * @returns {Promise<any[]>} - Resolves when all preloads complete (tolerates single errors).
     */
    preloadBatch(urls) {
        const promises = urls.map(url => this.preload(url).catch(err => err));
        return Promise.all(promises);
    }
};
