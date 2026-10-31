import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const INTERVAL_MINUTES = parseInt(process.env.INTERVAL_MINUTES || "30", 10);
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

console.log("==================================================================");
console.log("🤖 CATATAN NEGERI: AUTO-PUBLISHER DAEMON (BACKGROUND ROBOT)");
console.log(`   Interval Pemeriksaan : Setiap ${INTERVAL_MINUTES} Menit`);
console.log("   Mode Publikasi       : 100% Otomatis Langsung Terbit");
console.log("   Target Media         : 15 Saluran Media Arus Utama Nasional");
console.log("==================================================================");

async function runCycle() {
  const timestamp = new Date().toLocaleString("id-ID");
  console.log(`\n[${timestamp}] 🚀 Memulai siklus auto-publish berita nasional...`);

  try {
    // 1. Fetch, rewrite with AI, and publish to DB & portal-data.json
    execSync("node scripts/sync-national-news.mjs", { stdio: "inherit", cwd: rootDir });

    // 2. Finalize static distribution and sitemaps
    console.log(`[${timestamp}] 📦 Memperbarui peta situs XML, RSS feed, dan bundle statis...`);
    execSync("node scripts/finalize-static-out.cjs", { stdio: "inherit", cwd: rootDir });

    console.log(`[${timestamp}] ✅ Siklus selesai dengan sukses! Berita langsung aktif.`);
  } catch (err) {
    console.error(`[${timestamp}] ⚠️ Kendala saat siklus auto-publish:`, err.message);
  }

  console.log(`⏳ Menunggu siklus berikutnya dalam ${INTERVAL_MINUTES} menit...\n`);
}

// Run immediately on launch
runCycle();

// Repeat every INTERVAL_MS
setInterval(runCycle, INTERVAL_MS);

