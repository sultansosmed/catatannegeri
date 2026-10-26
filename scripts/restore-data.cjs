const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreAll() {
  const backupPath = path.join(__dirname, 'database-backup.json');
  if (!fs.existsSync(backupPath)) {
    throw new Error('Backup file not found at: ' + backupPath);
  }
  const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

  console.log('Restoring users...');
  for (const user of data.users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
  }

  console.log('Restoring profiles...');
  for (const profile of data.profiles) {
    await prisma.authorProfile.upsert({
      where: { id: profile.id },
      update: profile,
      create: profile,
    });
  }

  console.log('Restoring categories...');
  for (const cat of data.categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: cat,
      create: cat,
    });
  }

  console.log('Restoring tags...');
  for (const tag of data.tags) {
    await prisma.tag.upsert({
      where: { id: tag.id },
      update: tag,
      create: tag,
    });
  }

  console.log('Restoring articles...');
  for (const art of data.articles) {
    await prisma.article.upsert({
      where: { id: art.id },
      update: art,
      create: art,
    });
  }

  console.log('Restoring article tags...');
  for (const at of data.articleTags) {
    const exists = await prisma.articleTag.findUnique({
      where: { articleId_tagId: { articleId: at.articleId, tagId: at.tagId } },
    });
    if (!exists) {
      await prisma.articleTag.create({ data: at });
    }
  }

  console.log('Restoring site settings...');
  for (const set of data.settings) {
    await prisma.siteSetting.upsert({
      where: { key: set.key },
      update: set,
      create: set,
    });
  }

  console.log('Database restore completed successfully!');
  const count = await prisma.article.count();
  console.log('Total articles in database:', count);
}

restoreAll()
  .catch((e) => {
    console.error('Restore error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
