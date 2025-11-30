"use client";

import { useUser } from "@/contexts/UserContext";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface AppLoaderProps {
  children: ReactNode;
}

export function AppLoader({ children }: AppLoaderProps) {
  const { isLoading } = useUser();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Track if component has mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show loader on public pages
  const publicPages = ['/login', '/signup', '/reset-password', '/verify-email', '/auth/setup', '/auth/error', '/terms', '/'];
  const isPublicPage = publicPages.some(page => pathname === page || pathname.startsWith(page + '/'));

  // Show loader if:
  // 1. Component hasn't mounted yet (prevents hydration mismatch)
  // 2. We're loading auth state AND not on a public page
  if (!mounted || (isLoading && !isPublicPage)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-[#DAA520] animate-spin animation-delay-150"></div>
            <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin animation-delay-300"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">
            {!mounted ? "Initializing..." : "Loading application..."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
