# Environment Setup for WildWatch Expo

## Issue Resolution

The error "Unable to resolve '@env' from 'lib\config.ts'" occurs because the `.env` file is missing. This file contains environment variables needed for the app configuration.

## Solution

### Step 1: Create .env file

Create a `.env` file in the root of the `wildwatch_expo` directory with the following content:

```env
# WildWatch Expo Environment Configuration

# Backend API Configuration
# For physical device testing, use your local IP address instead of localhost
API_BASE_URL=http://192.168.1.5:8080/api
API_TIMEOUT=30000

# Microsoft OAuth Configuration
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_TENANT_ID=your_microsoft_tenant_id_here
MICROSOFT_REDIRECT_URI=wildwatchexpo://auth/oauth2/callback

# App Configuration
APP_NAME=WildWatch
APP_VERSION=1.0.0
```

### Step 2: Fill in your values

Replace the empty values with your actual configuration:

- `MICROSOFT_CLIENT_ID`: Your Microsoft Azure app registration client ID
- `MICROSOFT_TENANT_ID`: Your Microsoft Azure tenant ID

### Step 3: Restart the development server

After creating the `.env` file, restart your Expo development server:

```bash
npm start
# or
expo start
```

## Physical Device Testing

When testing on a physical iPhone/Android device, you need to use your computer's local IP address instead of `localhost`:

1. **Find your local IP address:**
   - Windows: Run `ipconfig` in Command Prompt
   - Mac/Linux: Run `ifconfig` in Terminal
   - Look for your main network adapter's IPv4 address (usually starts with 192.168.x.x)

2. **Update the API_BASE_URL in your .env file:**
   ```env
   API_BASE_URL=http://YOUR_LOCAL_IP:8080/api
   ```

3. **Configure Microsoft OAuth (if using Microsoft login):**
   - Get your Microsoft Client ID and Tenant ID from Azure Portal
   - Update the .env file with your Microsoft OAuth credentials
   - The redirect URI is automatically configured as `wildwatchexpo://auth/oauth2/callback`

4. **Make sure your backend server is running and accessible:**
   - Ensure your backend server is running on port 8080
   - Check that your firewall allows connections on port 8080
   - Verify both your computer and phone are on the same WiFi network

## Alternative: Using Default Values

If you don't need to configure environment variables right now, the app will use default values. The configuration has been updated to handle missing environment variables gracefully and includes the local IP address for physical device testing.

## File Structure

```
wildwatch_expo/
├── .env                 # Environment variables (create this file)
├── lib/
│   ├── config.ts       # Configuration file
│   └── env.d.ts        # TypeScript declarations for @env
├── babel.config.js     # Babel configuration with react-native-dotenv
└── tsconfig.json       # TypeScript configuration
```

## Dependencies

The project uses `react-native-dotenv` to load environment variables. This is already configured in:

- `package.json` - dependency installed
- `babel.config.js` - babel plugin configured
- `lib/env.d.ts` - TypeScript declarations
- `tsconfig.json` - TypeScript configuration updated