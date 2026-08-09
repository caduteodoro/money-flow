@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Money Flow - Start

cd /d "%~dp0"

echo ==============================
echo Iniciando Money Flow...
echo ==============================

echo.
echo [1/7] Validando pre-requisitos...
where docker >nul 2>&1 || goto :docker_missing
where npm >nul 2>&1 || goto :npm_missing

docker info >nul 2>&1 || goto :docker_unavailable

if not exist ".env" goto :env_missing
if not exist "node_modules\next\dist\bin\next" goto :dependencies_missing

echo.
echo [2/7] Verificando a porta 3000...
set "CURRENT_PID="
for /f "tokens=5" %%A in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do set "CURRENT_PID=%%A"

if defined CURRENT_PID (
    curl.exe -fsS --max-time 5 "http://127.0.0.1:3000/" 2>nul | findstr /I /C:"Money Flow" /C:"GPS financeiro" >nul
    if not errorlevel 1 (
        echo Money Flow ja esta ativo em http://localhost:3000 ^(PID !CURRENT_PID!^).
        goto :success
    )

    echo ERRO: A porta 3000 esta ocupada pelo PID !CURRENT_PID!, mas nao foi possivel confirmar que seja o Money Flow.
    echo Nenhum processo foi encerrado.
    goto :failure
)

echo.
echo [3/7] Subindo PostgreSQL no Docker...
docker compose up -d postgres || goto :database_failure

echo.
echo [4/7] Aguardando o PostgreSQL ficar saudavel...
set "DATABASE_HEALTHY="
for /L %%I in (1,1,30) do (
    for /f "usebackq delims=" %%H in (`docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}" money-flow-postgres 2^>nul`) do set "DATABASE_STATUS=%%H"
    if "!DATABASE_STATUS!"=="healthy" (
        set "DATABASE_HEALTHY=1"
        goto :database_ready
    )
    timeout /t 1 /nobreak >nul
)

:database_ready
if not defined DATABASE_HEALTHY goto :database_unhealthy
echo PostgreSQL saudavel.

echo.
echo [5/7] Gerando Prisma Client...
call npx prisma generate || goto :prisma_failure

echo.
echo [6/7] Verificando migrations publicadas...
call npx prisma migrate status || goto :migration_failure

echo.
echo [7/7] Iniciando servidor Next.js...
start "Money Flow - Dev Server" /min cmd.exe /d /k "cd /d ""%~dp0"" && title Money Flow - Dev Server && call npm run dev"

set "APP_READY="
for /L %%I in (1,1,30) do (
    curl.exe -fsS --max-time 2 "http://127.0.0.1:3000/" 2>nul | findstr /I /C:"Money Flow" /C:"GPS financeiro" >nul
    if not errorlevel 1 (
        set "APP_READY=1"
        goto :app_ready
    )
    timeout /t 1 /nobreak >nul
)

:app_ready
if not defined APP_READY goto :app_failure

:success
echo.
echo ==============================
echo Money Flow esta pronto.
echo Acesse http://localhost:3000
echo Use stop-money-flow.bat para desligar.
echo ==============================
pause
exit /b 0

:docker_missing
echo ERRO: Docker nao foi encontrado no PATH.
goto :failure

:npm_missing
echo ERRO: npm nao foi encontrado no PATH.
goto :failure

:docker_unavailable
echo ERRO: Docker Desktop nao esta disponivel.
goto :failure

:env_missing
echo ERRO: O arquivo .env nao existe.
echo Copie .env.example para .env e configure apenas valores locais.
goto :failure

:dependencies_missing
echo ERRO: Dependencias ausentes. Execute npm install antes de iniciar.
goto :failure

:database_failure
echo ERRO: Nao foi possivel iniciar o PostgreSQL do Money Flow.
goto :failure

:database_unhealthy
echo ERRO: O PostgreSQL nao ficou saudavel dentro do tempo esperado.
goto :failure

:prisma_failure
echo ERRO: Falha ao gerar o Prisma Client.
goto :failure

:migration_failure
echo ERRO: O estado das migrations nao esta pronto.
echo Revise o diagnostico acima. Nenhuma migration foi aplicada automaticamente.
goto :failure

:app_failure
echo ERRO: O servidor foi iniciado, mas nao respondeu como Money Flow em 30 segundos.
echo Verifique a janela "Money Flow - Dev Server".
goto :failure

:failure
echo.
echo Money Flow nao foi iniciado completamente.
pause
exit /b 1
