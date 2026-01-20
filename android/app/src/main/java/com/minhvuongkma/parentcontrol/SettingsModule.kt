package com.minhvuongkma.parentcontrol

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.content.Context
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments

class SettingsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "SettingsModule"

    @ReactMethod
    fun saveSettings(showTimer: Boolean, timerPosition: String) {
        val sharedPref = reactApplicationContext.getSharedPreferences("ParentControlPrefs", Context.MODE_PRIVATE)
        with (sharedPref.edit()) {
            putBoolean("showFloatingTimer", showTimer)
            putString("floatingPosition", timerPosition)
            apply()
        }
    }

    @ReactMethod
    fun loadSettings(promise: Promise) {
        try {
            val sharedPref = reactApplicationContext.getSharedPreferences("ParentControlPrefs", Context.MODE_PRIVATE)
            val showTimer = sharedPref.getBoolean("showFloatingTimer", false)
            val timerPosition = sharedPref.getString("floatingPosition", "top-right") ?: "top-right"

            val settings = Arguments.createMap()
            settings.putBoolean("showTimer", showTimer)
            settings.putString("timerPosition", timerPosition)

            promise.resolve(settings)
        } catch (e: Exception) {
            promise.reject("E_LOAD_SETTINGS", "Error loading settings", e)
        }
    }
}