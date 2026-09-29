# Gate H: Direct Navigation API Call
# Calls the navigation API endpoint with proper authentication

$API_BASE = "http://localhost:3000"
$NAVIGATION_ID = "whatisjava"
$SUBTOPIC_ID = "414f63eb-cccf-4bd1-bcc0-b52df69ce499"
$USER_ID = "afc355ca-6bae-4165-89dd-198494a62f85"
$INTERNAL_SECRET = $env:INTERNAL_API_SECRET

$url = "$API_BASE/api/tutorial/ils/navigation/$NAVIGATION_ID?subtopicId=$SUBTOPIC_ID"

Write-Host "=== Gate H: Navigation API Direct Call ===" -ForegroundColor Cyan
Write-Host "URL: $url"
Write-Host ""

$headers = @{
    "X-Brand" = "skillup"
    "X-User-ID" = $USER_ID
    "X-Internal-Secret" = $INTERNAL_SECRET
}

Write-Host "Calling navigation API..." -ForegroundColor Yellow
Write-Host "Check API server terminal for [GATE H FORENSIC] output" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method GET -Headers $headers -ContentType "application/json"
    
    # Find D1 block in response
    $d1Block = $response.data.blocks | Where-Object { $_.blockId -eq "8680bd00-ecfe-4da7-a78f-9b6a0b6a1749" }
    
    if ($d1Block) {
        Write-Host "=== D1 Block in HTTP Response ===" -ForegroundColor Green
        Write-Host "blockId: $($d1Block.blockId)"
        Write-Host "blockVersion: $($d1Block.blockVersion)"
        Write-Host "activeTimeSec: $($d1Block.activeTimeSec)"
        Write-Host "expectedTimeSec: $($d1Block.expectedTimeSec)"
        Write-Host "completedAt: $($d1Block.completedAt)"
        Write-Host "isCompleted: (not in response)"
        Write-Host ""
        
        if ($null -eq $d1Block.completedAt) {
            Write-Host "❌ CASE B: Backend returns completedAt=null" -ForegroundColor Red
            Write-Host "Root cause: API not using Gate H fix" -ForegroundColor Red
        } else {
            Write-Host "✅ CASE A: Backend returns completedAt=$($d1Block.completedAt)" -ForegroundColor Green
            Write-Host "Root cause: Frontend not using completedAt from response" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  D1 block not found in response" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
