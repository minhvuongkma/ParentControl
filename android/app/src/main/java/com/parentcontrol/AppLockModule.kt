package com.parentcontrol

import android.app.AppOpsManager
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import com.facebook.react.bridge.*

class AppLockModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val sharedPreferences: SharedPreferences = reactContext.getSharedPreferences("ParentControlPrefs", Context.MODE_PRIVATE)

    override fun getName(): String = "AppLockModule"

    @ReactMethod
    fun startService() {
        val intent = Intent(reactApplicationContext, AppLockService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactApplicationContext.startForegroundService(intent)
        } else {
            reactApplicationContext.startService(intent)
        }
    }

    @ReactMethod
    fun stopService() {
        val intent = Intent(reactApplicationContext, AppLockService::class.java)
        reactApplicationContext.stopService(intent)
    }

    @ReactMethod
    fun setLocked(locked: Boolean) {
        sharedPreferences.edit().putBoolean("isLocked", locked).commit()
    }

    @ReactMethod
    fun getLocked(promise: Promise) {
        val isLockedVal = sharedPreferences.getBoolean("isLocked", false)
        val timerEndTime = sharedPreferences.getLong("timerEndTime", 0L)
        val currentTime = System.currentTimeMillis()
        
        val effectiveLocked = isLockedVal || (timerEndTime > 0 && currentTime > timerEndTime)
        promise.resolve(effectiveLocked)
    }

    @ReactMethod
    fun setWhitelist(whitelist: String) {
        sharedPreferences.edit().putString("whitelist", whitelist).commit()
    }

    @ReactMethod
    fun setTimerEndTime(endTime: Double) {
        sharedPreferences.edit().putLong("timerEndTime", endTime.toLong()).commit()
    }

    @ReactMethod
    fun getTimerEndTime(promise: Promise) {
        val time = sharedPreferences.getLong("timerEndTime", 0L)
        promise.resolve(time.toDouble())
    }

    @ReactMethod
    fun setNotificationEnabled(enabled: Boolean) {
        sharedPreferences.edit().putBoolean("showNotificationTimer", enabled).commit()
    }

    @ReactMethod
    fun setFloatingEnabled(enabled: Boolean) {
        sharedPreferences.edit().putBoolean("showFloatingTimer", enabled).commit()
    }

    @ReactMethod
    fun setFloatingPosition(position: String) {
        sharedPreferences.edit().putString("floatingPosition", position).commit()
    }

    @ReactMethod
    fun hasUsageStatsPermission(promise: Promise) {
        val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), reactApplicationContext.packageName)
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), reactApplicationContext.packageName)
        }
        promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
    }

    @ReactMethod
    fun requestUsageStatsPermission() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${reactApplicationContext.packageName}"))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun isDeviceAdminActive(promise: Promise) {
        val dpm = reactApplicationContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val adminName = ComponentName(reactApplicationContext, DeviceAdmin::class.java)
        promise.resolve(dpm.isAdminActive(adminName))
    }

    @ReactMethod
    fun requestDeviceAdmin() {
        val adminName = ComponentName(reactApplicationContext, DeviceAdmin::class.java)
        val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN)
        intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminName)
        intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Enabling Device Admin allows ParentControl to enforce lockdown.")
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun minimizeApp() {
        val intent = Intent(Intent.ACTION_MAIN)
        intent.addCategory(Intent.CATEGORY_HOME)
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        val manager = reactApplicationContext.packageManager
        val packages = manager.getInstalledApplications(PackageManager.GET_META_DATA)
        val list = Arguments.createArray()

        val myPackageName = reactApplicationContext.packageName

        for (appInfo in packages) {
            val packageName = appInfo.packageName
            
            // Skip our own app
            if (packageName == myPackageName) continue

            // Filter: Only show apps that can be launched by the user
            val launchIntent = manager.getLaunchIntentForPackage(packageName)
            if (launchIntent == null) continue

            val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
            val isGoogleApp = packageName.contains(".google.") || 
                             packageName.startsWith("com.google.") ||
                             packageName == "com.android.vending"
            
            var shouldShow = !isSystemApp || isGoogleApp

            // Check if installed from Play Store
            if (!shouldShow) {
                try {
                    val installer = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        manager.getInstallSourceInfo(packageName).installingPackageName
                    } else {
                        @Suppress("DEPRECATION")
                        manager.getInstallerPackageName(packageName)
                    }
                    if (installer == "com.android.vending") {
                        shouldShow = true
                    }
                } catch (e: Exception) {}
            }

            if (shouldShow) {
                val map = Arguments.createMap()
                map.putString("packageName", packageName)
                map.putString("appName", manager.getApplicationLabel(appInfo).toString())
                list.pushMap(map)
            }
        }
        promise.resolve(list)
    }
}
