'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  AlertTriangle,
  ClipboardCheck,
  History,
  LogOut,
  User2,
  Trophy
} from 'lucide-react';
import Cookies from 'js-cookie';
import { API_BASE_URL } from "@/utils/api";

interface User {
  firstName: string;
  lastName: string;
  schoolIdNumber: string;
  email: string;
  role: string;
}

export function OfficeAdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            Cookies.remove('token');
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch user profile');
        }

        const userData = await response.json();
        setUser({
          firstName: userData.firstName,
          lastName: userData.lastName,
          schoolIdNumber: userData.schoolIdNumber,
          email: userData.email,
          role: userData.role
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const handleSignOut = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  return (
    <div className="fixed top-0 left-0 h-screen z-30 w-64 bg-[#800000] text-white flex flex-col">
      <div className="p-6">
        <Image
          src="/logo2.png"
          alt="WildWatch Logo"
          width={150}
          height={50}
          className="mb-8"
        />
        <nav className="space-y-4">
          <Link
            href="/office-admin/dashboard"
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              pathname === "/office-admin/dashboard"
                ? "bg-[#6B0000] text-[#F0B429] border-l-4 border-[#F0B429]"
                : "hover:bg-[#6B0000]"
            }`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/office-admin/incidents"
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              pathname === "/office-admin/incidents"
                ? "bg-[#6B0000] text-[#F0B429] border-l-4 border-[#F0B429]"
                : "hover:bg-[#6B0000]"
            }`}
          >
            <AlertTriangle size={20} />
            <span>Incident Management</span>
          </Link>
          <Link
            href="/office-admin/approved-cases"
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              pathname === "/office-admin/approved-cases"
                ? "bg-[#6B0000] text-[#F0B429] border-l-4 border-[#F0B429]"
                : "hover:bg-[#6B0000]"
            }`}
          >
            <ClipboardCheck size={20} />
            <span>Approved Case Tracker</span>
          </Link>
          <Link
            href="/office-admin/history"
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              pathname === "/office-admin/history"
                ? "bg-[#6B0000] text-[#F0B429] border-l-4 border-[#F0B429]"
                : "hover:bg-[#6B0000]"
            }`}
          >
            <History size={20} />
            <span>Incident History</span>
          </Link>
          <Link
            href="/office-admin/leaderboard"
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              pathname === "/office-admin/leaderboard"
                ? "bg-[#6B0000] text-[#F0B429] border-l-4 border-[#F0B429]"
                : "hover:bg-[#6B0000]"
            }`}
          >
            <Trophy size={20} />
            <span>Leaderboard</span>
          </Link>
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="mt-auto border-t border-[#6B0000] p-4 flex items-center justify-between">
        <Link
          href="/profile"
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-[#6B0000] flex items-center justify-center">
            <User2 size={20} />
          </div>
          <div className="flex flex-col">
            {loading ? (
              <div className="text-sm text-gray-300">Loading...</div>
            ) : user ? (
              <>
                <div className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-gray-300">
                  ID: {user.schoolIdNumber}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-300">Not logged in</div>
            )}
          </div>
        </Link>
        <button
          onClick={handleSignOut}
          className="text-gray-300 hover:text-white"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
} 