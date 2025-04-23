"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, LayoutDashboard, AlertTriangle, History, Settings, LogOut, FileText, Check, X } from "lucide-react";
import Cookies from "js-cookie";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Sidebar } from "@/components/Sidebar";
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar";

interface UserProfile {
  firstName: string;
  lastName: string;
  middleInitial: string;
  email: string;
  schoolIdNumber: string;
  contactNumber: string;
  role: string;
}

const editFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleInitial: z.string().max(1, "Middle initial should be a single character"),
  contactNumber: z.string().regex(/^\+?[0-9]{10,15}$/, "Please provide a valid contact number")
});

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="text-[#8B0000] text-lg">Loading...</div>
    </div>
  );
}

function ProfileContent({ user }: { user: UserProfile }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('Current user role:', user.role);
  }, [user.role]);

  const form = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      middleInitial: user.middleInitial || '',
      contactNumber: user.contactNumber
    }
  });

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  const onSubmit = async (values: z.infer<typeof editFormSchema>) => {
    try {
      setIsSubmitting(true);
      const token = Cookies.get('token');
      const response = await fetch('http://localhost:8080/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsEditing(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f5f5f5]">
      {/* Render appropriate sidebar based on user role */}
      {user.role === 'OFFICE_ADMIN' ? <OfficeAdminSidebar /> : <Sidebar />}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-[#8B0000]">
                  {isEditing ? 'Edit Profile' : 'User Profile'}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative w-64">
                  <Input
                    type="text"
                    placeholder="Search incidents..."
                    className="pl-4 pr-10"
                  />
                </div>
                <Button className="bg-[#8B0000] hover:bg-[#6B0000]">
                  + Report New Incident
                </Button>
                <Button variant="ghost" size="icon">
                  <Bell size={20} />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-6 space-y-6">
          <div className="bg-[#8B0000] text-white p-6 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold">
                  {user.firstName} {user.lastName} 
                  <span className="text-base font-normal opacity-75 ml-2">
                    (ID: {user.schoolIdNumber})
                  </span>
                </h2>
                <p className="text-sm opacity-90">
                  {user.email} • {user.role ? user.role.split('_').map(word => word.toLowerCase()).join(' ') : 'regular user'}
                </p>
              </div>
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="destructive"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-b-lg shadow">
            <Form {...form}>
              <form className="space-y-8">
                <section>
                  <h3 className="text-xl font-semibold text-[#8B0000] mb-4">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              className={!isEditing ? "bg-gray-50" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              className={!isEditing ? "bg-gray-50" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="middleInitial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>M.I.</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              maxLength={1}
                              className={!isEditing ? "bg-gray-50" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              className={!isEditing ? "bg-gray-50" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-[#8B0000] mb-4">Account Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Institutional Email</label>
                      <Input value={user.email} disabled className="mt-1 bg-gray-50" />
                      <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <Input 
                        value={user.role ? user.role.split('_').map(word => word.toLowerCase()).join(' ') : 'regular user'} 
                        disabled 
                        className="mt-1 bg-gray-50" 
                      />
                      <p className="text-sm text-gray-500 mt-1">Role is assigned by the system</p>
                    </div>
                  </div>
                </section>

                {!isEditing && (
                  <div className="flex justify-end space-x-4">
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="bg-[#8B0000] hover:bg-[#6B0000]"
                    >
                      Edit Profile
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchUserProfile(token);
  }, [router]);

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch("http://localhost:8080/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();
      console.log('API Response - User Data:', data);
      setUser(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return <ProfileContent user={user} />;
} 