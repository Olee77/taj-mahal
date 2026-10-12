@echo off
title GitHub Push - Taj Mahal App
echo ========================================================
echo        TAJ MAHAL WIRD ZU GITHUB HOCHGELADEN
echo ========================================================
echo.
cd /d "%~dp0"

git remote get-url origin >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Noch kein Remote Repository verknuepft.
    echo Standard-Repository: https://github.com/Olee77/Taj-Mahal.git
    echo.
    set /p REPO_URL="GitHub Repository URL eingeben [Enter fuer https://github.com/Olee77/Taj-Mahal.git]: "
    if "%REPO_URL%"=="" set REPO_URL=https://github.com/Olee77/Taj-Mahal.git
    git remote add origin %REPO_URL%
)

echo Ziel-Repository:
git remote get-url origin
echo.
git add .
git commit -m "Update Taj Mahal Web Game" >nul 2>&1
echo Pushe zu GitHub...
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  [ERFOLG] Das Projekt ist jetzt auf GitHub!
    echo  Du kannst es jetzt auf render.com verknuepfen!
    echo ========================================================
) else (
    echo ========================================================
    echo  [HINWEIS] Bitte oben die Meldung beachten.
    echo  Hast du das Repository auf GitHub bereits erstellt?
    echo ========================================================
)
echo.
pause
