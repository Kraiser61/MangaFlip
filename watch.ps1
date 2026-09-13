# Dosyalari izlemek icin klasor yolu
$folder = $PSScriptRoot

# Firebase yollarini ekle
$env:PATH += ";C:\Program Files\nodejs;$env:APPDATA\npm"

# PowerShell ve isletim sistemi seviyesinde calisma dizinini guncelle
Set-Location -Path $folder
[System.IO.Directory]::SetCurrentDirectory($folder)

Clear-Host
Write-Host "===================================================" -ForegroundColor Green
Write-Host "     MANGAFLIP OTO-DEPLOY IZLEYICI BASLATILDI" -ForegroundColor Green
Write-Host "     Dosyalardaki degisiklikler izleniyor..." -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host "Durdurmak icin bu pencerede Ctrl+C tuslarina basin." -ForegroundColor Gray
Write-Host ""

# Dosyalarin degisme zamanlarini alan yardimci fonksiyon
function Get-FilesState {
    Get-ChildItem -Path $folder -Recurse -File | 
        Where-Object { 
            $_.Name -match '\.(html|css|js|json)$' -and 
            $_.FullName -notmatch 'node_modules|\.git|\.firebaserc|firebase\.json|mangas\.json|bump_version\.js|watch\.ps1|watch\.bat' 
        } |
        Select-Object FullName, LastWriteTime
}

# Ilk durumu kaydet
$lastState = Get-FilesState

while ($true) {
    # 2 saniyede bir kontrol et
    Start-Sleep -Seconds 2
    $currentState = Get-FilesState
    
    $changed = $false
    foreach ($file in $currentState) {
        $oldFile = $lastState | Where-Object { $_.FullName -eq $file.FullName }
        if (-not $oldFile -or $oldFile.LastWriteTime -ne $file.LastWriteTime) {
            $changed = $true
            Write-Host "[Mdf] Degisiklik Tespit Edildi: $($file.Name) ($($file.LastWriteTime.ToString('HH:mm:ss')))" -ForegroundColor Yellow
            break
        }
    }
    
    if ($changed) {
        Write-Host "[Deploy] Manga listesi ve surum guncellenip Firebase'e otomatik yukleniyor (manga-reader-kraiser)..." -ForegroundColor Cyan
        Set-Location -Path $folder
        [System.IO.Directory]::SetCurrentDirectory($folder)
        
        # 1. Once manga listesini guncelle
        node generate_pages.js
        
        # 2. Sonra surum numarasini arttir (Cache-Busting)
        node bump_version.js
        
        # 3. Sonra Firebase'e gonder
        firebase deploy --project manga-reader-kraiser
        
        # 4. Dongusel tetiklemeyi onlemek icin son durumu guncelle
        $lastState = Get-FilesState
        Write-Host "[Izle] Degisiklikler yeniden izleniyor..." -ForegroundColor Green
        Write-Host ""
    }
}
