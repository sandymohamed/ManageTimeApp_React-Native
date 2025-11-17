const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apkPath = path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');

if (!fs.existsSync(apkPath)) {
  console.error('❌ APK not found at:', apkPath);
  console.error('💡 Run "npm run build:apk" first to build the APK.');
  process.exit(1);
}

console.log('📦 Installing APK:', apkPath);
try {
  execSync(`adb install -r "${apkPath}"`, { stdio: 'inherit' });
  console.log('✅ APK installed successfully!');
} catch (error) {
  console.error('❌ Failed to install APK');
  process.exit(1);
}

