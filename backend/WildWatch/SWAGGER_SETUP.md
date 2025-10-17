# Swagger API Documentation Setup

## Overview

Swagger (OpenAPI) has been successfully configured for the WildWatch backend API. This provides interactive API documentation that allows developers to explore and test API endpoints.

## Access Points

### Swagger UI

- **Local Development**: http://localhost:8080/swagger-ui.html
- **Production**: https://wildwatch-backend.onrender.com/swagger-ui.html

### OpenAPI JSON

- **Local Development**: http://localhost:8080/v3/api-docs
- **Production**: https://wildwatch-backend.onrender.com/v3/api-docs

## Features Configured

### 1. Authentication

- JWT Bearer token authentication is configured
- Use the "Authorize" button in Swagger UI to add your JWT token
- Token format: `Bearer <your-jwt-token>`

### 2. API Documentation

- Comprehensive API information including:
  - API title: "WildWatch API"
  - Version: 2.0.0
  - Description: Complete incident reporting and management system
  - Contact information
  - License information

### 3. Security

- Bearer token authentication is properly configured
- Swagger UI endpoints are accessible without authentication
- All other endpoints require proper JWT authentication

### 4. Endpoint Documentation

- Authentication endpoints (login, register, profile)
- Incident management endpoints
- User management endpoints
- And more...

## How to Use

1. **Start the Application**

   ```bash
   ./mvnw spring-boot:run
   ```

2. **Access Swagger UI**

   - Navigate to http://localhost:8080/swagger-ui.html

3. **Authenticate**

   - Click the "Authorize" button
   - Enter your JWT token in the format: `Bearer <token>`
   - Click "Authorize"

4. **Test Endpoints**
   - Expand any endpoint
   - Click "Try it out"
   - Fill in required parameters
   - Click "Execute"

## Configuration Details

### Dependencies Added

- `springdoc-openapi-starter-webmvc-ui` (version 2.6.0)

### Configuration Files Modified

- `pom.xml` - Added Swagger dependency
- `OpenApiConfig.java` - OpenAPI configuration
- `SecurityConfig.java` - Allowed Swagger UI access
- `application.properties` - Swagger UI settings

### Controllers Documented

- `AuthController` - Authentication endpoints
- `IncidentController` - Incident management endpoints

## Additional Features

### Customization

The OpenAPI configuration can be customized in `OpenApiConfig.java`:

- API information (title, description, version)
- Server configurations
- Security schemes
- Contact and license information

### Adding More Documentation

To add Swagger annotations to other controllers:

1. Add the `@Tag` annotation to the controller class
2. Add `@Operation` annotations to methods
3. Add `@ApiResponses` for response documentation
4. Use `@SecurityRequirement` for protected endpoints

## Troubleshooting

### Common Issues

1. **Swagger UI not accessible**: Check if the application is running on the correct port
2. **Authentication errors**: Ensure JWT token is properly formatted with "Bearer " prefix
3. **CORS issues**: Verify CORS configuration in SecurityConfig.java

### Security Notes

- Swagger UI is accessible without authentication for development purposes
- All API endpoints (except public ones) require proper JWT authentication
- Never commit sensitive API keys or tokens to version control
