"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
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

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = Cookies.get("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

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
                <div className="relative w-64">
                  <Input
                    type="text"
                    placeholder="Search incidents..."
                    className="pl-4 pr-10"
                  />
                </div>
                <Button 
                  className="bg-[#8B0000] hover:bg-[#6B0000]"
                  onClick={() => router.push('/incidents/submit')}
                >
                  + Report New Incident
                </Button>
                <Button variant="ghost" size="icon">
                  <Bell size={20} />
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
                      <p className="text-2xl font-bold">12</p>
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
                      <p className="text-2xl font-bold">3</p>
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
                      <p className="text-2xl font-bold">8</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Urgent</p>
                      <p className="text-2xl font-bold">1</p>
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