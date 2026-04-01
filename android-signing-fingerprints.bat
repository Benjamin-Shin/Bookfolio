@echo off
setlocal EnableExtensions

REM Android 서명 인증서 디지털 지문 출력 (OAuth / Firebase / Play 연동용)
REM
REM   기본: Android 디버그 keystore (%USERPROFILE%\.android\debug.keystore)
REM   릴리스: Keystore 경로, 별칭, [store 비밀번호] — 비밀번호 생략 시 입력 프롬프트
REM
REM @history
REM - 2026-04-01: 최초 추가 (Bookfolio 모노레포 루트)

title Android signing fingerprints

set "KEYTOOL="
if defined JAVA_HOME if exist "%JAVA_HOME%\bin\keytool.exe" set "KEYTOOL=%JAVA_HOME%\bin\keytool.exe"
if not defined KEYTOOL for /f "delims=" %%i in ('where keytool 2^>nul') do (
  set "KEYTOOL=%%i"
  goto :keytool_ok
)
:keytool_ok
if not defined KEYTOOL (
  echo [오류] keytool.exe 를 찾지 못했습니다. JDK를 설치하고 PATH 또는 JAVA_HOME을 설정하세요.
  exit /b 1
)

if "%~1"=="" goto :use_debug

if "%~2"=="" (
  echo 사용법:
  echo   %~nx0
  echo       ^> Android 디버그 keystore 지문 ^(별칭 androiddebugkey^)
  echo   %~nx0 ^<keystore 경로^> ^<alias^> [keystore 비밀번호]
  echo       ^> 릴리스/업로드 키 등 ^(비밀번호 생략 시 입력 요청^)
  exit /b 1
)

set "KS=%~1"
set "ALIAS=%~2"
if "%~3"=="" (
  set /p "KS_PASS=Keystore 비밀번호: "
) else (
  set "KS_PASS=%~3"
)
goto :run

:use_debug
set "KS=%USERPROFILE%\.android\debug.keystore"
set "ALIAS=androiddebugkey"
set "KS_PASS=android"
echo [정보] 기본 디버그 keystore 사용
echo.

:run
if not exist "%KS%" (
  echo [오류] keystore 파일이 없습니다: %KS%
  exit /b 1
)

echo Keystore: %KS%
echo Alias:    %ALIAS%
echo.
"%KEYTOOL%" -list -v -keystore "%KS%" -alias "%ALIAS%" -storepass "%KS_PASS%"
if errorlevel 1 (
  echo.
  echo [오류] keytool 실패. 경로, 별칭^(alias^), 비밀번호를 확인하세요.
  exit /b 1
)

exit /b 0
