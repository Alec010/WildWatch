"use client";

import { useUser } from "@/contexts/UserContext";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface AppLoaderProps {
  children: ReactNode;
}

export function AppLoader({ children }: AppLoaderProps) {
  const { isLoading, userRole } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const publicPages = [
    "/login",
    "/signup",
    "/reset-password",
    "/verify-email",
    "/auth/setup",
    "/auth/error",
    "/terms",
    "/",
    "/oauth2/redirect",
    "/auth/oauth2/redirect",
  ];
  const isPublicPage = publicPages.some(
    (page) => pathname === page || pathname.startsWith(page + "/")
  );

  // Pages that handle their own loading state (with sidebar/navbar visible)
  const pagesWithOwnLoader = ["/office-admin/pdf-preview"];
  const hasOwnLoader = pagesWithOwnLoader.some((page) =>
    pathname?.startsWith(page)
  );

  // Redirect unauthenticated users to login when accessing protected pages
  useEffect(() => {
    if (!mounted) return;

    // Don't redirect on public pages
    if (isPublicPage) return;

    // Wait for loading to complete
    if (isLoading) return;

    // Check if user is authenticated
    const token = Cookies.get("token");
    const isAuthenticated = token && userRole;

    // If no token or no user role, redirect to login
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, isLoading, userRole, isPublicPage, pathname, router]);

  // Don't show AppLoader's loading screen for pages that have their own loader
  // This allows those pages to show sidebar/navbar during loading
  // If we're on a page with its own loader, always render children (let page handle loading)
  if (hasOwnLoader) {
    return <>{children}</>;
  }

  // Show AppLoader's loading screen only for pages without their own loader
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

  // Don't render protected content if user is not authenticated
  if (!isPublicPage) {
    const token = Cookies.get("token");
    const isAuthenticated = token && userRole;

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-[#DAA520] animate-spin animation-delay-150"></div>
              <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin animation-delay-300"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">
              Redirecting to login...
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
