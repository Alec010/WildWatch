# WildWatch Android Project - Current Working Configuration

## Project Structure
```
WildWatch/
├── app/
├── gradle/
├── .gradle/
├── .idea/
├── build.gradle.kts
├── gradle.properties
├── local.properties
├── settings.gradle.kts
└── gradlew
```

## Current Working Versions

### Android Configuration
- Android Studio Version: (Current IDE version)
- Gradle Version: 8.2 (from gradle-wrapper.properties)
- Android Gradle Plugin: 8.3.2
- Kotlin Version: 2.0.21
- Java Version: 11
- Compile SDK: 35 (needs to be changed to 34)
- Target SDK: 35 (needs to be changed to 34)
- Min SDK: 24

### Key Dependencies
1. **Compose Dependencies**
   - Compose BOM: 2024.09.00
   - Material3: 1.0.0
   - Navigation Compose: 2.7.5
   - Material Icons Extended: 1.4.0
   - UI Text: 1.4.0
   - Material: 1.4.0

2. **Networking**
   - Retrofit: 2.9.0
   - OkHttp: 4.12.0
   - OkHttp Logging: 4.10.0

3. **Lifecycle Components**
   - Lifecycle Runtime KTX: 2.8.7
   - Lifecycle ViewModel KTX: 2.6.2
   - Lifecycle Runtime Compose: 2.6.2

4. **Core Android**
   - Core KTX: 1.15.0
   - Activity Compose: 1.10.1

5. **Image Loading**
   - Coil Compose: 2.2.2

6. **Logging**
   - Timber: 5.0.1

7. **Data Storage**
   - DataStore Preferences: 1.0.0

8. **Coroutines**
   - Kotlinx Coroutines Android: 1.6.4

## Build Configuration Notes

### Current Working Features
- Compose UI implementation
- Navigation setup
- API integration
- Image loading
- Data persistence
- Logging system

### Known Working Configurations
1. **Build Types**
   - Debug configuration with local API
   - Release configuration with production API

2. **API Endpoints**
   - Debug: http://10.0.2.2:8080
   - Release: https://wildwatch-9djc.onrender.com
   - WebSocket: wss://wildwatch-9djc.onrender.com

## Backup Instructions

1. **Before Making Changes**
   ```bash
   # Create a backup branch
   git checkout -b backup/working-config-$(date +%Y%m%d)
   
   # Commit current working state
   git add .
   git commit -m "Backup: Current working configuration"
   ```

2. **Files to Backup**
   - All .gradle files
   - build.gradle.kts
   - gradle.properties
   - local.properties (without sensitive data)
   - settings.gradle.kts
   - gradle/wrapper/gradle-wrapper.properties

## Migration Plan

### Phase 1: Critical Fixes
1. Update SDK versions from 35 to 34
2. Keep all other versions unchanged
3. Test build and functionality

### Phase 2: Dependency Cleanup
1. Remove duplicate dependencies
2. Organize version catalog
3. Test each change independently

### Phase 3: Version Updates
1. Update Java version to 17
2. Update Compose versions
3. Update other dependencies

## Rollback Plan

If issues occur:
1. Revert to backup branch
2. Restore original configuration files
3. Clear build caches:
   ```bash
   ./gradlew clean
   rm -rf .gradle
   rm -rf app/build
   ```

## Notes
- Keep this document updated with any changes
- Document any issues encountered
- Record successful configurations
- Note any workarounds implemented 