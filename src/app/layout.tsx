import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Portal — Tutoring Accountability",
  description:
    "A calm, focused portal for daily study logs, homework, and progress tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
