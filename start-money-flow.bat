@echo off
title Money Flow - Start

echo ==============================
echo Iniciando Money Flow...
echo ==============================

cd /d "%~dp0"

echo.
echo [1/4] Subindo PostgreSQL no Docker...
docker compose up -d postgres

if errorlevel 1 (
    echo.
    echo ERRO: Nao foi possivel subir o PostgreSQL.
    echo Verifique se o Docker Desktop esta aberto.
    pause
    exit /b 1
)

echo.
echo [2/4] Gerando Prisma Client...
call npx prisma generate

if errorlevel 1 (
    echo.
    echo ERRO: Falha ao gerar Prisma Client.
    pause
    exit /b 1
)

echo.
echo [3/4] Verificando status das migrations...
call npx prisma migrate status

echo.
echo [4/4] Iniciando servidor Next.js...
echo.
echo Acesse:
echo http://localhost:3000
echo.
echo Para parar o servidor, use CTRL + C neste terminal.
echo.

call npm run dev

pause