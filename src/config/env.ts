// Environment configuration
export const config = {
  API_BASE_URL: 'http://192.168.1.8:3000/api/v1',
  // API_BASE_URL: 'https://nodeapi-production-08e7.up.railway.app/api/v1',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
};

