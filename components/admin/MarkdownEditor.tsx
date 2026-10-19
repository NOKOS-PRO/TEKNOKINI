"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownEditorProps {
  name: string;
  defaultValue?: string;
}

const TOOLBAR: { label: string; before: string; after: string; placeholder?: string }[] = [
  { label: "H2", before: "## ", after: "" },
  { label: "B", before: "**", after: "**", placeholder: "teks tebal" },
  { label: "I", before: "_", after: "_", placeholder: "teks miring" },
  { label: "Link", before: "[", after: "](https://)", placeholder: "teks tautan" },
  { label: "• List", before: "- ", after: "" },
  { label: "1. List", before: "1. ", after: "" },
  { label: "Quote", before: "> ", after: "" },
  { label: "Image", before: "![", after: "](https://url-gambar.jpg)", placeholder: "alt teks" },
  { label: "Code", before: "```\n", after: "\n```" },
];

export function MarkdownEditor({ name, defaultValue = "" }: MarkdownEditorProps) {
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function applyFormat(before: string, after: string, placeholder = "") {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + before.length + selected.length + after.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-300">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5">
        <div className="flex flex-wrap gap-1">
          {TOOLBAR.map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={() => applyFormat(btn.before, btn.after, btn.placeholder)}
              className="rounded px-2 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-200"
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="flex rounded-md border border-neutral-200 bg-white text-xs">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={`px-2.5 py-1 ${tab === "write" ? "bg-brand-50 text-brand-700" : "text-neutral-500"}`}
          >
            Tulis
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`px-2.5 py-1 ${tab === "preview" ? "bg-brand-50 text-brand-700" : "text-neutral-500"}`}
          >
            Preview
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          ref={textareaRef}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={18}
          className="w-full resize-y px-4 py-3 font-mono text-sm outline-none"
          placeholder="Tulis isi artikel dalam Markdown…"
        />
      ) : (
        <div className="prose prose-sm max-w-none px-4 py-3">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {value || "*Belum ada konten.*"}
          </ReactMarkdown>
        </div>
      )}
      {/* Keeps the value present in the submitted form even while the Preview tab is showing */}
      {tab === "preview" && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
