# Complete Data Clearing Script for Testing OAuth
# Run this before testing Microsoft login to ensure NO old session data remains

Write-Host "🧹 Clearing ALL WildWatch & Browser Data..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Clear app data (includes AsyncStorage, files, cache, databases)
Write-Host "1. Clearing WildWatch app data..." -ForegroundColor Yellow
Write-Host "   - Auth tokens (authToken, pendingOAuthToken)" -ForegroundColor Gray
Write-Host "   - OAuth user data" -ForegroundColor Gray
Write-Host "   - Form data (reports, location, evidence)" -ForegroundColor Gray
Write-Host "   - Chat messages" -ForegroundColor Gray
Write-Host "   - All app cache" -ForegroundColor Gray
adb shell pm clear com.wildwatch.app 2>&1 | Out-Null
Write-Host "   ✅ WildWatch app data cleared" -ForegroundColor Green
Write-Host ""

# Clear browser cache (where Microsoft OAuth runs)
Write-Host "2. Clearing browser cache..." -ForegroundColor Yellow
Write-Host "   - Microsoft cookies & sessions" -ForegroundColor Gray
Write-Host "   - Cached OAuth tokens" -ForegroundColor Gray
Write-Host "   - Auto-login data" -ForegroundColor Gray
adb shell pm clear com.android.chrome 2>&1 | Out-Null
adb shell pm clear com.android.browser 2>&1 | Out-Null
Write-Host "   ✅ Browser cache cleared" -ForegroundColor Green
Write-Host ""

# Clear WebView cache (used by expo-web-browser)
Write-Host "3. Clearing WebView cache..." -ForegroundColor Yellow
Write-Host "   - WebView sessions" -ForegroundColor Gray
Write-Host "   - OAuth browser data" -ForegroundColor Gray
adb shell pm clear com.google.android.webview 2>&1 | Out-Null
Write-Host "   ✅ WebView cache cleared" -ForegroundColor Green
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🎉 All data cleared! Ready for clean test." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What should happen now:" -ForegroundColor Yellow
Write-Host "1. Open WildWatch app" -ForegroundColor White
Write-Host "2. Click 'Sign in with Microsoft'" -ForegroundColor White
Write-Host "3. Browser opens and ASKS you to select/login account" -ForegroundColor White
Write-Host "4. Select YOUR account" -ForegroundColor White
Write-Host "5. Returns to app → Terms screen" -ForegroundColor White
Write-Host "6. Accept terms → Setup screen (if new user)" -ForegroundColor White
Write-Host "7. Complete setup → Logged in as YOUR account ✅" -ForegroundColor White
Write-Host ""
Write-Host "🚨 If it auto-selects wrong account, the issue is on the BACKEND!" -ForegroundColor Red
Write-Host ""

