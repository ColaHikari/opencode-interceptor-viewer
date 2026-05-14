"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { MD_PROSE } from "@/lib/utils";

interface Heading {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function MarkdownRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [outlineOpen, setOutlineOpen] = useState(false);

  // Extract headings from rendered DOM
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new MutationObserver(() => {
      const hs = el.querySelectorAll("h1, h2, h3, h4");
      const items: Heading[] = [];
      hs.forEach((h) => {
        const text = h.textContent || "";
        const id = slugify(text);
        h.id = id;
        items.push({
          id,
          text,
          level: parseInt(h.tagName[1]),
        });
      });
      setHeadings(items);
    });
    observer.observe(el, { childList: true, subtree: true });
    // Also run immediately in case content is already rendered
    setTimeout(() => {
      const hs = el.querySelectorAll("h1, h2, h3, h4");
      const items: Heading[] = [];
      hs.forEach((h) => {
        const text = h.textContent || "";
        const id = slugify(text);
        h.id = id;
        items.push({ id, text, level: parseInt(h.tagName[1]) });
      });
      setHeadings(items);
    }, 100);
    return () => observer.disconnect();
  }, [content]);

  // Track active heading on scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const allHeadings = el.querySelectorAll("h1, h2, h3, h4");
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    allHeadings.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, [headings]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  }, []);

  const activeIndex = headings.findIndex((h) => h.id === activeId);

  return (
    <div className="flex gap-0">
      <div ref={containerRef} className={`min-w-0 flex-1 ${className || ""}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {content}
        </ReactMarkdown>
      </div>

      {headings.length > 0 && (
        <>
          <button
            onClick={() => setOutlineOpen(!outlineOpen)}
            className="fixed bottom-4 right-4 z-20 p-2 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--border)]/20 transition-colors shadow-lg text-[var(--muted)]"
            title="Toggle outline"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="15" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {outlineOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setOutlineOpen(false)}
              />
              <nav className="fixed top-0 right-0 z-40 w-60 h-full overflow-auto border-l border-[var(--border)] bg-[var(--background)] shadow-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">
                    Outline
                  </span>
                  <button
                    onClick={() => setOutlineOpen(false)}
                    className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <ul className="space-y-0.5">
                  {headings.map((h, i) => (
                    <li key={h.id}>
                      <button
                        onClick={() => {
                          scrollTo(h.id);
                          setOutlineOpen(false);
                        }}
                        className={`w-full text-left text-[11px] leading-tight py-1 px-1.5 rounded transition-colors truncate block ${
                          i === activeIndex
                            ? "bg-[var(--accent)]/15 text-[var(--accent)] font-medium"
                            : "text-[var(--muted)] hover:bg-[var(--surface)]"
                        }`}
                        style={{ paddingLeft: `${(h.level - 1) * 12 + 6}px` }}
                      >
                        {h.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </>
          )}
        </>
      )}
    </div>
  );
}
