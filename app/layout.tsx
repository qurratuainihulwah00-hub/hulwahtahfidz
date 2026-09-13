import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Tahfidz with Hulwah", template: "%s · Tahfidz with Hulwah" },
  description: "Personal Tahfidz Dashboard — Track • Guide • Grow",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
