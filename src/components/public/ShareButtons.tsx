"use client";

import React, { useState } from "react";
import { Share2, Check, Link as LinkIcon } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="flex items-center gap-2 py-3 border-y border-slate-200 text-xs">
      <span className="flex items-center gap-1 font-bold text-slate-700 mr-1">
        <Share2 className="w-3.5 h-3.5" />
        Bagikan:
      </span>

      {/* WhatsApp */}
      <a
        href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bagikan ke WhatsApp"
        className="px-2.5 py-1 rounded bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366] hover:text-white font-medium transition-colors"
      >
        WhatsApp
      </a>

      {/* Twitter / X */}
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bagikan ke X"
        className="px-2.5 py-1 rounded bg-black/5 text-black hover:bg-black hover:text-white font-medium transition-colors"
      >
        X (Twitter)
      </a>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bagikan ke Facebook"
        className="px-2.5 py-1 rounded bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white font-medium transition-colors"
      >
        Facebook
      </a>

      {/* Copy Link */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors ml-auto"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700 font-semibold">Tersalin!</span>
          </>
        ) : (
          <>
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Salin Tautan</span>
          </>
        )}
      </button>
    </div>
  );
}

