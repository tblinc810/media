@echo off
title tblinc Media - Windows 11 Installer
echo ==============================================
echo        tblinc Media - Windows 11 Setup
echo ==============================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] Node.js not detected!
    echo Please download and install Node.js from https://nodejs.org/ (version 18 or higher).
    pause
    exit /b 1
)

echo [*] Node.js detected:
node -v
echo.

echo [*] Installing dependencies...
call npm install

echo [*] Building project...
call npm run build
call npm run electron:prep

echo.
echo ==============================================
echo  Installation Complete!
echo  Double-click start.bat to launch the app!
echo ==============================================
pause
