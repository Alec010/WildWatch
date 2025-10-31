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
  Globe,
  FileText,
} from "lucide-react";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/utils/api";
import { api } from "@/utils/apiClient";
import { useSidebar } from "@/contexts/SidebarContext";
import { useUser } from "@/contexts/UserContext";

interface User {
  firstName: string;
  lastName: string;
  schoolIdNumber: string;
  email: string;
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { collapsed, setCollapsed } = useSidebar();
  const { userRole, isLoading: roleLoading } = useUser();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    const fetchUserProfile = async () => {
      try {
        const response = await api.get("/api/auth/profile");

        if (!response.ok) {
          if (response.status === 401) {
            // Token is invalid or expired - API client will handle refresh
            console.log("Authentication failed, redirecting to login");
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch user profile");
        }

        const userData = await response.json();
        setUser({
          firstName: userData.firstName,
          lastName: userData.lastName,
          schoolIdNumber: userData.schoolIdNumber,
          email: userData.email,
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    // Only fetch user profile if role is loaded and user is authenticated
    if (!roleLoading && userRole) {
      fetchUserProfile();
    } else if (!roleLoading && !userRole) {
      // No role means not authenticated, redirect to login
      router.push("/login");
    }
  }, [router, roleLoading, userRole]);

  const handleSignOut = async () => {
    const tokenService = (await import("@/utils/tokenService")).default;
    tokenService.removeToken();
    router.push("/login");
  };

  const navItems = [
    {
      href: "/dashboard",
      icon: <LayoutDashboard size={20} />,
      label: "Dashboard",
    },
    {
      href: "/incidents/submit",
      icon: <AlertTriangle size={20} />,
      label: "Report Incident",
    },
    {
      href: "/incidents/tracking",
      icon: <ClipboardList size={20} />,
      label: "Case Tracking",
    },
    {
      href: "/office-bulletin",
      icon: <FileText size={20} />,
      label: "Office Bulletin",
    },
    {
      href: "/incidents/public",
      icon: <Globe size={20} />,
      label: (
        <div className="flex items-center">
          <span className="text-sm ml-1">Community</span>
          <span className="text-sm ml-1">Reports</span>
        </div>
      ),
    },
    {
      href: "/incidents/history",
      icon: <History size={20} />,
      label: "Incident History",
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

  // Don't render sidebar until role is verified
  if (roleLoading || !userRole) {
    return null;
  }

  // Only render regular user sidebar for REGULAR_USER role
  if (userRole !== "REGULAR_USER") {
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
          className={`fixed top-6 ${
            collapsed ? "left-16" : "left-60"
          } z-50 bg-white text-[#800000] p-1 rounded-full shadow-md  hover:bg-[#800000] hover:text-white`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight
            size={18}
            className={` ${collapsed ? "rotate-0" : "rotate-180"}`}
          />
        </button>
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed top-0 left-0 h-screen z-40 bg-gradient-to-b from-[#800000] to-[#5a0000] text-white flex flex-col shadow-xl overflow-hidden ${
          isMobile
            ? mobileOpen
              ? "left-0"
              : "-left-full"
            : collapsed
            ? "w-20"
            : "w-64"
        }`}
      >
        {/* Logo Section */}
        <div
          className={`p-2 ${
            collapsed && !isMobile ? "flex justify-center" : "px-4"
          }`}
        >
          {collapsed && !isMobile ? (
            <div className="mt-6 mb-2 w-[150px] h-[80px] flex items-center justify-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Shield className="w-7 h-7 text-[#800000]" />
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <Image
                src="/logo2.png"
                alt="WildWatch Logo"
                width={150}
                height={50}
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={`flex-1 ${collapsed && !isMobile ? "px-4" : "px-4"} ${
            collapsed && !isMobile ? "pt-8" : "pt-4"
          } pb-4 overflow-y-auto hide-scrollbar`}
        >
          <div className="space-y-2 w-full">
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
                    } p-3 rounded-lg  ${
                      isActive
                        ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                        : "hover:bg-white/10 text-white/90 hover:text-white"
                    }`}
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
                            : "text-white/90 group-hover:text-white"
                        } rounded-md p-1 flex items-center justify-center h-8`}
                      >
                        {item.icon}
                      </div>
                      {(!collapsed || isMobile) && (
                        <span
                          className={`${
                            isActive ? "font-medium" : ""
                          }  whitespace-nowrap`}
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
                      <div className="absolute left-full ml-2 px-2 py-1 bg-[#800000] text-white text-xs rounded opacity-0 group-hover:opacity-100  whitespace-nowrap z-50 pointer-events-none">
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
          className={`mt-auto border-t border-[#D4AF37]/20 ${
            collapsed && !isMobile ? "p-4 pb-2" : "p-4"
          }`}
        >
          {collapsed && !isMobile ? (
            <div className="flex flex-col items-center space-y-3">
              {loading ? (
                <div className="w-10 h-10 rounded-full bg-[#6B0000] "></div>
              ) : user ? (
                <Link href="/profile" className="group relative">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-medium">
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#800000] text-white text-xs rounded opacity-0 group-hover:opacity-100  whitespace-nowrap z-50 pointer-events-none">
                    View Profile
                  </div>
                </Link>
              ) : null}
              <button
                onClick={handleSignOut}
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10  group relative"
                aria-label="Sign out"
              >
                <LogOut size={20} />
                <div className="absolute left-full ml-2 px-2 py-1 bg-[#800000] text-white text-xs rounded opacity-0 group-hover:opacity-100  whitespace-nowrap z-50 pointer-events-none">
                  Sign Out
                </div>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Link
                href="/profile"
                className="flex items-center space-x-3 hover:opacity-90  group"
              >
                {loading ? (
                  <div className="w-10 h-10 rounded-full bg-[#6B0000] "></div>
                ) : user ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-medium relative">
                      {getInitials(user.firstName, user.lastName)}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#800000]"></div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm font-medium truncate max-w-[120px]">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-[#D4AF37]/80 truncate max-w-[120px]">
                        ID: {user.schoolIdNumber}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-300">Not logged in</div>
                )}
              </Link>
              <button
                onClick={handleSignOut}
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 "
                aria-label="Sign out"
              >
                <LogOut size={20} />
              </button>
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
