import { URL } from "url";
import dns from "dns/promises";

// Disallowed private / reserved IPv4 & IPv6 blocks
const PRIVATE_IP_PATTERNS = [
  /^127\./,                 // 127.0.0.0/8 (Loopback)
  /^10\./,                  // 10.0.0.0/8 (Private)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 (Private)
  /^192\.168\./,            // 192.168.0.0/16 (Private)
  /^169\.254\./,            // 169.254.0.0/16 (Link Local, AWS/Cloud metadata)
  /^0\./,                   // 0.0.0.0/8
  /^localhost$/i,
  /^::1$/,                  // IPv6 loopback
  /^fc00:/i,                // IPv6 unique local
  /^fe80:/i,                // IPv6 link local
];

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  headers?: Record<string, string>;
}

/**
 * Validates that a target URL is safe to fetch and not attempting SSRF into internal networks.
 */
export async function validateSafeUrl(rawUrl: string): Promise<{ isSafe: boolean; reason?: string; parsedUrl?: URL }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { isSafe: false, reason: "Format URL tidak valid." };
  }

  // Only allow HTTP and HTTPS
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { isSafe: false, reason: `Protokol '${parsed.protocol}' dilarang. Hanya http/https yang diizinkan.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check known private hostnames
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { isSafe: false, reason: `Akses ke alamat jaringan privat/lokal (${hostname}) diblokir demi keamanan SSRF.` };
    }
  }

  // Resolve DNS to verify actual IP
  try {
    const addresses = await dns.resolve(hostname);
    for (const ip of addresses) {
      for (const pattern of PRIVATE_IP_PATTERNS) {
        if (pattern.test(ip)) {
          return { isSafe: false, reason: `Resolusi DNS domain mengarah ke IP privat (${ip}). Permintaan dibatalkan.` };
        }
      }
    }
  } catch (err: any) {
    // If DNS resolution fails, reject
    return { isSafe: false, reason: `Gagal memverifikasi DNS hostname: ${err.message}` };
  }

  return { isSafe: true, parsedUrl: parsed };
}

/**
 * Performs a safe fetch with timeout, size limits, and SSRF guards
 */
export async function safeFetchText(url: string, options: SafeFetchOptions = {}): Promise<string> {
  const timeoutMs = options.timeoutMs || 12000; // 12 seconds
  const maxBytes = options.maxBytes || 5 * 1024 * 1024; // 5 MB

  const validation = await validateSafeUrl(url);
  if (!validation.isSafe) {
    throw new Error(`Permintaan URL ditolak: ${validation.reason}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "CatatanNegeri-Bot/1.0 (+https://catatannegeri.com; redaksi@catatannegeri.com)",
        Accept: "application/rss+xml, application/xml, text/xml, application/atom+xml, application/json, text/html",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }

    // Check content-length header if provided
    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      throw new Error(`Ukuran data respon (${contentLength} bytes) melebihi batas aman 5MB.`);
    }

    const text = await res.text();
    if (Buffer.byteLength(text, "utf8") > maxBytes) {
      throw new Error("Ukuran berkas melebihi batas aman 5MB.");
    }

    return text;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`Permintaan waktu habis (timeout ${timeoutMs}ms) saat menghubungi sumber.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

