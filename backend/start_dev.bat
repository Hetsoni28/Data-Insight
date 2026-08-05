@echo off
echo Starting Data Insight Backend in Development Mode...
echo (Excluding logs from file watcher to prevent OTP cache wipe)

:: Run uvicorn with reload excluded for the logs folder and any debug files
uvicorn app.main:app --reload --reload-exclude "logs/*" --reload-exclude "422_debug.log" --reload-exclude "scratch/*"
