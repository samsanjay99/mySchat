import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fixImports() {
  try {
    console.log('Fixing import paths...');
    
    // Get all JS files in dist directory
    const files = await glob('dist/**/*.js');
    
    let fixedCount = 0;
    
    for (const file of files) {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;
      
      // Fix @shared imports
      if (content.includes('@shared/')) {
        // Calculate relative path from current file to shared directory
        const fileDir = path.dirname(file);
        const sharedDir = path.join(__dirname, 'dist', 'shared');
        const relativePath = path.relative(fileDir, sharedDir).replace(/\\/g, '/');
        
        // Replace @shared/ with relative path
        content = content.replace(/@shared\//g, `${relativePath}/`);
        modified = true;
      }
      
      // Fix relative imports without .js extension
      // Match: from './something' or from '../something' but not from './something.js'
      content = content.replace(/from\s+['"](\.\.[\/\\][^'"]+?)(?<!\.js)['"]/g, "from '$1.js'");
      content = content.replace(/from\s+['"](\.[\/\\][^'"]+?)(?<!\.js)['"]/g, "from '$1.js'");
      
      // Fix import statements without .js extension
      content = content.replace(/import\s+['"](\.\.[\/\\][^'"]+?)(?<!\.js)['"]/g, "import '$1.js'");
      content = content.replace(/import\s+['"](\.[\/\\][^'"]+?)(?<!\.js)['"]/g, "import '$1.js'");
      
      if (content !== fs.readFileSync(file, 'utf8')) {
        fs.writeFileSync(file, content, 'utf8');
        fixedCount++;
        modified = true;
      }
    }
    
    console.log(`✓ Fixed imports in ${fixedCount} files`);
  } catch (error) {
    console.error('Failed to fix imports:', error);
    process.exit(1);
  }
}

fixImports();
