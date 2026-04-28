@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   DEPLOYMENT PREREQUISITES CHECKER
echo ========================================
echo.

set ISSUES_FOUND=0

REM ============================================
REM 1. Check Python
REM ============================================

echo 1. Checking Python...

where python >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
    echo    [OK] !PYTHON_VERSION!
) else (
    where python3 >nul 2>&1
    if %errorlevel% equ 0 (
        for /f "tokens=*" %%i in ('python3 --version 2^>^&1') do set PYTHON_VERSION=%%i
        echo    [OK] !PYTHON_VERSION!
    ) else (
        echo    [X] Python is NOT installed
        echo.
        echo    Installation options:
        echo.
        echo    Option 1: Microsoft Store ^(Recommended^)
        echo    ----------------------------------------
        echo    1. Open Microsoft Store
        echo    2. Search for 'Python 3.12'
        echo    3. Click 'Get' or 'Install'
        echo.
        echo    Option 2: Official Python Installer
        echo    ----------------------------------------
        echo    1. Visit: https://www.python.org/downloads/
        echo    2. Download the latest Python 3.x installer
        echo    3. Run the installer
        echo    4. CHECK 'Add Python to PATH'
        echo    5. Click 'Install Now'
        echo.
        set /a ISSUES_FOUND+=1
    )
)

echo.

REM ============================================
REM 2. Check Google Cloud SDK
REM ============================================

echo 2. Checking Google Cloud SDK...

where gcloud >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('gcloud version --format^="value(version)" 2^>nul') do set GCLOUD_VERSION=%%i
    echo    [OK] gcloud !GCLOUD_VERSION!
    
    REM Check authentication
    for /f "tokens=*" %%i in ('gcloud config get-value account 2^>nul') do set ACCOUNT=%%i
    if not "!ACCOUNT!"=="" (
        echo    [OK] Authenticated as: !ACCOUNT!
    ) else (
        echo    [!] Not authenticated
        echo    Run: gcloud auth login
        set /a ISSUES_FOUND+=1
    )
    
    REM Check project
    for /f "tokens=*" %%i in ('gcloud config get-value project 2^>nul') do set PROJECT=%%i
    if not "!PROJECT!"=="" (
        echo    [OK] Project: !PROJECT!
    ) else (
        echo    [!] No project set
        echo    Run: gcloud config set project YOUR_PROJECT_ID
        set /a ISSUES_FOUND+=1
    )
) else (
    echo    [X] Google Cloud SDK is NOT installed
    echo.
    echo    Installation:
    echo    1. Visit: https://cloud.google.com/sdk/docs/install
    echo    2. Download the installer for Windows
    echo    3. Run the installer
    echo    4. Follow the setup wizard
    echo    5. Restart your terminal
    echo.
    set /a ISSUES_FOUND+=1
)

echo.

REM ============================================
REM 3. Check Docker
REM ============================================

echo 3. Checking Docker...

where docker >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('docker --version 2^>^&1') do set DOCKER_VERSION=%%i
    echo    [OK] !DOCKER_VERSION!
    
    REM Check if Docker daemon is running
    docker info >nul 2>&1
    if %errorlevel% equ 0 (
        echo    [OK] Docker daemon is running
    ) else (
        echo    [!] Docker daemon is NOT running
        echo    Start Docker Desktop
        set /a ISSUES_FOUND+=1
    )
) else (
    echo    [X] Docker is NOT installed
    echo.
    echo    Installation:
    echo    1. Visit: https://www.docker.com/products/docker-desktop
    echo    2. Download Docker Desktop for Windows
    echo    3. Run the installer
    echo    4. Restart your computer if prompted
    echo    5. Start Docker Desktop
    echo.
    set /a ISSUES_FOUND+=1
)

echo.

REM ============================================
REM 4. Check Node.js and pnpm
REM ============================================

echo 4. Checking Node.js and pnpm...

where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version 2^>^&1') do set NODE_VERSION=%%i
    echo    [OK] Node.js !NODE_VERSION!
) else (
    echo    [X] Node.js is NOT installed
    set /a ISSUES_FOUND+=1
)

where pnpm >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('pnpm --version 2^>^&1') do set PNPM_VERSION=%%i
    echo    [OK] pnpm !PNPM_VERSION!
) else (
    echo    [!] pnpm is NOT installed
    echo    Run: npm install -g pnpm
    set /a ISSUES_FOUND+=1
)

echo.

REM ============================================
REM 5. Check Git
REM ============================================

echo 5. Checking Git...

where git >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('git --version 2^>^&1') do set GIT_VERSION=%%i
    echo    [OK] !GIT_VERSION!
) else (
    echo    [X] Git is NOT installed
    set /a ISSUES_FOUND+=1
)

echo.

REM ============================================
REM SUMMARY
REM ============================================

echo ========================================
echo.

if !ISSUES_FOUND! equ 0 (
    echo [OK] All prerequisites are met!
    echo     You can run: .\scripts\deploy-direct.sh
    echo.
    exit /b 0
) else (
    echo [X] Found !ISSUES_FOUND! issue^(s^)
    echo.
    echo Please fix the issues above before deploying.
    echo.
    echo Quick fixes:
    echo   - Python: Install from Microsoft Store or python.org
    echo   - gcloud: Install from cloud.google.com/sdk
    echo   - Docker: Install Docker Desktop
    echo.
    echo After fixing, run this script again to verify.
    echo.
    exit /b 1
)
