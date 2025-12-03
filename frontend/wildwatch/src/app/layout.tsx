import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
import ClientChatbot from "../components/ClientChatbot";
import { SidebarProvider } from "@/contexts/SidebarContext";
import TokenInitializer from "@/components/TokenInitializer";
import { AppLoader } from "@/components/AppLoader";
import { MobileAppDownload } from "@/components/MobileAppDownload";
import { Toaster } from "sonner";
import LayoutWrapper from "@/components/LayoutWrapper";
import ImagePreloader from "@/components/ImagePreloader";

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
  description:
    "Official incident reporting system for Cebu Institute of Technology - University",
  icons: {
    icon: "/logo2.png",
    shortcut: "/logo2.png",
    apple: "/logo2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-hidden h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden h-full max-w-full`}
      >
        <ImagePreloader />
        <SidebarProvider>
          <UserProvider>
            <AppLoader>
              <TokenInitializer />
              <LayoutWrapper>{children}</LayoutWrapper>
              <ClientChatbot />
              <MobileAppDownload />
              <Toaster
                position="top-right"
                richColors
                toastOptions={{
                  classNames: {
                    toast: "bg-white",
                    success: "bg-[#dcfce7] border-[#86efac] text-[#166534]",
                    error: "bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]",
                    warning: "bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]",
                    info: "bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]",
                  },
                }}
                theme="light"
              />
            </AppLoader>
          </UserProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
