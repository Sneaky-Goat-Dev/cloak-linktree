import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cloak — protected link page",
  description: "A link-in-bio that doesn't leak its destinations.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full text-neutral-100">
        {/* Background photo — the colorful surface that the glass refracts. */}
        <div className="fixed inset-0 -z-20 overflow-hidden bg-neutral-950" aria-hidden>
          <Image
            src="/bg.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        {/* Subtle dark vignette so glass + text stay legible over bright sky. */}
        <div
          className="fixed inset-0 -z-10 bg-gradient-to-b from-black/25 via-black/35 to-black/55"
          aria-hidden
        />
        {children}
      </body>
    </html>
  );
}
