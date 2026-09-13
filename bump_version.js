const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'mobile.html'),
    path.join(__dirname, 'sw.js')
];

// Read index.html to find current version
const indexHtmlPath = filesToUpdate[0];
let indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// Find version string like ?v=1.0.0
const versionRegex = /\?v=(\d+)\.(\d+)\.(\d+)/;
const match = indexHtmlContent.match(versionRegex);

if (!match) {
    console.error('Error: Version pattern not found in index.html');
    process.exit(1);
}

const major = parseInt(match[1], 10);
const minor = parseInt(match[2], 10);
const patch = parseInt(match[3], 10);

const newPatch = patch + 1;
const oldVersion = `${major}.${minor}.${patch}`;
const newVersion = `${major}.${minor}.${newPatch}`;

console.log(`Bumping version from ${oldVersion} to ${newVersion}...`);

for (const file of filesToUpdate) {
    if (!fs.existsSync(file)) {
        console.warn(`Warning: File not found: ${file}`);
        continue;
    }
    let content = fs.readFileSync(file, 'utf8');
    
    let searchStr, replaceStr;
    if (path.basename(file) === 'index.html' || path.basename(file) === 'mobile.html') {
        searchStr = `?v=${oldVersion}`;
        replaceStr = `?v=${newVersion}`;
    } else if (path.basename(file) === 'sw.js') {
        searchStr = `mangaflip-v${oldVersion}`;
        replaceStr = `mangaflip-v${newVersion}`;
    }
    
    if (searchStr && content.includes(searchStr)) {
        content = content.split(searchStr).join(replaceStr);
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${path.basename(file)} successfully.`);
    } else {
        console.log(`No occurrences of ${searchStr} in ${path.basename(file)}.`);
    }
}
