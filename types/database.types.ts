/**
 * Hand-authored to match supabase/migrations/*.sql exactly.
 *
 * Once the project is linked to a real Supabase project, regenerate this
 * file from the live schema instead of hand-editing it:
 *
 *   npx supabase gen types typescript --linked > types/database.types.ts
 */

export type UserRole = "admin" | "editor" | "writer";

export type ArticleStatus = "draft" | "review" | "scheduled" | "published" | "archived";

export type ContentPlanStatus = "planned" | "drafting" | "drafted" | "failed" | "cancelled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          display_name: string;
          avatar_url?: string | null;
        };
        Update: Partial<{
          role: UserRole;
          display_name: string;
          avatar_url: string | null;
        }>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
        };
        Update: Partial<{
          name: string;
          slug: string;
          description: string | null;
        }>;
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
        };
        Update: Partial<{
          name: string;
          slug: string;
        }>;
        Relationships: [];
      };
      authors: {
        Row: {
          id: string;
          name: string;
          slug: string;
          bio: string | null;
          avatar: string | null;
          profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          bio?: string | null;
          avatar?: string | null;
          profile_id?: string | null;
        };
        Update: Partial<{
          name: string;
          slug: string;
          bio: string | null;
          avatar: string | null;
          profile_id: string | null;
        }>;
        Relationships: [];
      };
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string;
          featured_image: string | null;
          featured_image_credit: string | null;
          category_id: string | null;
          author_id: string | null;
          status: ArticleStatus;
          published_at: string | null;
          seo_title: string | null;
          seo_description: string | null;
          views: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt?: string | null;
          content?: string;
          featured_image?: string | null;
          featured_image_credit?: string | null;
          category_id?: string | null;
          author_id?: string | null;
          status?: ArticleStatus;
          published_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
        };
        Update: Partial<{
          title: string;
          slug: string;
          excerpt: string | null;
          content: string;
          featured_image: string | null;
          featured_image_credit: string | null;
          category_id: string | null;
          author_id: string | null;
          status: ArticleStatus;
          published_at: string | null;
          seo_title: string | null;
          seo_description: string | null;
          views: number;
        }>;
        Relationships: [];
      };
      article_tags: {
        Row: {
          article_id: string;
          tag_id: string;
        };
        Insert: {
          article_id: string;
          tag_id: string;
        };
        Update: Partial<{
          article_id: string;
          tag_id: string;
        }>;
        Relationships: [];
      };
      sources: {
        Row: {
          id: string;
          article_id: string;
          source_name: string;
          source_url: string;
          source_published_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          source_name: string;
          source_url: string;
          source_published_at?: string | null;
        };
        Update: Partial<{
          source_name: string;
          source_url: string;
          source_published_at: string | null;
        }>;
        Relationships: [];
      };
      media: {
        Row: {
          id: string;
          file_path: string;
          url: string;
          file_name: string;
          mime_type: string | null;
          size_bytes: number | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          file_path: string;
          url: string;
          file_name: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          uploaded_by?: string | null;
        };
        Update: Partial<{
          file_path: string;
          url: string;
          file_name: string;
        }>;
        Relationships: [];
      };
      content_plan: {
        Row: {
          id: string;
          topic: string;
          brief: string | null;
          category_id: string;
          author_id: string | null;
          publish_at: string;
          auto_schedule: boolean;
          status: ContentPlanStatus;
          attempts: number;
          article_id: string | null;
          error: string | null;
          ai_notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic: string;
          brief?: string | null;
          category_id: string;
          author_id?: string | null;
          publish_at: string;
          auto_schedule?: boolean;
          status?: ContentPlanStatus;
          attempts?: number;
          article_id?: string | null;
          error?: string | null;
          ai_notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<{
          topic: string;
          brief: string | null;
          category_id: string;
          author_id: string | null;
          publish_at: string;
          auto_schedule: boolean;
          status: ContentPlanStatus;
          attempts: number;
          article_id: string | null;
          error: string | null;
          ai_notes: string | null;
        }>;
        Relationships: [];
      };
      page_views: {
        Row: {
          id: number;
          created_at: string;
          path: string;
          visitor_hash: string;
          referrer_host: string | null;
          device: string | null;
          country: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          path: string;
          visitor_hash: string;
          referrer_host?: string | null;
          device?: string | null;
          country?: string | null;
        };
        Update: Partial<{
          path: string;
          visitor_hash: string;
          referrer_host: string | null;
          device: string | null;
          country: string | null;
        }>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      increment_article_views: {
        Args: { p_article_id: string };
        Returns: undefined;
      };
      publish_due_articles: {
        Args: Record<string, never>;
        Returns: number;
      };
      traffic_overview: {
        Args: { p_days?: number };
        Returns: unknown;
      };
      purge_old_page_views: {
        Args: { p_days?: number };
        Returns: number;
      };
    };
    Enums: {
      user_role: UserRole;
      article_status: ArticleStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
}

// Convenience row aliases for use across components/services.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type Author = Database["public"]["Tables"]["authors"]["Row"];
export type Article = Database["public"]["Tables"]["articles"]["Row"];
export type Source = Database["public"]["Tables"]["sources"]["Row"];
export type Media = Database["public"]["Tables"]["media"]["Row"];
export type ContentPlan = Database["public"]["Tables"]["content_plan"]["Row"];
export type PageView = Database["public"]["Tables"]["page_views"]["Row"];
