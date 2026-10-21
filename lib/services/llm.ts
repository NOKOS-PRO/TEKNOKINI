/**
 * Klien LLM untuk bot artikel. Memakai format OpenAI-compatible
 * `POST {LLM_BASE_URL}/chat/completions`, jadi provider apa pun yang
 * mendukung format itu bisa dipakai tanpa mengubah kode. Contoh:
 *
 *   - OpenRouter (ratusan model, termasuk yang gratis berakhiran ":free"):
 *       LLM_BASE_URL=https://openrouter.ai/api/v1
 *   - OpenCode Zen: LLM_BASE_URL=https://opencode.ai/inference/openai/v1
 *   - OpenAI:       LLM_BASE_URL=https://api.openai.com/v1
 *   - Gateway lain yang kompatibel (Groq, OpenRouter, dll.)
 *
 * Verifikasi nama model (LLM_MODEL) di dashboard provider Anda.
 */

interface GenerateDraftInput {
  sourceName: string;
  sourceUrl: string;
  sourceText: string;
  categoryHint?: string;
}

export interface GeneratedDraft {
  title: string;
  excerpt: string;
  content: string;
  seo_title: string;
  seo_description: string;
  /** 2-4 kata kunci bahasa Inggris untuk mencari foto sampul (opsional). */
  image_query?: string;
  /** Klaim yang perlu dicek faktanya oleh editor sebelum tayang (opsional). */
  fact_check?: string;
}

const LLM_BASE_URL = (process.env.LLM_BASE_URL ?? "https://openrouter.ai/api/v1").replace(/\/+$/, "");
const LLM_MODEL = process.env.LLM_MODEL;
/** Opsional (OpenRouter): "low" | "medium" | "high". "low" menekan token reasoning sehingga lebih murah dan cepat. */
const LLM_REASONING_EFFORT = process.env.LLM_REASONING_EFFORT;
/**
 * Batas token keluaran per permintaan. WAJIB diisi eksplisit: tanpa ini provider memakai
 * batas maksimum model (ratusan ribu token), lalu OpenRouter menolak request dengan
 * 402 "requires more credits" walau pemakaian sebenarnya hanya beberapa ribu token.
 * 4000 token ≈ 2.500–3.000 kata — cukup untuk satu artikel 700–1.100 kata.
 */
const LLM_MAX_TOKENS = Number(process.env.LLM_MAX_TOKENS) || 4000;

const JSON_SHAPE = `{"title": "...", "excerpt": "...", "content": "... (Markdown, minimal 3 paragraf) ...", "seo_title": "...", "seo_description": "...", "image_query": "2-4 kata kunci bahasa Inggris untuk foto sampul yang NATURAL dan relevan (contoh: \\"developer typing laptop\\", \\"smartphone in hand\\"), tanpa nama merek atau orang"}`;

const SYSTEM_PROMPT = `Anda adalah jurnalis teknologi untuk portal berita TeknoKini.

ATURAN WAJIB (anti-plagiarisme):
- Anda akan diberi FAKTA mentah dari satu sumber (nama sumber + cuplikan teks).
- Tulis artikel BARU dari fakta tersebut dengan kalimat dan struktur paragraf Anda sendiri.
- JANGAN memparafrase kalimat sumber secara mekanis (mengganti beberapa kata tapi struktur
  kalimat sama). Itu tetap pelanggaran meski kata-katanya "diubah".
- JANGAN meniru urutan/struktur paragraf sumber.
- Boleh menambah konteks umum yang sudah diketahui publik untuk memperkaya artikel.
- Gaya: lugas, ringkas, bahasa Indonesia jurnalistik, sesuai tagline "Cepat, Ringkas, Terpercaya".

Kembalikan HANYA JSON valid, tanpa teks lain, dengan struktur persis:
${JSON_SHAPE}`;

const TOPIC_SYSTEM_PROMPT = `Anda adalah penulis konten teknologi untuk portal TeknoKini (bahasa Indonesia, gaya lugas dan ramah pembaca awam).

Anda diberi TOPIK dan (opsional) catatan dari editor. Tulis artikel orisinal yang bermanfaat, bukan sekadar daftar umum.

ATURAN WAJIB (akurasi):
- JANGAN mengarang angka, statistik, harga, tanggal rilis, kutipan, atau nama orang. Jika tidak yakin,
  tulis secara umum ("biasanya", "umumnya") atau tinggalkan.
- Hindari klaim "terbaru" yang bergantung pada waktu; tulis yang tetap benar saat artikel tayang.
- Struktur: pembuka singkat, 3-6 subjudul (## Markdown), isi konkret (langkah, perbandingan, contoh),
  penutup/kesimpulan. Panjang sekitar 700-1100 kata.
- Pakai tabel Markdown bila perbandingan membantu. Tanpa emoji.
- Di field "fact_check", daftar singkat (poin dipisah baris) klaim spesifik dalam artikel yang sebaiknya
  dicek editor sebelum tayang (nama produk, fitur, batas pemakaian, harga). Kosongkan bila tidak ada.

Kembalikan HANYA JSON valid, tanpa teks lain, dengan struktur persis:
${JSON_SHAPE.replace(/}$/, ', "fact_check": "..."}')}`;

/**
 * Perbaiki JSON yang rusak oleh model: karakter kontrol mentah di dalam string
 * (mis. tab/newline) dan escape yang tidak valid (mis. "\(").
 */
function repairJson(text: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (const ch of text) {
    if (!inString) {
      if (ch === '"') inString = true;
      out += ch;
      continue;
    }
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = false;
      out += ch;
      continue;
    }
    // Karakter kontrol di dalam string JSON tidak valid -> ganti spasi.
    out += ch.charCodeAt(0) < 0x20 ? " " : ch;
  }
  // Escape backslash yang tidak diikuti karakter escape JSON yang valid.
  return out.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
}

function extractJson(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
  const candidates = [cleaned];
  // Beberapa model menambah teks di sekitar JSON; ambil objek terluar.
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) candidates.push(cleaned.slice(start, end + 1));

  for (const candidate of candidates) {
    for (const text of [candidate, repairJson(candidate)]) {
      try {
        return JSON.parse(text);
      } catch {
        // coba variasi berikutnya
      }
    }
  }
  throw new Error("Respons LLM bukan JSON yang valid.");
}

/**
 * Draf dianggap tidak layak kalau isinya terlalu pendek untuk jadi artikel.
 * Dihitung per kata (bukan per baris kosong) karena beberapa model menulis
 * paragraf dengan satu baris kosong di antaranya atau tanpa baris kosong sama sekali.
 */
export function isUsableDraft(content: string): boolean {
  const words = content.split(/\s+/).filter(Boolean).length;
  const blocks = content.split(/\n\s*\n/).filter((s) => s.trim()).length;
  const lines = content.split("\n").filter((s) => s.trim()).length;
  return words >= 120 && (blocks >= 3 || lines >= 3);
}

async function callLlm(messages: { role: "system" | "user"; content: string }[], temperature: number): Promise<string> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) throw new Error("LLM_API_KEY belum diisi di environment variables.");
  if (!LLM_MODEL) throw new Error("LLM_MODEL belum diisi di environment variables.");

  // OpenRouter memakai header opsional ini untuk atribusi aplikasi di dashboard-nya.
  const attribution: Record<string, string> = LLM_BASE_URL.includes("openrouter.ai")
    ? {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        "X-OpenRouter-Title": "TeknoKini",
      }
    : {};

  const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...attribution,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature,
      max_tokens: LLM_MAX_TOKENS,
      ...(LLM_REASONING_EFFORT && LLM_BASE_URL.includes("openrouter.ai")
        ? { reasoning: { effort: LLM_REASONING_EFFORT } }
        : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM provider error ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  const data = await response.json();
  const raw: string | undefined = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("LLM provider mengembalikan respons kosong/format tak dikenal.");
  return raw;
}

function toDraft(parsed: Partial<GeneratedDraft>): GeneratedDraft {
  if (!parsed.title || !parsed.content) {
    throw new Error("Respons LLM tidak berisi field title/content yang valid.");
  }
  return {
    title: parsed.title,
    excerpt: parsed.excerpt ?? "",
    content: parsed.content,
    seo_title: parsed.seo_title ?? parsed.title,
    seo_description: parsed.seo_description ?? parsed.excerpt ?? "",
    image_query: typeof parsed.image_query === "string" ? parsed.image_query.slice(0, 80) : undefined,
    fact_check: typeof parsed.fact_check === "string" ? parsed.fact_check.trim().slice(0, 1500) : undefined,
  };
}

/** Artikel dari fakta sumber RSS (alur bot harian). */
export async function generateArticleDraft(input: GenerateDraftInput): Promise<GeneratedDraft> {
  const raw = await callLlm(
    [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Sumber: ${input.sourceName} (${input.sourceUrl})\nKategori: ${input.categoryHint ?? "umum"}\n\nFakta mentah:\n${input.sourceText}`,
      },
    ],
    0.4,
  );
  return toDraft(extractJson(raw) as Partial<GeneratedDraft>);
}

/** Artikel dari topik + catatan editor (alur rencana konten). */
export async function generateTopicArticle(input: {
  topic: string;
  brief?: string | null;
  categoryName: string;
}): Promise<GeneratedDraft> {
  const raw = await callLlm(
    [
      { role: "system", content: TOPIC_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Kategori: ${input.categoryName}\nTopik: ${input.topic}\nCatatan editor: ${input.brief?.trim() || "(tidak ada)"}`,
      },
    ],
    0.5,
  );
  return toDraft(extractJson(raw) as Partial<GeneratedDraft>);
}

/** Saran topik artikel untuk satu kategori (dipakai tombol "Saran topik" di admin). */
export async function suggestTopics(input: { categoryName: string; existingTitles: string[]; count?: number }): Promise<string[]> {
  const count = Math.min(input.count ?? 7, 15);
  const raw = await callLlm(
    [
      {
        role: "system",
        content: `Anda editor portal teknologi Indonesia. Usulkan ${count} topik artikel yang punya potensi pencarian Google tinggi di Indonesia, bersifat evergreen (tetap relevan berbulan-bulan), spesifik, dan berbeda dari judul yang sudah ada. Satu topik = satu kalimat judul kerja, tanpa nomor. Kembalikan HANYA JSON: {"topics": ["...", "..."]}`,
      },
      {
        role: "user",
        content: `Kategori: ${input.categoryName}\nJudul yang sudah ada (hindari duplikat):\n${input.existingTitles.slice(0, 40).join("\n") || "(belum ada)"}`,
      },
    ],
    0.8,
  );
  const parsed = extractJson(raw) as { topics?: unknown };
  return (Array.isArray(parsed.topics) ? parsed.topics : [])
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim().replace(/^[-\d.\s]+/, "").slice(0, 250))
    .filter((t) => t.length >= 5)
    .slice(0, count);
}
