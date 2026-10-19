"use client";

import { useActionState, useState } from "react";
import { createAuthorAction, type SimpleFormState } from "@/app/admin/authors/actions";
import { slugify } from "@/lib/utils/slug";

const initialState: SimpleFormState = {};

export function AuthorAddForm() {
  const [state, formAction, pending] = useActionState(createAuthorAction, initialState);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <form action={formAction} className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="name"
          required
          placeholder="Nama penulis"
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
      </div>
      <textarea
        name="bio"
        placeholder="Bio singkat (opsional)"
        rows={2}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
      />
      <div className="flex gap-2">
        <input
          name="avatar"
          type="url"
          placeholder="URL avatar (opsional)"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Tambah
        </button>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
