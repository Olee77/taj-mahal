@echo off
setlocal enabledelayedexpansion
title GitHub Push - Taj Mahal App
echo ========================================================
echo        TAJ MAHAL WIRD ZU GITHUB HOCHGELADEN
echo ========================================================
echo.
cd /d "%~dp0"

git remote get-url origin >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Noch kein Remote Repository verknuepft.
    echo Standard-Repository: https://github.com/Olee77/taj-mahal.git
    echo.
    set REPO_URL=https://github.com/Olee77/taj-mahal.git
    set /p USER_INPUT="GitHub Repository URL eingeben [Enter fuer https://github.com/Olee77/taj-mahal.git]: "
    if not "!USER_INPUT!"=="" set REPO_URL=!USER_INPUT!
    git remote add origin !REPO_URL!
)

echo Ziel-Repository:
git remote get-url origin
echo.
git add .
git commit -m "Update Taj Mahal Web Game" >nul 2>&1
echo.
echo Pushe zu GitHub...
echo (Falls ein Browserfenster oder GitHub-Login erscheint, bitte bestaetigen)
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  [ERFOLG] Das Projekt ist jetzt auf GitHub!
    echo  Du kannst es jetzt auf render.com verknuepfen!
    echo ========================================================
) else (
    echo ========================================================
    echo  [HINWEIS] Push fehlgeschlagen.
    echo  Meldung siehe oben.
    echo ========================================================
)
echo.
pause

