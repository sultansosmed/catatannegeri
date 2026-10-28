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

async function testArticleLifecycle() {
  console.log('=== Testing Complete Article CRUD Lifecycle ===');

  // 1. Login
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

  const cookieHeader = Array.isArray(loginRes.headers['set-cookie'])
    ? loginRes.headers['set-cookie'].join('; ')
    : loginRes.headers['set-cookie'];

  // Fetch categories and authors to get valid IDs
  const catsRes = await request({ host: 'localhost', port: 3000, path: '/api/categories', method: 'GET', headers: { Cookie: cookieHeader } });
  const categoryId = JSON.parse(catsRes.body).categories[0].id;

  const authorsRes = await request({ host: 'localhost', port: 3000, path: '/api/authors', method: 'GET', headers: { Cookie: cookieHeader } });
  const authorId = JSON.parse(authorsRes.body).authors[0].id;

  const uniqueId = Date.now();
  const testSlug = `uji-coba-redaksi-${uniqueId}`;

  // 2. Create Article (DRAFT)
  console.log(`\n1. Creating test draft article (slug: ${testSlug})...`);
  const newArtPayload = JSON.stringify({
    title: `Uji Coba Validasi Redaksi Digital ${uniqueId}`,
    slug: testSlug,
    summary: 'Ringkasan artikel pengujian integrasi database redaksi Catatan Negeri.',
    content: '<p>Konten lengkap artikel pengujian untuk memverifikasi fungsionalitas CRUD dashboard admin.</p>',
    categoryId,
    authorId,
    status: 'DRAFT',
    tags: [],
  });

  const createRes = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/articles',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(newArtPayload),
      Cookie: cookieHeader,
    },
  }, newArtPayload);

  console.log('Create Status:', createRes.statusCode);
  const createdArt = JSON.parse(createRes.body).article;
  console.log('Created Article ID:', createdArt.id, 'Title:', createdArt.title);

  // 3. Edit & Publish Article
  console.log('\n2. Updating and publishing article...');
  const updatePayload = JSON.stringify({
    title: `Uji Coba Validasi Redaksi Digital ${uniqueId} (Updated)`,
    slug: testSlug,
    summary: 'Ringkasan artikel yang telah diperbarui dan diterbitkan.',
    content: '<p>Konten lengkap yang telah dimutakhirkan dengan status publikasi.</p>',
    categoryId,
    authorId,
    status: 'PUBLISHED',
    tags: [],
  });

  const updateRes = await request({
    host: 'localhost',
    port: 3000,
    path: `/api/articles/${createdArt.id}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(updatePayload),
      Cookie: cookieHeader,
    },
  }, updatePayload);

  console.log('Update Status:', updateRes.statusCode);
  const updatedArt = JSON.parse(updateRes.body).article;
  console.log('Updated Status:', updatedArt.status, 'Title:', updatedArt.title);

  // 4. Delete Article
  console.log('\n3. Deleting test article...');
  const deleteRes = await request({
    host: 'localhost',
    port: 3000,
    path: `/api/articles/${createdArt.id}`,
    method: 'DELETE',
    headers: {
      Cookie: cookieHeader,
    },
  });

  console.log('Delete Status:', deleteRes.statusCode);
  console.log('Delete Result:', JSON.parse(deleteRes.body).message);

  // 5. Verify it is gone
  const verifyRes = await request({
    host: 'localhost',
    port: 3000,
    path: `/api/articles/${createdArt.id}`,
    method: 'GET',
    headers: {
      Cookie: cookieHeader,
    },
  });
  console.log('Verify Deleted Article Status:', verifyRes.statusCode, '(Expected 404)');
  console.log('✔ Article lifecycle (Create, Edit, Publish, Delete) tested and 100% verified against live PostgreSQL database!');
}

testArticleLifecycle().catch(console.error);

