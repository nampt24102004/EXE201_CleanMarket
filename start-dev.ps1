$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $projectRoot 'backend'
$frontendDir = Join-Path $projectRoot 'frontend'
$javaHome = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'Machine')

if ([string]::IsNullOrWhiteSpace($javaHome)) {
    $javaHome = $env:JAVA_HOME
}
if ([string]::IsNullOrWhiteSpace($javaHome) -or -not (Test-Path (Join-Path $javaHome 'bin\java.exe'))) {
    throw 'Khong tim thay JDK qua JAVA_HOME. Hay cai JDK 25 va mo lai terminal.'
}

if (-not (Test-Path (Join-Path $backendDir '.env'))) {
    throw 'Thiếu backend/.env. Hãy tạo file này từ backend/.env.example và cấu hình MySQL.'
}
if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
    throw 'Thiếu frontend/node_modules. Hãy chạy npm install trong thư mục frontend trước.'
}

$escapedJavaHome = $javaHome.Replace("'", "''")
$escapedBackendDir = $backendDir.Replace("'", "''")
$escapedFrontendDir = $frontendDir.Replace("'", "''")
$backendCommand = "`$env:JAVA_HOME='$escapedJavaHome'; `$env:Path=(`$env:JAVA_HOME + '\bin;' + `$env:Path); Set-Location -LiteralPath '$escapedBackendDir'; .\mvnw.cmd spring-boot:run"
$frontendCommand = "Set-Location -LiteralPath '$escapedFrontendDir'; npm.cmd run dev"

Start-Process powershell.exe -ArgumentList '-NoExit', '-Command', $backendCommand | Out-Null
Start-Process powershell.exe -ArgumentList '-NoExit', '-Command', $frontendCommand | Out-Null

Write-Host 'Đã mở backend và frontend trong hai cửa sổ PowerShell.' -ForegroundColor Green
Write-Host 'Frontend: http://localhost:5173'
Write-Host 'Backend:  http://localhost:8080'
Write-Host 'Swagger:  http://localhost:8080/swagger-ui.html'
