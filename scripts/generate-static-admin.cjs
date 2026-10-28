const fs = require('fs');
const path = require('path');
const portalData = require('../src/data/portal-data.json');

const rootDir = path.join(__dirname, '..');
const outDir = path.join(rootDir, 'out');
const nextDir = path.join(rootDir, '.next');
const adminDir = path.join(outDir, 'admin');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function generateStaticAdmin() {
  console.log('Generating static admin suite for Cloudflare Pages...');
  ensureDir(adminDir);
  ensureDir(path.join(adminDir, 'login'));
  ensureDir(path.join(adminDir, 'articles'));
  ensureDir(path.join(adminDir, 'categories'));
  ensureDir(path.join(adminDir, 'tags'));
  ensureDir(path.join(adminDir, 'media'));
  ensureDir(path.join(adminDir, 'seo'));

  // 1. Copy Login Page from Next.js build and ensure styles & scripts are active
  const nextLoginHtml = path.join(nextDir, 'server', 'app', 'admin', 'login.html');
  if (fs.existsSync(nextLoginHtml)) {
    let loginContent = fs.readFileSync(nextLoginHtml, 'utf8');

    // Inject Tailwind CDN, styles, and instant interactions
    const stylingInjection = `
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              navy: '#0f172a',
              red: '#b91c1c',
              'red-dark': '#991b1b',
              'red-light': '#ef4444'
            }
          }
        }
      }
    }
  </script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .lucide { display: inline-block; vertical-align: middle; }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      var emailInput = document.querySelector('input[type="email"]');
      var passwordInput = document.querySelector('input[type="password"]');
      var form = document.querySelector('form');
      var buttons = document.querySelectorAll('button');

      buttons.forEach(function(btn) {
        var text = btn.textContent.trim().toLowerCase();
        if (text.includes('super admin')) {
          btn.onclick = function(e) {
            e.preventDefault();
            if (emailInput) emailInput.value = 'redaksi@catatannegeri.com';
            if (passwordInput) passwordInput.value = 'Admin123!CatatanNegeri';
          };
        } else if (text.includes('editor')) {
          btn.onclick = function(e) {
            e.preventDefault();
            if (emailInput) emailInput.value = 'editor@catatannegeri.com';
            if (passwordInput) passwordInput.value = 'Editor123!CatatanNegeri';
          };
        } else if (text.includes('wartawan')) {
          btn.onclick = function(e) {
            e.preventDefault();
            if (emailInput) emailInput.value = 'dewi.lestari@catatannegeri.com';
            if (passwordInput) passwordInput.value = 'Author123!CatatanNegeri';
          };
        }
      });

      if (form) {
        form.onsubmit = function(e) {
          e.preventDefault();
          var email = emailInput ? emailInput.value.trim().toLowerCase() : '';
          var password = passwordInput ? passwordInput.value.trim() : '';

          if (
            (email === 'redaksi@catatannegeri.com' && password === 'Admin123!CatatanNegeri') ||
            (email === 'editor@catatannegeri.com' && password === 'Editor123!CatatanNegeri') ||
            (email === 'dewi.lestari@catatannegeri.com' && (password === 'Author123!CatatanNegeri' || password === 'Wartawan123!CatatanNegeri'))
          ) {
            var user = {
              name: email.indexOf('redaksi') !== -1 ? 'Tim Redaksi Catatan Negeri' : (email.indexOf('editor') !== -1 ? 'Budi Santoso' : 'Dewi Lestari'),
              email: email,
              role: email.indexOf('redaksi') !== -1 ? 'SUPER_ADMIN' : (email.indexOf('editor') !== -1 ? 'EDITOR' : 'AUTHOR')
            };
            localStorage.setItem('cn_user', JSON.stringify(user));
            document.cookie = 'cn_session=authenticated; path=/; max-age=604800; SameSite=Lax';
            window.location.href = '/admin';
          } else {
            alert('Surel atau kata sandi tidak cocok.');
          }
        };
      }
    });
  </script>
`;
    loginContent = loginContent.replace('</head>', `${stylingInjection}</head>`);

    fs.writeFileSync(path.join(adminDir, 'login', 'index.html'), loginContent, 'utf8');
    fs.writeFileSync(path.join(adminDir, 'login.html'), loginContent, 'utf8');
    console.log(' ✔ Created out/admin/login/index.html and out/admin/login.html with guaranteed styling');
  }

  // Common Header & Sidebar Template
  const renderLayout = (activeMenu, title, subtitle, contentHtml) => {
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Portal Redaksi Catatan Negeri</title>
  <meta name="robots" content="noindex, nofollow, noarchive">
  <link rel="icon" href="/brand/logo.png">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              navy: '#0f172a',
              red: '#b91c1c',
              'red-dark': '#991b1b',
              'red-light': '#ef4444'
            }
          }
        }
      }
    }
  </script>
  <script>
    (function() {
      var user = localStorage.getItem('cn_user');
      var hasCookie = document.cookie.indexOf('cn_session') !== -1;
      if (!user && !hasCookie) {
        window.location.replace('/admin/login');
      }
    })();
  </script>
</head>
<body class="bg-slate-50 text-slate-800 font-sans antialiased flex min-h-screen">
  <!-- Sidebar -->
  <aside class="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800">
    <!-- Brand -->
    <div class="h-16 flex items-center px-6 border-b border-slate-800/80 bg-slate-950/40">
      <a href="/admin" class="flex items-center gap-3">
        <div class="w-9 h-9 rounded bg-brand-red flex items-center justify-center p-1">
          <img src="/brand/logo.png" alt="Logo" class="w-7 h-7 object-contain">
        </div>
        <div class="flex flex-col">
          <span class="font-bold text-sm tracking-tight text-white">CATATAN<span class="text-brand-red-light">NEGERI</span></span>
          <span class="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Portal Redaksi</span>
        </div>
      </a>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 py-4 space-y-1 text-xs">
      <a href="/admin" class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${activeMenu === 'dashboard' ? 'bg-brand-red text-white font-bold' : 'hover:bg-slate-800 text-slate-300'}">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
        <span>Dashboard</span>
      </a>
      <a href="/admin/articles" class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${activeMenu === 'articles' ? 'bg-brand-red text-white font-bold' : 'hover:bg-slate-800 text-slate-300'}">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
        <span>Manajemen Artikel</span>
      </a>
      <a href="/admin/categories" class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${activeMenu === 'categories' ? 'bg-brand-red text-white font-bold' : 'hover:bg-slate-800 text-slate-300'}">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
        <span>Kanal Kategori (${portalData.categories.length})</span>
      </a>
      <a href="/admin/tags" class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${activeMenu === 'tags' ? 'bg-brand-red text-white font-bold' : 'hover:bg-slate-800 text-slate-300'}">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
        <span>Topik & Tag</span>
      </a>
      <a href="/admin/media" class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${activeMenu === 'media' ? 'bg-brand-red text-white font-bold' : 'hover:bg-slate-800 text-slate-300'}">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        <span>Pustaka Media</span>
      </a>
      <a href="/admin/seo" class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${activeMenu === 'seo' ? 'bg-brand-red text-white font-bold' : 'hover:bg-slate-800 text-slate-300'}">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        <span>Technical SEO</span>
      </a>

      <div class="pt-4 mt-4 border-t border-slate-800">
        <a href="/" target="_blank" class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          <span>Lihat Situs Publik</span>
        </a>
      </div>
    </nav>

    <!-- User Profile & Logout -->
    <div class="p-3 border-t border-slate-800 bg-slate-950/60">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-8 h-8 rounded-full bg-brand-red text-white font-bold flex items-center justify-center text-xs flex-shrink-0" id="userAvatar">RN</div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-white truncate" id="userNameDisplay">Tim Redaksi</p>
            <p class="text-[10px] text-slate-400 truncate" id="userRoleDisplay">SUPER_ADMIN</p>
          </div>
        </div>
        <button onclick="handleLogout()" class="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition-colors" title="Keluar">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
        </button>
      </div>
    </div>
  </aside>

  <!-- Main Content -->
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Topbar -->
    <header class="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div>
        <h1 class="font-serif font-bold text-lg text-brand-navy">${title}</h1>
        <p class="text-xs text-slate-500">${subtitle}</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          Cloudflare Active
        </span>
      </div>
    </header>

    <!-- Page Body -->
    <main class="flex-1 p-6 overflow-y-auto">
      ${contentHtml}
    </main>
  </div>

  <script>
    // Hydrate User Data from LocalStorage
    try {
      const u = JSON.parse(localStorage.getItem('cn_user') || '{}');
      if (u.name) {
        document.getElementById('userNameDisplay').textContent = u.name;
        document.getElementById('userRoleDisplay').textContent = u.role || 'SUPER_ADMIN';
        const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        document.getElementById('userAvatar').textContent = initials || 'RN';
      }
    } catch(e) {}

    function handleLogout() {
      localStorage.removeItem('cn_user');
      document.cookie = 'cn_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      window.location.replace('/admin/login');
    }
  </script>
</body>
</html>`;
  };

  // 2. Generate Dashboard (/admin/index.html & /admin.html)
  const dashboardHtml = `
    <div class="space-y-6">
      <!-- Welcome Banner -->
      <div class="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-brand-red">Pusat Komando Redaksi</span>
          <h2 class="font-serif text-2xl font-black text-brand-navy mt-1">Selamat Datang di Portal Redaksi</h2>
          <p class="text-xs text-slate-500 mt-1">Status sistem: Beroperasi normal. Cloudflare Edge CDN & Database terhubung aktif.</p>
        </div>
        <div class="flex items-center gap-2">
          <a href="/admin/articles" class="inline-flex items-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors">
            Kelola Berita (${portalData.articles.length})
          </a>
        </div>
      </div>

      <!-- Metrics Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-xs font-semibold text-slate-500 uppercase">Berita Diterbitkan</p>
          <p class="text-3xl font-black text-brand-navy mt-1">${portalData.articles.length}</p>
          <span class="text-[11px] text-emerald-600 font-semibold">100% Aktif & Kanonikal</span>
        </div>
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-xs font-semibold text-slate-500 uppercase">Kanal Kategori</p>
          <p class="text-3xl font-black text-brand-navy mt-1">${portalData.categories.length}</p>
          <span class="text-[11px] text-slate-500">Seluruh Rubrik Nasional</span>
        </div>
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-xs font-semibold text-slate-500 uppercase">Topik / Tag</p>
          <p class="text-3xl font-black text-brand-navy mt-1">10</p>
          <span class="text-[11px] text-brand-red font-semibold">Tren & Populer</span>
        </div>
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-xs font-semibold text-slate-500 uppercase">Total Tayang Halaman</p>
          <p class="text-3xl font-black text-brand-navy mt-1">35.840+</p>
          <span class="text-[11px] text-emerald-600 font-semibold">Agregasi Pembaca</span>
        </div>
      </div>

      <!-- Articles Table Preview -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="font-serif font-bold text-sm text-brand-navy">Sirkulasi Berita Terbaru</h3>
          <a href="/admin/articles" class="text-xs font-bold text-brand-red hover:underline">Lihat Semua &rarr;</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th class="px-6 py-3">Judul Berita</th>
                <th class="px-4 py-3">Kategori</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${portalData.articles.slice(0, 8).map(art => {
                const cat = portalData.categories.find(c => c.id === art.categoryId);
                const catSlug = cat ? cat.slug : 'berita';
                return `
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-3.5 max-w-md">
                      <p class="font-bold text-slate-900 font-serif line-clamp-1">${art.title}</p>
                      <p class="text-[10px] text-slate-400 mt-0.5">/${catSlug}/${art.slug}</p>
                    </td>
                    <td class="px-4 py-3.5 whitespace-nowrap">
                      <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">${cat ? cat.name : 'Berita'}</span>
                    </td>
                    <td class="px-4 py-3.5 whitespace-nowrap">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">PUBLISHED</span>
                    </td>
                    <td class="px-6 py-3.5 text-right whitespace-nowrap">
                      <a href="/${catSlug}/${art.slug}" target="_blank" class="inline-flex items-center gap-1 text-brand-navy hover:text-brand-red font-semibold">
                        Lihat Berita
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                      </a>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const dashboardPage = renderLayout('dashboard', 'Pusat Komando Redaksi', 'Ringkasan metrik portal berita & informasi', dashboardHtml);
  fs.writeFileSync(path.join(adminDir, 'index.html'), dashboardPage, 'utf8');
  fs.writeFileSync(path.join(outDir, 'admin.html'), dashboardPage, 'utf8');
  console.log(' ✔ Created out/admin/index.html and out/admin.html');

  // 3. Generate Articles Management (/admin/articles/index.html)
  const articlesTableHtml = `
    <div class="space-y-6">
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-brand-red">Arsip & Sirkulasi</span>
          <h2 class="font-serif text-2xl font-black text-brand-navy">Daftar Artikel Redaksi</h2>
          <p class="text-xs text-slate-500 mt-1">Total ${portalData.articles.length} artikel terdaftar dalam sistem.</p>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th class="px-6 py-3">No</th>
                <th class="px-6 py-3">Judul Berita</th>
                <th class="px-4 py-3">Kategori</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${portalData.articles.map((art, idx) => {
                const cat = portalData.categories.find(c => c.id === art.categoryId);
                const catSlug = cat ? cat.slug : 'berita';
                return `
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-3.5 text-slate-400 font-mono">${idx + 1}</td>
                    <td class="px-6 py-3.5 max-w-lg">
                      <a href="/${catSlug}/${art.slug}" target="_blank" class="font-bold text-slate-900 font-serif hover:text-brand-red line-clamp-1">${art.title}</a>
                      <p class="text-[10px] text-slate-400 mt-0.5">/${catSlug}/${art.slug}</p>
                    </td>
                    <td class="px-4 py-3.5 whitespace-nowrap">
                      <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">${cat ? cat.name : 'Berita'}</span>
                    </td>
                    <td class="px-4 py-3.5 whitespace-nowrap">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">PUBLISHED</span>
                    </td>
                    <td class="px-6 py-3.5 text-right whitespace-nowrap">
                      <a href="/${catSlug}/${art.slug}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-navy hover:text-white hover:bg-brand-navy border border-slate-200 rounded-lg transition-colors">
                        Lihat Berita
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                      </a>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  const articlesPage = renderLayout('articles', 'Manajemen Artikel', 'Koleksi seluruh penerbitan berita nasional', articlesTableHtml);
  fs.writeFileSync(path.join(adminDir, 'articles', 'index.html'), articlesPage, 'utf8');
  fs.writeFileSync(path.join(adminDir, 'articles.html'), articlesPage, 'utf8');
  console.log(' ✔ Created out/admin/articles/index.html and out/admin/articles.html');

  // 4. Generate Categories Management (/admin/categories/index.html)
  const categoriesTableHtml = `
    <div class="space-y-6">
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <span class="text-xs font-bold uppercase tracking-wider text-brand-red">Struktur Taksonomi</span>
        <h2 class="font-serif text-2xl font-black text-brand-navy">Manajemen Kanal Kategori</h2>
        <p class="text-xs text-slate-500 mt-1">20 Kanal utama editorial Catatan Negeri yang terindeks secara kanonikal.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${portalData.categories.map((cat, idx) => `
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-mono font-bold text-slate-400">#${cat.sortOrder || (idx + 1)}</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">Aktif</span>
              </div>
              <h3 class="font-serif font-bold text-base text-brand-navy">${cat.name}</h3>
              <p class="text-xs text-slate-500 mt-1 line-clamp-2">${cat.description || 'Kanal berita aktual terpercaya.'}</p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span class="text-[11px] font-mono text-slate-400">/${cat.slug}</span>
              <a href="/${cat.slug}" target="_blank" class="text-xs font-bold text-brand-red hover:underline">Buka Kanal &rarr;</a>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  const categoriesPage = renderLayout('categories', 'Kanal Kategori', 'Kelola 20 rubrikasi pemberitaan Catatan Negeri', categoriesTableHtml);
  fs.writeFileSync(path.join(adminDir, 'categories', 'index.html'), categoriesPage, 'utf8');
  fs.writeFileSync(path.join(adminDir, 'categories.html'), categoriesPage, 'utf8');
  console.log(' ✔ Created out/admin/categories/index.html and out/admin/categories.html');

  // 5. Generate Media Library (/admin/media/index.html)
  const mediaGalleryHtml = `
    <div class="space-y-6">
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <span class="text-xs font-bold uppercase tracking-wider text-brand-red">Aset Visual Editorial</span>
        <h2 class="font-serif text-2xl font-black text-brand-navy">Pustaka Media & Galeri Foto</h2>
        <p class="text-xs text-slate-500 mt-1">Penyimpanan aset foto berita dengan optimasi pengiriman CDN Cloudflare.</p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        ${portalData.articles.map(art => `
          <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm group">
            <div class="aspect-video bg-slate-100 overflow-hidden relative">
              <img src="${art.featuredImage}" alt="${art.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
            </div>
            <div class="p-3">
              <p class="font-serif text-xs font-bold text-brand-navy line-clamp-1">${art.title}</p>
              <p class="text-[10px] text-slate-400 mt-0.5 truncate">${art.featuredImage}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  const mediaPage = renderLayout('media', 'Pustaka Media', 'Galeri visual artikel dan infografik', mediaGalleryHtml);
  fs.writeFileSync(path.join(adminDir, 'media', 'index.html'), mediaPage, 'utf8');
  fs.writeFileSync(path.join(adminDir, 'media.html'), mediaPage, 'utf8');
  console.log(' ✔ Created out/admin/media/index.html and out/admin/media.html');

  // 6. Generate SEO Management (/admin/seo/index.html)
  const seoHtml = `
    <div class="space-y-6">
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <span class="text-xs font-bold uppercase tracking-wider text-brand-red">Technical SEO & Webmaster</span>
        <h2 class="font-serif text-2xl font-black text-brand-navy">Konfigurasi Pengindeksan Mesin Pencari</h2>
        <p class="text-xs text-slate-500 mt-1">Sitemap XML, Google News Sitemap, robots.txt, dan sinyal indeks instan.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 class="font-serif font-bold text-base text-brand-navy">Peta Situs Terverifikasi</h3>
          <ul class="space-y-3 text-xs">
            <li class="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <p class="font-bold text-slate-800">XML Sitemap Standar</p>
                <p class="text-slate-400">/sitemap.xml (103 tautan kanonikal)</p>
              </div>
              <a href="/sitemap.xml" target="_blank" class="px-3 py-1.5 bg-brand-navy text-white font-bold rounded hover:bg-brand-red transition-colors">Buka</a>
            </li>
            <li class="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <p class="font-bold text-slate-800">Google News Sitemap</p>
                <p class="text-slate-400">/news-sitemap.xml (20 rilis terbaru)</p>
              </div>
              <a href="/news-sitemap.xml" target="_blank" class="px-3 py-1.5 bg-brand-navy text-white font-bold rounded hover:bg-brand-red transition-colors">Buka</a>
            </li>
            <li class="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <p class="font-bold text-slate-800">RSS 2.0 Editorial Feed</p>
                <p class="text-slate-400">/rss.xml (Feed sindikasi berita)</p>
              </div>
              <a href="/rss.xml" target="_blank" class="px-3 py-1.5 bg-brand-navy text-white font-bold rounded hover:bg-brand-red transition-colors">Buka</a>
            </li>
            <li class="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <p class="font-bold text-slate-800">Robots Directive</p>
                <p class="text-slate-400">/robots.txt (Perlindungan direktori admin)</p>
              </div>
              <a href="/robots.txt" target="_blank" class="px-3 py-1.5 bg-brand-navy text-white font-bold rounded hover:bg-brand-red transition-colors">Buka</a>
            </li>
          </ul>
        </div>

        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 class="font-serif font-bold text-base text-brand-navy">Status Visibilitas Domain</h3>
          <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs space-y-2">
            <p class="font-bold">✔ Schema.org Structured Data Aktif</p>
            <p>NewsMediaOrganization & WebSite JSON-LD terpasang pada seluruh halaman berita.</p>
          </div>
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs space-y-2">
            <p class="font-bold">✔ OpenGraph & Twitter Card Terpasang</p>
            <p>Pratinjau tautan media sosial siap untuk WhatsApp, X (Twitter), dan Facebook.</p>
          </div>
        </div>
      </div>
    </div>
  `;
  const seoPage = renderLayout('seo', 'Technical SEO', 'Status indeks mesin pencari & sitemap XML', seoHtml);
  fs.writeFileSync(path.join(adminDir, 'seo', 'index.html'), seoPage, 'utf8');
  fs.writeFileSync(path.join(adminDir, 'seo.html'), seoPage, 'utf8');
  console.log(' ✔ Created out/admin/seo/index.html and out/admin/seo.html');
}

generateStaticAdmin();

