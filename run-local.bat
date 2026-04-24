@echo off
REM Avvia il dev server Vite e apre il browser su http://localhost:5173
cd /d "%~dp0"
call npm run dev -- --open
