import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Footer, Header } from "@/components/SiteChrome";
import { IntroReveal } from "@/components/IntroReveal";
import { PanelSpotlight } from "@/components/PanelSpotlight";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
export const metadata: Metadata = {
  title: {
    default: "InternGuard — Investigate before you accept",
    template: "%s | InternGuard",
  },
  description:
    "Transparent, evidence-first internship risk intelligence for students.",
  icons: { icon: "/icon.svg" },
};
const bootstrapScript = `(function(){try{var theme=localStorage.getItem('ig-theme');if(theme==='light'||theme==='dark')document.documentElement.dataset.theme=theme}catch(e){}})()`;
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootstrapScript }} />
        <noscript>
          <style>{`.intro-cover{display:none!important}html{overflow:auto!important}`}</style>
        </noscript>
      </head>
      <body className={`${inter.variable} ${space.variable}`}>
        <IntroReveal />
        <PanelSpotlight />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
