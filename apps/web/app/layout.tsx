import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ClientToaster } from "@/components/ClientToaster";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.founderpath.app"),
  title: {
    default: "FounderPath — Founder Operating System",
    template: "%s | FounderPath",
  },
  description:
    "From idea to execution. Nothing missed. The operating system for founders who cannot afford to miss a step.",
  alternates: {
    canonical: "https://www.founderpath.app",
  },
  openGraph: {
    type: "website",
    url: "https://www.founderpath.app",
    siteName: "FounderPath",
    title: "FounderPath — Founder Operating System",
    description:
      "From idea to execution. Nothing missed. The operating system for founders who cannot afford to miss a step.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FounderPath — Founder Operating System",
    description:
      "From idea to execution. Nothing missed. The operating system for founders who cannot afford to miss a step.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
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
