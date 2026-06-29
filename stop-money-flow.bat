@echo off
title Money Flow - Stop Seguro

echo ==============================
echo Desligando Money Flow...
echo ==============================

cd /d "%~dp0"

echo.
echo [1/2] Procurando servidores Next.js nas portas 3000 e 3001...

for %%P in (3000 3001) do (
    for /f "tokens=5" %%A in ('netstat -ano ^| findstr ":%%P" ^| findstr "LISTENING"') do (
        echo.
        echo Encontrado processo usando a porta %%P. PID: %%A
        choice /C SN /M "Deseja encerrar esse processo?"
        if errorlevel 2 (
            echo Mantendo processo da porta %%P ativo.
        ) else (
            taskkill /F /PID %%A
        )
    )
)

echo.
echo [2/2] Parando containers Docker do Money Flow...
docker compose down

echo.
echo ==============================
echo Money Flow desligado com seguranca.
echo Banco parado SEM apagar dados.
echo ==============================

pause