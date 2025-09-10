"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { API_BASE_URL } from "@/utils/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff, Shield, CheckCircle2, AlertCircle } from "lucide-react"

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to reset password")
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f5f5f7" }}>
        <div className="relative w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl border border-[#D4AF37]/20">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#800000] via-[#D4AF37] to-[#800000] rounded-t-lg animate-gradient-x"></div>
          <div className="absolute -z-10 top-20 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -z-10 bottom-20 left-0 w-64 h-64 bg-[#800000]/10 rounded-full opacity-20 blur-3xl"></div>

          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="relative bg-white rounded-full p-1">
                  <Image src="/logo.png" alt="WildWatch Logo" width={150} height={50} priority className="relative" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#800000]">Invalid Reset Link</h2>
            <p className="text-muted-foreground">This password reset link is invalid or has expired.</p>
            <Link
              href="/login"
              className="mt-4 inline-block text-[#800000] hover:text-[#800000]/80 font-medium transition-colors"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f5f5f7" }}>
      <div className="relative w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl border border-[#D4AF37]/20">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#800000] via-[#D4AF37] to-[#800000] rounded-t-lg animate-gradient-x"></div>
        <div className="absolute -z-10 top-20 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -z-10 bottom-20 left-0 w-64 h-64 bg-[#800000]/10 rounded-full opacity-20 blur-3xl"></div>

        <div className="flex flex-col items-center space-y-4">
          <Link href="/" className="transition-transform hover:scale-105">
            <div className="relative">
              <div className="relative bg-white rounded-full p-1">
                <Image src="/logo.png" alt="WildWatch Logo" width={150} height={50} priority className="relative" />
              </div>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-[#800000]">Reset Password</h1>
          <p className="text-sm text-muted-foreground">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-[#800000] rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-[#800000] mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-normal text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border-l-4 border-green-600 rounded-md flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-700">Password reset successful! Redirecting to login...</p>
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="password" className="text-[#800000] font-medium">
                New Password
              </label>
              <div className="mt-1.5 relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pl-10 pr-10 border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#800000]/70 hover:text-[#800000] transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-[#800000] font-medium">
                Confirm New Password
              </label>
              <div className="mt-1.5 relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pl-10 pr-10 border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#800000]/70 hover:text-[#800000] transition-colors"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#800000] hover:bg-[#800000]/90 text-white font-medium py-6 transition-all duration-300 shadow-md hover:shadow-lg"
            disabled={isLoading || success}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Resetting...
              </span>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>

        <div className="text-center text-sm pt-4 border-t border-[#D4AF37]/30">
          <Link href="/login" className="text-[#800000] hover:text-[#800000]/80 font-medium transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
