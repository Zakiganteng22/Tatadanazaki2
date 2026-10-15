@echo off
title TataDana Online Public Tunnel
echo ============================================================
echo   TataDana - Online Public Access (Cloudflare Tunnel)
echo ============================================================
if not exist "%~dp0cloudflared.exe" (
    echo Mengunduh cloudflared.exe secara otomatis...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe', '%~dp0cloudflared.exe')"
)
echo Menghubungkan localhost:3000 ke internet publik...
echo Link publik HTTPS akan muncul di bawah ini.
echo.
"%~dp0cloudflared.exe" tunnel --url http://localhost:3000
pause
