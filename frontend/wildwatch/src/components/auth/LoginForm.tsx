"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, X, Shield, Mail } from "lucide-react"
import Cookies from "js-cookie"
import { MicrosoftLogo } from "@/components/icons/MicrosoftLogo"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { API_BASE_URL } from "@/utils/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const formSchema = z.object({
  email: z.string().email("Invalid email").endsWith("@cit.edu", "Must be a CIT email address"),
  password: z.string().min(1, "Password is required"),
})

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetStatus, setResetStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [resetMessage, setResetMessage] = useState("")
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to login")
      }

      // Store the token in a cookie
      Cookies.set("token", data.token, {
        expires: 7,
        secure: true,
        sameSite: "strict",
        path: "/",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      setError(error instanceof Error ? error.message : "Failed to login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetStatus("loading")
    setResetMessage("")

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset link")
      }

      setResetStatus("success")
      setResetMessage("Password reset link has been sent to your email.")
    } catch (error) {
      setResetStatus("error")
      setResetMessage(error instanceof Error ? error.message : "Failed to send reset link")
    }
  }

  // Required field label with asterisk
  const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="flex items-center gap-1 text-[#800000] font-medium">
      {children}
      <span className="text-[#800000] ml-0.5">*</span>
    </span>
  )

  return (
    <div className="relative w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-xl border border-[#D4AF37]/20">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#800000] via-[#D4AF37] to-[#800000] rounded-t-lg animate-gradient-x"></div>
      <div className="absolute -z-10 top-20 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute -z-10 bottom-20 left-0 w-64 h-64 bg-[#800000]/10 rounded-full opacity-20 blur-3xl"></div>

      {/* Logo */}
      <div className="flex flex-col items-center space-y-4">
        <Link href="/" className="transition-transform hover:scale-105">
          <div className="relative">
            <div className="relative bg-background rounded-full p-1">
              <Image src="/logo.png" alt="WildWatch Logo" width={150} height={50} priority />
            </div>
          </div>
        </Link>
        <h1 className="text-3xl font-bold text-[#800000]">Sign In</h1>
        <p className="text-sm text-muted-foreground">Access your WILD WATCH account</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-[#800000]">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabel>CIT Email</RequiredLabel>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                    <Input
                      placeholder="your.name@cit.edu"
                      type="email"
                      className="pl-10 border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-[#800000]" />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>
                    <RequiredLabel>Password</RequiredLabel>
                  </FormLabel>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-sm text-[#800000] hover:text-[#800000]/80 font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <FormControl>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all"
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#800000]/70 hover:text-[#800000] transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-[#800000]" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-[#800000] hover:bg-[#800000]/90 text-white font-medium py-6 transition-all duration-300 shadow-md hover:shadow-lg"
            disabled={isLoading}
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
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>

      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#D4AF37]/30"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">OR</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 py-5"
          onClick={() => {
            window.location.href = `${API_BASE_URL}/oauth2/authorization/microsoft`
          }}
        >
          <MicrosoftLogo />
          <span className="text-foreground">Sign in with Microsoft</span>
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Note: When signing in with Microsoft, additional credentials may be required after authentication.
        </p>
      </div>

      <div className="text-center text-sm pt-4 border-t border-[#D4AF37]/30">
        Don't have an account?{" "}
        <Link href="/signup" className="text-[#800000] hover:text-[#800000]/80 font-medium transition-colors">
          Create Account
        </Link>
      </div>

      {/* Reset Password Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="sm:max-w-md rounded-xl shadow-2xl p-0 border-[#D4AF37]/30">
          <div className="relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#800000] via-[#D4AF37] to-[#800000]"></div>
            <div className="flex justify-end p-2">
              <button
                type="button"
                className="text-[#800000]/70 hover:text-[#800000] transition"
                onClick={() => setShowResetModal(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DialogHeader>
              <DialogTitle className="text-center text-2xl font-bold mb-2 text-[#800000]">Reset Password</DialogTitle>
            </DialogHeader>
          </div>
          <form onSubmit={handleResetPassword} className="space-y-6 px-6 pb-6">
            <div className="space-y-2">
              <label htmlFor="reset-email" className="text-sm font-medium text-[#800000]">
                CIT Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your.name@cit.edu"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  pattern="[a-zA-Z0-9._%+-]+@cit\.edu$"
                  title="Please enter a valid CIT email address"
                  className="pl-10 border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all h-12 text-base rounded-lg"
                />
              </div>
            </div>

            {resetMessage && (
              <div
                className={`p-3 rounded-md text-center text-base font-medium ${
                  resetStatus === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-[#800000] border border-red-200"
                }`}
              >
                {resetMessage}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold bg-[#800000] hover:bg-[#800000]/90 text-white rounded-lg shadow-md transition"
              disabled={resetStatus === "loading"}
            >
              {resetStatus === "loading" ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}