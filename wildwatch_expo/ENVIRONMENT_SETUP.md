# Environment Variables Setup

This document explains how to set up environment variables for the WildWatch Expo app.

## Required Environment Variables

Create a `.env` file in the root of the `wildwatch_expo` directory with the following variables:

```bash
# Backend API Configuration
API_BASE_URL=http://192.168.1.34:8080/api
API_TIMEOUT=30000

# Microsoft OAuth Configuration
MICROSOFT_CLIENT_ID=39e32928-3be0-4723-b913-0ddd50c5d205
MICROSOFT_TENANT_ID=823cde44-4433-456d-b801-bdf0ab3d41fc
MICROSOFT_REDIRECT_URI=wildwatchexpo://auth/oauth2/callback

# App Configuration
APP_NAME=WildWatch
APP_VERSION=1.0.0
```

## Important Notes

1. **Never commit the `.env` file** to version control
2. **The `.env` file is already in `.gitignore`**
3. **Use `.env.example` as a template** for team members
4. **Restart the development server** after creating/modifying the `.env` file

## Development vs Production

For different environments, you can create:
- `.env.development` - Development environment
- `.env.production` - Production environment
- `.env.local` - Local overrides (already gitignored)

## Troubleshooting

If environment variables are not loading:
1. Make sure the `.env` file is in the root directory
2. Restart the Expo development server
3. Check that `react-native-dotenv` is properly configured in `babel.config.js`
4. Verify the variable names match exactly (case-sensitive)

## Security

- Keep your `.env` file secure and never share it publicly
- Use different values for development and production
- Consider using Expo's secure store for highly sensitive data
