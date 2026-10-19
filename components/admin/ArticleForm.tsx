"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { saveArticleAction, type ArticleFormState } from "@/app/admin/articles/actions";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { FeaturedImagePicker } from "@/components/admin/FeaturedImagePicker";
import { slugify } from "@/lib/utils/slug";
import { siteConfig } from "@/lib/config/site";
import type { Article, Author, Category, Source, Tag } from "@/types/database.types";

const STATUS_OPTIONS: { value: Article["status"]; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "Review" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

interface ArticleFormProps {
  articleId: string | null;
  initial?: Partial<Article> & { tagIds?: string[]; sources?: Source[] };
  categories: Category[];
  tags: Tag[];
  authors: Author[];
}

const initialState: ArticleFormState = {};

function toDateTimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ArticleForm({ articleId, initial, categories, tags, authors }: ArticleFormProps) {
  const boundAction = saveArticleAction.bind(null, articleId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const router = useRouter();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seo_description ?? "");
  const [status, setStatus] = useState<Article["status"]>(initial?.status ?? "draft");
  const [publishedAtLocal, setPublishedAtLocal] = useState(toDateTimeLocal(initial?.published_at));
  const [selectedTags, setSelectedTags] = useState<string[]>(initial?.tagIds ?? []);
  const [sources, setSources] = useState<Array<Partial<Source>>>(
    initial?.sources && initial.sources.length > 0
      ? initial.sources
      : [{ source_name: "", source_url: "", source_published_at: "" }],
  );

  const publishedAtIso = publishedAtLocal ? new Date(publishedAtLocal).toISOString() : "";
  const displayDomain = siteConfig.url.replace(/^https?:\/\//, "");

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {state.error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
        )}

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Judul</label>
          <input
            name="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            required
            className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder="Judul artikel"
          />
          {state.fieldErrors?.title && <p className="mt-1 text-xs text-red-600">{state.fieldErrors.title}</p>}

          <label className="mb-1.5 mt-4 block text-sm font-medium text-neutral-700">Slug</label>
          <div className="flex items-center gap-1 rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm">
            <span className="text-neutral-400">/berita/</span>
            <input
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className="min-w-0 flex-1 outline-none"
              placeholder="slug-artikel"
            />
          </div>
          {state.fieldErrors?.slug && <p className="mt-1 text-xs text-red-600">{state.fieldErrors.slug}</p>}

          <label className="mb-1.5 mt-4 block text-sm font-medium text-neutral-700">Excerpt</label>
          <textarea
            name="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            maxLength={300}
            className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder="Ringkasan singkat untuk card & meta description…"
          />
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Featured Image</label>
          <FeaturedImagePicker
            name="featured_image"
            defaultValue={initial?.featured_image ?? ""}
            creditName="featured_image_credit"
            defaultCredit={initial?.featured_image_credit ?? ""}
          />
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Konten</label>
          <MarkdownEditor name="content" defaultValue={initial?.content ?? ""} />
          {state.fieldErrors?.content && <p className="mt-1 text-xs text-red-600">{state.fieldErrors.content}</p>}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-700">Sumber</label>
            <button
              type="button"
              onClick={() =>
                setSources((s) => [...s, { source_name: "", source_url: "", source_published_at: "" }])
              }
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              + Tambah sumber
            </button>
          </div>
          <div className="space-y-2">
            {sources.map((src, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.3fr_auto]">
                <input
                  name="source_name"
                  defaultValue={src.source_name ?? ""}
                  placeholder="Nama sumber (mis. NVIDIA)"
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
                <input
                  name="source_url"
                  type="url"
                  defaultValue={src.source_url ?? ""}
                  placeholder="https://…"
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
                <div className="flex gap-1">
                  <input
                    name="source_published_at"
                    type="date"
                    defaultValue={src.source_published_at?.slice(0, 10) ?? ""}
                    className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-2 py-2 text-sm outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setSources((s) => s.filter((_, idx) => idx !== i))}
                    className="rounded-lg border border-neutral-200 px-2 text-xs text-neutral-400 hover:border-red-200 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            Menyimpan sumber bukan izin menyalin konten — tulis artikel secara orisinal.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="mb-3 text-sm font-medium text-neutral-700">SEO</p>
          <label className="mb-1.5 block text-xs font-medium text-neutral-500">SEO Title</label>
          <input
            name="seo_title"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            maxLength={70}
            className="w-full rounded-lg border border-neutral-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
            placeholder={title || "Judul untuk Google (opsional, default: judul artikel)"}
          />
          <label className="mb-1.5 mt-3 block text-xs font-medium text-neutral-500">SEO Description</label>
          <textarea
            name="seo_description"
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={2}
            maxLength={160}
            className="w-full rounded-lg border border-neutral-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
            placeholder={excerpt || "Deskripsi untuk Google (opsional, default: excerpt)"}
          />

          <div className="mt-4 rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
              Perkiraan tampilan di Google — bukan jaminan hasil sebenarnya
            </p>
            <p className="truncate text-xs text-emerald-800">
              {displayDomain} › berita › {slug || "slug-artikel"}
            </p>
            <p className="truncate text-base text-blue-800">{seoTitle || title || "Judul artikel"}</p>
            <p className="line-clamp-2 text-sm text-neutral-600">
              {seoDescription || excerpt || "Deskripsi artikel akan muncul di sini."}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Status</label>
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Article["status"])}
            className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {(status === "scheduled" || status === "published") && (
            <>
              <label className="mb-1.5 mt-4 block text-sm font-medium text-neutral-700">
                Tanggal publish
              </label>
              <input
                type="datetime-local"
                value={publishedAtLocal}
                onChange={(e) => setPublishedAtLocal(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </>
          )}
          <input type="hidden" name="published_at" value={publishedAtIso} />

          <div className="mt-5 space-y-2">
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {pending ? "Menyimpan…" : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full rounded-lg border border-neutral-200 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Batal
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Kategori</label>
          <select
            name="category_id"
            defaultValue={initial?.category_id ?? ""}
            required
            className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="" disabled>
              Pilih kategori
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {state.fieldErrors?.category_id && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.category_id}</p>
          )}

          <label className="mb-1.5 mt-4 block text-sm font-medium text-neutral-700">Penulis</label>
          <select
            name="author_id"
            defaultValue={initial?.author_id ?? ""}
            required
            className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="" disabled>
              Pilih penulis
            </option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {state.fieldErrors?.author_id && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.author_id}</p>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <label className="mb-2 block text-sm font-medium text-neutral-700">Tag</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const checked = selectedTags.includes(tag.id);
              return (
                <label
                  key={tag.id}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium ${
                    checked
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-neutral-200 text-neutral-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="tag_ids"
                    value={tag.id}
                    checked={checked}
                    onChange={(e) =>
                      setSelectedTags((prev) =>
                        e.target.checked ? [...prev, tag.id] : prev.filter((id) => id !== tag.id),
                      )
                    }
                    className="hidden"
                  />
                  #{tag.name}
                </label>
              );
            })}
            {tags.length === 0 && <p className="text-xs text-neutral-400">Belum ada tag.</p>}
          </div>
        </div>
      </div>
    </form>
  );
}
