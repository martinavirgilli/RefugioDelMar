# Script para configurar el archivo .env en Windows PowerShell

Write-Host "Configurando archivo .env para la API..." -ForegroundColor Green

# Verificar si .env ya existe
if (Test-Path ".env") {
    $response = Read-Host "El archivo .env ya existe. ¿Deseas sobrescribirlo? (s/n)"
    if ($response -ne "s" -and $response -ne "S") {
        Write-Host "Operación cancelada." -ForegroundColor Yellow
        exit
    }
}

# Copiar .env.example a .env
if (Test-Path ".env.example") {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Archivo .env creado desde .env.example" -ForegroundColor Green
} else {
    Write-Host "✗ Error: No se encontró .env.example" -ForegroundColor Red
    exit 1
}

# Generar SECRET_KEY seguro
$secretKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 50 | ForEach-Object {[char]$_})
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 50 | ForEach-Object {[char]$_})

# Reemplazar SECRET_KEY en .env
(Get-Content ".env") -replace "SECRET_KEY=django-insecure-change-this-in-production-use-a-secure-random-key", "SECRET_KEY=$secretKey" | Set-Content ".env"
(Get-Content ".env") -replace "JWT_SECRET_KEY=django-insecure-change-this-in-production-use-a-secure-random-key", "JWT_SECRET_KEY=$jwtSecret" | Set-Content ".env"

Write-Host "✓ SECRET_KEY y JWT_SECRET_KEY generados automáticamente" -ForegroundColor Green
Write-Host ""
Write-Host "¡Configuración completada!" -ForegroundColor Green
Write-Host "Puedes editar el archivo .env si necesitas cambiar otros valores." -ForegroundColor Cyan

