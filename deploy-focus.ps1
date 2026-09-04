$ErrorActionPreference = "Stop"

$appPath = "C:\focus"
$branch = "main"
$processName = "focus"
$healthUrl = "http://localhost:3000/api/setup"
$dataDir = Join-Path $appPath "data"
$dbPath = Join-Path $dataDir "focus.db"
$backupDir = Join-Path $dataDir "backups"
$maxBackups = 20

function Write-Step {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Write-Ok {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

function Backup-Database {
    Ensure-Directory -Path $dataDir
    Ensure-Directory -Path $backupDir

    if (-not (Test-Path -LiteralPath $dbPath)) {
        Write-Host "Banco ainda nao existe. Pulando backup." -ForegroundColor DarkYellow
        return
    }

    $data = Get-Date -Format "yyyyMMdd_HHmmss"
    $destino = Join-Path $backupDir "focus_$data.db"

    Write-Step "Gerando backup do banco em: $destino"
    Copy-Item -LiteralPath $dbPath -Destination $destino -Force

    $backups = Get-ChildItem -LiteralPath $backupDir -File -Filter "focus_*.db" | Sort-Object LastWriteTime -Descending
    if ($backups.Count -gt $maxBackups) {
        $backups | Select-Object -Skip $maxBackups | ForEach-Object {
            Remove-Item -LiteralPath $_.FullName -Force
        }
    }
}

function Stop-Focus {
    Write-Step "Parando Focus antes do backup..."
    Set-Location $appPath
    pm2 stop $processName
}

function Update-Code {
    Write-Step "Atualizando codigo do GitHub..."
    Set-Location $appPath
    git checkout $branch
    git pull origin $branch
}

function Install-Dependencies {
    Write-Step "Instalando dependencias Node..."
    Set-Location $appPath
    npm install --omit=dev
}

function Restart-Focus {
    Write-Step "Reiniciando Focus no PM2..."
    Set-Location $appPath

    $exists = $false
    try {
        pm2 describe $processName | Out-Null
        if ($LASTEXITCODE -eq 0) { $exists = $true }
    } catch {
        $exists = $false
    }

    if ($exists) {
        pm2 restart $processName --update-env
    } else {
        pm2 start server.js --name $processName
    }

    pm2 save
}

function Test-Focus {
    Write-Step "Testando Focus em $healthUrl..."
    Start-Sleep -Seconds 2
    $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -ne 200) {
        throw "Focus respondeu com status inesperado: $($response.StatusCode)"
    }
}

Write-Host "Iniciando deploy Focus..." -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath $appPath)) {
    throw "Pasta do Focus nao encontrada: $appPath"
}

Stop-Focus
Backup-Database
Update-Code
Install-Dependencies
Restart-Focus
Test-Focus

Write-Ok "Deploy Focus finalizado com sucesso!"
