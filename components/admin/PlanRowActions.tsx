"use client";

import Link from "next/link";
import { useTransition } from "react";
import { approveArticleAction, deletePlanAction, draftNowAction } from "@/app/admin/plan/actions";

export function PlanRowActions({
  planId,
  status,
  articleId,
  articleStatus,
}: {
  planId: string;
  status: string;
  articleId: string | null;
  articleStatus: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) alert(res.error);
    });
  }

  const canDraft = status === "planned" || status === "failed";
  const canApprove = status === "drafted" && articleId && (articleStatus === "draft" || articleStatus === "review");
  const btn = "rounded-md px-2.5 py-1 text-xs font-semibold disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canDraft && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => draftNowAction(planId))}
          className={`${btn} border border-neutral-300 text-neutral-700 hover:bg-neutral-50`}
        >
          {pending ? "Membuat… (bisa 1 menit)" : status === "failed" ? "Coba lagi" : "Buat draf sekarang"}
        </button>
      )}
      {canApprove && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => approveArticleAction(articleId!))}
          className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}
        >
          {pending ? "Memproses…" : "Setujui & jadwalkan"}
        </button>
      )}
      {articleId && (
        <>
          <Link
            href={`/admin/articles/${articleId}/preview`}
            className="text-xs font-medium text-neutral-500 hover:text-brand-600"
          >
            Preview
          </Link>
          <Link href={`/admin/articles/${articleId}/edit`} className="text-xs font-medium text-brand-600">
            Edit
          </Link>
        </>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Hapus item rencana ini? Artikel yang sudah dibuat tidak ikut terhapus.")) {
            run(() => deletePlanAction(planId));
          }
        }}
        className="text-xs font-medium text-neutral-400 hover:text-red-600 disabled:opacity-50"
      >
        Hapus
      </button>
    </div>
  );
}
