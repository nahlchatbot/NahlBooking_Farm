import app from './app.js';
import { config, validateEnv } from './config/index.js';
import prisma from './config/database.js';

async function main() {
  try {
    // Validate environment variables
    validateEnv();

    // Test database connection
    await prisma.$connect();
    console.log('✓ Database connected');

    // Start server
    app.listen(config.port, () => {
      console.log(`✓ Server running on port ${config.port}`);
      console.log(`  Environment: ${config.nodeEnv}`);
      console.log(`  Health check: http://localhost:${config.port}/health`);
      console.log(`  API: http://localhost:${config.port}/api`);

      if (!config.isProduction) {
        console.log(`  Admin login: POST http://localhost:${config.port}/api/admin/auth/login`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
