import portalData from "@/data/portal-data.json";

function parseDates(item: any) {
  if (!item) return item;
  return {
    ...item,
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    publishedAt: item.publishedAt ? new Date(item.publishedAt) : (item.createdAt ? new Date(item.createdAt) : new Date()),
  };
}

export const fallbackData: Record<string, any> = {
  category: {
    findMany: async (args?: any) => {
      let cats = [...portalData.categories];
      if (args?.where?.isActive !== undefined) {
        cats = cats.filter((c) => c.isActive === args.where.isActive);
      }
      if (args?.orderBy?.sortOrder === "asc") {
        cats.sort((a, b) => a.sortOrder - b.sortOrder);
      }
      return cats.map(parseDates);
    },
    findUnique: async (args: any) => {
      const slug = args?.where?.slug;
      const id = args?.where?.id;
      const cat = portalData.categories.find((c) => c.slug === slug || c.id === id);
      return cat ? parseDates(cat) : null;
    },
    count: async () => portalData.categories.length,
  },
  article: {
    findMany: async (args?: any) => {
      let articles = [...portalData.articles];
      if (args?.where?.status) {
        articles = articles.filter((a) => a.status === args.where.status);
      }
      if (args?.where?.isFeatured !== undefined) {
        articles = articles.filter((a) => a.isFeatured === args.where.isFeatured);
      }
      if (args?.where?.isBreaking !== undefined) {
        articles = articles.filter((a) => a.isBreaking === args.where.isBreaking);
      }
      if (args?.where?.categoryId) {
        articles = articles.filter((a) => a.categoryId === args.where.categoryId);
      }
      if (args?.where?.authorId) {
        articles = articles.filter((a) => a.authorId === args.where.authorId);
      }
      if (args?.where?.id?.not) {
        articles = articles.filter((a) => a.id !== args.where.id.not);
      }
      if (args?.take) {
        articles = articles.slice(0, args.take);
      }
      return articles.map((art) => ({
        ...parseDates(art),
        category: portalData.categories.find((c) => c.id === art.categoryId) || null,
        author: portalData.profiles.find((p) => p.id === art.authorId) || null,
      }));
    },
    findFirst: async (args?: any) => {
      const results = await fallbackData.article.findMany({ ...args, take: 1 });
      return results[0] || null;
    },
    findUnique: async (args: any) => {
      const slug = args?.where?.slug;
      const id = args?.where?.id;
      const art = portalData.articles.find((a) => a.slug === slug || a.id === id);
      if (!art) return null;
      return {
        ...parseDates(art),
        category: portalData.categories.find((c) => c.id === art.categoryId) || null,
        author: portalData.profiles.find((p) => p.id === art.authorId) || null,
      };
    },
    count: async () => portalData.articles.length,
  },
  tag: {
    findMany: async (args?: any) => {
      let tags = [...portalData.tags];
      if (args?.take) tags = tags.slice(0, args.take);
      return tags.map(parseDates);
    },
  },
  siteSetting: {
    findUnique: async (args: any) => {
      const key = args?.where?.key;
      return portalData.settings.find((s) => s.key === key) || null;
    },
  },
  authorProfile: {
    findMany: async () => portalData.profiles.map(parseDates),
    findUnique: async (args: any) => {
      const slug = args?.where?.slug;
      const id = args?.where?.id;
      const p = portalData.profiles.find((pr) => pr.slug === slug || pr.id === id);
      return p ? parseDates(p) : null;
    },
  },
  navigationMenu: {
    findMany: async () => portalData.menus || [],
  },
  user: {
    findMany: async () => portalData.users || [],
    findUnique: async (args: any) => {
      const email = args?.where?.email;
      const id = args?.where?.id;
      return portalData.users.find((u: any) => u.email === email || u.id === id) || null;
    },
  },
  redirect: {
    findMany: async () => [],
    findUnique: async () => null,
    count: async () => 0,
  },
  auditLog: {
    findMany: async () => [],
    count: async () => 0,
  },
  comment: {
    findMany: async () => [],
    count: async () => 0,
  },
  ingestedItem: {
    findMany: async () => [],
    findUnique: async () => null,
    count: async () => 0,
  },
  ingestionSource: {
    findMany: async () => [],
    findUnique: async () => null,
    count: async () => 0,
  },
  newsletterSubscriber: {
    findMany: async () => [],
    count: async () => 0,
  },
  mediaAsset: {
    findMany: async () => [],
    count: async () => 0,
  },
};
