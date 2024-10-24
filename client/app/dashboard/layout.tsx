import localFont from "next/font/local";
import "../globals.css";
import { Toaster } from "sonner";
import SiteHeader from "@/components/site-header";

const geistSans = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
       <Toaster />
       
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}