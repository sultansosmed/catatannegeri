const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log('--- 1. Testing GET /admin/login ---');
  const loginPage = await request({ host: 'localhost', port: 3000, path: '/admin/login', method: 'GET' });
  console.log('Status:', loginPage.statusCode);
  console.log('Has Login Form:', loginPage.body.includes('Portal Redaksi Catatan Negeri'));

  console.log('\n--- 2. Testing Unauthenticated GET /admin (Middleware protection) ---');
  const unauth = await request({ host: 'localhost', port: 3000, path: '/admin', method: 'GET' });
  console.log('Status:', unauth.statusCode, '(Expected 307 or 302 redirect to /admin/login)');
  console.log('Location:', unauth.headers.location);

  console.log('\n--- 3. Testing POST /api/auth/login ---');
  const loginPayload = JSON.stringify({ email: 'redaksi@catatannegeri.com', password: 'Admin123!CatatanNegeri' });
  const loginRes = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginPayload),
    },
  }, loginPayload);
  console.log('Status:', loginRes.statusCode);
  console.log('Body:', loginRes.body);

  const setCookie = loginRes.headers['set-cookie'];
  console.log('Set-Cookie Received:', !!setCookie);
  const cookieHeader = Array.isArray(setCookie) ? setCookie.join('; ') : (setCookie || '');

  console.log('\n--- 4. Testing Authenticated GET /admin with Session Cookie ---');
  const authDashboard = await request({
    host: 'localhost',
    port: 3000,
    path: '/admin',
    method: 'GET',
    headers: {
      'Cookie': cookieHeader,
    },
  });
  console.log('Dashboard Status:', authDashboard.statusCode);
  console.log('Has Dashboard Header:', authDashboard.body.includes('Pusat Komando Redaksi'));
  console.log('Has Welcome Admin:', authDashboard.body.includes('Tim Redaksi Catatan Negeri'));

  console.log('\n--- 5. Testing Authenticated GET /api/articles with Session Cookie ---');
  const articlesApi = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/articles',
    method: 'GET',
    headers: {
      'Cookie': cookieHeader,
    },
  });
  console.log('Articles API Status:', articlesApi.statusCode);
  const parsedArticles = JSON.parse(articlesApi.body);
  console.log('Total Articles Returned from DB:', parsedArticles.articles?.length || 0);

  console.log('\n--- 6. Testing Authenticated GET /api/categories ---');
  const categoriesApi = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/categories',
    method: 'GET',
    headers: {
      'Cookie': cookieHeader,
    },
  });
  console.log('Categories API Status:', categoriesApi.statusCode);
  const parsedCats = JSON.parse(categoriesApi.body);
  console.log('Total Categories Returned from DB:', parsedCats.categories?.length || 0);

  console.log('\n--- 7. Testing Authenticated GET /api/tags ---');
  const tagsApi = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/tags',
    method: 'GET',
    headers: {
      'Cookie': cookieHeader,
    },
  });
  console.log('Tags API Status:', tagsApi.statusCode);
  const parsedTags = JSON.parse(tagsApi.body);
  console.log('Total Tags Returned from DB:', parsedTags.tags?.length || 0);
}

run().catch(console.error);

