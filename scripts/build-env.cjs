// Memastikan build tidak gagal di Cloudflare Pages / CI jika environment variable belum diisi
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envProdPath = path.join(__dirname, '..', '.env.production');

if (!fs.existsSync(envPath) && !fs.existsSync(envProdPath)) {
  const defaultEnv = [
    'DATABASE_URL="postgresql://dummy:dummy@localhost:5432/catatannegeri?schema=public"',
    'NEXT_PUBLIC_SITE_URL="https://catatannegeri.com"',
    'JWT_SECRET="catatan-negeri-fallback-secret-for-build-safety-32chars"',
    'NODE_ENV="production"',
  ].join('\n');
  fs.writeFileSync(envProdPath, defaultEnv);
  console.log('Created build-time fallback environment file at .env.production');
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/catatannegeri?schema=public";
}
if (!process.env.NEXT_PUBLIC_SITE_URL) {
  process.env.NEXT_PUBLIC_SITE_URL = "https://catatannegeri.com";
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "catatan-negeri-fallback-secret-for-build-safety-32chars";
}

const { execSync } = require("child_process");
try {
  console.log("Running prisma generate...");
  execSync("npx prisma generate", { stdio: "inherit", env: process.env });
} catch (err) {
  console.error("Prisma generate error:", err.message);
}
