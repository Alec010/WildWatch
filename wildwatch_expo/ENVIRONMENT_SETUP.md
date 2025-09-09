# Environment Setup for WildWatch Expo

We use Expo’s built-in environment variable support. Public variables are inlined at build time when prefixed with `EXPO_PUBLIC_` and referenced as `process.env.EXPO_PUBLIC_*` in the code. See: [Expo docs on environment variables](https://docs.expo.dev/guides/environment-variables).

## 1) Create .env file (public vars only)

Create `wildwatch_expo/.env`:

```env
# Backend API Configuration
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.5:8080/api
EXPO_PUBLIC_API_TIMEOUT=30000

# Microsoft OAuth Configuration (public identifiers)
EXPO_PUBLIC_MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
EXPO_PUBLIC_MICROSOFT_TENANT_ID=your_microsoft_tenant_id_here
EXPO_PUBLIC_MICROSOFT_REDIRECT_URI=wildwatchexpo://auth/oauth2/callback

# App Configuration
EXPO_PUBLIC_APP_NAME=WildWatch
EXPO_PUBLIC_APP_VERSION=1.0.0
```

Do not put secrets in `EXPO_PUBLIC_` variables, they are bundled into the app.

## 2) Usage in code

Values are read directly in code without extra plugins. Example in `lib/config.ts`:

```ts
const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
```

## 3) Restart the dev server

After adding or changing `.env` values:

```bash
npx expo start --clear
```

## Physical device testing

- Use your machine’s LAN IP in `EXPO_PUBLIC_API_BASE_URL` (e.g., `http://YOUR_LOCAL_IP:8080/api`).
- Ensure your backend is reachable from the device and both are on the same network.

## File structure

```
wildwatch_expo/
├── .env                 # Expo environment variables (create this)
├── lib/
│   ├── config.ts       # Reads process.env.EXPO_PUBLIC_*
│   └── env.d.ts        # TypeScript declarations for process.env
├── babel.config.js     # Babel config (no dotenv plugin required)
└── tsconfig.json
```

## Secrets

For sensitive values, use EAS Secrets and read them within `app.config.ts`, passing only necessary data to `extra`. Do not expose secrets via `EXPO_PUBLIC_*`.