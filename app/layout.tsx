import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { APP_NAME, APP_URL } from "@/lib/constants";
import "./globals.css";

const OG_TITLE = `${APP_NAME} — Every review. One clear picture.`;
const OG_DESCRIPTION =
  "Upload customer reviews, get AI themes, sentiment breakdown & executive summary in under 60 seconds.";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — AI Product Insights`,
    template: `%s | ${APP_NAME}`,
  },
  description: OG_DESCRIPTION,
  keywords: [
    "product analytics",
    "review analysis",
    "AI insights",
    "customer feedback",
    "SaaS",
    "sentiment analysis",
  ],
  authors: [{ name: APP_NAME }],
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafe" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0a1e" },
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
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthSessionProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
