"use client";

import Image from "next/image";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const PORTRAITS = ["/hulwah-avatar-pro.webp", "/hulwah-avatar.webp", "/hulwah-portrait-pro.webp"] as const;

export function TeacherPortrait({ className }: { className?: string }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const src = PORTRAITS[Math.min(sourceIndex, PORTRAITS.length - 1)];

  return (
    <div className={cn("relative isolate", className)}>
      <div className="absolute -inset-4 rounded-[36px] bg-cyan-300/15 blur-3xl" aria-hidden="true" />
      <div className="absolute inset-0 rotate-2 rounded-[32px] border border-white/15 bg-white/10 shadow-[0_30px_80px_rgba(2,44,48,0.34)] backdrop-blur-sm" aria-hidden="true" />

      <div className="relative h-full overflow-hidden rounded-[30px] border border-white/30 bg-gradient-to-b from-white/24 via-cyan-50/10 to-teal-950/20 p-1.5 shadow-[0_26px_70px_rgba(1,39,45,0.28)]">
        <div className="relative h-full overflow-hidden rounded-[25px] bg-gradient-to-br from-cyan-50/20 via-teal-900/10 to-teal-950/35">
          <Image
            key={src}
            src={src}
            alt="Foto Hulwah Qurratu Aini, S.Pd."
            fill
            priority
            unoptimized
            sizes="(max-width: 767px) 180px, (max-width: 1279px) 260px, 300px"
            onError={() => setSourceIndex((current) => Math.min(current + 1, PORTRAITS.length - 1))}
            className="select-none object-cover object-top"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-teal-950/55 via-transparent to-white/5" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-teal-950/80 to-transparent" />

          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-extrabold tracking-tight text-white">Hulwah Qurratu Aini, S.Pd.</p>
              <p className="mt-0.5 text-[10px] font-semibold tracking-[0.08em] text-cyan-100/80">GURU TAHFIDZ</p>
            </div>
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/12 text-cyan-100 backdrop-blur-md">
              <Sparkles size={15} strokeWidth={1.8} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
