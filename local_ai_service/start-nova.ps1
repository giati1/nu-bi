$ErrorActionPreference = "Stop"

$ServiceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$OllamaExe = "C:\Users\cedri_vq8ow\AppData\Local\Programs\Ollama\ollama.exe"
$CloudflaredExe = "C:\WINDOWS\cloudflared.exe"
$TunnelConfig = "C:\Users\cedri_vq8ow\.cloudflared\config.yml"
$TunnelId = "919069ce-03e2-42b7-8984-52f415479a16"

$env:OLLAMA_BASE_URL = "http://127.0.0.1:11434"
$env:OLLAMA_MODEL = "llama3.2:latest"
$env:NUBI_API_BASE_URL = "https://nu-bi.com"
$env:LOCAL_AGENT_SECRET = "ce7becd13e98e2c0b75aeb19843fa971a0bdbf1cec1a29eea433e7444f81da96"

# 1. Ensure Ollama is running
if (-not (Get-Process -Name "ollama" -ErrorAction SilentlyContinue)) {
    Write-Host "[Nova] Starting Ollama server..."
    Start-Process -FilePath $OllamaExe -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
} else {
    Write-Host "[Nova] Ollama server is already running."
}

# 2. Ensure Cloudflared Tunnel is running for nova.thetechova.com -> 127.0.0.1:8090
if (-not (Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue)) {
    Write-Host "[Nova] Starting Cloudflare Tunnel ($TunnelId -> https://nova.thetechova.com)..."
    Start-Process -FilePath $CloudflaredExe -ArgumentList "tunnel", "--config", $TunnelConfig, "run", $TunnelId -WindowStyle Hidden
    Start-Sleep -Seconds 3
} else {
    Write-Host "[Nova] Cloudflare Tunnel is already running."
}

# 3. Start the FastAPI Multiplexer on port 8090
Write-Host "[Nova] Starting Local Persona Multiplexer on http://127.0.0.1:8090 ..."
Set-Location $ServiceDir
python -m uvicorn multiplexer:app --host 127.0.0.1 --port 8090
