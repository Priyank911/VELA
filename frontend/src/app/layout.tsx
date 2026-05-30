import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "VELA - AI Career Agent",
  description:
    "Personal AI career agent. Connect your data, ask anything, and watch Vela find jobs, draft emails, track applications, and boost your career — powered by Coral SQL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrains.variable} h-full`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full antialiased" style={{ background: "#0a0a0a", color: "#ff8200", fontFamily: "'JetBrains Mono', monospace" }}>
        {children}
      </body>
    </html>
  );
}
