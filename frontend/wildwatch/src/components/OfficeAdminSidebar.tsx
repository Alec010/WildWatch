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
  LogOut
} from 'lucide-react';
import Cookies from 'js-cookie';

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
        const response = await fetch('http://localhost:8080/api/auth/profile', {
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

  const navigation = [
    {
      name: 'Dashboard',
      href: '/office-admin/dashboard',
      icon: LayoutDashboard,
      current: pathname === '/office-admin/dashboard'
    },
    {
      name: 'Incident Management',
      href: '/office-admin/incidents',
      icon: AlertTriangle,
      current: pathname === '/office-admin/incidents'
    },
    {
      name: 'Approved Case Tracker',
      href: '/office-admin/approved-cases',
      icon: ClipboardCheck,
      current: pathname === '/office-admin/approved-cases'
    },
    {
      name: 'Incident History',
      href: '/office-admin/history',
      icon: History,
      current: pathname === '/office-admin/history'
    }
  ];

  return (
    <div className="flex flex-col w-64 bg-[#800000] min-h-screen text-white">
      {/* Logo */}
      <div className="p-4">
        <Image
          src="/logo2.png"
          alt="WildWatch Logo"
          width={150}
          height={40}
          className="mx-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
              item.current
                ? 'bg-white/10 text-white'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* User Profile */}
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