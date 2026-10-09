import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

const server = app.listen(env.port, async () => {
  console.log(`API ETIC sur http://localhost:${env.port}/api  (auth: ${env.authMode})`);
  try {
    await pool.query('SELECT 1');
    console.log('Base de données : connexion OK');
  } catch (err) {
    console.error(`Base de données inaccessible : ${err.message}\n→ Vérifiez DATABASE_URL puis lancez "npm run db:reset".`);
  }
});

const shutdown = () => server.close(() => pool.end().then(() => process.exit(0)));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
