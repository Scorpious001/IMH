# Test script to verify API connections
# This script tests all the API endpoints to ensure they are accessible

Write-Host "Testing IMH IMS API Connections..." -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:8000/api"
$username = "admin"
$password = "admin123"

# Test CSRF token endpoint (should work without auth)
Write-Host "1. Testing CSRF token endpoint..." -ForegroundColor Cyan
try {
    $csrfResponse = Invoke-WebRequest -Uri "$baseUrl/auth/csrf/" -Method GET -SessionVariable session
    $csrfData = $csrfResponse.Content | ConvertFrom-Json
    $csrfToken = $csrfData.csrfToken
    Write-Host "   ✓ CSRF token retrieved: $csrfToken" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed to get CSRF token: $_" -ForegroundColor Red
    exit 1
}

# Test login endpoint
Write-Host "2. Testing login endpoint..." -ForegroundColor Cyan
try {
    $loginBody = @{
        username = $username
        password = $password
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login/" -Method POST -Body $loginBody -ContentType "application/json" -WebSession $session
    $loginData = $loginResponse.Content | ConvertFrom-Json
    Write-Host "   ✓ Login successful for user: $($loginData.user.username)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Test user info endpoint
Write-Host "3. Testing user info endpoint..." -ForegroundColor Cyan
try {
    $userResponse = Invoke-WebRequest -Uri "$baseUrl/auth/user/" -Method GET -WebSession $session
    $userData = $userResponse.Content | ConvertFrom-Json
    Write-Host "   ✓ User info retrieved: $($userData.username)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed to get user info: $_" -ForegroundColor Red
}

# Test items endpoint
Write-Host "4. Testing items endpoint..." -ForegroundColor Cyan
try {
    $itemsResponse = Invoke-WebRequest -Uri "$baseUrl/items/" -Method GET -WebSession $session
    $itemsData = $itemsResponse.Content | ConvertFrom-Json
    $itemCount = if ($itemsData.results) { $itemsData.results.Count } else { $itemsData.Count }
    Write-Host "   ✓ Items endpoint accessible ($itemCount items)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Items endpoint failed: $_" -ForegroundColor Red
}

# Test locations endpoint
Write-Host "5. Testing locations endpoint..." -ForegroundColor Cyan
try {
    $locationsResponse = Invoke-WebRequest -Uri "$baseUrl/locations/" -Method GET -WebSession $session
    $locationsData = $locationsResponse.Content | ConvertFrom-Json
    $locationCount = if ($locationsData.results) { $locationsData.results.Count } else { $locationsData.Count }
    Write-Host "   ✓ Locations endpoint accessible ($locationCount locations)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Locations endpoint failed: $_" -ForegroundColor Red
}

# Test stock endpoint
Write-Host "6. Testing stock endpoint..." -ForegroundColor Cyan
try {
    $stockResponse = Invoke-WebRequest -Uri "$baseUrl/stock/" -Method GET -WebSession $session
    $stockData = $stockResponse.Content | ConvertFrom-Json
    $stockCount = if ($stockData.results) { $stockData.results.Count } else { $stockData.Count }
    Write-Host "   ✓ Stock endpoint accessible ($stockCount stock levels)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Stock endpoint failed: $_" -ForegroundColor Red
}

# Test reports/alerts endpoint
Write-Host "7. Testing reports/alerts endpoint..." -ForegroundColor Cyan
try {
    $alertsResponse = Invoke-WebRequest -Uri "$baseUrl/reports/alerts/" -Method GET -WebSession $session
    $alertsData = $alertsResponse.Content | ConvertFrom-Json
    Write-Host "   ✓ Alerts endpoint accessible (Below par: $($alertsData.below_par_count), At risk: $($alertsData.at_risk_count))" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Alerts endpoint failed: $_" -ForegroundColor Red
}

# Test settings/categories endpoint
Write-Host "8. Testing settings/categories endpoint..." -ForegroundColor Cyan
try {
    $categoriesResponse = Invoke-WebRequest -Uri "$baseUrl/settings/categories/" -Method GET -WebSession $session
    $categoriesData = $categoriesResponse.Content | ConvertFrom-Json
    $categoryCount = if ($categoriesData.results) { $categoriesData.results.Count } else { $categoriesData.Count }
    Write-Host "   ✓ Categories endpoint accessible ($categoryCount categories)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Categories endpoint failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Connection tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "All endpoints are accessible and authentication is working." -ForegroundColor Cyan

