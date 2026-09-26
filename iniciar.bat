@echo off
cd /d "%~dp0"
echo Gym Control - servidor local
echo Abri http://localhost:8000/index.html en el navegador.
echo Manten esta ventana abierta. Para detener: Ctrl+C.
where py >nul 2>nul
if %errorlevel% equ 0 (
  py -m http.server 8000 --bind 127.0.0.1
  goto :fin
)
where python >nul 2>nul
if %errorlevel% equ 0 (
  python -m http.server 8000 --bind 127.0.0.1
  goto :fin
)
echo No se encontro Python. Usa Live Server en Visual Studio Code
echo o ejecuta el servidor HTTP con tu instalacion de Python.
:fin
pause
