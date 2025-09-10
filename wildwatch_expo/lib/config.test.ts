// Test configuration to verify environment variables are working
import { config } from './config';

console.log('Configuration loaded successfully:');
console.log('API Base URL:', config.API.BASE_URL);
console.log('API Timeout:', config.API.TIMEOUT);
console.log('Microsoft Client ID:', config.MICROSOFT.CLIENT_ID);
console.log('Microsoft Tenant ID:', config.MICROSOFT.TENANT_ID);
console.log('App Name:', config.APP.NAME);
console.log('App Version:', config.APP.VERSION);

// Verify that sensitive data is not hardcoded
const hasHardcodedValues = 
  config.API.BASE_URL === 'http://192.168.1.34:8080/api' ||
  config.MICROSOFT.CLIENT_ID === '39e32928-3be0-4723-b913-0ddd50c5d205' ||
  config.MICROSOFT.TENANT_ID === '823cde44-4433-456d-b801-bdf0ab3d41fc';

if (hasHardcodedValues) {
  console.warn('⚠️  Warning: Some values appear to be hardcoded!');
} else {
  console.log('✅ All sensitive values are properly loaded from environment variables');
}
