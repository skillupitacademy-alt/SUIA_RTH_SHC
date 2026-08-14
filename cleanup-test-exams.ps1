#!/usr/bin/env pwsh
# Script to delete test exams from yesterday and today (IST timezone)

$ErrorActionPreference = "Stop"

Write-Host "=" -ForegroundColor Cyan
Write-Host "🧹 Exam Cleanup Script - Yesterday & Today (IST)" -ForegroundColor Cyan
Write-Host "=" -ForegroundColor Cyan
Write-Host ""

# Database connection string (from .env.local)
$DATABASE_URL = "postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr.ap-southeast-1.aws.neon.tech/quiz_platform_prod?sslmode=require&channel_binding=require"

# Calculate IST dates (UTC+5:30)
$IST_OFFSET = [TimeSpan]::FromHours(5.5)
$NOW_IST = [DateTime]::UtcNow.Add($IST_OFFSET)
$TODAY_IST_START = $NOW_IST.Date
$YESTERDAY_IST_START = $TODAY_IST_START.AddDays(-1)

Write-Host "📅 Current IST Time: $($NOW_IST.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Yellow
Write-Host "📅 Yesterday IST: $($YESTERDAY_IST_START.ToString('yyyy-MM-dd'))" -ForegroundColor Yellow
Write-Host "📅 Today IST: $($TODAY_IST_START.ToString('yyyy-MM-dd'))" -ForegroundColor Yellow
Write-Host ""

# Convert to UTC for database query
$YESTERDAY_UTC = $YESTERDAY_IST_START.Subtract($IST_OFFSET)
$TOMORROW_UTC = $TODAY_IST_START.AddDays(1).Subtract($IST_OFFSET)

Write-Host "🔍 Querying database for exams created between:" -ForegroundColor Cyan
Write-Host "   UTC: $($YESTERDAY_UTC.ToString('yyyy-MM-dd HH:mm:ss')) to $($TOMORROW_UTC.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
Write-Host ""

# First, count the exams to be deleted
$COUNT_SQL = @"
SELECT COUNT(*) as count
FROM exams
WHERE created_at >= '$($YESTERDAY_UTC.ToString('yyyy-MM-dd HH:mm:ss'))'
  AND created_at < '$($TOMORROW_UTC.ToString('yyyy-MM-dd HH:mm:ss'))';
"@

Write-Host "🔢 Counting exams to be deleted..." -ForegroundColor Yellow

try {
    $countResult = psql "$DATABASE_URL" -t -c "$COUNT_SQL" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to connect to database" -ForegroundColor Red
        Write-Host $countResult -ForegroundColor Red
        exit 1
    }
    
    $examCount = [int]($countResult -replace "\s", "")
    
    Write-Host "📊 Found $examCount exam(s) to delete" -ForegroundColor Yellow
    Write-Host ""
    
    if ($examCount -eq 0) {
        Write-Host "✅ No exams found for yesterday and today (IST). Nothing to delete." -ForegroundColor Green
        exit 0
    }
    
    # Show sample of exams to be deleted
    $SAMPLE_SQL = @"
SELECT 
    id,
    user_id,
    status,
    TO_CHAR(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI:SS') as created_at_ist,
    total_score
FROM exams
WHERE created_at >= '$($YESTERDAY_UTC.ToString('yyyy-MM-dd HH:mm:ss'))'
  AND created_at < '$($TOMORROW_UTC.ToString('yyyy-MM-dd HH:mm:ss'))'
LIMIT 10;
"@

    Write-Host "📋 Sample of exams to be deleted (max 10):" -ForegroundColor Cyan
    psql "$DATABASE_URL" -c "$SAMPLE_SQL" 2>&1 | Write-Host
    Write-Host ""
    
    # Confirmation
    Write-Host "⚠️  WARNING: This will DELETE $examCount exam(s) and all related data!" -ForegroundColor Red
    Write-Host "   - Exam questions will be deleted" -ForegroundColor Red
    Write-Host "   - Exam results will be deleted" -ForegroundColor Red
    Write-Host "   - This action CANNOT be undone!" -ForegroundColor Red
    Write-Host ""
    
    $confirmation = Read-Host "Type 'DELETE' (all caps) to confirm deletion"
    
    if ($confirmation -ne "DELETE") {
        Write-Host "❌ Deletion cancelled. No data was deleted." -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host ""
    Write-Host "🗑️  Starting deletion process..." -ForegroundColor Yellow
    Write-Host ""
    
    # Delete in transaction with cascade
    $DELETE_SQL = @"
BEGIN;

-- Delete related exam questions first
DELETE FROM exam_questions
WHERE exam_id IN (
    SELECT id FROM exams
    WHERE created_at >= '$($YESTERDAY_UTC.ToString('yyyy-MM-dd HH:mm:ss'))'
      AND created_at < '$($TOMORROW_UTC.ToString('yyyy-MM-dd HH:mm:ss'))'
);

-- Delete results by dimension
DELETE FROM results_by_dimension
WHERE exam_id IN (
    SELECT id FROM exams
    WHERE created_at >= '$($YESTERDAY_UTC.ToString('yyyy-MM-dd HH:mm:ss'))'
      AND created_at < '$($TOMORROW_UTC.ToString('yyyy-MM-dd HH:mm:ss'))'
);

-- Delete idempotency keys
DELETE FROM idempotency_keys
WHERE exam_id IN (
    SELECT id FROM exams
    WHERE created_at >= '$($YESTERDAY_UTC.ToString('yyyy-MM-dd HH:mm:ss'))'
      AND created_at < '$($TOMORROW_UTC.ToString('yyyy-MM-dd HH:mm:ss'))'
);

-- Finally delete exams
DELETE FROM exams
WHERE created_at >= '$($YESTERDAY_UTC.ToString('yyyy-MM-dd HH:mm:ss'))'
  AND created_at < '$($TOMORROW_UTC.ToString('yyyy-MM-dd HH:mm:ss'))';

COMMIT;
"@

    psql "$DATABASE_URL" -c "$DELETE_SQL" 2>&1 | Write-Host
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Successfully deleted $examCount exam(s) and all related data!" -ForegroundColor Green
        Write-Host ""
        
        # Verify deletion
        $verifyResult = psql "$DATABASE_URL" -t -c "$COUNT_SQL" 2>&1
        $remainingCount = [int]($verifyResult -replace '\s', '')
        
        if ($remainingCount -eq 0) {
            Write-Host "✅ Verification: All target exams deleted successfully" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Warning: $remainingCount exam(s) still remain" -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "❌ Deletion failed. Database may have rolled back the transaction." -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Cleanup completed!" -ForegroundColor Green
