"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface LayoutWrapperProps {
  children: ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Pages that should be full width (no sidebar, no flex layout)
  const fullWidthPages = [
    "/",
    "/login",
    "/signup",
    "/terms",
    "/verify-email",
    "/reset-password",
  ];

  // Check if current path is a full-width page
  const isFullWidthPage =
    fullWidthPages.includes(pathname) ||
    pathname.startsWith("/oauth2/redirect") ||
    pathname.startsWith("/auth/oauth2/redirect") ||
    pathname.startsWith("/auth/setup") ||
    pathname.startsWith("/auth/error");

  // Full width pages should be scrollable (no flex layout)
  if (isFullWidthPage) {
    return <div className="w-full">{children}</div>;
  }

  // Other pages use the flex layout for sidebar
  return (
    <div className="flex h-screen w-screen overflow-hidden gap-0">
      {children}
    </div>
  );
}
