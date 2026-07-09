@echo off
echo.
echo ============================================
echo   YieldSmart — Starting Application
echo ============================================
echo.

echo [1/2] Starting FastAPI backend on port 8000...
start "YieldSmart Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak > nul

echo [2/2] Starting Next.js frontend on port 3000...
start "YieldSmart Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo   App will open at: http://localhost:3000
echo ============================================
echo.

timeout /t 5 /nobreak > nul
start http://localhost:3000
