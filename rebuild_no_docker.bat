@echo off

:: Create the database file if not exist
cd backend
if not exist db (
    mkdir db
)

cd db
if not exist progress-dashboard.db (
    type nul > progress-dashboard.db
    echo done creating backend/db/progress-dashboard.db
)

cd ../..

:: Install dependencies
cd backend
cmd /c npm ci
cd ../frontend
cmd /c npm ci
cd ..

:: Build backend (TypeScript)
cd backend
cmd /c npx tsc
cd ..

:: Build frontend (Vite)
cd frontend
cmd /c npm run build
cd ..

:: Start backend
start cmd /k "cd backend && npm run dev"
:: Start frontend
start cmd /k "cd frontend && npm run dev"
