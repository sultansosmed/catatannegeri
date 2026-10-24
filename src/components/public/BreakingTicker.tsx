import React from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

interface BreakingTickerProps {
  text: string;
  link?: string;
}

export function BreakingTicker({ text, link }: BreakingTickerProps) {
  if (!text) return null;

  return (
    <div className="bg-brand-red text-white text-xs sm:text-sm font-medium py-1.5 px-4 shadow-sm border-b border-red-900/20">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
          <Zap className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
          Terkini
        </span>
        <div className="overflow-hidden whitespace-nowrap text-ellipsis flex-1">
          {link ? (
            <Link href={link} className="hover:underline transition-colors">
              {text}
            </Link>
          ) : (
            <span>{text}</span>
          )}
        </div>
      </div>
    </div>
  );
}

