import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      featuredImage: true,
      category: { select: { name: true, slug: true } }
    },
    orderBy: { publishedAt: "desc" }
  });
  console.log(`Total articles in DB: ${articles.length}`);
  articles.forEach((a, i) => {
    console.log(`${i + 1}. [${a.category.name}] (${a.category.slug}) ${a.title}`);
    console.log(`   Img: ${a.featuredImage}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

