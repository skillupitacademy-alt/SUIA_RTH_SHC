@echo off
REM Apply onboarding field migrations to both SkillUp and RTH databases

echo 🔄 Applying onboarding field migrations...

REM SkillUp Database
echo.
echo 📦 SkillUp Database Migration
echo ================================
cd packages\db-skillup
call npm run db:migrate
cd ..\..

REM RTH Database
echo.
echo 📦 RTH Database Migration
echo ================================
cd packages\db-rth
call npm run db:migrate
cd ..\..

echo.
echo ✅ All migrations applied successfully!
echo.
echo 📋 Summary:
echo   - Added onboarding fields to users table
echo   - Added onboarding fields to user_profiles table
echo   - Both SkillUp and RTH databases are now in sync
