@echo off
REM One-Click VPS Deployment Script
REM Double-click this file to deploy the signup fix to your VPS

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║          VPS SIGNUP FIX - ONE-CLICK DEPLOYMENT                ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Target VPS: 72.61.115.49
echo.
echo Press ENTER to start deployment (or CTRL+C to cancel)...
pause > nul

powershell.exe -ExecutionPolicy Bypass -File "%~dp0DEPLOY_VPS_SIGNUP_FIX.ps1"

echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo Deployment script finished!
echo Check the output above for any errors.
echo.
pause
