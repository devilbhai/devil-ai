import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Devil Ai",
  description: "Devil Ai is a powerful autonomous AI agent platform. Our purpose is to streamline your workflow by connecting with your favorite tools, managing complex tasks, and executing multi-step instructions with precision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#0a0a0f] text-gray-200 selection:bg-red-500/20 overflow-x-hidden`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
