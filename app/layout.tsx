import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import { APP_NAME, APP_TAGLINE, APP_URL } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — AI Product Insights`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Turn hundreds of messy product reviews into actionable insights in seconds.",
  keywords: [
    "product analytics",
    "review analysis",
    "AI insights",
    "customer feedback",
    "SaaS",
  ],
  authors: [{ name: APP_NAME }],
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    title: `${APP_NAME} — AI Product Insights`,
    description: APP_TAGLINE,
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — AI Product Insights`,
    description: APP_TAGLINE,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      // suppressHydrationWarning prevents the dark mode flash warning
      // when a ThemeProvider changes the class server-side vs client-side
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}