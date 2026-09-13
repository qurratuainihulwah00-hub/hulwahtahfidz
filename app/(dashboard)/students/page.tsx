import { StudentDirectory } from "@/components/student-directory";
import { getStudentOverviews } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const students = await getStudentOverviews();

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <p className="label">Pembinaan Individual</p>
        <h1 className="mt-1 text-2xl font-extrabold">Siswa Binaan Saya</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
          Cari siswa dengan cepat, lihat posisi hafalan, kehadiran, fokus pembinaan, dan histori setiap siswa.
        </p>
      </div>
      <StudentDirectory students={students} />
    </div>
  );
}
