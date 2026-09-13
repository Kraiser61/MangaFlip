@echo off
set "PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm"

echo ===================================================
echo        MANGAFLIP OTO-DEPLOYER (FIREBASE)
echo ===================================================
echo.
echo 1. Manga sayfalari taranip mangas.json olusturuluyor...
call node generate_pages.js
echo.

echo 2. Surum numarasi yukseltiliyor (Cache-Busting)...
call node bump_version.js
echo.

echo 3. Degisiklikler canliya yukleniyor (Firebase Hosting)...
echo Lutfen bekleyin...
call firebase deploy --project manga-reader-kraiser
echo.

echo ===================================================
echo Yukleme basariyla tamamlandi! Canli siteniz guncellendi.
echo ===================================================
echo.
pause
