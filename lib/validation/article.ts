import { z } from "zod";

export const articleStatusValues = [
  "draft",
  "review",
  "scheduled",
  "published",
  "archived",
] as const;

export const articleSchema = z
  .object({
    title: z.string().trim().min(5, "Judul minimal 5 karakter").max(200),
    slug: z
      .string()
      .trim()
      .min(3, "Slug minimal 3 karakter")
      .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung"),
    excerpt: z.string().trim().max(300).optional().or(z.literal("")),
    content: z.string().min(1, "Konten tidak boleh kosong"),
    featured_image: z.string().url().optional().or(z.literal("")),
    featured_image_credit: z.string().trim().max(300).optional().or(z.literal("")),
    category_id: z.string().uuid("Pilih kategori"),
    author_id: z.string().uuid("Pilih penulis"),
    status: z.enum(articleStatusValues),
    published_at: z.string().optional().or(z.literal("")),
    seo_title: z.string().trim().max(70).optional().or(z.literal("")),
    seo_description: z.string().trim().max(160).optional().or(z.literal("")),
    tag_ids: z.array(z.string().uuid()).default([]),
    sources: z
      .array(
        z.object({
          source_name: z.string().trim().min(1),
          source_url: z.string().trim().url(),
          source_published_at: z.string().optional().or(z.literal("")),
        }),
      )
      .default([]),
  })
  .refine((data) => data.status !== "scheduled" || Boolean(data.published_at), {
    message: "Artikel scheduled wajib punya tanggal publish",
    path: ["published_at"],
  });

export type ArticleFormValues = z.infer<typeof articleSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka, dan tanda hubung"),
  description: z.string().trim().max(300).optional().or(z.literal("")),
});

export const tagSchema = z.object({
  name: z.string().trim().min(2).max(40),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka, dan tanda hubung"),
});

export const authorSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka, dan tanda hubung"),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
  avatar: z.string().url().optional().or(z.literal("")),
});
