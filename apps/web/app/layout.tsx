import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ClientToaster } from "@/components/ClientToaster";

export const metadata: Metadata = {
  title: "BUSOS — Founder Operating System",
  description:
    "From idea to execution. Nothing missed. The operating system for founders who cannot afford to miss a step.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <ClientToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
