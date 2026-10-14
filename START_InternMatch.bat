@echo off
title InternMatch - Local AI Server
cd /d "%~dp0"

echo ==========================================
echo        InternMatch Local AI App
echo ==========================================
echo.

if not exist ".venv\Scripts\python.exe" (
    echo [1/3] Creating Python virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo.
        echo ERROR: Python could not create the virtual environment.
        echo Make sure Python is installed and available as "python".
        pause
        exit /b 1
    )
) else (
    echo [1/3] Virtual environment already exists.
)

call ".venv\Scripts\activate.bat"

echo [2/3] Checking/installing required packages...
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo ERROR: Package installation failed.
    pause
    exit /b 1
)

echo [3/3] Starting InternMatch...
echo.
echo The browser will open automatically.
echo Keep this window open while using InternMatch.
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:5000"
python backend.py

echo.
echo InternMatch has stopped.
pause
