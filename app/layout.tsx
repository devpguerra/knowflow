import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KnowFlow",
  description: "AI-powered knowledge transformer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
      <body>{children}</body>
    </html>
  );
}
