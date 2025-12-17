# Firebase Initialization Fix

## Problem
You're getting this error:
```
Default FirebaseApp is not initialized in this process com.mobile. 
Make sure to call FirebaseApp.initializeApp(Context) first.
```

This happens because `react-native-push-notification` tries to use Firebase Messaging before Firebase is initialized.

## Solution Applied

I've added explicit Firebase initialization in `MainApplication.kt` **before** React Native loads. This ensures Firebase is ready when native modules try to use it.

### File Changed
- `android/app/src/main/java/com/mobile/MainApplication.kt`

### What Was Added
```kotlin
import com.google.firebase.FirebaseApp

override fun onCreate() {
  super.onCreate()
  // Initialize Firebase BEFORE React Native loads
  try {
    if (FirebaseApp.getApps(this).isEmpty()) {
      FirebaseApp.initializeApp(this)
    }
  } catch (e: Exception) {
    // Firebase might already be initialized by google-services plugin
    android.util.Log.w("MainApplication", "Firebase initialization check: ${e.message}")
  }
  loadReactNative(this)
}
```

## Why This Works

1. **Timing**: Firebase is initialized in `onCreate()` before `loadReactNative()`, ensuring it's ready when React Native modules load
2. **Safety Check**: `getApps().isEmpty()` prevents double initialization
3. **Error Handling**: Try-catch handles cases where google-services plugin already initialized Firebase
4. **Order**: Firebase must be initialized before any native module tries to use `FirebaseMessaging.getInstance()`

## Next Steps

1. **Rebuild the APK**:
   ```powershell
   cd android
   .\gradlew clean assembleRelease
   ```

2. **Install the new APK** on your phone

3. **The error should be gone!** ✅

## Additional Notes

- The `google-services` plugin (applied in `build.gradle`) also initializes Firebase, but it might not happen early enough
- This explicit initialization ensures Firebase is ready immediately when the app starts
- Both initialization methods (plugin + explicit) can coexist safely due to the `getApps().isEmpty()` check
