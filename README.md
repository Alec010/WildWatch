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
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Mobile Setup](#mobile-setup)
- [Deployment](#deployment)
  - [Backend Deployment](#backend-deployment)
  - [Frontend Deployment](#frontend-deployment)
- [API Documentation](#api-documentation)
- [Additional Resources](#additional-resources)
- [Developers](#developers)

## About WildWatch

### Product Description

WildWatch is an official incident reporting system for Cebu Institute of Technology - University (CIT-U). It provides a structured and confidential platform for students, faculty, and staff to report concerns and incidents. This centralized system enhances campus safety, streamlines reporting, and ensures proper resolution by directing reports to the appropriate university departments.

### System Architecture

WildWatch follows a modern multi-tier architecture:

- **Frontend**: Next.js web application with responsive design
- **Backend**: Spring Boot RESTful API
- **Mobile**: Android application built with Kotlin and Jetpack Compose
- **Database**: PostgreSQL for data persistence
- **AI Integration**: Google Gemini AI for chatbot and incident classification

The system uses JWT authentication with Microsoft OAuth2 integration for secure access.

## Features

### Web Functionalities

1. **Login/Sign-Up with Microsoft** – Secure and convenient access through Microsoft authentication.
2. **Incident Report Submission & Tracking** – Users can file incident reports with details such as location, description, and supporting evidence (images/videos) and track the status of their reports.
3. **Department Selection for Case Submission** – Users can categorize their reports by selecting the relevant department, ensuring that incidents are directed to the appropriate office for proper handling.
4. **Automated Notifications (Email & SMS)** – Users receive real-time updates on report status through automated email and SMS alerts.
5. **Incident Dashboard** – Admins can view a summary of reported incidents, generate reports.
6. **User Feedback & Follow-Up Requests** – Users can provide feedback on how their reports were handled and request follow-ups if further action is needed.
7. **AI-Powered Chatbot** - Provides assistance and answers questions about the incident reporting process.

### Mobile Functionalities

1. **Login/Sign-Up with Microsoft or Biometrics** – Secure access through social logins or biometric authentication for faster entry.
2. **Quick Incident Reporting** – Easily submit reports with descriptions, location, and optional image or video uploads.
3. **Real-Time Case Tracking** – Users can check the status of their submitted reports and receive updates from the assigned department.
4. **In-App & Automated SMS/Email Notifications** – Users receive push notifications for status updates within the app and automated SMS/email alerts for critical incidents.
5. **Emergency Alert Feature** – Enables users to quickly notify campus security of urgent situations, sharing their live location for faster response.
6. **Incident History & Report Archive** – Users can view their past incident reports and access archived reports for reference.

## Getting Started

### Prerequisites

To run WildWatch locally, you'll need:

- **Backend**:
  - JDK 17 or higher
  - Maven 3.8+
  - PostgreSQL 13+
  
- **Frontend**:
  - Node.js 18+
  - npm 9+ or yarn 1.22+
  
- **Mobile**:
  - Android Studio Arctic Fox or newer
  - Android SDK 33+
  - Kotlin 1.8+

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

2. **Configure environment variables**:
   
   Create a `.env` file in the backend root directory with the following variables:
   ```
   DB_URL=jdbc:postgresql://localhost:5432/wildwatch
   DB_USER=your_db_username
   DB_PASSWORD=your_db_password
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRATION=86400000
   MS_CLIENT_ID=your_microsoft_client_id
   MS_CLIENT_SECRET=your_microsoft_client_secret
   MS_TENANT_ID=your_microsoft_tenant_id
   MS_REDIRECT_URI=http://localhost:8080/login/oauth2/code/microsoft
   FRONTEND_URL=http://localhost:3000
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Build and run the backend**:
   ```bash
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```
   
   The backend server will start on http://localhost:8080

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
   
   Create a `.env.local` file in the frontend directory:
   ```
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
   NEXT_PUBLIC_MS_CLIENT_ID=your_microsoft_client_id
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   
   The frontend will be available at http://localhost:3000

### Mobile Setup

1. **Open Android Studio**

2. **Open the project**:
   - Navigate to File > Open
   - Select the `mobile/WildWatch` directory

3. **Configure local properties**:
   
   Create a `local.properties` file in the mobile/WildWatch directory:
   ```
   sdk.dir=/path/to/your/android/sdk
   backendUrl=http://10.0.2.2:8080
   msClientId=your_microsoft_client_id
   ```

4. **Build and run the app**:
   - Connect an Android device or start an emulator
   - Click the Run button in Android Studio

## Deployment

### Backend Deployment

The backend can be deployed to any Java-compatible hosting service:

1. **Build the JAR file**:
   ```bash
   ./mvnw clean package
   ```

2. **Deploy to a server**:
   - Upload the JAR file from `target/WildWatch-0.0.1-SNAPSHOT.jar`
   - Configure environment variables on your hosting platform
   - Start the application with `java -jar WildWatch-0.0.1-SNAPSHOT.jar`

### Frontend Deployment

The Next.js frontend can be deployed to Vercel or any Node.js hosting:

1. **Build the production version**:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel --prod
   ```

## API Documentation

The backend API provides the following main endpoints:

- **Authentication**: `/api/auth/*`
- **Incidents**: `/api/incidents/*`
- **Users**: `/api/users/*`
- **Offices**: `/api/offices/*`
- **Chatbot**: `/api/chatbot`

For detailed API documentation, run the backend and visit:
http://localhost:8080/swagger-ui.html

## Additional Resources

- [Figma Design](https://www.figma.com/design/LECRx0PK3Fn1uTzRoxpS5K/Untitled?node-id=0-1&m=dev&t=fhjCKp0RQMycVBoM-1)
- [System Architecture Diagram](https://visualparadigm.com) (Visual Paradigm)

## Developers

- **Alec R. Arela** - BSIT-3
  - *Kill them with kindness*

- **Jhean Hecari B. Caag** - BSIT-3
  - *Life goes on...*

- **Jermaine L. Gadiano** - BSIT-3
  - *If You Begin To Regret, You'll Dull Your Future Decisions And Let Others Make Your Choices For You.*