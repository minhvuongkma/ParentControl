package com.parentcontrol

import android.app.*
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.TextView
import androidx.core.app.NotificationCompat
import java.util.*

class AppLockService : Service() {
    private val handler = Handler(Looper.getMainLooper())
    private var isRunning = false
    private val CHECK_INTERVAL = 1000L // 1 second

    private lateinit var sharedPreferences: SharedPreferences
    private lateinit var windowManager: WindowManager
    private var floatingView: View? = null
    private var currentPosition: String? = null

    companion object {
        const val CHANNEL_ID = "AppLockStealthChannel"
        const val PREFS_NAME = "ParentControlPrefs"
        const val KEY_LOCKED = "isLocked"
        const val KEY_WHITELIST = "whitelist"
        const val KEY_SHOW_FLOATING = "showFloatingTimer"
        const val KEY_FLOATING_POS = "floatingPosition"
    }

    override fun onCreate() {
        super.onCreate()
        sharedPreferences = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Start foreground with an absolutely static, minimal notification
        startForeground(1, createStealthNotification())

        if (!isRunning) {
            isRunning = true
            startMonitoring()
        }

        return START_STICKY
    }

    private fun createStealthNotification(): Notification {
        // Empty intent makes the notification non-functional when clicked
        val intent = Intent() 
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(null)
            .setContentText("System update service") // High disguise
            .setSmallIcon(android.R.drawable.ic_menu_info_details) // Generic icon
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
                    checkForegroundApp()
                    updateDynamicUI()
                    handler.postDelayed(this, CHECK_INTERVAL)
                }
            }
        }, CHECK_INTERVAL)
    }

    private fun updateDynamicUI() {
        val timerEndTime = sharedPreferences.getLong("timerEndTime", 0L)
        val now = System.currentTimeMillis()
        val showFloating = sharedPreferences.getBoolean(KEY_SHOW_FLOATING, false)
        val position = sharedPreferences.getString(KEY_FLOATING_POS, "top-right") ?: "top-right"

        if (timerEndTime > 0) {
            if (now >= timerEndTime) {
                forceLockdown()
                hideFloatingTimer()
            } else {
                if (showFloating) {
                    val diff = (timerEndTime - now) / 1000
                    val hours = diff / 3600
                    val minutes = (diff % 3600) / 60
                    val seconds = diff % 60
                    val timeStr = String.format("%02d:%02d:%02d", hours, minutes, seconds)
                    
                    // If position changed, recreate view
                    if (position != currentPosition && floatingView != null) {
                        hideFloatingTimer()
                    }
                    
                    showFloatingTimer(timeStr, position)
                } else {
                    hideFloatingTimer()
                }
            }
        } else {
            hideFloatingTimer()
        }
    }

    private fun forceLockdown() {
        sharedPreferences.edit().putBoolean(KEY_LOCKED, true).putLong("timerEndTime", 0L).commit()
        launchApp()
    }

    private fun launchApp() {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        startActivity(launchIntent)
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
                e.printStackTrace()
            }
        }
        
        floatingView?.findViewById<TextView>(R.id.timer_text)?.text = timeStr
    }

    private fun hideFloatingTimer() {
        if (floatingView != null) {
            try {
                windowManager.removeView(floatingView)
            } catch (e: Exception) {
                // View might not be attached
            }
            floatingView = null
            currentPosition = null
        }
    }

    private fun checkForegroundApp() {
        val isLocked = sharedPreferences.getBoolean(KEY_LOCKED, false)
        val timerEndTime = sharedPreferences.getLong("timerEndTime", 0L)
        val currentTime = System.currentTimeMillis()

        val shouldLock = isLocked || (timerEndTime > 0 && currentTime >= timerEndTime)

        if (!shouldLock) return

        val foregroundApp = getForegroundApp() ?: return
        val whitelistStr = sharedPreferences.getString(KEY_WHITELIST, "") ?: ""
        val whitelist = whitelistStr.split(",").filter { it.isNotEmpty() }

        if (foregroundApp != packageName && !whitelist.contains(foregroundApp)) {
            launchApp()
        }
    }

    private fun getForegroundApp(): String? {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val time = System.currentTimeMillis()
        val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 1000 * 10, time)
        
        if (stats != null && stats.isNotEmpty()) {
            var latestStats = stats[0]
            for (usageStat in stats) {
                if (usageStat.lastTimeUsed > latestStats.lastTimeUsed) {
                    latestStats = usageStat
                }
            }
            return latestStats.packageName
        }
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "System Update",
                NotificationManager.IMPORTANCE_MIN
            )
            serviceChannel.description = "Required system update service"
            serviceChannel.setShowBadge(false)
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        isRunning = false
        hideFloatingTimer()
        super.onDestroy()
    }
}
