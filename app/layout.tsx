import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doffice",
  description:
    "Takvim, ajanda ve kayıt yönetimini tek ekranda toplayan kişisel ofis paneli.",
  applicationName: "Doffice",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Doffice",
    description: "Kişisel ofis paneli ve yıllık takvim.",
    type: "website",
    locale: "tr_TR",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f2ea",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
