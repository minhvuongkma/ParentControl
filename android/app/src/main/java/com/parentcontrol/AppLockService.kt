package com.parentcontrol

import android.app.*
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.TextView
import androidx.core.app.NotificationCompat
import android.util.Log
import java.util.*

class AppLockService : Service() {
    private val handler = Handler(Looper.getMainLooper())
    private var isRunning = false
    private val CHECK_INTERVAL = 1000L // 1 second

    private lateinit var sharedPreferences: SharedPreferences
    private lateinit var devicePolicyManager: DevicePolicyManager
    private lateinit var adminComponent: ComponentName
    private lateinit var powerManager: PowerManager
    private lateinit var windowManager: WindowManager
    private var floatingView: View? = null
    private var currentPosition: String? = null

    companion object {
        const val CHANNEL_ID = "AppLockStealthChannel"
        const val PREFS_NAME = "ParentControlPrefs"
        const val KEY_LOCKED = "isLocked"
        const val KEY_SHOW_FLOATING = "showFloatingTimer"
        const val KEY_FLOATING_POS = "floatingPosition"
    }

    override fun onCreate() {
        super.onCreate()
        sharedPreferences = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        adminComponent = ComponentName(this, DeviceAdmin::class.java)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(1, createStealthNotification())

        if (!isRunning) {
            Log.d("AppLockService", "Starting Monitoring")
            isRunning = true
            startMonitoring()
        }

        return START_STICKY
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        // Restart service if task is swiped away
        val restartServiceIntent = Intent(applicationContext, this.javaClass)
        restartServiceIntent.setPackage(packageName)
        val restartServicePendingIntent = PendingIntent.getService(
            applicationContext, 1, restartServiceIntent, 
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )
        val alarmService = applicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmService.set(
            AlarmManager.ELAPSED_REALTIME,
            android.os.SystemClock.elapsedRealtime() + 1000,
            restartServicePendingIntent
        )
        super.onTaskRemoved(rootIntent)
    }

    private fun createStealthNotification(): Notification {
        val intent = Intent() 
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(null)
            .setContentText("Parent Control Active")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_SECRET)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .build()
    }

    private fun startMonitoring() {
        handler.postDelayed(object : Runnable {
            override fun run() {
                if (isRunning) {
                    checkLockState()
                    updateFloatingTimer()
                    handler.postDelayed(this, CHECK_INTERVAL)
                }
            }
        }, CHECK_INTERVAL)
    }

    private fun updateFloatingTimer() {
        val timerEndTime = sharedPreferences.getLong("timerEndTime", 0L)
        val now = System.currentTimeMillis()
        val showFloating = sharedPreferences.getBoolean(KEY_SHOW_FLOATING, false)
        val position = sharedPreferences.getString(KEY_FLOATING_POS, "top-right") ?: "top-right"

        if (timerEndTime > 0 && now < timerEndTime && showFloating) {
             val diff = (timerEndTime - now) / 1000
             val hours = diff / 3600
             val minutes = (diff % 3600) / 60
             val seconds = diff % 60
             val timeStr = String.format("%02d:%02d:%02d", hours, minutes, seconds)

             if (position != currentPosition && floatingView != null) {
                 hideFloatingTimer()
             }
             showFloatingTimer(timeStr, position)
        } else {
            hideFloatingTimer()
        }
    }

    private fun showFloatingTimer(timeStr: String, position: String) {
        if (floatingView == null) {
            try {
                floatingView = LayoutInflater.from(this).inflate(R.layout.floating_timer, null)
                val params = WindowManager.LayoutParams(
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                    else
                        WindowManager.LayoutParams.TYPE_PHONE,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                    PixelFormat.TRANSLUCENT
                )
                
                when (position) {
                    "top-left" -> {
                        params.gravity = Gravity.TOP or Gravity.START
                        params.x = 20; params.y = 100
                    }
                    "top-right" -> {
                        params.gravity = Gravity.TOP or Gravity.END
                        params.x = 20; params.y = 100
                    }
                    "bottom-left" -> {
                        params.gravity = Gravity.BOTTOM or Gravity.START
                        params.x = 20; params.y = 100
                    }
                    "bottom-right" -> {
                        params.gravity = Gravity.BOTTOM or Gravity.END
                        params.x = 20; params.y = 100
                    }
                    else -> {
                        params.gravity = Gravity.TOP or Gravity.END
                        params.x = 20; params.y = 100
                    }
                }
                
                windowManager.addView(floatingView, params)
                currentPosition = position
            } catch (e: Exception) {
                // Permission might be missing or view creation fail
                e.printStackTrace()
            }
        }
        
        floatingView?.findViewById<TextView>(R.id.timer_text)?.text = timeStr
    }

    private fun hideFloatingTimer() {
        if (floatingView != null) {
            try {
                windowManager.removeView(floatingView)
            } catch (e: Exception) {}
            floatingView = null
            currentPosition = null
        }
    }

    private var blockerView: View? = null

    private var hasLockedForCurrentSession = false

    private fun checkLockState() {
        val isLocked = sharedPreferences.getBoolean(KEY_LOCKED, false)
        val timerEndTime = sharedPreferences.getLong("timerEndTime", 0L)
        val currentTime = System.currentTimeMillis()

        // 2. Determine if we should be locked
        val shouldLock = isLocked || (timerEndTime > 0 && currentTime >= timerEndTime)
        
        // Grace period check: If we are in grace period, treat as "not blocking overlay"
        val bridgeGraceEndTime = sharedPreferences.getLong("bridgeGraceEndTime", 0L)
        val inGracePeriod = bridgeGraceEndTime > currentTime

        if (shouldLock) {
            // Update state to ensure consistency if timer just expired
            if (timerEndTime > 0 && currentTime >= timerEndTime) {
                if (!isLocked) {
                     sharedPreferences.edit().putBoolean(KEY_LOCKED, true).putLong("timerEndTime", 0L).apply()
                 }
            }

            // A. Show Fullscreen Blocker Overlay ONLY if NOT in grace period
            if (!inGracePeriod) {
                if (blockerView == null) {
                    try {
                        showBlockerOverlay()
                    } catch (e: Exception) {
                        Log.e("AppLockService", "Error showing overlay", e)
                    }
                }
                
                // B. Lock Screen Logic (Persistent check to avoid double-lock loop)
                // Only lock the screen if we haven't already locked for this session AND screen is currently on
                val hasLockedSession = sharedPreferences.getBoolean("hasLockedSession", false)
                if (!hasLockedSession) {
                     if (devicePolicyManager.isAdminActive(adminComponent)) {
                         if (powerManager.isInteractive) {
                             try {
                                 devicePolicyManager.lockNow()
                                 // Persist that we have locked for this violation
                                 sharedPreferences.edit().putBoolean("hasLockedSession", true).commit()
                             } catch (e: SecurityException) {
                                 e.printStackTrace()
                             }
                         }
                     }
                }
            } else {
                // During grace period, hide overlay but don't clear the lock flag yet
                hideBlockerOverlay()
            }
        } else {
            // Reset the flag and Remove Overlay when unlocked
            // Clear persistent lock flag
            if (sharedPreferences.getBoolean("hasLockedSession", false)) {
                sharedPreferences.edit().putBoolean("hasLockedSession", false).apply()
            }
            hideBlockerOverlay()
        }
    }

    private var gracePeriodEndTime = 0L

    private fun showBlockerOverlay() {
        if (blockerView == null) {
            try {
                blockerView = LayoutInflater.from(this).inflate(R.layout.blocker_overlay, null)
                val params = WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.MATCH_PARENT,
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                    else
                        WindowManager.LayoutParams.TYPE_PHONE,
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                            WindowManager.LayoutParams.FLAG_FULLSCREEN or
                            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                    PixelFormat.OPAQUE
                )
             
                params.gravity = Gravity.CENTER
                
                val btnUnlock = blockerView?.findViewById<android.widget.Button>(R.id.btn_unlock)
                val pinContainer = blockerView?.findViewById<android.widget.LinearLayout>(R.id.pin_container)
                val pinInput = blockerView?.findViewById<android.widget.EditText>(R.id.pin_input)
                val btnVerify = blockerView?.findViewById<android.widget.Button>(R.id.btn_verify_pin)
                val btnCancel = blockerView?.findViewById<android.widget.Button>(R.id.btn_cancel_pin)

                btnUnlock?.setOnClickListener {
                    // Show PIN input, Hide Unlock button
                    btnUnlock.visibility = View.GONE
                    pinContainer?.visibility = View.VISIBLE
                    // Clear previous input
                    pinInput?.text?.clear()
                    
                    // Request focus (might struggle with window flags, but try)
                    pinInput?.requestFocus()
                }

                btnCancel?.setOnClickListener {
                    pinContainer?.visibility = View.GONE
                    btnUnlock?.visibility = View.VISIBLE
                    pinInput?.clearFocus()
                    // Re-hide keyboard if needed (complex in service overlay, skip for now)
                }

                btnVerify?.setOnClickListener {
                    val input = pinInput?.text.toString()
                    val storedPin = sharedPreferences.getString("masterPin", "") ?: ""
                    
                    // Default PIN when not set (rescue): "0000"
                    val isDefaultRescue = storedPin.isEmpty() && input == "0000"
                    val isCorrectPin = storedPin.isNotEmpty() && input == storedPin
                    
                    if (isDefaultRescue || isCorrectPin) {
                        // CORRECT PIN -> UNLOCK
                        // Set grace period to 20 seconds to prevent immediate re-locking
                        sharedPreferences.edit()
                            .putLong("bridgeGraceEndTime", System.currentTimeMillis() + 20000L)
                            .apply()
                        
                        // Use commit() here to ensure immediate write to disk before we proceed
                        sharedPreferences.edit()
                            .putBoolean(KEY_LOCKED, false)
                            .putLong("timerEndTime", 0L)
                            .putBoolean("hasLockedSession", false)
                            .commit()
                        
                        // This will trigger checkLockState on next loop to remove overlay
                        hideBlockerOverlay()
                        hasLockedForCurrentSession = false
                        
                        // Launch App
                         try {
                            val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
                            launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                            startActivity(launchIntent)
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    } else {
                        // INCORRECT > Shake? Toast?
                        pinInput?.error = "Incorrect PIN"
                    }
                }

                windowManager.addView(blockerView, params)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun hideBlockerOverlay() {
        if (blockerView != null) {
            try {
                windowManager.removeView(blockerView)
            } catch (e: Exception) {}
            blockerView = null
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Parent Control Service",
                NotificationManager.IMPORTANCE_LOW
            )
            serviceChannel.description = "Enforces device lock"
            serviceChannel.setShowBadge(false)
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        isRunning = false
        handler.removeCallbacksAndMessages(null)
        super.onDestroy()
    }
}
