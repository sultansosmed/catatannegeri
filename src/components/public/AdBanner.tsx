import React from "react";

interface AdBannerProps {
  placement: string;
  html?: string | null;
  enabled?: boolean;
  className?: string;
}

export function AdBanner({ placement, html, enabled = true, className = "" }: AdBannerProps) {
  if (!enabled || !html) return null;

  return (
    <div className={`my-4 flex flex-col items-center justify-center ${className}`}>
      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1">
        Pariwara / Advertorial
      </span>
      <div
        className="w-full flex justify-center overflow-hidden"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

