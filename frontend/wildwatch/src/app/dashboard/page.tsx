"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bell,
  MapPin,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  CircleDot
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { checkAuth } from "@/utils/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      console.log('Starting dashboard authentication verification...');
      try {
        // Verify with the backend
        const { isAuthenticated, user } = await checkAuth();
        console.log('Backend authentication result:', { isAuthenticated, user });

        if (isMounted) {
          if (!isAuthenticated) {
            console.log('Not authenticated by backend, redirecting to login...');
            setAuthError(true);
            router.push('/login');
            return;
          }

          console.log('Authentication successful, showing dashboard...');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error in authentication verification:', error);
        if (isMounted) {
          setAuthError(true);
          router.push('/login');
        }
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (authError) {
    return null; // Don't render anything if there's an auth error
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f5f5f5]">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-[#8B0000]">Incident Dashboard</h1>
                <p className="text-gray-500 text-sm">View and manage your reported incidents</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#8B0000] mb-4">Overview</h2>
            <div className="grid grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Reports</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <FileText className="h-8 w-8 text-[#8B0000]" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">In Progress</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <CircleDot className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Resolved</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">High</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#8B0000]">Recent Incidents</h2>
              <Button variant="link" className="text-[#8B0000]">View All</Button>
            </div>
            
            <div className="space-y-4">
              {/* Incident Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">Suspicious Person</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin size={16} className="mr-1" />
                        <span>Library - 2nd Floor Study Area</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Unidentified individual looking through personal belongings when students were away.
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock size={16} className="mr-1" />
                        <span>Today, 2:30 PM</span>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm mt-2">
                        In Progress
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* You can add more incident cards here */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 