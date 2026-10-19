"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPlanAction, suggestTopicsAction, type PlanFormState } from "@/app/admin/plan/actions";

const initialState: PlanFormState = {};

const base = "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500";
const field = `w-full ${base}`;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function PlanForm({
  categories,
  authors,
}: {
  categories: { id: string; name: string }[];
  authors: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createPlanAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [topics, setTopics] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [auto, setAuto] = useState(false);
  const [suggesting, startSuggest] = useTransition();
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const { today, tomorrow } = useMemo(() => {
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return { today: fmt(new Date()), tomorrow: fmt(new Date(Date.now() + 86_400_000)) };
  }, []);
  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState("08:00");

  // Dihitung di browser agar jam mengikuti zona waktu Anda, lalu dikirim sebagai ISO (UTC).
  const startIso = useMemo(() => {
    const d = new Date(`${date}T${time}`);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [date, time]);

  useEffect(() => {
    if (state.ok) setTopics("");
  }, [state.ok]);

  const lineCount = topics.split("\n").filter((l) => l.trim()).length;

  function suggest() {
    setSuggestError(null);
    startSuggest(async () => {
      const res = await suggestTopicsAction(categoryId);
      if (res.error) setSuggestError(res.error);
      else if (res.topics) setTopics((t) => `${t.trim() ? `${t.trim()}\n` : ""}${res.topics!.join("\n")}`);
    });
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label htmlFor="topics" className="text-sm font-medium text-neutral-700">
            Topik artikel <span className="font-normal text-neutral-400">(satu baris = satu artikel)</span>
          </label>
          <button
            type="button"
            onClick={suggest}
            disabled={suggesting || !categoryId}
            className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            {suggesting ? "Meminta saran…" : "Saran topik dari AI"}
          </button>
        </div>
        <textarea
          id="topics"
          name="topics"
          required
          rows={6}
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          placeholder={"Cara kerja OTP SMS dan kenapa kadang terlambat\nPerbandingan chatbot AI gratis | fokus batas pemakaian harian"}
          className={`${field} font-mono text-[13px] leading-relaxed`}
        />
        <p className="mt-1 text-xs text-neutral-400">
          Tambahkan catatan untuk AI setelah tanda <code className="rounded bg-neutral-100 px-1">|</code>. {lineCount}{" "}
          topik.
        </p>
        {suggestError && <p className="mt-1 text-xs text-red-600">{suggestError}</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.6fr_1fr]">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Kategori</label>
          <select
            name="category_id"
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={field}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Penulis</label>
          <select name="author_id" className={field} defaultValue="">
            <option value="">Otomatis</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Tayang pertama</label>
          <div className="flex gap-2">
            <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} className={`${base} min-w-0 flex-1`} required />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${base} w-[7.5rem] shrink-0`} required />
          </div>
          <input type="hidden" name="start_iso" value={startIso} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Jarak antar artikel</label>
          <select name="interval_days" defaultValue="1" className={field}>
            <option value="1">Setiap hari</option>
            <option value="2">Setiap 2 hari</option>
            <option value="3">Setiap 3 hari</option>
            <option value="7">Setiap minggu</option>
          </select>
        </div>
      </div>

      <label className="flex items-start gap-2.5 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
        <input
          type="checkbox"
          name="auto_schedule"
          checked={auto}
          onChange={(e) => setAuto(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          <strong>Tayang otomatis tanpa review.</strong> Bila dicentang, draf langsung berstatus Scheduled dan tayang
          sendiri pada jadwalnya. Biarkan kosong (disarankan) agar draf menunggu persetujuan Anda; AI bisa keliru
          pada fakta.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || !startIso}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Menyimpan…" : "Tambahkan ke rencana"}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.ok && <p className="text-sm text-emerald-700">{state.ok}</p>}
      </div>
    </form>
  );
}
