@echo off

if exist backend\node_modules rmdir /s /q backend\node_modules
if exist frontend\node_modules rmdir /s /q frontend\node_modules
if exist backend\dist rmdir /s /q backend\dist
if exist frontend\dist rmdir /s /q frontend\dist

:: Create the database files if not exist
cd backend
if not exist db (
    mkdir db
)

cd db
if not exist progress-dashboard.db (
    type nul > progress-dashboard.db
    echo done creating backend/db/progress-dashboard.db
)
if not exist history.db (
    type nul > history.db
    echo done creating backend/db/history.db
)

cd ../..

docker-compose down
docker-compose build
docker-compose up -d