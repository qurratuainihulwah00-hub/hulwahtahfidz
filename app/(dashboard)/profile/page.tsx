import { Card } from "@/components/ui";
import { getTeacherProfile } from "@/lib/data";
import { logout } from "@/app/login/actions";
import { LogOut, UserRound } from "lucide-react";

export default async function ProfilePage(){
  const p=await getTeacherProfile();
  return <div className="mx-auto max-w-3xl space-y-5"><div><p className="label">Akun</p><h1 className="mt-1 text-2xl font-extrabold">Profil Saya</h1></div><Card className="p-6"><div className="flex items-center gap-4">{p.avatarUrl ? <img src={p.avatarUrl} alt={p.name} className="h-16 w-16 rounded-2xl object-cover"/> : <div className="grid h-16 w-16 place-items-center rounded-2xl bg-teal-50 text-teal-700"><UserRound size={28}/></div>}<div><div className="text-xl font-extrabold">{p.name}</div>{p.email&&<div className="text-sm text-muted">{p.email}</div>}<div className="mt-1 text-xs font-semibold text-teal-700">Guru Tahfidz</div></div></div><div className="my-6 border-t border-line"/><div className="rounded-xl bg-teal-50 p-4 text-sm leading-6 text-teal-900"><b>Tahfidz with Hulwah</b><br/><span className="text-teal-700">Personal Tahfidz Dashboard · Track • Guide • Grow</span></div><p className="mt-4 text-xs leading-5 text-muted">Foto profil Ustadzah dapat ditambahkan nanti. Profil siswa tetap menggunakan inisial agar dashboard ringan dan fokus pada perkembangan.</p><form action={logout} className="mt-6"><button className="button-secondary text-red-600"><LogOut size={16}/> Keluar</button></form></Card></div>
}
