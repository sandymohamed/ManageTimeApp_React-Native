# How to Sign and Install APK

## Problem
Your `app-release-unsigned.apk` cannot be installed because:
1. **Android requires ALL APKs to be signed** before installation
2. The APK is unsigned (as the filename indicates)
3. You need a keystore file to sign the APK

## Solution Options

### Option 1: Create Release Keystore and Rebuild (Recommended)

This will create a properly signed APK that can be installed.

#### Step 1: Create the Release Keystore

Run this command in the `android/app` directory:

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000 -storepass Sandy@123 -keypass Sandy@123
```

**Important details from gradle.properties:**
- Keystore file: `my-release-key.keystore` (must be in `android/app/`)
- Alias: `my-key-alias`
- Store password: `Sandy@123`
- Key password: `Sandy@123`

The command will ask for your name, organization, etc. You can fill in anything or press Enter for defaults.

#### Step 2: Build Signed APK

```bash
cd android
./gradlew assembleRelease
```

This will create: `android/app/build/outputs/apk/release/app-release.apk`

**This APK will be SIGNED and can be installed!**

---

### Option 2: Sign the Existing Unsigned APK

If you want to use the existing unsigned APK:

#### Step 1: Create Keystore (if you don't have it)

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000 -storepass Sandy@123 -keypass Sandy@123
```

#### Step 2: Sign the APK using jarsigner

```bash
cd android/app/build/outputs/apk/release
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore ../../../my-release-key.keystore -storepass Sandy@123 -keypass Sandy@123 app-release-unsigned.apk my-key-alias
```

#### Step 3: Verify the APK is signed

```bash
jarsigner -verify -verbose -certs app-release-unsigned.apk
```

#### Step 4: Align the APK (optional but recommended)

```bash
zipalign -v 4 app-release-unsigned.apk app-release-signed.apk
```

Now you can install `app-release-signed.apk`!

---

### Option 3: Build Debug APK (For Testing Only)

If you just want to test quickly without signing:

```bash
cd android
./gradlew assembleDebug
```

This creates: `android/app/build/outputs/apk/debug/app-debug.apk`

**Note:** This uses the debug keystore and is only for testing. You'll need to uninstall any release version first.

---

## Important Notes

### Can't Update Existing App?

If you're trying to **update** an existing app on your phone:

1. **You MUST use the SAME keystore** that was used to sign the original app
2. If you don't have the original keystore, you **cannot update** - you must:
   - Uninstall the old app first
   - Install the new app with the new keystore
3. **Android prevents updates** if the signing keys don't match (security feature)

### Finding Your Original Keystore

If you previously installed the app and want to update it:
- Check if you have a backup of the original keystore
- Look for `my-release-key.keystore` in your project or backup
- Check your computer's backup/cloud storage

### First Time Installation

If this is your first time installing this app:
- Any keystore will work
- Use Option 1 above to create and use a keystore

---

## Quick Commands Summary

```bash
# 1. Navigate to android/app
cd android/app

# 2. Create keystore (one time only - KEEP THIS FILE SAFE!)
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000 -storepass Sandy@123 -keypass Sandy@123

# 3. Build signed release APK
cd ..
./gradlew assembleRelease

# 4. Install APK
adb install app/build/outputs/apk/release/app-release.apk
```

---

## Troubleshooting

### "App not installed as package appears to be invalid"

- The APK is unsigned or corrupted
- Solution: Use Option 1 or 2 to properly sign it

### "App not installed as the package conflicts with an existing package"

- You're trying to update but using a different keystore
- Solution: Uninstall the old app first, OR use the original keystore

### "Permission denied" when running keytool

- On Windows, you might need Administrator privileges
- Solution: Run command prompt as Administrator

---

## Keystore File Security

**IMPORTANT:** Once you create `my-release-key.keystore`:
- ✅ Keep it safe and backed up
- ✅ Never commit it to git (should be in .gitignore)
- ✅ Use the same keystore for all future updates
- ❌ Don't lose it - you can't update your app without it!
