import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const outDir = path.join(rootDir, "out");
const publicDir = path.join(rootDir, "public");

const arg = process.argv[2];

if (!arg) {
  console.log("Penggunaan:");
  console.log("  1. Jika menggunakan Tag HTML / Kode Verifikasi:");
  console.log("     node scripts/add-google-verification.mjs \"google-site-verification-code-disini\"");
  console.log("     atau");
  console.log("     node scripts/add-google-verification.mjs \"<meta name='google-site-verification' content='...' />\"");
  console.log("  2. Jika menggunakan File HTML:");
  console.log("     node scripts/add-google-verification.mjs \"google1234567890abcdef.html\"");
  process.exit(1);
}

if (arg.endsWith(".html") && arg.startsWith("google")) {
  // Option: File HTML Verification
  const fileName = path.basename(arg);
  const fileContent = `google-site-verification: ${fileName}`;

  fs.writeFileSync(path.join(publicDir, fileName), fileContent, "utf8");
  fs.writeFileSync(path.join(outDir, fileName), fileContent, "utf8");
  console.log(`✔ Berhasil membuat berkas verifikasi: public/${fileName} dan out/${fileName}`);
} else {
  // Option: Meta Tag Verification
  let token = arg;
  const match = arg.match(/content=["']([^"']+)["']/i);
  if (match) token = match[1];
  token = token.trim();

  console.log(`Memasang token verifikasi Google: ${token}`);

  const metaTag = `<meta name="google-site-verification" content="${token}">`;

  // Inject into out/index.html
  const indexHtmlPath = path.join(outDir, "index.html");
  if (fs.existsSync(indexHtmlPath)) {
    let html = fs.readFileSync(indexHtmlPath, "utf8");
    if (!html.includes("google-site-verification")) {
      html = html.replace("</head>", `  ${metaTag}\n</head>`);
      fs.writeFileSync(indexHtmlPath, html, "utf8");
      console.log("✔ Berhasil menyematkan meta tag ke out/index.html");
    }
  }

  // Inject into .env
  const envPath = path.join(rootDir, ".env");
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  if (env.includes("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=")) {
    env = env.replace(/NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=.*/g, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="${token}"`);
  } else {
    env += `\nNEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="${token}"\n`;
  }
  fs.writeFileSync(envPath, env, "utf8");
  console.log("✔ Berhasil menyimpan ke .env");
}

console.log("Melakukan commit dan push ke Cloudflare Pages...");
try {
  execSync("git add . && git commit -m 'chore(seo): add google search console verification' && git push origin main", {
    cwd: rootDir,
    stdio: "inherit",
  });
  console.log("🎉 Selesai! Verifikasi telah terpasang langsung di domain https://catatannegeri.com");
} catch (e) {
  console.log("Catatan: Silakan jalankan 'git push origin main' jika belum ter-push otomatis.");
}
