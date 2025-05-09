# WildWatch Developer Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Mobile Setup](#mobile-setup)
6. [Deployment](#deployment)
7. [Environment Variables](#environment-variables)

## Prerequisites

### Required Software
- Java Development Kit (JDK) 17 or higher
- Node.js 18.x or higher
- npm package manager
- Git
- Android Studio (for mobile development)
- Maven
- Docker (optional, for containerized deployment)

### IDE Recommendations
- IntelliJ IDEA or Eclipse (for backend)
- Visual Studio Code (for frontend)
- Android Studio (for mobile)

## Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/Alec010/WildWatch.git
cd WildWatch
```

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend/WildWatch
```

2. Configure environment variables:
   - Update `.env` file with the provided Supabase credentials
   - Ensure JWT and OAuth2 configurations are set

3. Install dependencies and run:
```bash
mvn clean install
mvn spring-boot:run
```

The backend will run on `http://localhost:8080`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend/wildwatch
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Mobile Setup

1. Open Android Studio
2. Open the `mobile/WildWatch` directory
3. Sync Gradle files
4. Run the app on an emulator or physical device

## Deployment

### Production URLs
- Backend: https://wildwatch-9djc.onrender.com
- Frontend: https://wild-watch-smoky.vercel.app
- Database: Supabase
- File Storage: Supabase Storage

## Environment Variables

### Backend (.env)
```
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=86400000

# OAuth2 Configuration
OAUTH2_CLIENT_ID=your_client_id
OAUTH2_CLIENT_SECRET=your_client_secret
OAUTH2_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Next.js Documentation](https://nextjs.org/docs)
- [Android Developer Documentation](https://developer.android.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

## Troubleshooting

### Common Issues

1. **Supabase Connection Issues**
   - Verify Supabase project is active
   - Check Supabase credentials
   - Ensure proper permissions are set

2. **Frontend Build Issues**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify environment variables

3. **Mobile Build Issues**
   - Update Android Studio
   - Sync Gradle files
   - Check SDK versions

## Support

For additional support or questions, please contact:
- Alec R. Arela (BSIT-3)
- Jhean Hecari B. Caag (BSIT-3)
- Jermaine L. Gadiano (BSIT-3) 