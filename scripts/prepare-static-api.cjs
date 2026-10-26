const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) results = results.concat(walk(full));
    else if (item === 'route.ts' || item === 'route.js') results.push(full);
  }
  return results;
}

const apiRoutes = walk(path.join(__dirname, '..', 'src', 'app', 'api'));

for (const routePath of apiRoutes) {
  let content = fs.readFileSync(routePath, 'utf8');
  let changed = false;

  if (!content.includes('export const dynamic')) {
    content = 'export const dynamic = "force-static";\n' + content;
    changed = true;
  }

  if (routePath.includes('[id]') || routePath.includes('[')) {
    if (!content.includes('generateStaticParams')) {
      content += '\nexport async function generateStaticParams() {\n  return [];\n}\n';
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(routePath, content);
    console.log('Updated static route:', path.relative(path.join(__dirname, '..'), routePath));
  }
}

console.log('All API routes prepared for static export!');

