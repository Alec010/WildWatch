plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.wildwatch"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.wildwatch"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    android {
        // Other configurations...
        buildTypes {
            debug {
                buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:8080\"") // For Android Emulator
                buildConfigField ("String", "WS_BASE_URL", "\"https://wildwatch-9djc.onrender.com\"")
            }
            release {
                buildConfigField("String", "API_BASE_URL", "\"https://wildwatch-9djc.onrender.com\"")
                buildConfigField ("String", "WS_BASE_URL", "\"wss://wildwatch-9djc.onrender.com\"")
                isMinifyEnabled = false
                proguardFiles(
                    getDefaultProguardFile("proguard-android-optimize.txt"),
                    "proguard-rules.pro"
                )
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
        isCoreLibraryDesugaringEnabled = true
    }
    kotlinOptions {
        jvmTarget = "11"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)
    implementation("androidx.navigation:navigation-compose:2.7.5")
    implementation ("androidx.compose.material:material-icons-extended:1.4.0")
    implementation ("androidx.compose.ui:ui-text:1.4.0")
    implementation ("androidx.compose.material:material:1.4.0")

    // Retrofit & GSON
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")

    // Lifecycle ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.2")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.6.2")

    // Kotlin Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.6.4")

    implementation("androidx.datastore:datastore-preferences:1.0.0")

    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.4")

    implementation ("androidx.activity:activity-compose:1.7.2") // or latest stable version

    implementation ("io.coil-kt:coil-compose:2.2.2")

    implementation ("androidx.compose.material3:material3:1.0.0")

    implementation ("com.squareup.okhttp3:logging-interceptor:4.10.0")
    
    implementation("com.jakewharton.timber:timber:5.0.1")
}