@echo off

if exist backend\node_modules rmdir /s /q backend\node_modules
if exist frontend\node_modules rmdir /s /q frontend\node_modules
if exist backend\dist rmdir /s /q backend\dist
if exist frontend\dist rmdir /s /q frontend\dist

docker-compose down
docker-compose build
docker-compose up -d