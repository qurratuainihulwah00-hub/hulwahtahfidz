import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function scoreLabel(score: number) {
  if (score >= 4.5) return "Sangat Baik";
  if (score >= 4) return "Baik";
  if (score >= 3.5) return "Cukup Baik";
  if (score >= 3) return "Perlu Penguatan";
  return "Perlu Pembinaan";
}
