const fs = require('fs');
const path = require('path');

// Helper function to pad numbers to 2 digits
const pad = (num) => String(num).padStart(2, '0');

// Get current local date and time
const now = new Date();
const year = now.getFullYear();
const month = pad(now.getMonth() + 1);
const day = pad(now.getDate());
const hours = pad(now.getHours());
const minutes = pad(now.getMinutes());
const timestamp = `${year}-${month}-${day}_${hours}-${minutes}`;

const backupDirName = `backup_${timestamp}`;
const backupParentDir = path.join(__dirname, 'backup');
const targetBackupDir = path.join(backupParentDir, backupDirName);

console.log('===================================================');
console.log('            MANGAFLIP BACKUP UTILITY               ');
console.log('===================================================');
console.log(`Starting backup process...`);
console.log(`Target folder: backup/${backupDirName}`);

// Create backup parent dir if it doesn't exist
if (!fs.existsSync(backupParentDir)) {
    fs.mkdirSync(backupParentDir);
    console.log(`Created 'backup/' folder.`);
}

// Create target backup directory
if (!fs.existsSync(targetBackupDir)) {
    fs.mkdirSync(targetBackupDir);
    console.log(`Created folder: ${backupDirName}`);
}

const filesToBackup = [
    'index.html',
    'mobile.html',
    'sw.js',
    'manifest.json',
    'firebase.json',
    '.firebaserc',
    'package.json',
    'sitemap.xml',
    'robots.txt',
    'logo.svg',
    'bump_version.js',
    'generate_pages.js',
    'deploy.bat',
    'watch.bat',
    'watch.ps1',
    'mangas.json'
];

const dirsToBackup = [
    'css',
    'js'
];

// Recursive directory copy helper
function copyDirRecursive(src, dest) {
    if (!fs.existsSync(src)) {
        console.warn(`Warning: Source directory not found: ${src}`);
        return;
    }
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Copy individual files
let fileCount = 0;
filesToBackup.forEach(file => {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(targetBackupDir, file);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`- Copied file: ${file}`);
        fileCount++;
    } else {
        console.warn(`- Skipping file (not found): ${file}`);
    }
});

// Copy directories
let dirCount = 0;
dirsToBackup.forEach(dir => {
    const srcPath = path.join(__dirname, dir);
    const destPath = path.join(targetBackupDir, dir);
    if (fs.existsSync(srcPath)) {
        copyDirRecursive(srcPath, destPath);
        console.log(`- Copied directory: ${dir}/`);
        dirCount++;
    } else {
        console.warn(`- Skipping directory (not found): ${dir}/`);
    }
});

console.log('---------------------------------------------------');
console.log(`Backup completed successfully!`);
console.log(`Copied ${fileCount} files and ${dirCount} directories.`);
console.log(`Saved at: ${targetBackupDir}`);
console.log('===================================================');
