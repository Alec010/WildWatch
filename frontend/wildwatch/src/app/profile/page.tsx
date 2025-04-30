"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, AlertTriangle, History, Settings, FileText, Check, X, Eye, EyeOff } from "lucide-react"
import Cookies from "js-cookie"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Sidebar } from "@/components/Sidebar"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { useForm as usePasswordForm } from "react-hook-form"
import { zodResolver as zodPasswordResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { API_BASE_URL } from "@/utils/api"

interface UserProfile {
  firstName: string
  lastName: string
  middleInitial: string
  email: string
  schoolIdNumber: string
  contactNumber: string
  role: string
  authProvider?: string
}

const editFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleInitial: z.string().max(1, "Middle initial should be a single character"),
  contactNumber: z.string().regex(/^\+?[0-9]{10,15}$/, "Please provide a valid contact number"),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  })

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8B0000] border-t-transparent"></div>
        <div className="text-[#8B0000] font-medium">Loading your profile...</div>
      </div>
    </div>
  )
}

function ResetPasswordSection({ authProvider }: { authProvider?: string }) {
  const [open, setOpen] = useState(false)

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  if (authProvider === "microsoft") {
    return (
      <div className="mt-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-[#8B0000] flex items-center gap-2">
              <History size={20} className="text-[#8B0000]" />
              Password Management
            </h3>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded flex items-start gap-2">
            <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium">Password change is not allowed</p>
              <p className="text-sm">Microsoft OAuth accounts must change their password through Microsoft.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const form = usePasswordForm({
    resolver: zodPasswordResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setLoading(true)
    setSuccess("")
    setError("")
    try {
      const token = Cookies.get("token")
      const res = await fetch(`${API_BASE_URL}/api/users/me/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to change password")
      }
      setSuccess("Password changed successfully.")
      form.reset()
      // Close the modal after successful password change
      setTimeout(() => {
        setOpen(false)
        setSuccess("")
      }, 2000)
    } catch (e: any) {
      setError(e.message || "Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-[#8B0000] flex items-center gap-2">
            <History size={20} className="text-[#8B0000]" />
            Password Management
          </h3>
          <Dialog
            open={open}
            onOpenChange={(newOpen) => {
              setOpen(newOpen)
              if (!newOpen) {
                form.reset()
                setError("")
                setSuccess("")
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-[#8B0000] hover:bg-[#6B0000]">Reset Password</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[#8B0000]">Reset Your Password</DialogTitle>
                <DialogDescription>
                  Enter your current password and a new password to update your credentials.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Current Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showCurrent ? "text" : "password"}
                              {...field}
                              autoComplete="current-password"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              tabIndex={-1}
                              onClick={() => setShowCurrent((v) => !v)}
                            >
                              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showNew ? "text" : "password"}
                              {...field}
                              autoComplete="new-password"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              tabIndex={-1}
                              onClick={() => setShowNew((v) => !v)}
                            >
                              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmNewPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirm ? "text" : "password"}
                              {...field}
                              autoComplete="new-password"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              tabIndex={-1}
                              onClick={() => setShowConfirm((v) => !v)}
                            >
                              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {success && (
                    <div className="bg-green-50 border border-green-100 text-green-600 p-3 rounded-md flex items-center gap-2">
                      <Check size={18} />
                      {success}
                    </div>
                  )}
                  {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-md flex items-center gap-2">
                      <X size={18} />
                      {error}
                    </div>
                  )}
                  <div className="flex justify-end pt-2">
                    <Button type="submit" className="bg-[#8B0000] hover:bg-[#6B0000] text-white" disabled={loading}>
                      {loading ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Changing...
                        </>
                      ) : (
                        <>Change Password</>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-gray-600 mt-2 text-sm">
          For security reasons, we recommend changing your password regularly.
        </p>
      </div>
    </div>
  )
}

function ProfileContent({ user }: { user: UserProfile }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    console.log("Current user role:", user.role)
  }, [user.role])

  const form = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      middleInitial: user.middleInitial || "",
      contactNumber: user.contactNumber,
    },
  })

  const handleCancel = () => {
    form.reset()
    setIsEditing(false)
  }

  const onSubmit = async (values: z.infer<typeof editFormSchema>) => {
    try {
      setIsSubmitting(true)
      const token = Cookies.get("token")
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    } finally {
      setIsSubmitting(false)
      setIsEditing(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Render appropriate sidebar based on user role */}
      {user.role === "OFFICE_ADMIN" ? <OfficeAdminSidebar /> : <Sidebar />}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#8B0000]">{isEditing ? "Edit Profile" : "User Profile"}</h1>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Input type="text" placeholder="Search incidents..." className="pl-4 pr-10" />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button className="bg-[#8B0000] hover:bg-[#6B0000] w-full sm:w-auto">+ Report New Incident</Button>
                  <Button variant="outline" size="icon" className="flex-shrink-0">
                  <Bell size={20} />
                </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
          <div className="bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white p-6 rounded-t-lg shadow">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white rounded-full p-1 hidden sm:block">
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-[#8B0000] font-bold text-xl">
                    {user.firstName.charAt(0)}
                    {user.lastName.charAt(0)}
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                  {user.firstName} {user.lastName} 
                  </h2>
                  <p className="text-sm opacity-90 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span>{user.email}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="capitalize bg-white/20 px-2 py-0.5 rounded text-xs inline-block">
                      {user.role
                        ? user.role
                            .split("_")
                            .map((word) => word.toLowerCase())
                            .join(" ")
                        : "regular user"}
                  </span>
                </p>
                  <p className="text-xs mt-1 opacity-75">ID: {user.schoolIdNumber}</p>
                </div>
              </div>
              {isEditing && (
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Button
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="bg-white text-[#8B0000] hover:bg-gray-100 w-full sm:w-auto"
                    size="sm"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Save Changes
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-white text-white hover:bg-white/20 w-full sm:w-auto"
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
                <section className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="text-xl font-semibold text-[#8B0000] mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-[#8B0000]" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">First Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              className={!isEditing ? "bg-white border-gray-200" : ""}
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
                          <FormLabel className="text-gray-700">Last Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              className={!isEditing ? "bg-white border-gray-200" : ""}
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
                          <FormLabel className="text-gray-700">Middle Initial</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              maxLength={1}
                              className={!isEditing ? "bg-white border-gray-200" : ""}
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
                          <FormLabel className="text-gray-700">Contact Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              className={!isEditing ? "bg-white border-gray-200" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <section className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="text-xl font-semibold text-[#8B0000] mb-4 flex items-center gap-2">
                    <Settings size={20} className="text-[#8B0000]" />
                    Account Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Institutional Email</label>
                      <Input value={user.email} disabled className="mt-1 bg-white border-gray-200" />
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <AlertTriangle size={14} />
                        Email cannot be changed
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <Input 
                        value={
                          user.role
                            ? user.role
                                .split("_")
                                .map((word) => word.toLowerCase())
                                .join(" ")
                            : "regular user"
                        }
                        disabled 
                        className="mt-1 bg-white border-gray-200"
                      />
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <AlertTriangle size={14} />
                        Role is assigned by the system
                      </p>
                    </div>
                  </div>
                </section>

                {!isEditing && (
                  <div className="flex justify-end space-x-4">
                    <Button onClick={() => setIsEditing(true)} className="bg-[#8B0000] hover:bg-[#6B0000]">
                      <Settings size={16} className="mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </div>

          <ResetPasswordSection authProvider={user.authProvider} />
        </main>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 bg-gray-200 rounded mb-4" />
          <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <div className="h-6 w-1/4 bg-gray-200 rounded mb-2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <div className="h-6 w-1/4 bg-gray-200 rounded mb-2" />
            <div className="h-10 bg-gray-200 rounded w-1/2" />
            <div className="h-10 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchUserProfile(token)
  }, [router])

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch user profile")
      }

      const data = await response.json()
      console.log("API Response - User Data:", data)
      setUser(data)
    } catch (error) {
      console.error("Error fetching user profile:", error)
      router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <ProfileSkeleton />
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  return <ProfileContent user={user} />
} 
