# WildWatch - Incident Reporting System

<div align="center">
    <img src="WildWatch.png" alt="WildWatch Logo">
    <h3>A Comprehensive Incident Reporting Platform for Cebu Institute of Technology - University</h3>
</div>

## Table of Contents
- [About WildWatch](#about-wildwatch)
  - [Product Description](#product-description)
  - [System Architecture](#system-architecture)
- [Features](#features)
  - [Web Functionalities](#web-functionalities)
  - [Mobile Functionalities](#mobile-functionalities)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Mobile Setup](#mobile-setup)
- [Deployment](#deployment)
  - [Backend Deployment](#backend-deployment)
  - [Frontend Deployment](#frontend-deployment)
  - [Mobile Deployment](#mobile-deployment)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Additional Resources](#additional-resources)
- [Developers](#developers)

## About WildWatch

### Product Description

WildWatch is an official incident reporting system for Cebu Institute of Technology - University (CIT-U). It provides a structured and confidential platform for students, faculty, and staff to report concerns and incidents. This centralized system enhances campus safety, streamlines reporting, and ensures proper resolution by directing reports to the appropriate university departments.

### System Architecture

WildWatch follows a modern multi-tier architecture:

- **Frontend**: Next.js 15 web application with responsive design and real-time WebSocket support
- **Backend**: Spring Boot 3.4.4 RESTful API with JPA/Hibernate
- **Mobile**: Cross-platform mobile application built with Expo (React Native)
- **Database**: PostgreSQL for data persistence with Hibernate caching (EhCache)
- **AI Integration**: Google Gemini AI for chatbot assistance and incident classification
- **Real-time Communication**: WebSocket (STOMP) for live notifications and updates
- **Authentication**: JWT tokens with Microsoft OAuth2 integration

The system uses JWT authentication with Microsoft OAuth2 integration for secure access across all platforms.

## Features

### Web Functionalities

1. **Authentication & Authorization**
   - Microsoft OAuth2 login integration
   - JWT-based session management
   - Role-based access control (Regular User, Office Admin)
   - Email verification system

2. **Incident Management**
   - Multi-step incident report submission with evidence upload (images/videos)
   - Real-time incident status tracking (Pending, Verified, In Progress, Resolved, Closed, Dismissed)
   - Priority level assignment (Low, Medium, High, Critical)
   - Office assignment and case transfer functionality
   - AI-powered similar incident detection
   - Incident history and archive

3. **Office Administration**
   - Office admin dashboard with case management
   - Bulk incident operations
   - Case verification and approval workflow
   - Incident transfer between offices
   - Office bulletin board with upvoting system
   - Performance analytics and reporting

4. **Gamification System**
   - Badge system with multiple levels and types
   - User ranking tiers (Bronze, Silver, Gold)
   - Points system based on upvotes and resolved incidents
   - Leaderboard with Gold Elite rankings
   - Achievement celebrations and progress tracking

5. **Rating & Feedback**
   - 4-dimensional rating system for office admins
   - User feedback and follow-up requests
   - Rating analytics and performance metrics
   - Recognition system for top performers

6. **Real-time Features**
   - WebSocket-based live notifications
   - Real-time bulletin updates
   - Live incident status changes
   - Activity log tracking

7. **AI-Powered Features**
   - Intelligent chatbot for user assistance (Google Gemini)
   - AI-powered incident classification
   - Automatic tag generation for incidents
   - Similar incident detection and suggestions

8. **Notifications**
   - Email notifications for status updates
   - SMS notifications (configured)
   - In-app notification center
   - Real-time WebSocket notifications

### Mobile Functionalities

1. **Authentication**
   - Microsoft OAuth2 login
   - Biometric authentication support
   - Secure token storage

2. **Incident Reporting**
   - Quick incident report submission
   - Camera integration for evidence capture
   - Location picker with map integration
   - Witness management
   - Multi-step form with progress tracking

3. **Case Management**
   - Real-time case tracking
   - Active cases and incident history
   - Case details with status updates
   - Evidence viewing and download

4. **Notifications**
   - Push notifications via Expo Notifications
   - In-app notification center
   - Real-time status updates
   - Notification sound alerts

5. **Community Features**
   - Public incidents feed (Community Reports)
   - Upvoting system
   - Office bulletin board
   - Leaderboard and rankings

6. **Profile & Badges**
   - User profile management
   - Badge collection and display
   - Rank progress tracking
   - Achievement celebrations

7. **Location Services**
   - Real-time GPS location tracking
   - Map integration for incident location
   - Emergency location sharing

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.4.4
- **Language**: Java 17
- **Security**: Spring Security with OAuth2, JWT (jjwt 0.11.5)
- **Database**: PostgreSQL with Spring Data JPA / Hibernate
- **Caching**: EhCache (Hibernate second-level cache)
- **WebSocket**: Spring WebSocket with STOMP protocol
- **API Documentation**: SpringDoc OpenAPI (Swagger)
- **Build Tool**: Maven
- **Other**: Lombok, Spring Mail, RestTemplate

### Frontend
- **Framework**: Next.js 15.5.7 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI
- **Forms**: React Hook Form with Zod validation
- **WebSocket**: STOMP.js with SockJS
- **State Management**: React Context API
- **Other**: Framer Motion, jsPDF, date-fns

### Mobile
- **Framework**: Expo SDK 54
- **Language**: TypeScript 5.9
- **UI Library**: React Native 0.81.5, React 19
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: Expo Router 6
- **Location**: Expo Location
- **Notifications**: Expo Notifications
- **Storage**: AsyncStorage
- **Maps**: React Native Maps

## Getting Started

### Prerequisites

To run WildWatch locally, you'll need:

- **Backend**:
  - JDK 17 or higher
  - Maven 3.8+
  - PostgreSQL 13+
  
- **Frontend**:
  - Node.js 18+ (recommended: Node.js 20+)
  - npm 9+ or yarn 1.22+
  
- **Mobile**:
  - Node.js 18+
  - Expo CLI (installed via npm)
  - Expo Go app (for testing on physical devices)
  - iOS Simulator (for macOS) or Android Emulator (optional)

### Environment Setup

#### Database Configuration

1. Create a PostgreSQL database for WildWatch
2. Note your database URL, username, and password for configuration

#### External Services Configuration

1. **Microsoft OAuth2**:
   - Register an application in Microsoft Azure Portal
   - Configure redirect URIs
   - Note the client ID and client secret

2. **Google Gemini AI**:
   - Obtain an API key from Google AI Studio
   - Enable the Gemini API for your project

### Backend Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/wildwatch.git
   cd wildwatch/backend/WildWatch
   ```

2. **Create PostgreSQL database**:
   ```sql
   CREATE DATABASE wildwatch;
   ```

3. **Configure environment variables**:
   
   Create a `.env` file in the `backend/WildWatch` directory with the following variables:
   ```env
   # Database Configuration
   DB_URL=jdbc:postgresql://localhost:5432/wildwatch
   DB_USER=your_db_username
   DB_PASSWORD=your_db_password
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_min_256_bits
   JWT_EXPIRATION=86400000
   
   # Microsoft OAuth2
   MS_CLIENT_ID=your_microsoft_client_id
   MS_CLIENT_SECRET=your_microsoft_client_secret
   MS_TENANT_ID=your_microsoft_tenant_id
   MS_REDIRECT_URI=http://localhost:8080/login/oauth2/code/microsoft
   
   # Application URLs
   FRONTEND_URL=http://localhost:3000
   MOBILE_REDIRECT_URI=wildwatch://oauth-redirect
   
   # AI Integration
   GEMINI_API_KEY=your_gemini_api_key
   
   # Email Configuration (Optional)
   SPRING_MAIL_HOST=smtp.gmail.com
   SPRING_MAIL_PORT=587
   SPRING_MAIL_USERNAME=your_email@gmail.com
   SPRING_MAIL_PASSWORD=your_app_password
   
   # File Storage (Optional - defaults to local uploads/)
   UPLOAD_DIR=./uploads
   ```

4. **Build and run the backend**:
   ```bash
   # Windows
   mvnw.cmd clean install
   mvnw.cmd spring-boot:run
   
   # Linux/Mac
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```
   
   The backend server will start on http://localhost:8080
   
   **Note**: The database schema will be auto-generated on first run if `spring.jpa.hibernate.ddl-auto=update` is set (default).

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd ../../frontend/wildwatch
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**:
   
   Create a `.env.local` file in the `frontend/wildwatch` directory:
   ```env
   # Backend API URL
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
   
   # Microsoft OAuth2
   NEXT_PUBLIC_MS_CLIENT_ID=your_microsoft_client_id
   
   # WebSocket URL (for real-time notifications)
   NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
   
   # Optional: Use local backend (set to true for local development)
   NEXT_PUBLIC_USE_LOCAL_BACKEND=true
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   
   The frontend will be available at http://localhost:3000
   
   **Note**: The app uses Next.js App Router and supports both server and client components.

### Mobile Setup

1. **Navigate to the mobile directory**:
   ```bash
   cd ../../wildwatch_expo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**:
   
   Create a `.env` file in the `wildwatch_expo` directory:
   ```
   EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
   EXPO_PUBLIC_MS_CLIENT_ID=your_microsoft_client_id
   ```

   Or configure in `lib/config.ts` directly.

4. **Start the Expo development server**:
   ```bash
   npm start
   # or
   yarn start
   # or
   expo start
   ```

5. **Run on device/emulator**:
   - **iOS**: Press `i` to open in iOS Simulator (macOS only)
   - **Android**: Press `a` to open in Android Emulator, or scan QR code with Expo Go app
   - **Physical Device**: Scan the QR code with Expo Go app (iOS/Android)

   For development builds:
   ```bash
   npm run android  # For Android
   npm run ios     # For iOS (macOS only)
   ```

## Deployment

### Backend Deployment

The backend can be deployed to any Java-compatible hosting service (Render, Heroku, AWS, etc.):

1. **Build the JAR file**:
   ```bash
   # Windows
   mvnw.cmd clean package
   
   # Linux/Mac
   ./mvnw clean package
   ```

2. **Deploy to a server**:
   - Upload the JAR file from `target/WildWatch-0.0.1-SNAPSHOT.jar`
   - Configure environment variables on your hosting platform
   - Ensure PostgreSQL database is accessible
   - Start the application with:
     ```bash
     java -jar WildWatch-0.0.1-SNAPSHOT.jar
     ```

3. **Docker Deployment** (if using Dockerfile):
   ```bash
   docker build -t wildwatch-backend .
   docker run -p 8080:8080 --env-file .env wildwatch-backend
   ```

### Frontend Deployment

The Next.js frontend can be deployed to Vercel, Netlify, or any Node.js hosting:

1. **Build the production version**:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. **Deploy to Vercel** (Recommended):
   ```bash
   npm install -g vercel
   vercel --prod
   ```
   
   Or connect your GitHub repository to Vercel for automatic deployments.

3. **Environment Variables**:
   - Set `NEXT_PUBLIC_BACKEND_URL` to your production backend URL
   - Set `NEXT_PUBLIC_MS_CLIENT_ID` to your Microsoft OAuth client ID
   - Set `NEXT_PUBLIC_WS_URL` to your WebSocket URL (wss:// for secure)

### Mobile Deployment

The Expo mobile app can be built and deployed to app stores:

1. **Configure EAS Build** (if using Expo Application Services):
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

2. **Build for production**:
   ```bash
   # Android
   eas build --platform android --profile production
   
   # iOS
   eas build --platform ios --profile production
   ```

3. **Submit to app stores**:
   ```bash
   eas submit --platform android
   eas submit --platform ios
   ```

   Or manually upload the built artifacts to Google Play Store and Apple App Store.

## API Documentation

The backend API provides the following main endpoints:

### Core Endpoints
- **Authentication**: `/api/auth/*` - User registration, login, password management
- **Mobile Authentication**: `/api/mobile/auth/*` - Mobile-specific auth endpoints
- **Incidents**: `/api/incidents/*` - Incident CRUD operations, tracking, updates
- **Users**: `/api/users/*` - User profile management, search
- **Offices**: `/api/offices/*` - Office information and management

### Office Administration
- **Office Admin**: `/api/office-admin/*` - Case management, bulk operations, transfers
- **Office Bulletin**: `/api/office-bulletin/*` - Bulletin board management

### Gamification & Social
- **Rankings**: `/api/rank/*` - User rankings, leaderboard, progress
- **Badges**: `/api/badges/*` - Badge system, achievements
- **Ratings**: `/api/ratings/*` - Rating system, analytics

### AI & Analysis
- **Chatbot**: `/api/chatbot` - AI-powered chatbot (Google Gemini)
- **Incident Analysis**: `/api/incident-analysis/*` - Similar incidents, AI classification

### Utilities
- **Geolocation**: `/api/geolocation/*` - Location services
- **Tags**: `/api/tags/*` - Tag management
- **Activity Logs**: `/api/activity-logs/*` - Activity tracking
- **Terms**: `/api/terms/*` - Terms and conditions management

### WebSocket
- **Notifications**: `/ws/**` - Real-time notifications via STOMP

For detailed API documentation with interactive testing, run the backend and visit:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

## Project Structure

```
WildWatch/
├── backend/
│   └── WildWatch/
│       ├── src/main/java/com/teamhyungie/WildWatch/
│       │   ├── config/          # Configuration classes (Security, WebSocket, Cache, etc.)
│       │   ├── controller/      # REST API controllers (20 controllers)
│       │   ├── dto/             # Data Transfer Objects
│       │   ├── model/           # JPA entities (User, Incident, Badge, etc.)
│       │   ├── repository/      # JPA repositories
│       │   ├── security/        # Security configuration and filters
│       │   └── service/         # Business logic services (24 services)
│       ├── src/main/resources/  # Application properties, SQL scripts
│       ├── pom.xml              # Maven dependencies
│       └── Dockerfile           # Docker configuration
├── frontend/
│   └── wildwatch/
│       ├── src/
│       │   ├── app/             # Next.js App Router pages
│       │   ├── components/      # React components (78 components)
│       │   ├── contexts/        # React Context providers
│       │   ├── lib/             # Utility libraries
│       │   ├── types/           # TypeScript type definitions
│       │   └── utils/           # Utility functions
│       ├── public/              # Static assets
│       └── package.json
├── wildwatch_expo/
│   ├── app/                     # Expo Router pages
│   ├── src/
│   │   └── features/            # Feature-based modules
│   │       ├── auth/            # Authentication
│   │       ├── incidents/       # Incident management
│   │       ├── badges/         # Badge system
│   │       ├── ranking/        # Ranking system
│   │       ├── ratings/        # Rating system
│   │       └── ...              # Other features
│   ├── components/             # Shared components
│   ├── lib/                     # API clients, config, storage
│   └── package.json
└── README.md
```

## Additional Resources

- [Figma Design](https://www.figma.com/design/LECRx0PK3Fn1uTzRoxpS5K/Untitled?node-id=0-1&m=dev&t=fhjCKp0RQMycVBoM-1)
- [Backend Rankings Implementation](backend/WildWatch/RANKINGS_BACKEND_IMPLEMENTATION.md)
- [Frontend Rankings Implementation](frontend/wildwatch/RANKINGS_FRONTEND_IMPLEMENTATION.md)
- [Swagger Setup Documentation](backend/WildWatch/SWAGGER_SETUP.md)
- [Mobile Environment Setup](wildwatch_expo/ENVIRONMENT_SETUP.md)
- [Mobile Geolocation Documentation](wildwatch_expo/GEOLOCATION_README.md)

## Developers

- **Alec R. Arela** - BSIT-3
  - *Kill them with kindness*

- **Jhean Hecari B. Caag** - BSIT-3
  - *Life goes on...*

- **Jermaine L. Gadiano** - BSIT-3
  - *If You Begin To Regret, You'll Dull Your Future Decisions And Let Others Make Your Choices For You.*