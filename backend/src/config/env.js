import 'dotenv/config';

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name} (voir .env.example)`);
  }
  return value;
};

const authMode = process.env.AUTH_MODE || 'dev';

if (process.env.NODE_ENV === 'production' && authMode === 'dev') {
  throw new Error('AUTH_MODE=dev est interdit en production.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  databaseUrl: required('DATABASE_URL'),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  authMode,
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
};
