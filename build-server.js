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
    
    console.log('✓ Server build completed successfully');
  } catch (error) {
    console.error('Server build failed:', error);
    process.exit(1);
  }
}

buildServer();
