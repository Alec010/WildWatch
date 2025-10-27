"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  AlertTriangle,
  History,
  Check,
  X,
  Eye,
  EyeOff,
  User,
  Phone,
  Mail,
  Shield,
  Award,
  Edit3,
  Save,
  Lock,
  Search,
  Plus,
  Trophy,
} from "lucide-react"
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
import NotificationDropdown from "@/components/ui/notificationdropdown"
import { useSidebar } from "@/contexts/SidebarContext"
import { Navbar } from "@/components/Navbar"
import { OfficeAdminNavbar } from "@/components/OfficeAdminNavbar"
import { useUser } from "@/contexts/UserContext"
import { RankBadge } from "@/components/RankBadge"
import { RankProgress } from "@/components/RankProgress"
import { GoldEliteCard } from "@/components/GoldEliteCard"
import { rankService } from "@/utils/rankService"
import { badgeService } from "@/utils/badgeService"
import { BadgesModal } from "@/components/badges/BadgesModal"
import { BadgeDisplay } from "@/components/badges/BadgeDisplay"
import type { RankProgress as RankProgressType, GoldEliteEntry } from "@/types/rank"
import type { UserBadgeSummary, BadgeProgress } from "@/types/badge"
import { TrendingUp } from "lucide-react"

// Add keyframe animation for gradients
const gradientAnimationStyle = `
  @keyframes gradient-x {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }
  .animate-gradient-x {
    background-size: 200% 200%;
    animation: gradient-x 15s ease infinite;
  }
`

interface UserProfile {
  id: number
  firstName: string
  lastName: string
  middleInitial: string
  email: string
  schoolIdNumber: string
  contactNumber: string
  role: string
  authProvider?: string
  points?: number
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
    message: "Passwords don't match",
    path: ["confirmNewPassword"],
  })

function LoadingSpinner() {
  const { collapsed } = useSidebar()
  const { userRole } = useUser()
  
  const getContentMargin = () => {
    if (userRole === 'OFFICE_ADMIN') {
      return collapsed ? 'ml-20' : 'ml-72'
    }
    return collapsed ? 'ml-18' : 'ml-64'
  }

  return (
    <div className="min-h-screen flex bg-[#f5f5f5]">
      {userRole === 'OFFICE_ADMIN' ? <OfficeAdminSidebar /> : <Sidebar />}
      <div className={`flex-1 flex items-center justify-center transition-all duration-300 ${getContentMargin()}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
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

  if (authProvider === "microsoft") {
    return (
      <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-[#800000] flex items-center gap-2">
              <Lock size={20} className="text-[#800000]" />
              Password Management
            </h3>
          </div>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-3">
            <div className="bg-amber-100 p-2 rounded-full">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="font-medium">Password change is not allowed</p>
              <p className="text-sm">Microsoft OAuth accounts must change their password through Microsoft.</p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
      <div className="p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-[#800000] flex items-center gap-2">
            <Lock size={20} className="text-[#800000]" />
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
              <Button className="bg-[#800000] hover:bg-[#600000] text-white">
                <Lock className="mr-2 h-4 w-4" /> Reset Password
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border border-[#D4AF37]/30 bg-white">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#800000] via-[#D4AF37] to-[#800000] animate-gradient-x"></div>
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-[#800000] text-xl">Reset Your Password</DialogTitle>
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
                              className="pr-10 border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all"
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
                              className="pr-10 border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all"
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
                              className="pr-10 border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all"
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
                    <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-md flex items-center gap-2">
                      <div className="bg-green-100 p-1 rounded-full">
                        <Check size={16} />
                      </div>
                      {success}
                    </div>
                  )}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md flex items-center gap-2">
                      <div className="bg-red-100 p-1 rounded-full">
                        <X size={16} />
                      </div>
                      {error}
                    </div>
                  )}
                  <div className="flex justify-end pt-2">
                    <Button type="submit" className="bg-[#800000] hover:bg-[#600000] text-white" disabled={loading}>
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
    </Card>
  )
}

// Add this helper function at the top level
const formatRole = (role: string) => {
  if (!role) return "Regular User";
  return role
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

function ProfileContent({ user }: { user: UserProfile }) {
  const { collapsed } = useSidebar()
  const { userRole } = useUser()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [rankProgress, setRankProgress] = useState<RankProgressType | null>(null)
  const [goldEliteEntries, setGoldEliteEntries] = useState<GoldEliteEntry[]>([])
  const [loadingRank, setLoadingRank] = useState(true)
  
  // Badge state
  const [badgeSummary, setBadgeSummary] = useState<UserBadgeSummary | null>(null)
  const [loadingBadges, setLoadingBadges] = useState(true)
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false)
  const [recentBadges, setRecentBadges] = useState<BadgeProgress[]>([])

  useEffect(() => {
    console.log("Current user role:", user.role)
    // Fetch rank data and badge data
    fetchRankData()
    fetchBadgeData()
  }, [user.role])

  const fetchRankData = async () => {
    try {
      console.log("🚀 Fetching rank data for role:", user.role)
      setLoadingRank(true)
      
      // Fetch rank data and gold elite data based on user role
      const [rankData, goldEliteData] = await Promise.all([
        rankService.getMyRank(), // This endpoint handles both users and office admins
        user.role === 'OFFICE_ADMIN' 
          ? rankService.getGoldEliteOffices() 
          : rankService.getGoldEliteUsers(),
      ])
      
      console.log("✅ Rank data received:", rankData)
      console.log("✅ Gold elite data received:", goldEliteData)
      setRankProgress(rankData)
      setGoldEliteEntries(goldEliteData)
    } catch (error) {
      console.error("❌ Error fetching rank data:", error)
      // Show error state instead of just hiding
      console.error("Full error details:", error)
    } finally {
      setLoadingRank(false)
      console.log("✅ Loading complete. loadingRank:", false)
    }
  }
  
  const fetchBadgeData = async () => {
    try {
      console.log("🚀 Fetching badge data")
      setLoadingBadges(true)
      
      const badgeSummaryData = await badgeService.getUserBadgeSummary()
      console.log("✅ Badge data received:", badgeSummaryData)

      // Restrict badges based on role
      const allowedTypes = user.role === 'OFFICE_ADMIN'
        ? ['FIRST_RESPONSE', 'RATING_CHAMPION', 'OFFICE_LEGEND']
        : ['FIRST_RESPONDER', 'COMMUNITY_HELPER', 'CAMPUS_LEGEND']

      const filteredBadges = (badgeSummaryData.badges || []).filter(b => allowedTypes.includes(b.badgeType))

      // Recalculate summary numbers from filtered set
      const filteredSummary = {
        ...badgeSummaryData,
        badges: filteredBadges,
        totalBadgesAvailable: filteredBadges.length,
        totalBadgesEarned: filteredBadges.filter(b => b.currentLevel > 0).length,
        totalPointsEarned: filteredBadges.reduce((sum, b) => sum + (b.pointsAwarded ? (b.pointReward || 0) : 0), 0),
      }

      setBadgeSummary(filteredSummary)
      
      // Get recent/earned badges for display
      const earnedBadges = filteredBadges.filter(badge => badge.currentLevel > 0)
      // Sort by highest level first, then by badge type
      earnedBadges.sort((a, b) => {
        if (b.currentLevel !== a.currentLevel) return b.currentLevel - a.currentLevel
        return a.badgeType.localeCompare(b.badgeType)
      })
      
      // Take up to 3 badges for the preview
      setRecentBadges(earnedBadges.slice(0, 3))
    } catch (error) {
      console.error("❌ Error fetching badge data:", error)
      console.error("Full error details:", error)
    } finally {
      setLoadingBadges(false)
      console.log("✅ Loading complete. loadingBadges:", false)
    }
  }
  
  const handleClaimBadge = async (badgeId: number) => {
    try {
      await badgeService.claimBadge(badgeId)
      // Refresh badge data after claiming
      await fetchBadgeData()
    } catch (error) {
      console.error("Error claiming badge:", error)
      throw error
    }
  }

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

  const getContentMargin = () => {
    if (userRole === 'OFFICE_ADMIN') {
      return collapsed ? 'ml-20' : 'ml-72'
    }
    return collapsed ? 'ml-18' : 'ml-64'
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {userRole === 'OFFICE_ADMIN' ? <OfficeAdminSidebar /> : <Sidebar />}
      <div className={`transition-all duration-300 ${getContentMargin()}`}>
        {userRole === 'OFFICE_ADMIN' ? (
          <OfficeAdminNavbar 
            title="Office Profile" 
            subtitle="Manage your account settings and preferences"
            showSearch={false}
          />
        ) : (
          <Navbar 
            title="Profile" 
            subtitle="Manage your account settings and preferences"
            showSearch={false}
            showNewIncident={false}
          />
        )}
        <main className="p-6 pt-24">
          {/* Badges Modal */}
          <BadgesModal
            isOpen={isBadgeModalOpen}
            onClose={() => setIsBadgeModalOpen(false)}
            badgeSummary={badgeSummary}
            isLoading={loadingBadges}
            onClaimBadge={handleClaimBadge}
          />
          
          {/* User Profile Header Card */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-[#800000] via-[#9a0000] to-[#800000] text-white p-6 relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNEMUFGMzciIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-5">
                  <div className="bg-gradient-to-br from-[#D4AF37]/80 to-[#D4AF37]/40 rounded-full p-1 hidden sm:block shadow-lg">
                    <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-[#800000] font-bold text-2xl shadow-inner border-2 border-[#D4AF37]/20">
                      {user.firstName.charAt(0)}
                      {user.lastName.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold flex items-center gap-3 flex-wrap">
                      {user.firstName} {user.lastName}
                      {rankProgress && !loadingRank && (
                        <RankBadge 
                          rank={rankProgress.currentRank} 
                          goldRanking={rankProgress.goldRanking}
                          size="md"
                          showLabel={true}
                          showGoldNumber={true}
                        />
                      )}
                      {typeof user.points === "number" && (
                        <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-[#800000] px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-md border border-[#D4AF37]/50">
                          <Award className="h-4 w-4 text-yellow-600" />
                          {user.points} pts
                        </span>
                      )}
                    </h2>
                    <p className="text-sm opacity-90 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-white/70" />
                        {user.email}
                      </span>
                      <span className="hidden sm:inline text-white/50">•</span>
                      <span className="capitalize bg-white/20 px-3 py-1 rounded-full text-xs inline-flex items-center gap-1 shadow-sm">
                        <Shield className="h-3 w-3" />
                        {formatRole(user.role)}
                      </span>
                    </p>
                    <p className="text-xs mt-1.5 opacity-75 flex items-center gap-1">
                      <span className="bg-white/10 px-2 py-0.5 rounded">ID: {user.schoolIdNumber}</span>
                    </p>
                  </div>
                </div>
                {isEditing && (
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <Button
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={isSubmitting}
                      className="bg-white text-[#800000] hover:bg-gray-100 w-full sm:w-auto shadow-md"
                      size="sm"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save Changes
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="border-white text-black/70 hover:bg-white/20 hover:text-white w-full sm:w-auto"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Ranking Section */}
          {rankProgress && !loadingRank && (
            <Card className="bg-gradient-to-br from-white via-gray-50 to-white border border-gray-200 rounded-lg shadow-lg overflow-hidden mb-6">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-[#8B0000] to-[#6B0000] p-3 rounded-full shadow-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#8B0000]">Your Ranking</h3>
                      <p className="text-sm text-gray-600">Track your progress and achievements</p>
                    </div>
                  </div>
                  
                  {/* Badges Button */}
                  <Button 
                    onClick={() => setIsBadgeModalOpen(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Trophy size={16} className="text-amber-500" />
                    <span>View Badges</span>
                    {badgeSummary && badgeSummary.totalBadgesEarned > 0 && (
                      <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                        {badgeSummary.totalBadgesEarned}
                      </span>
                    )}
                  </Button>
                </div>

                <RankProgress rankProgress={rankProgress} showDetails={true} />
                
                {/* Badges Preview Section */}
                {!loadingBadges && recentBadges.length > 0 && (
                  <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-amber-800 flex items-center gap-2">
                        <Trophy size={16} />
                        Your Badges
                      </h4>
                      <span className="text-xs text-amber-700">
                        {badgeSummary?.totalBadgesEarned || 0}/{badgeSummary?.totalBadgesAvailable || 0} earned
                      </span>
                    </div>
                    <div className="flex gap-4">
                      {recentBadges.map(badge => (
                        <BadgeDisplay 
                          key={badge.badgeId}
                          badge={badge}
                          size="md"
                          showName={true}
                        />
                      ))}
                      {badgeSummary?.totalBadgesEarned && recentBadges.length < badgeSummary.totalBadgesEarned && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsBadgeModalOpen(true)}
                          className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                        >
                          +{(badgeSummary?.totalBadgesEarned || 0) - recentBadges.length} more
                        </Button>
                      )}
                    </div>
                  </div>
                )}

              {/* Show Gold Elite if user is in it */}
              {rankProgress.currentRank === 'GOLD' && rankProgress.goldRanking && rankProgress.goldRanking <= 10 && (
                <div className="mt-6">
                  <GoldEliteCard 
                    entries={goldEliteEntries} 
                    userType={user.role === 'OFFICE_ADMIN' ? 'offices' : 'users'}
                    currentUserId={user.id}
                  />
                </div>
              )}
              </div>
            </Card>
          )}

          {/* Loading state for ranking */}
          {loadingRank && (
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B0000]"></div>
                <p className="ml-3 text-gray-600">Loading your ranking...</p>
              </div>
            </Card>
          )}

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 flex items-center">
                <div className="mr-4 bg-[#800000] p-3 rounded-full flex-shrink-0">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500 mb-1">Account Type</p>
                  <p className="text-lg font-bold break-words">
                    {formatRole(user.role)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 flex items-center">
                <div className="mr-4 bg-[#D4AF37]/20 p-3 rounded-full flex-shrink-0">
                  <Mail className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="text-lg font-bold break-words">
                    {user.email}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 flex items-center">
                <div className="mr-4 bg-gray-50 p-3 rounded-full flex-shrink-0">
                  <Phone className="h-6 w-6 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500 mb-1">Contact</p>
                  <p className="text-lg font-bold break-words">
                    {user.contactNumber}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 flex items-center">
                <div className="mr-4 bg-[#800000]/10 p-3 rounded-full flex-shrink-0">
                  <Shield className="h-6 w-6 text-[#800000]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <p className="text-lg font-bold flex items-center">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                    Active
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Personal Information Section */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-[#800000] flex items-center gap-2">
                  <User className="h-5 w-5 text-[#800000]" />
                  Personal Information
                </h3>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} className="bg-[#800000] hover:bg-[#600000] text-white">
                    <Edit3 size={16} className="mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>

              <Form {...form}>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-[#800000]/70" />
                            First Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              className={`${
                                !isEditing
                                  ? "bg-white border-gray-200 text-gray-700"
                                  : "border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60"
                              } transition-all`}
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
                          <FormLabel className="text-gray-700 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-[#800000]/70" />
                            Last Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              className={`${
                                !isEditing
                                  ? "bg-white border-gray-200 text-gray-700"
                                  : "border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60"
                              } transition-all`}
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
                          <FormLabel className="text-gray-700 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-[#800000]/70" />
                            Middle Initial
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              maxLength={1}
                              className={`${
                                !isEditing
                                  ? "bg-white border-gray-200 text-gray-700"
                                  : "border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60"
                              } transition-all`}
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
                          <FormLabel className="text-gray-700 flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-[#800000]/70" />
                            Contact Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              className={`${
                                !isEditing
                                  ? "bg-white border-gray-200 text-gray-700"
                                  : "border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60"
                              } transition-all`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </div>
          </Card>

          {/* Account Information Section */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-[#800000] flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#800000]" />
                  Account Information
                </h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#800000]/70" />
                    Institutional Email
                  </label>
                  <Input value={user.email} disabled className="bg-white border-gray-200 text-gray-500" />
                  <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={14} className="text-amber-500" />
                    Email cannot be changed
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
                    <Shield className="h-3.5 w-3.5 text-[#800000]/70" />
                    Role
                  </label>
                  <Input
                    value={formatRole(user.role)}
                    disabled
                    className="bg-white border-gray-200 text-gray-500"
                  />
                  <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={14} className="text-amber-500" />
                    Role is assigned by the system
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Password Management Section */}
          <ResetPasswordSection authProvider={user.authProvider} />
        </main>
      </div>
      <style jsx global>
        {gradientAnimationStyle}
      </style>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      setError(error instanceof Error ? error.message : "Failed to load profile data")
      router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-[#f5f5f5]">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  return <ProfileContent user={user} />
}
