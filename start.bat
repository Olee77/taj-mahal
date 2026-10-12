@echo off
title Taj Mahal Game Server
echo ===================================================
echo   Taj Mahal - Reiner Knizia
echo   Lokaler Asymmetrischer Multiplayer-Server
echo ===================================================
echo.
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000/table.html"
node server/index.js
pause
