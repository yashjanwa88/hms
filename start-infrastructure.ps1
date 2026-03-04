# Start Redis and RabbitMQ using Docker

Write-Host "Starting Redis and RabbitMQ..." -ForegroundColor Cyan

# Start Redis
Write-Host "`nStarting Redis on port 6379..." -ForegroundColor Yellow
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Start RabbitMQ
Write-Host "Starting RabbitMQ on ports 5672 and 15672..." -ForegroundColor Yellow
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=admin -e RABBITMQ_DEFAULT_PASS=admin rabbitmq:3-management-alpine

Write-Host "`n✓ Redis and RabbitMQ started!" -ForegroundColor Green
Write-Host "Redis: localhost:6379" -ForegroundColor Gray
Write-Host "RabbitMQ: localhost:5672" -ForegroundColor Gray
Write-Host "RabbitMQ Management: http://localhost:15672 (admin/admin)" -ForegroundColor Gray
