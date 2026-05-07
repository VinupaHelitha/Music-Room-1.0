@echo off
REM Music Room - Quick Start Script for Windows
REM This script sets up and runs the Music Room application

echo.
echo 🎵 Music Room - Quick Start
echo =============================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ %NODE_VERSION% detected
echo.

REM Setup Backend
echo 📦 Setting up Backend...
cd backend

if not exist ".env" (
    copy .env.example .env
    echo 📝 Created .env file - please edit with your API keys
    echo    Important: Set JWT_SECRET to a random string
)

if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)

echo ✅ Backend setup complete
echo.

REM Setup Frontend
echo 📦 Setting up Frontend...
cd ..\frontend

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

echo ✅ Frontend setup complete
echo.

REM Instructions
echo 🚀 Setup complete! To start the application:
echo.
echo   1. Edit backend\.env with your API keys
echo   2. Open two terminals
echo   3. In terminal 1 (from backend folder): npm run dev
echo   4. In terminal 2 (from frontend folder): npm run dev
echo   5. Open http://localhost:3000 in your browser
echo.
echo 📝 For detailed setup instructions, see docs/SETUP.md
echo.
pause
