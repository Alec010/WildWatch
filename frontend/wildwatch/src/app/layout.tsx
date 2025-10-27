import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
import ClientChatbot from '../components/ClientChatbot';
import { SidebarProvider } from "@/contexts/SidebarContext"
import TokenInitializer from '@/components/TokenInitializer';
import ZoomController from '@/components/ZoomController';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WildWatch",
  description: "WildWatch - Wildlife Monitoring and Reporting Platform",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          <UserProvider>
            <TokenInitializer />
            <ZoomController />
            {children}
            <ClientChatbot />
          </UserProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
