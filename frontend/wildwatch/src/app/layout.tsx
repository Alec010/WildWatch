import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
import ClientChatbot from '../components/ClientChatbot';
import { SidebarProvider } from "@/contexts/SidebarContext"
import TokenInitializer from '@/components/TokenInitializer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WildWatch - Campus Safety Monitoring System",
  description: "Streamlining incident reporting for CIT University. Ensuring all campus concerns are properly documented and addressed by the right authorities.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
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
            {children}
            <ClientChatbot />
          </UserProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
