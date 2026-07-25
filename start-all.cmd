@echo off
setlocal

set "ROOT=%~dp0"
set "PG_CTL=C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"
set "NODE_X64=C:\Users\Dhairya\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v26.2.0-win-x64\node.exe"
set "NPM=C:\Program Files\nodejs\npm.cmd"

if not exist "%ROOT%apps\api\.env" (
	if exist "%ROOT%apps\api\.env.example" copy /Y "%ROOT%apps\api\.env.example" "%ROOT%apps\api\.env" >nul
)

if not exist "%ROOT%apps\web\.env.local" (
	if exist "%ROOT%apps\web\.env.example" copy /Y "%ROOT%apps\web\.env.example" "%ROOT%apps\web\.env.local" >nul
)

if /I "%MUFIN_START_ALL_DRY_RUN%"=="1" (
	echo [dry-run] PostgreSQL: %PG_CTL% -D "%ROOT%.pgdata" -l "%ROOT%.pgdata\postgres.log" -o "-p 5432 -h 127.0.0.1" start
	echo [dry-run] Seed: %NODE_X64% "%ROOT%node_modules\tsx\dist\cli.mjs" "%ROOT%apps\api\prisma\seed.ts"
	echo [dry-run] API: %NODE_X64% "%ROOT%node_modules\tsx\dist\cli.mjs" watch src\server.ts
	echo [dry-run] Web: %NPM% --workspace apps/web run dev
	goto :end
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$dataDir = '%ROOT%.pgdata'; $logFile = '%ROOT%.pgdata\postgres.log'; $listening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 5432 }; if ($listening) { Write-Host 'PostgreSQL already listening on 5432'; exit 0 }; $status = & '%PG_CTL%' -D $dataDir status 2>&1; if ($LASTEXITCODE -eq 0) { Write-Host 'PostgreSQL cluster is already running'; exit 0 }; Remove-Item (Join-Path $dataDir 'postmaster.pid') -Force -ErrorAction SilentlyContinue; & '%PG_CTL%' -D $dataDir -l $logFile -o '-p 5432 -h 127.0.0.1' start | Out-Null; if ($LASTEXITCODE -ne 0) { throw 'Failed to start PostgreSQL' }"

"%NODE_X64%" "%ROOT%node_modules\tsx\dist\cli.mjs" "%ROOT%apps\api\prisma\seed.ts"

start "ElitePay API" /D "%ROOT%apps\api" "%NODE_X64%" "%ROOT%node_modules\tsx\dist\cli.mjs" watch src\server.ts
start "ElitePay Web" /D "%ROOT%" "%NPM%" --workspace apps/web run dev

echo Started PostgreSQL if needed, plus API and web servers.
echo Use http://localhost:4000/health and http://localhost:3000

:end
endlocal