@echo off
setlocal

cd /d "%~dp0"

echo Project root: %cd%
echo.

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm.cmd was not found in PATH.
  echo Install Node.js or add npm to PATH, then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\.bin\protoc.cmd" (
  echo [INFO] node_modules is missing proto tools. Running npm install first...
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed.
    echo.
    pause
    exit /b 1
  )
)

echo [INFO] Running npm run proto:generate...
call npm.cmd run proto:generate
if errorlevel 1 (
  echo.
  echo [ERROR] proto generation failed.
  echo.
  pause
  exit /b 1
)

echo.
echo [OK] Generated files:
dir /b "assets\scripts\core\network\examples\generated\*.ts"

echo.
pause
