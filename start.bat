@echo off
chcp 65001 > nul
echo ========================================================
echo  Trendyol Akilli Fiyatlandirma ve Buybox Radari
echo ========================================================
echo.
echo [1/2] FastAPI Backend Baslatiliyor (Port: 8000)...
start "Trendyol Backend API" cmd /k "cd /d %~dp0backend && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] React Frontend Baslatiliyor (Port: 3000)...
start "Trendyol Frontend Dashboard" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo  Sistem Basariyla Baslatildi!
echo  - Web Paneli: http://localhost:3000
echo  - Backend API & Swagger: http://127.0.0.1:8000/docs
echo ========================================================
pause
