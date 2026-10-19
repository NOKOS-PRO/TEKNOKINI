import type { Article, Author, Category, Source, Tag } from "./database.types";

export interface ArticleCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  views: number;
  category: Pick<Category, "id" | "name" | "slug"> | null;
  author: Pick<Author, "id" | "name" | "slug" | "avatar"> | null;
}

export interface ArticleDetail extends Article {
  category: Category | null;
  author: Author | null;
  tags: Tag[];
  sources: Source[];
}

export interface ArticleAdminRow extends Article {
  category: Pick<Category, "name" | "slug"> | null;
  author: Pick<Author, "name" | "slug"> | null;
}

export interface DashboardStats {
  total: number;
  draft: number;
  review: number;
  scheduled: number;
  published: number;
  archived: number;
  today: number;
}
