const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function exportAll() {
  const users = await prisma.user.findMany();
  const profiles = await prisma.authorProfile.findMany();
  const categories = await prisma.category.findMany();
  const tags = await prisma.tag.findMany();
  const articles = await prisma.article.findMany();
  const articleTags = await prisma.articleTag.findMany();
  const settings = await prisma.siteSetting.findMany();
  const menus = await prisma.navigationMenu.findMany();
  
  const backup = { users, profiles, categories, tags, articles, articleTags, settings, menus };
  const backupPath = path.join(__dirname, 'database-backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log('Database backup created successfully at:', backupPath);
  console.log({
    users: users.length,
    profiles: profiles.length,
    categories: categories.length,
    tags: tags.length,
    articles: articles.length,
    articleTags: articleTags.length,
    settings: settings.length,
    menus: menus.length
  });
}

exportAll()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
