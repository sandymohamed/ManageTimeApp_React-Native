# Clean Android build artifacts including CMake cache
Write-Host "Cleaning Android build artifacts..."

# Remove CMake cache directories
if (Test-Path "app\.cxx") {
    Write-Host "Removing CMake cache..."
    Remove-Item -Recurse -Force "app\.cxx"
}

# Remove autolinking generated files
if (Test-Path "app\build\generated\autolinking") {
    Write-Host "Removing autolinking generated files..."
    Remove-Item -Recurse -Force "app\build\generated\autolinking"
}

# Run Gradle clean
Write-Host "Running Gradle clean..."
./gradlew clean

Write-Host "Clean completed!"

