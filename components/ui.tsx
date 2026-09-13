import { cn } from "@/lib/utils";
import { CircleDashed } from "lucide-react";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) { return <div className={cn("card",className)}>{children}</div>; }
export function Badge({ children, tone="slate" }: { children: React.ReactNode; tone?: "teal"|"green"|"amber"|"red"|"blue"|"slate" }) {
  const styles={teal:"bg-teal-50 text-teal-800",green:"bg-emerald-50 text-emerald-700",amber:"bg-amber-50 text-amber-700",red:"bg-red-50 text-red-700",blue:"bg-sky-50 text-sky-700",slate:"bg-slate-100 text-slate-600"};
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",styles[tone])}>{children}</span>;
}
export function Progress({ value, className }: { value:number; className?:string }) { return <div className={cn("h-2 overflow-hidden rounded-full bg-slate-100",className)}><div className="h-full rounded-full bg-gradient-to-r from-teal-700 to-teal-400 transition-all" style={{width:`${Math.max(0,Math.min(100,value))}%`}}/></div>; }
export function EmptyState({ title, text, action }: { title:string;text:string;action?:React.ReactNode }) { return <div className="card flex min-h-52 flex-col items-center justify-center p-8 text-center"><div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700"><CircleDashed/></div><h3 className="font-bold">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-muted">{text}</p>{action && <div className="mt-4">{action}</div>}</div>; }
