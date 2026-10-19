"use client";

import { useActionState, useRef } from "react";
import { uploadMediaAction, type UploadState } from "@/app/admin/media/actions";

const initialState: UploadState = {};

export function MediaUploadForm() {
  const [state, formAction, pending] = useActionState(uploadMediaAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <input
        type="file"
        name="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        required
        className="text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Mengunggah…" : "Upload"}
      </button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && <p className="text-xs text-emerald-600">Berhasil diunggah.</p>}
      <span className="text-xs text-neutral-400">JPG/PNG/WebP/GIF, maks 5MB.</span>
    </form>
  );
}
