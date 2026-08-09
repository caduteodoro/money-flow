@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Money Flow - Stop Seguro

cd /d "%~dp0"

echo ==============================
echo Desligando Money Flow...
echo ==============================

echo.
echo [1/3] Localizando o servidor na porta 3000...
set "APP_PID="
for /f "tokens=5" %%A in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do set "APP_PID=%%A"

if not defined APP_PID (
    echo Nenhum servidor esta ouvindo na porta 3000.
    goto :stop_database
)

echo Processo encontrado: PID !APP_PID!.
echo Confirmando que a resposta pertence ao Money Flow...
curl.exe -fsS --max-time 5 "http://127.0.0.1:3000/" 2>nul | findstr /I /C:"Money Flow" /C:"GPS financeiro" >nul
if errorlevel 1 (
    echo AVISO: Nao foi possivel confirmar a identidade do processo da porta 3000.
    echo O PID !APP_PID! sera preservado. Encerre-o manualmente se necessario.
    goto :stop_database
)

echo.
echo [2/3] Encerrando somente o servidor confirmado do Money Flow...
taskkill /FI "WINDOWTITLE eq Money Flow - Dev Server*" /T /F >nul 2>&1

timeout /t 1 /nobreak >nul
netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if not errorlevel 1 (
    taskkill /PID !APP_PID! /T /F >nul 2>&1
)

timeout /t 1 /nobreak >nul
netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if not errorlevel 1 (
    echo AVISO: A porta 3000 continua ativa. Nenhum outro processo sera encerrado.
) else (
    echo Servidor Money Flow encerrado.
)

:stop_database
echo.
echo [3/3] Parando o PostgreSQL deste projeto...
docker compose stop postgres
if errorlevel 1 (
    echo AVISO: Nao foi possivel parar o PostgreSQL. Verifique o Docker Desktop.
    set "STOP_FAILED=1"
) else (
    echo PostgreSQL parado sem excluir container, rede ou volume.
)

echo.
echo ==============================
if defined STOP_FAILED (
    echo Money Flow foi desligado parcialmente.
) else (
    echo Money Flow foi desligado.
)
echo Nenhum volume ou banco de teste foi removido.
echo ==============================
pause

if defined STOP_FAILED exit /b 1
exit /b 0
