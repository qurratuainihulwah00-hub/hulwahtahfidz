"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PORTRAITS = [
  "/hulwah-portrait-pro.webp",
  "/hulwah-portrait-source.webp",
  "/hulwah-reference.jpg",
] as const;

export function TeacherPortrait({ className }: { className?: string }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const src = PORTRAITS[Math.min(sourceIndex, PORTRAITS.length - 1)];

  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <div className="absolute inset-2 rounded-[30px] border border-white/20 bg-gradient-to-br from-white/18 via-cyan-100/8 to-teal-950/5 shadow-[0_26px_80px_rgba(4,47,46,0.28)] backdrop-blur-[2px]" />
      <div className="absolute left-[14%] top-[8%] h-32 w-32 rounded-full bg-cyan-200/20 blur-3xl" />
      <div className="absolute bottom-[8%] right-[5%] h-40 w-40 rounded-full bg-teal-950/20 blur-3xl" />

      {!loaded && (
        <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
          <div className="h-32 w-24 animate-pulse rounded-[28px] bg-white/10" />
        </div>
      )}

      <Image
        key={src}
        src={src}
        alt="Hulwah Qurratu Aini, S.Pd."
        fill
        priority
        unoptimized
        sizes="(max-width: 639px) 210px, (max-width: 1023px) 360px, 430px"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(false);
          setSourceIndex((current) => Math.min(current + 1, PORTRAITS.length - 1));
        }}
        className={cn(
          "z-10 select-none object-contain object-bottom transition-opacity duration-500 drop-shadow-[0_28px_30px_rgba(3,35,34,0.38)]",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[30%] bg-gradient-to-t from-teal-950/30 via-teal-900/5 to-transparent" />
      <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-teal-950/45 px-3 py-1.5 text-[10px] font-extrabold tracking-[0.12em] text-white/90 shadow-lg backdrop-blur-md">
        GURU TAHFIDZ
      </div>
    </div>
  );
}
