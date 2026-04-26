import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI SEO Agent",
  description: "Autonomous SEO platform: scan, plan, write, optimize.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
