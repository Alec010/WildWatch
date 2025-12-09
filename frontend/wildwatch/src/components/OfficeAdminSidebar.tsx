"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  AlertTriangle,
  History,
  ClipboardList,
  LogOut,
  Trophy,
  ChevronRight,
  Shield,
  Menu,
  X,
  ClipboardCheck,
  FileText,
} from "lucide-react";
import Cookies from "js-cookie";
import { useEffect, useState, useRef } from "react";
import { API_BASE_URL } from "@/utils/api";
import { api } from "@/utils/apiClient";
import { useSidebar } from "@/contexts/SidebarContext";
import userProfileService from "@/utils/userProfileService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface User {
  firstName: string;
  lastName: string;
  schoolIdNumber: string;
  email: string;
}

export function OfficeAdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  // Initialize user state from sessionStorage immediately to prevent flickering
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const cachedProfile = userProfileService.getUserProfile();
      if (cachedProfile) {
        return {
          firstName: cachedProfile.firstName,
          lastName: cachedProfile.lastName,
          schoolIdNumber: cachedProfile.schoolIdNumber,
          email: cachedProfile.email,
        };
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    // If we have cached data, we're not loading
    if (typeof window !== "undefined") {
      const cachedProfile = userProfileService.getUserProfile();
      return !cachedProfile;
    }
    return true;
  });
  const { collapsed, setCollapsed } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 1024);
        if (window.innerWidth < 1024) {
          setCollapsed(true);
        }
      }
    };

    checkMobile();

    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, []);

  useEffect(() => {
    const loadUserProfile = async () => {
      // Check sessionStorage first - if we already have user state from initialization, verify it's still valid
      const cachedProfile = userProfileService.getUserProfile();
      if (cachedProfile) {
        // Only update if current user state doesn't match cached profile (prevents unnecessary updates)
        setUser((prevUser) => {
          if (
            prevUser?.firstName === cachedProfile.firstName &&
            prevUser?.lastName === cachedProfile.lastName &&
            prevUser?.schoolIdNumber === cachedProfile.schoolIdNumber
          ) {
            // State already matches, no update needed
            return prevUser;
          }
          // Update to match cached profile
          return {
            firstName: cachedProfile.firstName,
            lastName: cachedProfile.lastName,
            schoolIdNumber: cachedProfile.schoolIdNumber,
            email: cachedProfile.email,
          };
        });
        setLoading(false);
        hasFetchedRef.current = true;
        // Don't fetch from API if we have cached data - it's already loaded
        return;
      }

      // If no cached data and haven't fetched yet, fetch from API
      if (!hasFetchedRef.current) {
        try {
          setLoading(true);
          const response = await api.get("/api/auth/profile");

          if (!response.ok) {
            if (response.status === 401) {
              // Token is invalid or expired
              setUser(null);
              userProfileService.removeUserProfile();
              router.push("/login");
              return;
            }
            throw new Error("Failed to fetch user profile");
          }

          const userData = await response.json();
          const userProfile = {
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            schoolIdNumber: userData.schoolIdNumber || "",
            email: userData.email || "",
            role: userData.role || "",
          };

          // Save to sessionStorage for future use (sanitization handled by service)
          userProfileService.setUserProfile(userProfile);

          setUser({
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            schoolIdNumber: userProfile.schoolIdNumber,
            email: userProfile.email,
          });
          hasFetchedRef.current = true;
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Only clear if we don't have cached data
          const hasCachedProfile = userProfileService.getUserProfile();
          if (!hasCachedProfile) {
            setUser(null);
            userProfileService.removeUserProfile();
            router.push("/login");
          }
        } finally {
          setLoading(false);
        }
      }
    };

    loadUserProfile();
    // Remove router from dependencies - we don't need to re-fetch when navigating
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = () => {
    setShowSignOutConfirm(true);
  };

  const performSignOut = async () => {
    try {
      setShowSignOutConfirm(false);
      setIsSigningOut(true);

      // Attempt to call logout API if it exists (optional - for server-side cleanup)
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

        if (token) {
          const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          // Even if logout API fails, we'll still clear local state
          if (!response.ok && response.status !== 404) {
            console.warn(
              "Logout API call failed, but continuing with local logout"
            );
          }
        }
      } catch (apiError) {
        // Logout API might not exist or failed, but we'll still proceed with local logout
        console.warn(
          "Logout API error (continuing with local logout):",
          apiError
        );
      }

      // Clear all storage and cookies
      const { clearAllStorage } = await import("@/utils/storageCleanup");
      clearAllStorage();

      // Also clear token via tokenService (dispatches events)
      const tokenService = (await import("@/utils/tokenService")).default;
      tokenService.removeToken();

      // Reset local user state
      setUser(null);
      hasFetchedRef.current = false;
      setLoading(true);

      // Redirect to login only after successful state clearing
      router.push("/login");
    } catch (error) {
      console.error("Error during sign out:", error);
      // Even if there's an error, clear all storage and redirect
      const { clearAllStorage } = await import("@/utils/storageCleanup");
      clearAllStorage();

      const tokenService = (await import("@/utils/tokenService")).default;
      tokenService.removeToken();

      setUser(null);
      hasFetchedRef.current = false;
      router.push("/login");
    } finally {
      setIsSigningOut(false);
    }
  };

  const navItems = [
    {
      href: "/office-admin/dashboard",
      icon: <LayoutDashboard size={20} />,
      label: "Office Dashboard",
    },
    {
      href: "/office-admin/incidents",
      icon: <AlertTriangle size={20} />,
      label: "Incident Management",
    },
    {
      href: "/office-admin/approved-cases",
      icon: <ClipboardCheck size={20} />,
      label: "Verified Case Tracker",
    },
    {
      href: "/office-admin/history",
      icon: <History size={20} />,
      label: "Incident History",
    },
    {
      href: "/office-admin/office-bulletin",
      icon: <FileText size={20} />,
      label: "Office Bulletin",
    },
    {
      href: "/leaderboard",
      icon: <Trophy size={20} />,
      label: "Leaderboard",
    },
  ];

  // Function to get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Mobile menu toggle
  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  // Pages that should not have sidebar
  const noSidebarPages = [
    "/",
    "/login",
    "/signup",
    "/terms",
    "/verify-email",
    "/reset-password",
  ];

  // Don't render sidebar on public/auth pages
  const isPublicPage =
    noSidebarPages.includes(pathname) ||
    pathname.startsWith("/oauth2/redirect") ||
    pathname.startsWith("/auth/oauth2/redirect") ||
    pathname.startsWith("/auth/setup") ||
    pathname.startsWith("/auth/error");

  if (isPublicPage) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={toggleMobileMenu}
          className="fixed top-4 left-4 z-50 bg-[#800000] text-white p-2 rounded-full shadow-lg"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Desktop Sidebar Toggle */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`absolute top-6 ${
            collapsed ? "left-[4.5rem]" : "left-[15rem]"
          } z-50 bg-white text-[#800000] p-1 rounded-full shadow-md`}
          style={{ transition: "none" }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight
            size={18}
            className={`${collapsed ? "rotate-0" : "rotate-180"}`}
          />
        </button>
      )}

      {/* Sidebar Container */}
      <div
        className={`sticky top-0 left-0 h-screen z-40 bg-gradient-to-b from-[#800000] to-[#5a0000] text-white flex flex-col shadow-xl overflow-hidden flex-shrink-0 max-w-full ${
          isMobile
            ? mobileOpen
              ? "fixed left-0"
              : "fixed -left-full"
            : collapsed
            ? "w-20"
            : "w-64"
        }`}
        style={{ maxWidth: "100vw" }}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
        <div className="absolute top-1/3 left-0 w-full h-1/3 bg-[#D4AF37]/5 -skew-y-12"></div>

        {/* Logo Section */}
        <div
          className={`w-full pt-4 pb-3 ${
            collapsed && !isMobile
              ? "flex justify-center px-3"
              : "flex justify-start px-6"
          }`}
        >
          <div className="relative w-full max-w-[180px]">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/30 to-transparent rounded-lg blur opacity-30"></div>
            <div className="relative">
              {collapsed && !isMobile ? (
                <div className="mt-6 w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#800000]" />
                </div>
              ) : (
                <div className="mt-2 w-full" style={{ maxWidth: 150 }}>
                  <Image
                    src="/logo2.png"
                    alt="WildWatch Logo"
                    width={150}
                    height={50}
                    priority
                    unoptimized
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className={`flex-1 flex flex-col ${
            collapsed && !isMobile ? "px-4" : "px-4"
          } ${
            collapsed && !isMobile ? "pt-12" : "pt-4"
          } pb-4 overflow-y-auto overflow-x-hidden hide-scrollbar min-w-0`}
        >
          <div className="space-y-2 w-full max-w-full">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`group relative flex items-center ${
                      collapsed && !isMobile
                        ? "justify-center"
                        : "justify-between"
                    } p-3 rounded-lg ${
                      isActive
                        ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                        : "hover:bg-white/10 text-white/90"
                    }`}
                    style={{
                      minHeight: "44px",
                      transition: "none",
                      transform: "none",
                    }}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4AF37] rounded-r-full" />
                    )}

                    {/* Icon and label */}
                    <div
                      className={`flex items-center h-8 ${
                        collapsed && !isMobile
                          ? "justify-center w-full"
                          : "space-x-3"
                      }`}
                    >
                      <div
                        className={`${
                          isActive
                            ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                            : "text-white/90"
                        } rounded-md p-1 flex items-center justify-center h-8`}
                        style={{ transition: "none", transform: "none" }}
                      >
                        {item.icon}
                      </div>
                      {(!collapsed || isMobile) && (
                        <span
                          className={`${
                            isActive ? "font-medium" : ""
                          } whitespace-nowrap`}
                          style={{
                            transition: "none",
                            fontSize: "inherit",
                            transform: "none",
                          }}
                        >
                          {item.label}
                        </span>
                      )}
                    </div>

                    {/* Arrow indicator for active item */}
                    {isActive && !collapsed && !isMobile && (
                      <ChevronRight size={16} className="text-[#D4AF37]" />
                    )}

                    {/* Tooltip for collapsed state */}
                    {collapsed && !isMobile && (
                      <div
                        className="absolute left-full ml-2 px-2 py-1 bg-[#800000] text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none"
                        style={{ transition: "none", transform: "none" }}
                      >
                        {item.label}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile Section */}
        <div
          className={`mt-auto border-t border-[#D4AF37]/20 max-w-full overflow-hidden ${
            collapsed && !isMobile ? "p-4" : "p-4"
          }`}
        >
          {collapsed && !isMobile ? (
            <div className="flex flex-col items-center space-y-3">
              {loading ? (
                <div
                  className="w-10 h-10 rounded-full bg-[#6B0000]"
                  style={{ flexShrink: 0 }}
                ></div>
              ) : user ? (
                <Link href="office-admin/profile" className="group relative">
                  <div
                    className="w-10 h-10 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-medium"
                    style={{ flexShrink: 0 }}
                  >
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                  <div
                    className="absolute left-full ml-2 px-2 py-1 bg-[#800000] text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none"
                    style={{ transition: "none" }}
                  >
                    View Profile
                  </div>
                </Link>
              ) : null}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-white/70 p-2 rounded-full group relative disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ transition: "none" }}
                aria-label="Sign out"
              >
                <LogOut size={20} />
                <div className="absolute left-full ml-2 px-2 py-1 bg-[#800000] text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                  Sign Out
                </div>
              </button>
              {/* Sign Out Confirmation Dialog */}
              <Dialog
                open={showSignOutConfirm}
                onOpenChange={setShowSignOutConfirm}
              >
                <DialogContent className="sm:max-w-md border-[#D4AF37]/30">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#800000]">
                      Confirm Sign Out
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 mt-2">
                      Are you sure you want to sign out? You will need to log in
                      again to access your account.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex gap-3 sm:gap-0 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSignOutConfirm(false)}
                      className="border-[#D4AF37]/30 text-foreground hover:bg-[#D4AF37]/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={performSignOut}
                      disabled={isSigningOut}
                      className="bg-[#800000] hover:bg-[#600000] text-white"
                    >
                      {isSigningOut ? "Signing out..." : "Sign Out"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Link
                href="/office-admin/profile"
                className="flex items-center space-x-3 group"
                style={{ transition: "none" }}
              >
                {loading ? (
                  <div
                    className="w-10 h-10 rounded-full bg-[#6B0000]"
                    style={{ flexShrink: 0 }}
                  ></div>
                ) : user ? (
                  <>
                    <div
                      className="w-10 h-10 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-medium relative"
                      style={{ flexShrink: 0 }}
                    >
                      {getInitials(user.firstName, user.lastName)}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#800000]"></div>
                    </div>
                    <div
                      className="flex flex-col min-w-0"
                      style={{ transition: "none" }}
                    >
                      <div
                        className="text-sm font-medium truncate max-w-[120px]"
                        style={{ transition: "none", fontSize: "0.875rem" }}
                      >
                        {user.firstName} {user.lastName}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-300">Not logged in</div>
                )}
              </Link>
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-white/70 p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ transition: "none" }}
                aria-label="Sign out"
              >
                <LogOut size={20} />
              </button>
              {/* Sign Out Confirmation Dialog */}
              <Dialog
                open={showSignOutConfirm}
                onOpenChange={setShowSignOutConfirm}
              >
                <DialogContent className="sm:max-w-md border-[#D4AF37]/30">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#800000]">
                      Confirm Sign Out
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 mt-2">
                      Are you sure you want to sign out? You will need to log in
                      again to access your account.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex gap-3 sm:gap-0 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSignOutConfirm(false)}
                      className="border-[#D4AF37]/30 text-foreground hover:bg-[#D4AF37]/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={performSignOut}
                      disabled={isSigningOut}
                      className="bg-[#800000] hover:bg-[#600000] text-white"
                    >
                      {isSigningOut ? "Signing out..." : "Sign Out"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* App Version */}
        {!collapsed && !isMobile && (
          <div className="px-4 py-2 text-xs text-white/50 text-center">
            WildWatch v1.2.0
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Add custom styles for hiding scrollbar */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
