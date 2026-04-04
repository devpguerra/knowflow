import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { AppProvider } from "@/lib/context";
import GlobalAgentReasoning from "@/components/GlobalAgentReasoning";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
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
    <html lang="en" className={`${playfairDisplay.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased">
        <AppProvider>
          <GlobalAgentReasoning />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
