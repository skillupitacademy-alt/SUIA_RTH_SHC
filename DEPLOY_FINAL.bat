@echo off
REM Final Deployment Script - Copy and Deploy
REM This script will prompt for SSH passphrase when needed

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          VPS SIGNUP FIX DEPLOYMENT                        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Target: 72.61.115.49
echo.
echo NOTE: When prompted for passphrase, enter: hello
echo.
pause

echo.
echo [1/2] Copying file to VPS...
echo.
scp -i suia_rth packages\auth\src\middleware\cookie.middleware.ts root@72.61.115.49:/opt/platform/apps/quiz-platform/packages/auth/src/middleware/cookie.middleware.ts

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to copy file to VPS
    echo Please check:
    echo   1. SSH key passphrase is correct: hello
    echo   2. VPS is accessible
    pause
    exit /b 1
)

echo.
echo ✓ File copied successfully!
echo.
echo [2/2] Building and deploying on VPS...
echo.

ssh -i suia_rth root@72.61.115.49 "cd /opt/platform/apps/quiz-platform && ./infra/hostinger/scripts/build.sh && ./infra/hostinger/scripts/deploy.sh && ./infra/hostinger/scripts/health.sh"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Deployment failed on VPS
    echo Please check the error messages above
    pause
    exit /b 1
)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              ✓ DEPLOYMENT COMPLETE!                       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Next steps:
echo 1. Clear browser cache and cookies
echo 2. Test: https://user.realtutorialhub.com/signup
echo 3. Test: https://user.skillupitacademy.com/signup
echo.
pause
