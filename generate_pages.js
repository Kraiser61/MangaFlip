const fs = require('fs');
const path = require('path');

const mangasDir = path.join(__dirname, 'mangas');

// Create mangas directory if it doesn't exist
if (!fs.existsSync(mangasDir)) {
    fs.mkdirSync(mangasDir);
    console.log("Created 'mangas/' directory. Please place your manga title folders (e.g., 'mangas/Manga Adı 1/') inside this folder.");
}

const isImage = (file) => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
};

// Natural sort algorithm to sort page_2.jpg before page_10.jpg
const naturalSort = (a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

try {
    const items = fs.readdirSync(mangasDir);
    const mangaList = [];

    items.forEach(item => {
        const itemPath = path.join(mangasDir, item);
        const stat = fs.statSync(itemPath);

        // Process only subdirectories in root of mangas/
        if (stat.isDirectory()) {
            const files = fs.readdirSync(itemPath);
            const images = files.filter(isImage).sort(naturalSort);

            if (images.length > 0) {
                // Flat folder structure: images are directly in mangas/MangaName/
                mangaList.push({
                    title: item,
                    folder: item, // Path: mangas/[folder]/[page.jpg]
                    pages: images
                });
            } else {
                // Nested folder structure: subfolders inside mangas/MangaName/ (e.g., Part 1, Part 2)
                const subItems = files.sort(naturalSort);
                let foundSubimages = false;

                subItems.forEach(subItem => {
                    const subItemPath = path.join(itemPath, subItem);
                    const subStat = fs.statSync(subItemPath);

                    if (subStat.isDirectory()) {
                        const subFiles = fs.readdirSync(subItemPath);
                        const subImages = subFiles.filter(isImage).sort(naturalSort);

                        if (subImages.length > 0) {
                            mangaList.push({
                                title: `${item} - ${subItem}`,
                                folder: `${item}/${subItem}`, // Path: mangas/[folder_name]/[subfolder_name]/[page.jpg]
                                pages: subImages
                            });
                            foundSubimages = true;
                        }
                    }
                });

                if (!foundSubimages) {
                    console.log(`Warning: Folder '${item}' has no image files directly or in subfolders. Skipping.`);
                }
            }
        }
    });

    const chronologicalOrder = [
        "The Lost Adventures & Team Avatar Tales",
        "Katara and the Pirates Silver",
        "The Kyoshi Warriors",
        "Suki, Alone",
        "The Promise",
        "The Search",
        "The Rift",
        "Toph Beifongs Metalbending Academy",
        "Smoke and Shadow",
        "Ashes of the Academy",
        "Azula in the Spirit Temple",
        "North and South",
        "Imbalance",
        "Patterns in Time",
        "The Bounty Hunter and the Tea Brewer",
        "Turf Wars",
        "Ruins of the Empire",
        "The Mystery of Penquan Island"
    ];

    mangaList.sort((a, b) => {
        const folderA = a.folder.split('/')[0];
        const folderB = b.folder.split('/')[0];
        const indexA = chronologicalOrder.indexOf(folderA);
        const indexB = chronologicalOrder.indexOf(folderB);
        
        const valA = indexA === -1 ? 999 : indexA;
        const valB = indexB === -1 ? 999 : indexB;
        
        if (valA !== valB) {
            return valA - valB;
        }
        return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
    });

    fs.writeFileSync(
        path.join(__dirname, 'mangas.json'),
        JSON.stringify(mangaList, null, 2),
        'utf8'
    );

    console.log(`===================================================`);
    console.log(`Scan completed successfully!`);
    console.log(`Found ${mangaList.length} manga libraries in 'mangas/' directory.`);
    mangaList.forEach(m => {
        console.log(`- ${m.title} (${m.pages.length} sayfa)`);
    });
    console.log(`Saved manga library list to mangas.json.`);
    console.log(`===================================================`);
} catch (error) {
    console.error('Error generating mangas.json:', error);
}
