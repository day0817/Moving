# ==============================================================================
# 物件比較Webアプリ タスクスケジューラ登録スクリプト
# ==============================================================================
# 役割:
#   Windowsタスクスケジューラに「毎週金曜日 20:30」の定期更新タスクを登録します。
#   初回実行日は次回金曜日（今日実行されないように StartBoundary を設定）となります。
# ==============================================================================

$ErrorActionPreference = "Stop"

$taskName = "Moving_Weekly_Property_Update"
$scriptDir = $PSScriptRoot
$scriptPath = Join-Path $scriptDir "run_weekly_update.ps1"

Write-Host "=================================================="
Write-Host "Registering Scheduled Task: $taskName"
Write-Host "Target Script: $scriptPath"

# 次の金曜日 20:30 を計算（今日即時実行されないよう StartBoundary に設定）
$now = Get-Date
$daysUntilFriday = ((5 - [int]$now.DayOfWeek + 7) % 7)
if ($daysUntilFriday -eq 0) {
    # 今日が金曜日の場合は、次回（7日後）の金曜日を初日とする
    $daysUntilFriday = 7
}
$nextFriday = $now.Date.AddDays($daysUntilFriday).AddHours(20).AddMinutes(30)
$startBoundary = $nextFriday.ToString("yyyy-MM-ddTHH:mm:ss")

Write-Host "Next Target Date: $nextFriday (StartBoundary: $startBoundary)"

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

# 毎週金曜 20:30 トリガー
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Friday -At 20:30
$trigger.StartBoundary = $startBoundary

# 設定: PC起動時の未実行キャッチアップ、バッテリー駆動時実行許可、1時間ごと最大3回再試行、最大2時間実行
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Hours 1) `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2)

try {
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
    $taskDef = New-ScheduledTask -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Moving App Weekly Property and Commute Data Auto Update Job"
    Register-ScheduledTask -TaskName $taskName -InputObject $taskDef -Force

    $regTask = Get-ScheduledTask -TaskName $taskName
    $taskInfo = Get-ScheduledTaskInfo -TaskName $taskName

    Write-Host "--------------------------------------------------"
    Write-Host "SUCCESS: Task '$($regTask.TaskName)' successfully registered."
    Write-Host "State       : $($regTask.State)"
    Write-Host "NextRunTime : $($taskInfo.NextRunTime)"
    Write-Host "=================================================="
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    exit 1
}
