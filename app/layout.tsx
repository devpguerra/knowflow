import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { AppProvider } from "@/lib/context";
import GlobalAgentReasoning from "@/components/GlobalAgentReasoning";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KnowFlow — Knowledge Transformer",
  description: "Turn any document into a complete study system with AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="font-body antialiased">
        <AppProvider>
          <GlobalAgentReasoning />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
