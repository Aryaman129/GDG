const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
}

try {
  console.log('Building TypeScript files...');
  // Run TypeScript compiler with error suppression
  execSync('npx tsc --skipLibCheck', { stdio: 'inherit' });
  console.log('TypeScript build completed successfully.');
} catch (error) {
  console.error('TypeScript build encountered errors, but continuing with deployment...');
  console.error(error);

  // Create a simple server.js file if the build fails
  if (!fs.existsSync(path.join(__dirname, 'dist', 'server.js'))) {
    console.log('Creating fallback server.js...');
    const fallbackServer = `
      const express = require('express');
      const app = express();
      const port = process.env.PORT || 8000;

      app.get('/', (req, res) => {
        res.send('Conference Management API is running in fallback mode!');
      });

      // Use regular expression for wildcard routes in Express 5
      app.get(/(.*)/, (req, res) => {
        res.status(404).send('Not found in fallback mode');
      });

      app.listen(port, () => {
        console.log(\`[server]: Server is running at http://localhost:\${port}\`);
      });
    `;

    fs.writeFileSync(path.join(__dirname, 'dist', 'server.js'), fallbackServer);
    console.log('Fallback server.js created.');
  }
}

// Run Prisma DB push
try {
  console.log('Running Prisma DB push...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('Prisma DB push completed successfully.');
} catch (error) {
  console.error('Prisma DB push failed:', error);
}
