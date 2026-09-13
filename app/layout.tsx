import type { Metadata } from "next";
import "./globals.css";

const HULWAH_FAVICON = "/hulwah-avatar-pro.webp?v=20260913-2";

export const metadata: Metadata = {
  title: { default: "Tahfidz with Hulwah", template: "%s · Tahfidz with Hulwah" },
  description: "Personal Tahfidz Dashboard — Track • Guide • Grow",
  icons: {
    icon: [{ url: HULWAH_FAVICON, type: "image/webp" }],
    shortcut: HULWAH_FAVICON,
    apple: HULWAH_FAVICON,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
