# WildWatch React Native App

This is the React Native implementation of the WildWatch incident reporting and case management platform, designed to work with the Java Spring Boot backend.

## Features

### Authentication
- **Login Screen**: Institutional email (.edu) and password authentication
- **Sign Up Screen**: Complete user registration with validation
- **Token Management**: JWT token storage and automatic authentication
- **Microsoft OAuth**: Support for Microsoft authentication (placeholder)

### Dashboard
- **Overview Statistics**: Total reports, active cases, resolved cases, and user reports
- **Quick Actions**: Report incident and view all cases buttons
- **Recent Incidents**: Tabbed view of public incidents and user reports
- **Pull-to-Refresh**: Refresh dashboard data
- **Token Validation**: Automatic token checking and logout on expiration

### Navigation
- **Tab-based Navigation**: Dashboard, History, Report, Cases, and Profile tabs
- **Authentication Flow**: Automatic routing based on authentication status
- **Protected Routes**: Dashboard and other features require valid authentication

## Technical Implementation

### Architecture
- **Expo Router**: File-based routing with authentication guards
- **Context API**: Global authentication state management
- **AsyncStorage**: Secure token storage
- **NativeWind**: Tailwind CSS for React Native styling

### Authentication Flow
1. App starts and checks for existing JWT token
2. If token exists, validates with backend and redirects to dashboard
3. If no token or invalid, redirects to login screen
4. After successful login, token is stored and user is redirected to dashboard
5. Token is automatically included in all API requests
6. On token expiration, user is automatically logged out

### API Integration
- **Base URL**: `http://localhost:8080/api` (configurable in AuthContext)
- **Endpoints**: 
  - `POST /auth/login` - User authentication
  - `POST /auth/register` - User registration
  - `GET /auth/profile` - User profile retrieval
- **Headers**: Automatic JWT token inclusion in authenticated requests

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation
1. Navigate to the project directory:
   ```bash
   cd wildwatchreact/WildWatch
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install additional required packages:
   ```bash
   npm install @react-native-async-storage/async-storage
   ```

### Configuration
1. **Backend URL**: Update the `API_BASE_URL` in `contexts/AuthContext.tsx` to match your backend server
2. **Environment Variables**: Create a `.env` file if needed for environment-specific configuration

### Running the App
1. **Start the development server**:
   ```bash
   npm start
   ```

2. **Run on Android**:
   ```bash
   npm run android
   ```

3. **Run on iOS** (macOS only):
   ```bash
   npm run ios
   ```

4. **Run on Web**:
   ```bash
   npm run web
   ```

## Project Structure

```
wildwatchreact/WildWatch/
├── app/                    # Expo Router app directory
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── dashboard.tsx  # Main dashboard screen
│   │   ├── history.tsx    # Incident history
│   │   ├── report.tsx     # Report incident
│   │   ├── cases.tsx      # Case tracking
│   │   ├── profile.tsx    # User profile
│   │   └── _layout.tsx    # Tab layout
│   ├── login.tsx          # Login screen
│   ├── signup.tsx         # Registration screen
│   ├── index.tsx          # Entry point with auth redirect
│   └── _layout.tsx        # Root layout with AuthProvider
├── contexts/               # React Context providers
│   └── AuthContext.tsx    # Authentication context
├── components/             # Reusable components
├── assets/                 # Static assets
└── package.json            # Dependencies and scripts
```

## Key Components

### AuthContext
- Manages authentication state globally
- Handles login, registration, and logout
- Provides token management and user data
- Automatic token validation and cleanup

### Login Screen
- Email and password validation
- Institutional email (.edu) requirement
- Loading states and error handling
- Navigation to signup and dashboard

### Sign Up Screen
- Complete user registration form
- Real-time validation
- Terms and conditions acceptance
- School ID formatting (00-0000-000)

### Dashboard Screen
- Overview statistics cards
- Quick action buttons
- Recent incidents list with tabs
- Pull-to-refresh functionality

## Styling

The app uses NativeWind (Tailwind CSS for React Native) for consistent styling:
- **Color Scheme**: Red (#DC2626) as primary color matching the brand
- **Typography**: Consistent text sizes and weights
- **Spacing**: Standardized spacing using Tailwind classes
- **Components**: Reusable UI components with consistent styling

## Backend Integration

The React Native app is designed to work with the Java Spring Boot backend:
- **Authentication**: JWT-based authentication
- **API Endpoints**: RESTful API integration
- **Data Models**: Consistent with backend DTOs
- **Error Handling**: Proper error messages and user feedback

## Development Notes

### State Management
- Uses React hooks for local state
- Context API for global authentication state
- No external state management libraries required

### Navigation
- Expo Router for file-based routing
- Authentication guards on protected routes
- Automatic redirects based on auth status

### Performance
- Lazy loading of tab screens
- Optimized re-renders with proper dependency arrays
- Efficient list rendering for incidents

## Future Enhancements

- **Microsoft OAuth**: Complete Microsoft authentication implementation
- **Push Notifications**: Real-time incident updates
- **Offline Support**: Offline data caching and sync
- **Image Upload**: Photo evidence for incidents
- **Dark Mode**: Theme switching support
- **Biometric Auth**: Fingerprint/Face ID support

## Troubleshooting

### Common Issues
1. **Backend Connection**: Ensure backend server is running on the configured URL
2. **Token Issues**: Clear app data or reinstall if authentication problems persist
3. **Styling Issues**: Ensure NativeWind is properly configured
4. **Navigation Issues**: Check Expo Router configuration and dependencies

### Debug Mode
- Use React Native Debugger for debugging
- Check console logs for API errors
- Verify token storage in AsyncStorage

## Contributing

1. Follow the existing code structure and patterns
2. Use TypeScript for type safety
3. Implement proper error handling
4. Add loading states for async operations
5. Test on both Android and iOS platforms
