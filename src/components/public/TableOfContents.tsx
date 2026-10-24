"use client";

import React, { useEffect, useState } from "react";
import { ListCollapse } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ contentHtml }: { contentHtml: string }) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // Parse h2 and h3 headings from the content
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, "text/html");
    const elements = doc.querySelectorAll("h2, h3");

    const items: TocItem[] = [];
    elements.forEach((el, index) => {
      const text = el.textContent || "";
      if (text.trim()) {
        const id = `section-${index + 1}`;
        items.push({
          id,
          text,
          level: el.tagName === "H2" ? 2 : 3,
        });
      }
    });

    setHeadings(items);
  }, [contentHtml]);

  if (headings.length < 2) return null;

  return (
    <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full font-serif font-bold text-sm text-brand-navy hover:text-brand-red transition-colors"
      >
        <span className="flex items-center gap-2">
          <ListCollapse className="w-4 h-4 text-brand-red" />
          Daftar Isi Artikel
        </span>
        <span className="text-xs text-slate-500 font-sans font-normal">
          {isOpen ? "[Sembunyikan]" : "[Tampilkan]"}
        </span>
      </button>

      {isOpen && (
        <ul className="mt-3 space-y-1.5 text-xs">
          {headings.map((item) => (
            <li
              key={item.id}
              className={`${
                item.level === 3 ? "pl-4 text-slate-600" : "font-medium text-slate-700"
              }`}
            >
              <a
                href={`#${item.id}`}
                className="hover:text-brand-red hover:underline transition-colors block py-0.5"
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

