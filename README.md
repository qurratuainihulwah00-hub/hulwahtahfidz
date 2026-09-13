# Tahfidz with Hulwah

**Personal Tahfidz Dashboard — Track • Guide • Grow**

Dashboard full-stack untuk Guru Tahfidz SDIT: absensi, setoran hafalan, murajaah, siswa binaan, catatan individual, fokus pembinaan, perkembangan, laporan bulanan, laporan semester, PDF individual, dan Excel per kelas.

## Delivery plan (4 tahap)

1. **Foundation** — Next.js UI shell, auth, Supabase schema/RLS, desain teal premium.
2. **Daily workflow** — absensi, setoran, murajaah, profil siswa, catatan & fokus pembinaan.
3. **Insights & reports** — progress, analisis/narasi, PDF individual, ZIP semua PDF, Excel kelas, laporan bulanan/semester.
4. **Hardening & release** — QA responsive, security advisor, seed real data, final regression, lalu **satu kali deploy production di akhir**.

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dari project Supabase yang benar. Jalankan migration di `supabase/migrations` **berurutan**: initial schema → security hardening → Hulwah workspace bootstrap.

## Design

- Brand: **Tahfidz with Hulwah**
- Subtitle: Personal Tahfidz Dashboard
- Tagline: Track • Guide • Grow
- Palette: deep teal `#064E68`, teal `#08748F`, accent blue `#1683A5`, soft cyan `#C5E0E7`, canvas `#F5F8F9`.
- Visual language: modern SaaS dashboard, rounded cards, subtle border/shadow, gradient only as accent.

## Deployment rule

Jangan membuat production deploy berulang selama development. Build dan verifikasi dilakukan tanpa production deploy, lalu production dilepas **sekali di akhir tahap 4**.

## Data awal workspace

Guru Tahfidz: **Hulwah Qurratu Aini, S.Pd.**

Siswa binaan sementara:
- **1 Ar Rahman** — Shanum, Raina, Alif, Feiza, Aba, Adiba.
- **2 An Nur** — Farzan, Khaidar Ali, Asyifa, Shareen, Valdis, Azka, Rajab, Fikra.
- **3 Az Zukhruf** — Kayla, Shanum, Medina, Aisyah, Adel, Amira.

Target kelas sementara:
- 1 Ar Rahman — Target 1: An-Naba → Al-Fajr; Target 2: Al-Balad → An-Nas.
- 2 An Nur — Target 1: Al-Mulk → Al-Jinn; Target 2: Al-Muzzammil → Al-Baqarah: 29.
- 3 Az Zukhruf — Target 1: Al-Baqarah: 30 → Al-Baqarah: 112; Target 2: Al-Baqarah: 113 → Al-Baqarah: 190.

Foto siswa tidak digunakan. Siswa ditampilkan dengan inisial. Foto guru disiapkan melalui `profiles.avatar_url` dan dapat ditambahkan saat foto Ustadzah tersedia.
