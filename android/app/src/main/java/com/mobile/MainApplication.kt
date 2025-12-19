package com.mobile

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.mobile.alarm.AlarmPackage

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Add native alarm package
              add(AlarmPackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    // Initialize Firebase BEFORE React Native loads
    // This is critical because react-native-push-notification uses Firebase Messaging
    // and will crash if Firebase isn't initialized when it tries to request permissions
    try {
      // Check if Firebase is already initialized
      if (FirebaseApp.getApps(this).isEmpty()) {
        // Initialize with explicit options from google-services.json
        // Package name: com.mobile
        // Project ID: taskmanager-8dcf6
        // API Key: AIzaSyCW85EefITpD3fOcjbRpznVZX4EoW8XG48
        // App ID: 1:93362201097:android:701c45c397d1f181bcced8
        val options = FirebaseOptions.Builder()
          .setProjectId("taskmanager-8dcf6")
          .setApplicationId("1:93362201097:android:701c45c397d1f181bcced8")
          .setApiKey("AIzaSyCW85EefITpD3fOcjbRpznVZX4EoW8XG48")
          .setStorageBucket("taskmanager-8dcf6.firebasestorage.app")
          .build()
        
        FirebaseApp.initializeApp(this, options)
        android.util.Log.d("MainApplication", "Firebase initialized with explicit options")
      } else {
        android.util.Log.d("MainApplication", "Firebase already initialized")
      }
    } catch (e: Exception) {
      // If initialization fails, log but don't crash
      // The app might still work if Firebase isn't critical at startup
      android.util.Log.e("MainApplication", "Firebase initialization failed: ${e.message}", e)
    }
    loadReactNative(this)
  }
}
