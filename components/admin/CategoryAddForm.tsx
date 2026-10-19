"use client";

import { useActionState, useState } from "react";
import { createCategoryAction, type SimpleFormState } from "@/app/admin/categories/actions";
import { slugify } from "@/lib/utils/slug";

const initialState: SimpleFormState = {};

export function CategoryAddForm() {
  const [state, formAction, pending] = useActionState(createCategoryAction, initialState);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1.5fr_auto] sm:items-start"
    >
      <input
        name="name"
        required
        placeholder="Nama kategori"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (!slugTouched) setSlug(slugify(e.target.value));
        }}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
      />
      <input
        name="slug"
        placeholder="slug"
        value={slug}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(slugify(e.target.value));
        }}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
      />
      <input
        name="description"
        placeholder="Deskripsi (opsional)"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        Tambah
      </button>
      {state.error && <p className="sm:col-span-4 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
