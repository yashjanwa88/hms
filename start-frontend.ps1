# Start Frontend

Write-Host "Installing dependencies..." -ForegroundColor Cyan
cd "D:\Digital Hospital Infrastructure Company\DigitalHospital\frontend"
npm install

Write-Host "`nStarting frontend on http://localhost:5173..." -ForegroundColor Green
npm run dev
