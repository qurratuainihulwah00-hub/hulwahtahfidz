"use client";
import { useMemo, useState, useTransition } from "react";
import { Check, Loader2, Users } from "lucide-react";
import { saveAttendanceAction } from "@/app/actions";
import type { AttendanceStatus, Student } from "@/lib/types";
import { cn } from "@/lib/utils";

const options: Array<{value:AttendanceStatus;label:string;style:string}>=[
  {value:"hadir",label:"Hadir",style:"data-[active=true]:bg-emerald-600 data-[active=true]:text-white"},
  {value:"izin",label:"Izin",style:"data-[active=true]:bg-sky-600 data-[active=true]:text-white"},
  {value:"sakit",label:"Sakit",style:"data-[active=true]:bg-amber-500 data-[active=true]:text-white"},
  {value:"alfa",label:"Alfa",style:"data-[active=true]:bg-red-600 data-[active=true]:text-white"},
];

export function AttendanceBoard({students,initial,date}:{students:Student[];initial:Record<string,AttendanceStatus>;date:string}){
  const [statuses,setStatuses]=useState<Record<string,AttendanceStatus>>(()=>Object.fromEntries(students.map(s=>[s.id,initial[s.id]??"hadir"])));
  const [classFilter,setClassFilter]=useState("all"); const [pending,startTransition]=useTransition(); const [message,setMessage]=useState("");
  const classes=useMemo(()=>Array.from(new Set(students.map(s=>s.class_name))).sort(),[students]);
  const visible=classFilter==="all"?students:students.filter(s=>s.class_name===classFilter);
  const allPresent=()=>setStatuses(p=>({...p,...Object.fromEntries(visible.map(s=>[s.id,"hadir"]))}));
  const save=()=>startTransition(async()=>{setMessage("");const res=await saveAttendanceAction({date,rows:students.map(s=>({studentId:s.id,status:statuses[s.id]??"hadir"}))});setMessage(res.ok?"Absensi berhasil disimpan.":res.message??"Gagal menyimpan absensi.")});
  return <div className="space-y-4"><div className="flex flex-wrap items-center gap-2"><button className={cn("rounded-xl px-3 py-2 text-xs font-bold",classFilter==="all"?"bg-teal-700 text-white":"border border-line bg-white")} onClick={()=>setClassFilter("all")}>Semua</button>{classes.map(c=><button key={c} className={cn("rounded-xl px-3 py-2 text-xs font-bold",classFilter===c?"bg-teal-700 text-white":"border border-line bg-white")} onClick={()=>setClassFilter(c)}>Kelas {c}</button>)}<button className="button-secondary ml-auto" onClick={allPresent}><Users size={16}/> Tandai semua hadir</button></div>
    <div className="card divide-y divide-line overflow-hidden">{visible.map(s=><div key={s.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-sm font-extrabold text-teal-800">{s.full_name.charAt(0)}</div><div className="min-w-0"><div className="truncate text-sm font-bold">{s.full_name}</div><div className="text-xs text-muted">Kelas {s.class_name}</div></div></div><div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-50 p-1">{options.map(o=><button key={o.value} data-active={statuses[s.id]===o.value} onClick={()=>setStatuses(p=>({...p,[s.id]:o.value}))} className={cn("rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition",o.style)}>{o.label}</button>)}</div></div>)}</div>
    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">{message?<p className="text-sm font-semibold text-teal-700">{message}</p>:<p className="text-xs text-muted">Tip: tandai semua hadir lalu ubah hanya siswa yang izin, sakit, atau alfa.</p>}<button onClick={save} disabled={pending||!students.length} className="button-primary min-w-36">{pending?<Loader2 className="animate-spin" size={16}/>:<Check size={16}/>} Simpan Absensi</button></div></div>
}
