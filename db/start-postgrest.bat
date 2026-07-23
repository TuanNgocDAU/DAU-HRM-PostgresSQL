@echo off
REM ==========================================================================
REM  Khoi dong PostgREST phuc vu database "qlns" cho app HRM
REM  --------------------------------------------------------------------------
REM  - Dat file postgrest.exe cung thu muc nay (hoac them vao PATH).
REM  - Cua so nay phai giu MO trong luc dung app o che do local.
REM ==========================================================================
cd /d "%~dp0"

REM Them thu muc bin cua PostgreSQL vao PATH de tim thay libpq.dll
REM (doi 18 thanh phien ban PostgreSQL cua ban neu khac).
set "PATH=C:\Program Files\PostgreSQL\18\bin;%PATH%"

echo ============================================================
echo   PostgREST - dang phuc vu database qlns tai cong 3001
echo   Giu cua so nay mo. Dong lai = ngat ket noi DB.
echo ============================================================

if exist "postgrest.exe" (
    postgrest.exe postgrest.conf
) else (
    REM Neu postgrest.exe da co trong PATH:
    postgrest postgrest.conf
)

echo.
echo PostgREST da dung. Nhan phim bat ky de dong...
pause >nul
