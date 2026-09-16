@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js 22 o superior desde https://nodejs.org/
  pause
  exit /b 1
)
start "" "http://localhost:8080"
node scripts\serve-playable.mjs
pause
