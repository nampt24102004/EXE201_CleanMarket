$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $projectRoot 'backend'
$frontendDir = Join-Path $projectRoot 'frontend'

if (-not (Test-Path (Join-Path $backendDir '.env'))) {
    throw 'Thiếu backend/.env. Hãy tạo file này từ backend/.env.example và cấu hình MySQL.'
}
if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
    throw 'Thiếu frontend/node_modules. Hãy chạy npm install trong thư mục frontend trước.'
}

$backendCommand = "Set-Location -LiteralPath '$($backendDir.Replace("'", "''"))'; .\mvnw.cmd spring-boot:run"
$frontendCommand = "Set-Location -LiteralPath '$($frontendDir.Replace("'", "''"))'; npm run dev"

Start-Process powershell.exe -ArgumentList '-NoExit', '-Command', $backendCommand | Out-Null
Start-Process powershell.exe -ArgumentList '-NoExit', '-Command', $frontendCommand | Out-Null

Write-Host 'Đã mở backend và frontend trong hai cửa sổ PowerShell.' -ForegroundColor Green
Write-Host 'Frontend: http://localhost:5173'
Write-Host 'Backend:  http://localhost:8080'
Write-Host 'Swagger:  http://localhost:8080/swagger-ui.html'