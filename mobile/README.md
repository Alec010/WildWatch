# WildWatch Android Development Setup

## Prerequisites

- Android Studio Hedgehog (2023.1.1) or newer
- JDK 17 or newer
- Git

## Development Environment Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd mobile
   ```

2. **Open in Android Studio**
   - Launch Android Studio
   - Select "Open an Existing Project"
   - Navigate to the `mobile` directory and open it

3. **Sync Project with Gradle Files**
   - Wait for the initial Gradle sync to complete
   - If prompted to update the Gradle version, accept it

4. **SDK Setup**
   - Open Android Studio Settings (File > Settings)
   - Navigate to Appearance & Behavior > System Settings > Android SDK
   - Install the following:
     - Android SDK Platform 34 (Android 14.0)
     - Android SDK Build-Tools 34.0.0
     - Android SDK Command-line Tools
     - Android SDK Platform-Tools

5. **Environment Variables**
   - Set `ANDROID_HOME` to your Android SDK location
   - Add platform-tools to your PATH

## Building the Project

1. **Clean Build**
   ```bash
   ./gradlew clean
   ```

2. **Build Debug APK**
   ```bash
   ./gradlew assembleDebug
   ```

3. **Run Tests**
   ```bash
   ./gradlew test
   ```

## Common Issues and Solutions

1. **Gradle Sync Failed**
   - Delete the `.gradle` folder in the project root
   - Run `./gradlew clean`
   - Invalidate caches (File > Invalidate Caches)

2. **SDK Location Not Found**
   - Ensure `ANDROID_HOME` is set correctly
   - Check `local.properties` file exists with correct SDK path

3. **Build Tools Version Mismatch**
   - Update Android Studio to the latest version
   - Sync project with Gradle files

## Development Guidelines

1. **Code Style**
   - Use Kotlin coding conventions
   - Follow the project's architecture guidelines
   - Use Android Studio's built-in code formatting

2. **Version Control**
   - Create feature branches from `develop`
   - Use conventional commit messages
   - Submit PRs for code review

3. **Testing**
   - Write unit tests for new features
   - Run tests before committing
   - Maintain minimum 70% code coverage

## Contact

For any setup issues or questions, contact the development team lead. 