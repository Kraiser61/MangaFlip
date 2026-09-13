/**
 * ReadingGuideLoader Module
 * Handles loading, caching, and merging consecutive watch steps for reading guides.
 */

export const ReadingGuideLoader = {
    /**
     * Merges consecutive TV show watch steps into a single chronological step to save UI space.
     * @param {Array} guideList - Raw guide items
     * @returns {Array} - Merged list
     */
    mergeConsecutiveWatchSteps(guideList) {
        if (!guideList || guideList.length === 0) return [];
        const merged = [];
        let currentWatch = null;

        for (const item of guideList) {
            const isWatch = item.title.toLowerCase().includes('izle') || 
                            item.title.toLowerCase().includes('watch') ||
                            item.title.toLowerCase().includes('i\u0307zle') ||
                            item.title.toLowerCase().includes('dizi');

            if (isWatch) {
                if (!currentWatch) {
                    currentWatch = { ...item };
                } else {
                    let cleanPart = item.title.replace(/^(Watch Series:|Dizi İzle:|Watch:|İzle:|Dizi:)\s*/i, '').trim();
                    const isTr = item.title.toLowerCase().includes('izle') || item.title.toLowerCase().includes('dizi') || item.title.toLowerCase().includes('i\u0307zle');
                    const separator = isTr ? " ve " : " & ";
                    
                    let prefixMatch1 = currentWatch.title.match(/^(Watch Series:|Dizi İzle:|Watch:|İzle:|Dizi:)\s*(Season\s+\d+|[0-9]+\.\s*Sezon)\s*,\s*/i);
                    let prefixMatch2 = item.title.match(/^(Watch Series:|Dizi İzle:|Watch:|İzle:|Dizi:)\s*(Season\s+\d+|[0-9]+\.\s*Sezon)\s*,\s*/i);
                    
                    if (prefixMatch1 && prefixMatch2 && prefixMatch1[2].toLowerCase() === prefixMatch2[2].toLowerCase()) {
                        const seasonRegex = new RegExp(`^(${prefixMatch2[2]}\\s*,\\s*|${prefixMatch2[2]}\\s*-\\s*)`, 'i');
                        cleanPart = cleanPart.replace(seasonRegex, '').trim();
                    }
                    
                    currentWatch.title = currentWatch.title.replace(/\.$/, '') + separator + cleanPart;
                    currentWatch.exact_reading_point = item.exact_reading_point;
                    
                    if (item.specific_period && item.specific_period !== "-" && item.specific_period !== currentWatch.specific_period) {
                        if (currentWatch.specific_period && currentWatch.specific_period !== "-") {
                            currentWatch.specific_period += " " + item.specific_period;
                        } else {
                            currentWatch.specific_period = item.specific_period;
                        }
                    }
                }
            } else {
                if (currentWatch) {
                    merged.push(currentWatch);
                    currentWatch = null;
                }
                merged.push(item);
            }
        }
        if (currentWatch) {
            merged.push(currentWatch);
        }
        return merged;
    },

    /**
     * Loads the reading guide for a specific language and loads the English version as a fallback/global mapping reference.
     * @param {string} lang - 'tr' or 'en'
     * @returns {Promise<{currentGuide: Array, enGuide: Array}>}
     */
    async load(lang) {
        let currentGuide = [];
        let enGuide = [];
        try {
            const guideFile = lang === 'tr' ? 'js/reading_guide_tr.json' : 'js/reading_guide.json';
            const guideResponse = await fetch(guideFile + '?t=' + Date.now());
            if (guideResponse.ok) {
                const data = await guideResponse.json();
                currentGuide = this.mergeConsecutiveWatchSteps(data);
            }
            const enResponse = await fetch('js/reading_guide.json?t=' + Date.now());
            if (enResponse.ok) {
                const dataEn = await enResponse.json();
                enGuide = this.mergeConsecutiveWatchSteps(dataEn);
            }
        } catch (e) {
            console.warn('Reading guide could not be loaded via loader.', e);
        }
        return { currentGuide, enGuide };
    }
};
