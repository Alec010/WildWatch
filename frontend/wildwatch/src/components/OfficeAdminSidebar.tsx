'use client';

import { useMemo } from 'react';
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
  Building2
} from 'lucide-react';
import Cookies from 'js-cookie';
import { useUser } from '@/contexts/UserContext';

export function OfficeAdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useUser();

  const handleSignOut = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  const navItems = useMemo(() => [
    {
      href: "/office-admin/dashboard",
      icon: <LayoutDashboard size={20} />,
      label: "Dashboard",
      show: true
    },
    {
      href: "/office-admin/incidents",
      icon: <AlertTriangle size={20} />,
      label: "Incident Management",
      show: true
    },
    {
      href: "/office-admin/approved-cases",
      icon: <ClipboardCheck size={20} />,
      label: "Approved Case Tracker",
      show: true
    },
    {
      href: "/office-admin/history",
      icon: <History size={20} />,
      label: "Incident History",
      show: true
    },
    {
      href: "/office-admin/office-assignment",
      icon: <Building2 size={20} />,
      label: "Office Assignment",
      show: user?.officeCode === 'SSO'
    }
  ], [user?.officeCode]);

  return (
    <div className="w-64 bg-[#800000] text-white flex flex-col fixed h-screen overflow-y-auto">
      <div className="p-6">
        <Image
          src="/logo2.png"
          alt="WildWatch Logo"
          width={150}
          height={50}
          className="mb-8"
          priority
        />
        <nav className="space-y-4">
          {navItems.map((item) => 
            item.show && (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? "bg-[#6B0000] text-[#F0B429] border-l-4 border-[#F0B429]"
                    : "hover:bg-[#6B0000]"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )
          )}
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