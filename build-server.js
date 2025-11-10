import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildServer() {
  try {
    console.log('Building server with TypeScript...');
    
    // Use TypeScript compiler with server config, skip type checking for faster builds
    execSync('npx tsc --project tsconfig.server.json --noCheck', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    
    console.log('Fixing import paths...');
    execSync('node fix-imports.js', {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    console.log('Creating entry point...');
    // Create dist/index.js entry point for production
    const fs = await import('fs');
    const entryPoint = `// Production entry point
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Import and register routes
const { registerRoutes } = await import('./server/routes.js');
const { registerAdminRoutes } = await import('./server/admin-routes.js');

const server = await registerRoutes(app);
registerAdminRoutes(app);

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server running on port \${PORT}\`);
  console.log(\`WebSocket ready at ws://localhost:\${PORT}/ws\`);
});
`;
    
    fs.default.writeFileSync(path.join(__dirname, 'dist', 'index.js'), entryPoint);
    console.log('✓ Entry point created at dist/index.js');
    
    console.log('✓ Server build completed successfully');
  } catch (error) {
    console.error('Server build failed:', error);
    process.exit(1);
  }
}

buildServer();
