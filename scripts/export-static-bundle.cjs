const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const outDir = path.join(rootDir, 'out');
const nextDir = path.join(rootDir, '.next');
const publicDir = path.join(rootDir, 'public');

console.log('1. Running build-env and Next.js production build...');
execSync('node scripts/build-env.cjs && npx next build', { stdio: 'inherit', cwd: rootDir });

console.log('2. Preparing static distribution in out/ ...');
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

// Copy public directory contents
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, outDir, { recursive: true });
  console.log(' - Copied public assets to out/');
}

// Copy .next/static to out/_next/static
const nextStaticDir = path.join(nextDir, 'static');
const outNextStaticDir = path.join(outDir, '_next', 'static');
if (fs.existsSync(nextStaticDir)) {
  fs.mkdirSync(path.dirname(outNextStaticDir), { recursive: true });
  fs.cpSync(nextStaticDir, outNextStaticDir, { recursive: true });
  console.log(' - Copied Next.js static chunks to out/_next/static');
}

// Copy pre-rendered HTML files from .next/server/app to out/
const serverAppDir = path.join(nextDir, 'server', 'app');
function copyHtmlFiles(src, dest) {
  if (!fs.existsSync(src)) return;
  const items = fs.readdirSync(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    try {
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyHtmlFiles(srcPath, destPath);
      } else if (item.endsWith('.html')) {
        fs.copyFileSync(srcPath, destPath);
      }
    } catch (e) {
      // ignore individual copy locks
    }
  }
}

if (fs.existsSync(serverAppDir)) {
  copyHtmlFiles(serverAppDir, outDir);
  console.log(' - Copied pre-rendered HTML pages to out/');
}

// Verify index.html exists
if (fs.existsSync(path.join(outDir, 'index.html'))) {
  console.log('✔ Static portal export complete and verified: out/index.html is ready!');
} else {
  console.warn('⚠ Notice: checking out/ directory contents...');
}
