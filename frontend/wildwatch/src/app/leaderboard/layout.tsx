"use client";

import { Sidebar } from "@/components/Sidebar";
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar";
import { Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userRole, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <Loader2 className="w-10 h-10 text-[#800000] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f5f5f5]">
      {userRole === 'OFFICE_ADMIN' ? <OfficeAdminSidebar /> : <Sidebar />}
      {children}
    </div>
  );
} 