"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, Bell, BookHeart, BookOpenCheck, CalendarCheck2, ChevronRight, ClipboardCheck, FileBarChart, FileText, LayoutDashboard, Menu, NotebookPen, Search, UserRound, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { section: "Aktivitas" },
  { label: "Absensi", href: "/attendance", icon: CalendarCheck2 },
  { label: "Setoran Hafalan", href: "/submissions", icon: ClipboardCheck },
  { label: "Murajaah", href: "/murajaah", icon: BookHeart },
  { section: "Siswa" },
  { label: "Siswa Binaan", href: "/students", icon: Users },
  { label: "Perkembangan", href: "/progress", icon: BarChart3 },
  { section: "Laporan" },
  { label: "Laporan Bulanan", href: "/reports/monthly", icon: FileText },
  { label: "Laporan Semester", href: "/reports/semester", icon: FileBarChart },
  { section: "Akun" },
  { label: "Profil Saya", href: "/profile", icon: UserRound },
] as const;

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <div className="flex h-full flex-col bg-white p-4">
    <div className="mb-7 flex items-center gap-3 px-2 pt-2"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-teal-800 to-teal-500 text-white shadow-soft"><BookOpenCheck size={21}/></div><div><div className="text-[15px] font-extrabold tracking-tight">Tahfidz with Hulwah</div><div className="text-[10px] font-medium text-muted">Personal Tahfidz Dashboard</div></div></div>
    <nav className="space-y-1 overflow-y-auto pb-6">{nav.map((item, i) => "section" in item ? <div key={`${item.section}-${i}`} className="px-3 pb-1 pt-5 text-[10px] font-bold uppercase tracking-[.18em] text-muted/70">{item.section}</div> : (() => { const Icon=item.icon; const active=pathname===item.href || (item.href!=="/dashboard" && pathname.startsWith(item.href)); return <Link key={item.href} href={item.href} onClick={onNavigate} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition", active ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50 hover:text-ink")}><Icon size={18} className={active?"text-teal-700":"text-slate-400"}/><span className="flex-1">{item.label}</span>{active && <ChevronRight size={15}/>}</Link> })())}</nav>
    <div className="mt-auto rounded-2xl bg-gradient-to-br from-teal-800 to-teal-600 p-4 text-white"><div className="mb-2 flex items-center gap-2 text-xs font-bold"><NotebookPen size={15}/> Catatan hari ini</div><p className="text-[11px] leading-5 text-white/75">Simpan hal kecil dari setiap siswa. Catatan itu akan menjadi narasi perkembangan yang bermakna.</p></div>
  </div>
}

export function DashboardShell({ children, teacherName, teacherAvatarUrl }: { children: React.ReactNode; teacherName: string; teacherAvatarUrl?: string | null }) {
  const [open,setOpen]=useState(false);
  return <div className="min-h-screen bg-canvas md:grid md:grid-cols-[258px_1fr]">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[258px] border-r border-line md:block"><Sidebar/></aside>
    {open && <div className="fixed inset-0 z-50 md:hidden"><button aria-label="Tutup menu" className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" onClick={()=>setOpen(false)}/><aside className="relative h-full w-[286px] border-r border-line shadow-2xl"><div className="absolute right-3 top-3 z-10"><button onClick={()=>setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100"><X size={18}/></button></div><Sidebar onNavigate={()=>setOpen(false)}/></aside></div>}
    <div className="min-w-0 md:col-start-2">
      <header className="sticky top-0 z-30 flex h-[70px] items-center gap-3 border-b border-line/80 bg-white/90 px-4 backdrop-blur-xl md:px-7"><button className="grid h-10 w-10 place-items-center rounded-xl border border-line md:hidden" onClick={()=>setOpen(true)}><Menu size={19}/></button><div className="relative hidden max-w-md flex-1 md:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input className="h-10 w-full rounded-xl border border-line bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-teal-300 focus:bg-white" placeholder="Cari siswa..."/></div><div className="ml-auto flex items-center gap-2"><button className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-slate-500"><Bell size={18}/></button><div className="flex items-center gap-2 rounded-xl border border-line bg-white py-1.5 pl-1.5 pr-3">{teacherAvatarUrl ? <img src={teacherAvatarUrl} alt={teacherName} className="h-8 w-8 rounded-lg object-cover"/> : <div className="grid h-8 w-8 place-items-center rounded-lg bg-teal-100 text-xs font-extrabold text-teal-800">H</div>}<div className="hidden sm:block"><div className="max-w-[150px] truncate text-xs font-bold">{teacherName}</div><div className="text-[10px] text-muted">Guru Tahfidz</div></div></div></div></header>
      <main className="p-4 md:p-7 lg:p-8">{children}</main>
    </div>
  </div>
}
