@echo off
title Buat ZIP Bersih untuk GitHub
echo ============================================================
echo   Membuat file ZIP bersih (tanpa node_modules & .next)
echo ============================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$src = '%~dp0'; ^
   $destZip = Join-Path (Split-Path $src -Parent) 'tatadana-clean-for-github.zip'; ^
   if (Test-Path $destZip) { Remove-Item $destZip -Force }; ^
   $tempDir = Join-Path (Split-Path $src -Parent) 'tatadana_export_temp'; ^
   if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }; ^
   New-Item -ItemType Directory -Path $tempDir | Out-Null; ^
   $exclude = @('node_modules', '.next', '.agents', 'cloudflared.exe', 'tunnel_err.log', 'tunnel_out.log'); ^
   Get-ChildItem -Path $src -Force | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object { ^
       Copy-Item -Path $_.FullName -Destination $tempDir -Recurse -Force ^
   }; ^
   Compress-Archive -Path \"$tempDir\*\" -DestinationPath $destZip; ^
   Remove-Item $tempDir -Recurse -Force; ^
   $size = [math]::Round(((Get-Item $destZip).Length / 1KB), 2); ^
   Write-Host \"BERHASIL! File ZIP siap diupload ke GitHub:\" -ForegroundColor Green; ^
   Write-Host $destZip -ForegroundColor Yellow; ^
   Write-Host \"Ukuran file: $size KB\" -ForegroundColor Cyan;"
echo.
pause
