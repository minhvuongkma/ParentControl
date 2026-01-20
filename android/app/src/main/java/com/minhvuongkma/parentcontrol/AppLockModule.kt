package com.minhvuongkma.parentcontrol

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.util.Log
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
        val currentTime = System.currentTimeMillis()
        val bridgeGraceEndTime = sharedPreferences.getLong("bridgeGraceEndTime", 0L)
        
        // If we are trying to LOCK, check if we are in grace period
        if (locked && bridgeGraceEndTime > currentTime) {
            Log.d("AppLockModule", "Lock request ignored during grace period")
            return
        }

        val editor = sharedPreferences.edit()
        editor.putBoolean("isLocked", locked)
        if (!locked) {
            // Set 20 seconds grace period for bridge unlocks
            editor.putLong("bridgeGraceEndTime", currentTime + 20000L)
        }
        editor.apply()
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
    fun setTimerEndTime(endTime: Double) {
        sharedPreferences.edit().putLong("timerEndTime", endTime.toLong()).apply()
    }

    @ReactMethod
    fun getTimerEndTime(promise: Promise) {
        val time = sharedPreferences.getLong("timerEndTime", 0L)
        promise.resolve(time.toDouble())
    }

    @ReactMethod
    fun setFloatingEnabled(enabled: Boolean) {
        sharedPreferences.edit().putBoolean("showFloatingTimer", enabled).apply()
    }

    @ReactMethod
    fun setPIN(pin: String) {
        sharedPreferences.edit().putString("masterPin", pin).apply()
    }

    @ReactMethod
    fun setFloatingPosition(position: String) {
        sharedPreferences.edit().putString("floatingPosition", position).apply()
    }

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(android.provider.Settings.canDrawOverlays(reactApplicationContext))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION, android.net.Uri.parse("package:${reactApplicationContext.packageName}"))
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
    fun setNotificationEnabled(enabled: Boolean) {
        sharedPreferences.edit().putBoolean("notificationEnabled", enabled).apply()
    }
}
