"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLiveTrafficAction, type LiveSnapshot } from "@/app/admin/traffic/actions";

const POLL_MS = 10_000;

function ago(iso: string, now: number): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 10) return "baru saja";
  if (s < 60) return `${s} dtk lalu`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} mnt lalu`;
  return `${Math.floor(m / 60)} jam lalu`;
}

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
    setTimeout(() => void ctx.close(), 400);
  } catch {
    // browser memblokir audio; abaikan
  }
}

/**
 * Panel trafik real-time: memanggil server tiap 10 detik, menyorot kunjungan baru,
 * mengganti judul tab bila ada kunjungan saat tab tidak aktif, dan (opsional) berbunyi.
 */
export function LiveTraffic({ initial }: { initial: LiveSnapshot | null }) {
  const [snap, setSnap] = useState<LiveSnapshot | null>(initial);
  const [now, setNow] = useState(() => Date.now());
  const [fresh, setFresh] = useState<Set<number>>(new Set());
  const [sound, setSound] = useState(false);
  const [failed, setFailed] = useState(false);
  const lastId = useRef<number>(initial?.recent[0]?.id ?? 0);
  const unseen = useRef(0);
  const baseTitle = useRef("");
  const soundRef = useRef(false);

  useEffect(() => {
    baseTitle.current = document.title;
    try {
      const saved = localStorage.getItem("tk_traffic_sound") === "1";
      setSound(saved);
      soundRef.current = saved;
    } catch {
      // localStorage tidak tersedia
    }
    const onFocus = () => {
      unseen.current = 0;
      document.title = baseTitle.current;
    };
    const onVisible = () => {
      if (!document.hidden) onFocus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      document.title = baseTitle.current;
    };
  }, []);

  const poll = useCallback(async () => {
    try {
      const next = await getLiveTrafficAction();
      if (!next) {
        setFailed(true);
        return;
      }
      setFailed(false);
      const newOnes = next.recent.filter((r) => r.id > lastId.current);
      if (newOnes.length > 0 && lastId.current !== 0) {
        setFresh(new Set(newOnes.map((r) => r.id)));
        setTimeout(() => setFresh(new Set()), 8000);
        if (soundRef.current) beep();
        if (document.hidden) {
          unseen.current += newOnes.length;
          document.title = `(+${unseen.current}) Trafik live`;
        }
      }
      if (next.recent[0]) lastId.current = Math.max(lastId.current, next.recent[0].id);
      setSnap(next);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    const poller = setInterval(() => void poll(), POLL_MS);
    const ticker = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poller);
      clearInterval(ticker);
    };
  }, [poll]);

  function toggleSound() {
    const next = !sound;
    setSound(next);
    soundRef.current = next;
    try {
      localStorage.setItem("tk_traffic_sound", next ? "1" : "0");
    } catch {
      // abaikan
    }
    if (next) beep();
  }

  if (!snap) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-5 text-sm text-neutral-500">
        Data trafik belum tersedia. Pastikan migration <code>0006_content_plan_and_traffic.sql</code> sudah dijalankan dan{" "}
        <code>SUPABASE_SERVICE_ROLE_KEY</code> terisi.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-neutral-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span
              className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 ${
                snap.live > 0 ? "animate-ping opacity-75" : "opacity-0"
              }`}
            />
            <span className={`relative inline-flex h-3 w-3 rounded-full ${snap.live > 0 ? "bg-emerald-500" : "bg-neutral-300"}`} />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-neutral-900">{snap.live}</p>
            <p className="mt-1 text-xs text-neutral-500">pengunjung aktif (5 menit terakhir)</p>
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold leading-none text-neutral-900">{snap.todayViews.toLocaleString("id-ID")}</p>
          <p className="mt-1 text-xs text-neutral-500">tayangan hari ini</p>
        </div>
        <div>
          <p className="text-2xl font-bold leading-none text-neutral-900">{snap.todayVisitors.toLocaleString("id-ID")}</p>
          <p className="mt-1 text-xs text-neutral-500">pengunjung hari ini</p>
        </div>
        <button
          type="button"
          onClick={toggleSound}
          className={`ml-auto rounded-md border px-2.5 py-1 text-xs font-semibold ${
            sound ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
          }`}
          aria-pressed={sound}
        >
          {sound ? "Bunyi: nyala" : "Bunyi: mati"}
        </button>
      </div>

      <ul className="divide-y divide-neutral-100">
        {snap.recent.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-neutral-400">
            Belum ada kunjungan tercatat. Buka situs di jendela privat (bukan saat login admin) untuk mencoba.
          </li>
        )}
        {snap.recent.map((r) => (
          <li
            key={r.id}
            className={`flex items-center justify-between gap-4 px-5 py-2.5 text-sm transition-colors duration-1000 ${
              fresh.has(r.id) ? "bg-emerald-50" : ""
            }`}
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-neutral-900">
                {r.title ?? (r.path === "/" ? "Beranda" : r.path)}
                {fresh.has(r.id) && (
                  <span className="ml-2 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                    baru
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-neutral-400">
                {r.referrer_host ?? "langsung"} · {r.device ?? "?"}
                {r.country ? ` · ${r.country}` : ""}
              </p>
            </div>
            <span className="shrink-0 text-xs text-neutral-400">{ago(r.created_at, now)}</span>
          </li>
        ))}
      </ul>
      {failed && <p className="border-t border-neutral-100 px-5 py-2 text-xs text-amber-700">Koneksi terputus, mencoba lagi…</p>}
    </div>
  );
}
