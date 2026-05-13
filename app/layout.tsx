import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://marktopdf.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Markdown to PDF Converter - Free Online Tool",
    template: "%s | Markdown to PDF Converter",
  },
  description: "Free online Markdown to PDF and DOCX converter. Convert your Markdown files instantly with live preview, code highlighting, and professional formatting. No signup required.",
  keywords: [
    "markdown to pdf",
    "markdown converter",
    "md to pdf",
    "markdown to docx",
    "markdown to word",
    "online markdown converter",
    "free pdf converter",
    "markdown editor",
    "markdown preview",
    "document converter",
  ],
  authors: [{ name: "Markdown Converter Team" }],
  creator: "Markdown Converter",
  publisher: "Markdown Converter",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Markdown to PDF Converter",
    title: "Markdown to PDF Converter - Free Online Tool",
    description: "Convert Markdown to PDF or DOCX instantly. Free online tool with live preview, code highlighting, and professional formatting.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Markdown to PDF Converter - Free Online Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Markdown to PDF Converter - Free Online Tool",
    description: "Convert Markdown to PDF or DOCX instantly. Free online tool with live preview and professional formatting.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "Technology",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Google AdSense Verification */}
        <meta name="google-adsense-account" content="ca-pub-7743102827076051" />

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-Y19V5P0PN7"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-Y19V5P0PN7');
            `,
          }}
        />

        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster richColors closeButton position="bottom-right" />

        {/* Google AdSense - Replace with your pub ID */}
        {process.env.NEXT_PUBLIC_ADSENSE_PUB_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUB_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
