import { Geist, Geist_Mono } from "next/font/google";
import { TenantProvider } from "./components/TenantProvider";
import { ClientProviders } from "./components/ClientProviders";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="tenant-id" content="" />
        <meta name="tenant-slug" content="" />
        <meta name="tenant-name" content="" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <TenantProvider>
          <ClientProviders>
            {children}
          </ClientProviders>
        </TenantProvider>
      </body>
    </html>
  );
}
