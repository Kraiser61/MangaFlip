/**
 * EventManager Module
 * Handles event listener attachment and cleanup to prevent memory leaks,
 * specifically for reader-specific window/document events.
 */

export const EventManager = {
    readerListeners: [],
    
    /**
     * Adds an event listener that is scoped to the active reader lifecycle.
     * @param {EventTarget} target - The DOM element or window/document target.
     * @param {string} type - The event name (e.g. 'keydown', 'wheel').
     * @param {Function} handler - The listener callback function.
     * @param {Object|boolean} options - Event listener options.
     */
    addReaderEvent(target, type, handler, options = {}) {
        target.addEventListener(type, handler, options);
        this.readerListeners.push({ target, type, handler, options });
    },
    
    /**
     * Clears all registered reader-specific event listeners at once.
     * Should be called when exiting reader mode (returning to homepage).
     */
    clearReaderEvents() {
        this.readerListeners.forEach(({ target, type, handler, options }) => {
            try {
                target.removeEventListener(type, handler, options);
            } catch (e) {
                console.warn('Failed to remove event listener:', type, e);
            }
        });
        this.readerListeners = [];
    }
};
