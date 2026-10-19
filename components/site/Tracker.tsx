"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Mengirim satu kunjungan anonim per pindah halaman ke /api/track. Menghormati Do Not Track. */
export function Tracker() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    try {
      if (navigator.doNotTrack === "1") return;
      // Referrer eksternal hanya relevan pada pemuatan pertama; setelahnya navigasi internal.
      const referrer = first.current ? document.referrer : "";
      first.current = false;
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ path: pathname, referrer }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // abaikan
    }
  }, [pathname]);

  return null;
}
