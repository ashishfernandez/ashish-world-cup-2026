# One-time deploy: Supabase login, link, Stripe Edge Functions
# Run from repo root: powershell -ExecutionPolicy Bypass -File .\scripts\deploy-stripe-functions.ps1

$ErrorActionPreference = "Stop"
$ProjectRef = "ovfmmszhlkedypfveyxj"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

function Test-SupabaseLogin {
    $out = supabase projects list 2>&1 | Out-String
    return ($LASTEXITCODE -eq 0) -and ($out -notmatch "Access token not provided")
}

Write-Host ""
Write-Host "=== Stripe Edge Functions deploy ===" -ForegroundColor Cyan
Write-Host "Project: $ProjectRef"
Write-Host ""

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Supabase CLI..." -ForegroundColor Yellow
    npm install -g supabase
}

if (-not (Test-SupabaseLogin)) {
    Write-Host "Supabase CLI is not logged in." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Open: https://supabase.com/dashboard/account/tokens"
    Write-Host "2. Generate a token (starts with sbp_)"
    Write-Host "3. Paste it below and press Enter"
    Write-Host ""
    Start-Process "https://supabase.com/dashboard/account/tokens"
    $token = Read-Host "Access token"
    if ([string]::IsNullOrWhiteSpace($token)) {
        throw "No token entered."
    }
    supabase login --token $token.Trim()
    if (-not (Test-SupabaseLogin)) {
        throw "Login failed. Check your token and try again."
    }
    Write-Host "Logged in." -ForegroundColor Green
}

Write-Host "Linking project..." -ForegroundColor Cyan
supabase link --project-ref $ProjectRef

$functions = @(
    "create-checkout-session",
    "verify-checkout-session",
    "stripe-webhook"
)

foreach ($name in $functions) {
    Write-Host "Deploying $name ..." -ForegroundColor Cyan
    supabase functions deploy $name --no-verify-jwt
    if ($LASTEXITCODE -ne 0) {
        throw "Deploy failed for $name"
    }
}

Write-Host ""
Write-Host "Done. All three functions deployed." -ForegroundColor Green
Write-Host "Test: submit picks on the site, pay with 4242 4242 4242 4242 (Stripe test mode)."
Write-Host ""
