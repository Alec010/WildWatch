package com.wildwatch

import android.app.Application
import timber.log.Timber

class WildWatchApp : Application() {
    override fun onCreate() {
        super.onCreate()
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }
    }
}