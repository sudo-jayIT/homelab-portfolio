import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import { SITE } from "@/content/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Variable weight plus the wdth axis, required for `font-stretch: 62%` on .display. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: SITE.title,
  description: SITE.description,
  openGraph: {
    title: SITE.title,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
};

/**
 * First-visit intro gate (spec 01 section 2.2). Runs before the body paints:
 * unless a lab session is active, the URL has a hash, or the visitor prefers
 * reduced motion, it switches <html> into the room intro so the landing page
 * never flashes. Only on the home route, so /dev/* previews are unaffected.
 * Storage key names match the original for behavioral parity.
 */
const INTRO_GATE = `(function(){try{if(location.pathname!=="/")return;var s=null;try{s=JSON.parse(localStorage.getItem("yg-lab")||"null")}catch(e){}if((s&&s.active)||location.hash||matchMedia("(prefers-reduced-motion: reduce)").matches)return;var h=document.documentElement;h.dataset.view="room";h.dataset.labIntro="";h.dataset.opening="";history.scrollRestoration="manual";scrollTo(0,0)}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-view="classic"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />
        {children}
      </body>
    </html>
  );
}
