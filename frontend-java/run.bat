@echo off
echo ===================================================
echo   Menjalankan Gemini Chatbot - Java Client
echo ===================================================

where javac >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Compiler Java (javac) tidak ditemukan di PATH.
    echo Silakan install JDK 11 atau lebih baru dari https://adoptium.net/
    pause
    exit /b 1
)

echo Mengompilasi source code Java...
if not exist "out" mkdir out
javac -encoding UTF-8 -d out src\*.java
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Kompilasi gagal.
    pause
    exit /b 1
)

echo Menjalankan aplikasi Desktop...
java -cp out Main
pause
