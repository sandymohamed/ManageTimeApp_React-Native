# Step-by-Step: Rebuild Signed APK

## Prerequisites
- Windows PowerShell or Command Prompt
- JDK installed (for `keytool` command)
- Android SDK (already have it since you can build)

---

## Step 1: Navigate to Android App Directory

Open PowerShell or Command Prompt and run:

```powershell
cd E:\manage_time_app\ManageTimeApp_React-Native\android\app
```

---

## Step 2: Create the Release Keystore (One-Time Only)

Run this command to create the keystore file:

```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000 -storepass Sandy@123 -keypass Sandy@123
```

**What this does:**
- Creates `my-release-key.keystore` file
- Uses the passwords from your `gradle.properties` file
- Valid for 10,000 days

**When prompted, enter:**
- Your name (or press Enter for default)
- Organizational unit (or press Enter)
- Organization (or press Enter)
- City (or press Enter)
- State (or press Enter)
- Country code (or press Enter)
- Confirm with `yes`

**Important:** After this command completes, you should see `my-release-key.keystore` file created in the `android/app` folder.

---

## Step 3: Navigate to Android Directory

```powershell
cd ..
```

(You should now be in `E:\manage_time_app\ManageTimeApp_React-Native\android`)

---

## Step 4: Clean Previous Build (Optional but Recommended)

```powershell
.\gradlew clean
```

This removes old build files to ensure a fresh build.

---

## Step 5: Build the Signed Release APK

```powershell
.\gradlew assembleRelease
```

**What this does:**
- Builds a release APK
- Signs it with your `my-release-key.keystore`
- Creates: `app/build/outputs/apk/release/app-release.apk`

**Wait for it to complete** - this may take several minutes.

---

## Step 6: Verify the APK was Created

Check if the file exists:

```powershell
Test-Path "app\build\outputs\apk\release\app-release.apk"
```

Should return `True`.

Or navigate to the folder:

```powershell
cd app\build\outputs\apk\release
dir
```

You should see `app-release.apk` (this is your SIGNED APK that can be installed!)

---

## Step 7: Install on Your Phone

### Option A: Using ADB (if phone is connected via USB)

```powershell
adb install app-release.apk
```

### Option B: Copy to Phone Manually

1. Copy `app-release.apk` to your phone (via USB, email, cloud storage, etc.)
2. Open the file on your phone
3. Tap "Install" when prompted
4. If asked about "unknown sources", allow it

---

## Troubleshooting

### If "keytool: command not found"

The `keytool` is part of JDK. Try:

1. Find your JDK installation (usually `C:\Program Files\Java\jdk-xx\bin\`)
2. Use full path:
   ```powershell
   & "C:\Program Files\Java\jdk-17\bin\keytool.exe" -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000 -storepass Sandy@123 -keypass Sandy@123
   ```

### If Build Fails

1. Make sure you're in the `android` directory (not `android\app`)
2. Try `.\gradlew clean` first
3. Check for any error messages

### If APK Still Won't Install

1. Make sure you're using `app-release.apk` (NOT `app-release-unsigned.apk`)
2. Uninstall the old app first if you're updating
3. Check if "Install from unknown sources" is enabled on your phone

---

## Quick Command Summary (Copy-Paste Ready)

```powershell
# Step 1: Go to app directory
cd E:\manage_time_app\ManageTimeApp_React-Native\android\app

# Step 2: Create keystore (one time only)
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000 -storepass Sandy@123 -keypass Sandy@123

# Step 3: Go back to android directory
cd ..

# Step 4: Clean build
.\gradlew clean

# Step 5: Build signed APK
.\gradlew assembleRelease

# Step 6: Find your APK
cd app\build\outputs\apk\release
dir app-release.apk
```

---

## What Happens Behind the Scenes

1. **Keystore Creation**: Creates a digital certificate for signing your app
2. **Build Process**: 
   - Compiles your React Native code
   - Bundles JavaScript
   - Packages assets
   - Signs with your keystore
3. **Output**: A signed APK that Android recognizes as valid

---

## Important Notes

✅ **Keep `my-release-key.keystore` safe!** You'll need it for all future updates.  
✅ **The APK will be SIGNED** and ready to install  
✅ **File location**: `android\app\build\outputs\apk\release\app-release.apk`  
❌ **Don't use `app-release-unsigned.apk`** - that's the old unsigned file
