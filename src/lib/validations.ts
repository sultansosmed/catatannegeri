import { z } from "zod";
import { ArticleStatus, Role } from "@prisma/client";

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const articleSchema = z.object({
  title: z.string().min(5, "Judul artikel minimal 5 karakter").max(200, "Judul terlalu panjang (maks. 200 karakter)"),
  slug: z.string().min(3, "Slug minimal 3 karakter").regex(/^[a-z0-9-]+$/, "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung"),
  summary: z.string().min(20, "Ringkasan artikel minimal 20 karakter").max(500, "Ringkasan maksimal 500 karakter"),
  content: z.string().min(50, "Konten artikel minimal 50 karakter"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  authorId: z.string().optional(),
  featuredImage: z.string().url("URL gambar utama tidak valid").optional().or(z.literal("")),
  imageAlt: z.string().optional(),
  imageCaption: z.string().optional(),
  imageCredit: z.string().optional(),
  status: z.nativeEnum(ArticleStatus).default(ArticleStatus.DRAFT),
  scheduledFor: z.string().optional().nullable(),
  isBreaking: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isEditorPick: z.boolean().default(false),
  metaTitle: z.string().max(70, "SEO title maksimal 70 karakter").optional().nullable(),
  metaDescription: z.string().max(160, "Meta description maksimal 160 karakter").optional().nullable(),
  canonicalUrl: z.string().url("Format canonical URL tidak valid").optional().nullable().or(z.literal("")),
  noIndex: z.boolean().default(false),
  factCheckNotes: z.string().optional().nullable(),
  correctionNotes: z.string().optional().nullable(),
  sourceReferences: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter").max(50),
  slug: z.string().min(2, "Slug minimal 2 karakter").regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan strip"),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
});

export const tagSchema = z.object({
  name: z.string().min(2, "Nama tag minimal 2 karakter").max(50),
  slug: z.string().min(2, "Slug minimal 2 karakter").regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan strip"),
  description: z.string().optional().nullable(),
});

export const userSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter").optional().or(z.literal("")),
  role: z.nativeEnum(Role).default(Role.AUTHOR),
  isActive: z.boolean().default(true),
  authorTitle: z.string().optional(),
  authorBio: z.string().optional(),
});

export const redirectSchema = z.object({
  sourcePath: z.string().min(1, "Source path wajib diisi").startsWith("/", "Source path harus diawali '/'"),
  destinationPath: z.string().min(1, "Destination path wajib diisi"),
  statusCode: z.number().int().refine((val) => val === 301 || val === 302, "Status code harus 301 atau 302"),
  isActive: z.boolean().default(true),
});

export const newsletterSchema = z.object({
  email: z.string().email("Alamat email tidak valid"),
});
