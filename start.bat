@echo off
echo Starting Nudge App...
echo.

:: Kill any existing node processes
taskkill /F /IM node.exe 2>nul

:: Wait a moment
timeout /t 1 /nobreak >nul

:: Start the dev server
npm run dev

:: Keep window open
pause