Write-Host "Fixing all remaining services..." -ForegroundColor Green

# Fix csproj files with wrong paths
$csprojFiles = @(
    "src\EncounterService\EncounterService.csproj",
    "src\InsuranceService\InsuranceService.csproj",
    "src\AnalyticsService\AnalyticsService.csproj"
)

foreach ($file in $csprojFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace '\\.\\.\\\\Shared\.Common\\\\', '..\Shared\Common\'
        $content = $content -replace '\\.\\.\\\\Shared\.EventBus\\\\', '..\Shared\EventBus\'
        Set-Content $file $content
        Write-Host "Fixed csproj: $file" -ForegroundColor Cyan
    }
}

# Fix BillingService specific issues
$billingFiles = Get-ChildItem -Path "src\BillingService" -Filter "*.cs" -Recurse | Where-Object { $_.Name -notmatch 'AssemblyInfo|GlobalUsings' }
foreach ($file in $billingFiles) {
    $content = Get-Content $file.FullName -Raw
    $changed = $false
    
    if ($content -match 'using Shared\.Common;' -and $content -notmatch 'using Shared\.Common\.Models;') {
        $content = $content -replace 'using Shared\.Common;', 'using Shared.Common.Models;'
        $changed = $true
    }
    
    if ($content -match 'using Shared\.EventBus\.Implementations;') {
        $content = $content -replace 'using Shared\.EventBus\.Implementations;', ''
        $changed = $true
    }
    
    if ($content -match 'using Shared\.Common\.Repositories;') {
        $content = $content -replace 'using Shared\.Common\.Repositories;', 'using Shared.Common.Repositories;'
        $changed = $true
    }
    
    if ($changed) {
        Set-Content $file.FullName $content
        Write-Host "Fixed: $($file.Name)" -ForegroundColor Yellow
    }
}

Write-Host "`nAll fixes applied!" -ForegroundColor Green
