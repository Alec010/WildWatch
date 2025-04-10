"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  AlertTriangle,
  History,
  Settings,
  LogOut,
} from "lucide-react";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  middleInitial: string;
  schoolIdNumber: string;
  contactNumber: string;
  termsAccepted: boolean;
  role: string;
  enabled: boolean;
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/auth/profile', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Token is invalid or expired
            Cookies.remove('token');
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch user profile');
        }

        const userData = await response.json();
        setUser(userData);
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
    <div className="w-64 bg-[#800000] text-white flex flex-col min-h-screen">
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
            href="/dashboard"
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              pathname === '/dashboard' 
                ? 'bg-[#6B0000] hover:bg-[#5B0000]' 
                : 'hover:bg-[#6B0000]'
            }`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link 
            href="/incidents/submit"
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              pathname === '/incidents/submit' 
                ? 'bg-[#6B0000] hover:bg-[#5B0000]' 
                : 'hover:bg-[#6B0000]'
            }`}
          >
            <AlertTriangle size={20} />
            <span>Report Incident</span>
          </Link>
          <Link 
            href="/incidents/tracking"
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              pathname === '/incidents/tracking' 
                ? 'bg-[#6B0000] hover:bg-[#5B0000]' 
                : 'hover:bg-[#6B0000]'
            }`}
          >
            <History size={20} />
            <span>Case Tracking</span>
          </Link>
          <Link 
            href="/settings"
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              pathname === '/settings' 
                ? 'bg-[#6B0000] hover:bg-[#5B0000]' 
                : 'hover:bg-[#6B0000]'
            }`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="mt-auto border-t border-[#6B0000] p-4">
        <Link 
          href="/profile"
          className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
        >
          {loading ? (
            <div className="text-sm text-gray-300">Loading...</div>
          ) : user ? (
            <>
              <div className="text-sm font-medium">{user.firstName} {user.lastName}</div>
              <div className="text-xs text-gray-300">ID: {user.schoolIdNumber}</div>
              <div className="text-xs text-gray-300">{user.email}</div>
            </>
          ) : (
            <div className="text-sm text-gray-300">Not logged in</div>
          )}
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-2 mt-2 text-sm text-gray-300 hover:text-white"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
} 