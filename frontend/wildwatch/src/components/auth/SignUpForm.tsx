"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, X, Shield, User, Mail, Phone, Hash, CheckCircle2, AlertCircle } from "lucide-react"
import Cookies from "js-cookie"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { API_BASE_URL } from "@/utils/api"
import { toast } from "sonner"

const formSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    middleInitial: z.string().max(1, "Middle initial should be a single character"),
    email: z.string().email("Invalid email").endsWith("@cit.edu", "Must be a CIT email address"),
    schoolIdNumber: z.string().min(1, "School ID number is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
    contactNumber: z
      .string()
      .transform(val => val.replace(/\s/g, '')) // Remove spaces before validation
      .pipe(
        z.string()
          .min(11, "Contact number must be at least 11 digits")
          .max(13, "Contact number must not exceed 13 digits")
          .regex(/^\+?[0-9]+$/, "Contact number must contain only digits and may start with +")
      ),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms and Conditions to create an account",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      middleInitial: "",
      email: "",
      schoolIdNumber: "",
      password: "",
      confirmPassword: "",
      contactNumber: "",
      acceptTerms: false,
    },
  })

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showVerificationModal && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
    } else if (showVerificationModal && countdown === 0) {
      router.push("/")
    }
    return () => clearTimeout(timer)
  }, [showVerificationModal, countdown, router])

  const formatSchoolId = (value: string) => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, "")

    // Format as XX-XXXX-XXX
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 9)}`
  }

  const formatContactNumber = (value: string) => {
    // Remove all non-digits
    let inputValue = value.replace(/\D/g, '')
    
    // Always ensure it starts with +63
    if (!inputValue.startsWith('639')) {
      inputValue = '639' + inputValue.replace(/^639/, '')
    }
    
    // Format the number as +63### ### ####
    let formattedValue = '+63'
    if (inputValue.length > 2) {
      const remainingDigits = inputValue.slice(2)
      if (remainingDigits.length > 0) {
        formattedValue += ' ' + remainingDigits.slice(0, 3)
      }
      if (remainingDigits.length > 3) {
        formattedValue += ' ' + remainingDigits.slice(3, 6)
      }
      if (remainingDigits.length > 6) {
        formattedValue += ' ' + remainingDigits.slice(6, 10)
      }
    }
    
    // Limit total length to 15 characters (including spaces and +)
    if (formattedValue.length > 16) {
      formattedValue = formattedValue.slice(0, 16)
    }
    
    return formattedValue
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      // Map acceptTerms to termsAccepted for backend
      const payload = {
        ...values,
        termsAccepted: values.acceptTerms,
      } as any
      delete payload.acceptTerms

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create account")
      }

      const data = await response.json()

      // Store the token in a cookie with secure and httpOnly flags
      Cookies.set("token", data.token, {
        expires: 7, // Expires in 7 days
        secure: true,
        sameSite: "strict",
        path: "/",
      })

      // Show success toast
      toast.success("Account created successfully!", {
        description: "Please check your email to verify your account.",
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        className: "bg-white border-green-100 text-green-800",
        position: "top-center",
        duration: 3000,
      })

      // Show verification modal
      setShowVerificationModal(true)
    } catch (error) {
      console.error("Registration error:", error)

      // Show error toast
      toast.error("Registration failed", {
        description: error instanceof Error ? error.message : "Failed to create account",
        icon: <AlertCircle className="h-5 w-5 text-[#800000]" />,
        className: "bg-white border-[#800000]/10 text-[#800000]",
        position: "top-center",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
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
    <div className="relative w-full max-w-xl p-8 space-y-6 bg-card rounded-lg shadow-xl border border-[#D4AF37]/20">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#800000] via-[#D4AF37] to-[#800000] rounded-t-lg animate-gradient-x"></div>
      <div className="absolute -z-10 top-20 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute -z-10 bottom-20 left-0 w-64 h-64 bg-[#800000]/10 rounded-full opacity-20 blur-3xl"></div>

      {/* Logo */}
      <div className="flex flex-col items-center space-y-4">
        <Link href="/" className="transition-transform hover:scale-105">
          <div className="relative">
            <div className="relative bg-background rounded-full p-1">
              <Image src="/logo.png" alt="WildWatch Logo" width={150} height={50} priority className="relative" />
            </div>
          </div>
        </Link>
        <h1 className="text-3xl font-bold text-[#800000]">Create Account</h1>
        <p className="text-sm text-muted-foreground">Join WILD WATCH to report and track campus incidents</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Name Fields */}
          <div className="grid grid-cols-12 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="col-span-5">
                  <FormLabel>
                    <RequiredLabel>First Name</RequiredLabel>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                      <Input
                        placeholder="Enter first name"
                        className="pl-10 border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="font-normal text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="middleInitial"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className="text-[#800000] font-medium">M.I.</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="M.I."
                      maxLength={1}
                      className="text-center border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="font-normal text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="col-span-5">
                  <FormLabel>
                    <RequiredLabel>Last Name</RequiredLabel>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                      <Input
                        placeholder="Enter last name"
                        className="pl-10 border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="font-normal text-red-600" />
                </FormItem>
              )}
            />
          </div>

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
                <FormMessage className="font-normal text-red-600" />
                </FormItem>
            )}
          />

          {/* School ID Field */}
          <FormField
            control={form.control}
            name="schoolIdNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabel>School ID Number</RequiredLabel>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                    <Input
                      placeholder="22-0603-284"
                      className="pl-10 border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all"
                      {...field}
                      onChange={(e) => {
                        const formattedValue = formatSchoolId(e.target.value)
                        field.onChange(formattedValue)
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage className="font-normal text-red-600" />
                </FormItem>
            )}
          />

          {/* Password Fields */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabel>Password</RequiredLabel>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a secure password"
                      className="pl-10 pr-10 border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                      {...field}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
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
                {isPasswordFocused && (
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div
                        className={`h-3 w-3 rounded-full ${field.value.length >= 8 ? "bg-green-500" : "bg-gray-300"}`}
                      ></div>
                      <span className={field.value.length >= 8 ? "text-green-700" : "text-gray-500"}>
                        8+ characters
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className={`h-3 w-3 rounded-full ${/[A-Z]/.test(field.value) ? "bg-green-500" : "bg-gray-300"}`}
                      ></div>
                      <span className={/[A-Z]/.test(field.value) ? "text-green-700" : "text-gray-500"}>
                        Uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className={`h-3 w-3 rounded-full ${/[a-z]/.test(field.value) ? "bg-green-500" : "bg-gray-300"}`}
                      ></div>
                      <span className={/[a-z]/.test(field.value) ? "text-green-700" : "text-gray-500"}>
                        Lowercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className={`h-3 w-3 rounded-full ${/[0-9]/.test(field.value) ? "bg-green-500" : "bg-gray-300"}`}
                      ></div>
                      <span className={/[0-9]/.test(field.value) ? "text-green-700" : "text-gray-500"}>Number</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          /[^A-Za-z0-9]/.test(field.value) ? "bg-green-500" : "bg-gray-300"
                        }`}
                      ></div>
                      <span className={/[^A-Za-z0-9]/.test(field.value) ? "text-green-700" : "text-gray-500"}>
                        Special character
                      </span>
                    </div>
                  </div>
                )}
                <FormMessage className="font-normal text-red-600" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabel>Confirm Password</RequiredLabel>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="pl-10 pr-10 border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#800000]/70 hover:text-[#800000] transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="font-normal text-red-600" />
                </FormItem>
            )}
          />

          {/* Contact Number Field */}
          <FormField
            control={form.control}
            name="contactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabel>Contact Number</RequiredLabel>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                    <Input
                      placeholder="+63XXXXXXXXXX"
                      type="tel"
                      className="pl-10 border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all"
                      {...field}
                      onChange={(e) => {
                        const formattedValue = formatContactNumber(e.target.value)
                        field.onChange(formattedValue)
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage className="font-normal text-red-600" />
                </FormItem>
            )}
          />

          {/* Terms and Conditions Checkbox */}
          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => {
                      if (!field.value) {
                        setShowTerms(true)
                        e.preventDefault() // Prevent checking the box
                      } else {
                        field.onChange(e)
                      }
                    }}
                    className="mt-1 h-4 w-4 rounded border-[#D4AF37]/50 text-[#800000] focus:ring-[#D4AF37]/30"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm">
                    <RequiredLabel>
                      By creating an account, you agree to our{" "}
                      <button
                        type="button"
                        onClick={() => setShowTerms(true)}
                        className="text-[#800000] underline hover:text-[#800000]/80 font-medium transition-colors"
                      >
                        Terms and Conditions
                      </button>
                    </RequiredLabel>
                  </FormLabel>
                  <FormMessage className="font-normal text-red-600" />
                </div>
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
                Creating Account...
              </span>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </Form>

      {/* Terms Modal Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-3xl max-h-[100vh] overflow-hidden border-[#D4AF37]/30 bg-background p-0 sm:rounded-xl animate-in zoom-in-95 fade-in-0 duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0">
          {/* Header with decorative elements */}
          <div className="relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#800000] via-[#D4AF37] to-[#800000] animate-gradient-x"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl animate-pulse"></div>

            <DialogHeader className="p-6 border-b border-[#D4AF37]/30">
              <DialogTitle className="text-2xl font-bold text-[#800000] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-[#800000] rounded-full animate-pulse"></div>
                  Terms and Conditions
                </div>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Effective Date: April 08, 2025
              </DialogDescription>
            </DialogHeader>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4 text-[#800000]/70 hover:text-[#800000] transition-transform hover:scale-110" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          {/* Content with improved styling */}
          <div className="p-6 prose max-w-none space-y-6 overflow-y-auto max-h-[60vh] animate-in fade-in-0 duration-300">
            <p className="text-foreground leading-relaxed">
              Welcome to WildWatch, the official incident reporting and case management platform of Cebu Institute of
              Technology – University (CITU). By accessing or using the WildWatch website and application (the
              "Platform"), you agree to comply with and be bound by the following Terms and Conditions. Please read them
              carefully.
            </p>

            <div className="p-4 bg-[#FFF8E1] border-l-4 border-[#D4AF37] rounded-md">
              <h3 className="text-xl font-semibold text-[#800000] flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#800000] text-white text-sm">
                  1
                </span>
                Use of the Platform
              </h3>
              <p className="text-foreground">
                WildWatch is intended to facilitate the structured reporting, tracking, and resolution of campus-related
                incidents within CITU. Use of this platform must be in accordance with university policies, applicable
                laws, and ethical conduct.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>You must be a currently enrolled student or an authorized CITU personnel to use the platform.</li>
                <li>
                  You agree to provide accurate, truthful, and complete information when submitting a report or using
                  any part of the Platform.
                </li>
              </ul>
            </div>

            <div className="p-4 bg-background border border-[#D4AF37]/30 rounded-md shadow-sm">
              <h3 className="text-xl font-semibold text-[#800000] flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#800000] text-white text-sm">
                  2
                </span>
                User Responsibilities
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Report incidents truthfully and in good faith</li>
                <li>Respect the privacy and rights of others involved in reported incidents</li>
                <li>Use the platform responsibly and not for any malicious purposes</li>
                <li>Keep your contact information updated</li>
              </ul>
            </div>

            <div className="p-4 bg-background border border-[#D4AF37]/30 rounded-md shadow-sm">
              <h3 className="text-xl font-semibold text-[#800000] flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#800000] text-white text-sm">
                  3
                </span>
                Privacy and Data Protection
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your personal information will be handled in accordance with our Privacy Policy</li>
                <li>Incident reports and related information will be treated with appropriate confidentiality</li>
                <li>Access to incident details will be restricted to authorized personnel only</li>
              </ul>
            </div>

            <div className="p-4 bg-[#FFF8E1] border-l-4 border-[#D4AF37] rounded-md">
              <h3 className="text-xl font-semibold text-[#800000] flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#800000] text-white text-sm">
                  4
                </span>
                Platform Rules
              </h3>
              <p className="text-foreground font-medium">Users must NOT:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Submit false or malicious reports</li>
                <li>Harass or intimidate other users</li>
                <li>Share confidential information about incidents publicly</li>
                <li>Attempt to compromise the platform's security</li>
                <li>Use the platform for any illegal activities</li>
              </ul>
            </div>

            <div className="p-4 bg-background border border-[#D4AF37]/30 rounded-md shadow-sm">
              <h3 className="text-xl font-semibold text-[#800000] flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#800000] text-white text-sm">
                  5
                </span>
                Consequences of Violation
              </h3>
              <p className="text-foreground">Violation of these terms may result in:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Temporary or permanent account suspension</li>
                <li>Disciplinary action under university policies</li>
                <li>Legal action in severe cases</li>
              </ul>
            </div>

            <div className="p-4 bg-background border border-[#D4AF37]/30 rounded-md shadow-sm">
              <h3 className="text-xl font-semibold text-[#800000] flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#800000] text-white text-sm">
                  6
                </span>
                Changes to Terms
              </h3>
              <p className="text-foreground">
                CITU reserves the right to modify these terms at any time. Users will be notified of significant
                changes, and continued use of the platform constitutes acceptance of modified terms.
              </p>
            </div>

            <div className="p-4 bg-background border border-[#D4AF37]/30 rounded-md shadow-sm">
              <h3 className="text-xl font-semibold text-[#800000] flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#800000] text-white text-sm">
                  7
                </span>
                Contact Information
              </h3>
              <p className="text-foreground">
                For questions about these terms or the platform, contact the CITU Security Office or IT Department.
              </p>
            </div>
          </div>

          {/* Footer with improved styling */}
          <DialogFooter className="p-6 flex justify-end gap-4 border-t border-[#D4AF37]/30 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTerms(false)}
              className="border-[#800000]/20 text-[#800000] hover:bg-[#800000]/10 hover:text-[#800000] transition-all duration-200"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                form.setValue("acceptTerms", true)
                setShowTerms(false)
              }}
              className="bg-[#800000] hover:bg-[#800000]/90 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              Accept Terms
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Modal */}
      <Dialog
        open={showVerificationModal}
        onOpenChange={(open) => {
          if (!open && countdown > 0) {
            router.push("/")
          }
          setShowVerificationModal(open)
        }}
      >
        <DialogContent className="max-w-md border-[#D4AF37]/30 p-0 rounded-xl overflow-hidden">
          <div className="relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#800000] via-[#D4AF37] to-[#800000]"></div>

            <DialogHeader className="pt-8 px-6 pb-2 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-[#800000]" />
              </div>
              <DialogTitle className="text-2xl font-bold text-[#800000]">Check Your Email</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Please verify your account to complete registration
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-[#FFF8E1] p-4 rounded-md border-l-4 border-[#D4AF37] text-sm">
              <p className="font-medium text-[#800000]">Important:</p>
              <p className="mt-1 text-foreground">
                We've sent a verification link to <span className="font-medium">{form.getValues().email}</span>. Please
                check your inbox and click the link to activate your account.
              </p>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Redirecting to home page in <span className="font-bold text-[#800000]">{countdown}</span> seconds...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div
                  className="bg-[#800000] h-1.5 rounded-full transition-all duration-1000 ease-in-out"
                  style={{ width: `${(countdown / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-[#D4AF37]/20 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full sm:w-auto border-[#D4AF37]/30 text-foreground hover:bg-[#D4AF37]/10"
            >
              Go to Home Page
            </Button>
            <Button
              type="button"
              onClick={() => window.open("https://mail.google.com", "_blank")}
              className="w-full sm:w-auto bg-[#800000] hover:bg-[#800000]/90 text-white"
            >
              Open Gmail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="text-center text-sm pt-4 border-t border-[#D4AF37]/30">
        Already have an account?{" "}
        <Link href="/login" className="text-[#800000] hover:text-[#800000]/80 font-medium transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  )
}