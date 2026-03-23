import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "JobSearch AI — Joesh Sethi",
  description: "AI-powered job search for Solutions Engineer roles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-950 text-white font-sans">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
