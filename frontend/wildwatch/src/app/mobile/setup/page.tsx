"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  EyeOff,
  Phone,
  Shield,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Cookies from "js-cookie";
import { getApiBaseUrl } from "@/utils/api";
import Image from "next/image";

const formSchema = z
  .object({
    contactNumber: z
      .string()
      .transform((val) => val.replace(/\s/g, "")) // Remove spaces before validation
      .pipe(
        z
          .string()
          .min(11, "Contact number must be at least 11 digits")
          .max(13, "Contact number must not exceed 13 digits")
          .regex(
            /^\+?[0-9]+$/,
            "Contact number must contain only digits and may start with +"
          )
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function MobileSetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        const mobile =
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          ) || window.innerWidth < 1024;
        setIsMobile(mobile);
        if (!mobile) {
          // Redirect to desktop setup page if not mobile
          router.replace("/auth/setup");
        }
      }
    };
    checkMobile();
  }, [router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactNumber: "+639",
      password: "",
      confirmPassword: "",
    },
  });

  const handleContactNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (...event: any[]) => void
  ) => {
    // Remove all non-digits
    let inputValue = e.target.value.replace(/\D/g, "");

    // Always ensure it starts with +63
    if (!inputValue.startsWith("639")) {
      inputValue = "639" + inputValue.replace(/^639/, "");
    }

    // Format the number as +63### ### ####
    let formattedValue = "+63";
    if (inputValue.length > 2) {
      const remainingDigits = inputValue.slice(2);
      if (remainingDigits.length > 0) {
        formattedValue += " " + remainingDigits.slice(0, 3);
      }
      if (remainingDigits.length > 3) {
        formattedValue += " " + remainingDigits.slice(3, 6);
      }
      if (remainingDigits.length > 6) {
        formattedValue += " " + remainingDigits.slice(6, 10);
      }
    }

    // Limit total length to 15 characters (including spaces and +)
    if (formattedValue.length > 16) {
      formattedValue = formattedValue.slice(0, 16);
    }

    onChange(formattedValue);
  };

  const handleOpenApp = async () => {
    try {
      // Use stored token or get from cookies as fallback
      const token = authToken || Cookies.get("token");

      // Logout in the background first
      // Clear cookies
      Cookies.remove("token");

      // Clear session storage
      sessionStorage.clear();

      // Clear local storage
      localStorage.clear();

      // Small delay to ensure logout completes
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Deep link to open the mobile app with token
      const appScheme = token
        ? `wildwatchexpo://auth/oauth2/callback?token=${encodeURIComponent(
            token
          )}`
        : "wildwatchexpo://auth/oauth2/callback";
      const fallbackUrl =
        "https://play.google.com/store/apps/details?id=com.wildwatch.app";

      // Try to open the app
      window.location.href = appScheme;

      // Fallback after a delay if app doesn't open
      setTimeout(() => {
        // If still on the page, redirect to app store
        if (document.hasFocus()) {
          window.location.href = fallbackUrl;
        }
      }, 2000);
    } catch (error) {
      console.error("Error during logout:", error);
      // Still try to open the app even if logout fails
      window.location.href = "wildwatchexpo://auth/oauth2/callback";
    }
  };

  const [authToken, setAuthToken] = useState<string | null>(null);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      setError(null);

      // ✅ FIX: Get token from multiple sources for Android compatibility
      let token: string | undefined = Cookies.get("token");

      // Fallback 1: Check URL params
      if (!token && typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        token = urlParams.get("token") || undefined;
        if (token) {
          Cookies.set("token", token, {
            expires: 7,
            secure: true,
            sameSite: "lax",
            path: "/",
          });
        }
      }

      // Fallback 2: Check sessionStorage
      if (!token && typeof window !== "undefined") {
        const oauthUserData = sessionStorage.getItem("oauthUserData");
        if (oauthUserData) {
          try {
            const userData = JSON.parse(oauthUserData);
            const tokenFromStorage = userData.token;
            if (tokenFromStorage && typeof tokenFromStorage === "string") {
              token = tokenFromStorage;
              Cookies.set("token", tokenFromStorage, {
                expires: 7,
                secure: true,
                sameSite: "lax",
                path: "/",
              });
            }
          } catch (e) {
            console.warn("Could not parse oauthUserData:", e);
          }
        }
      }

      if (!token) {
        throw new Error(
          "No authentication token found. Please try logging in again."
        );
      }

      // Store token for later use in deep link
      setAuthToken(token);

      const response = await fetch(`${getApiBaseUrl()}/api/auth/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contactNumber: values.contactNumber,
          password: values.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to setup account");
      }

      // Show success message first
      setShowSuccessMessage(true);

      // After 2 seconds, redirect to complete page with token
      setTimeout(() => {
        setShowSuccessMessage(false);
        const token = Cookies.get("token");
        const redirectUrl = token
          ? `/mobile/complete?token=${encodeURIComponent(token)}`
          : "/mobile/complete";
        router.push(redirectUrl);
      }, 2000);
    } catch (error) {
      console.error("Setup error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to setup account"
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (!isMobile) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <div
        className="min-h-screen flex items-start justify-center overflow-y-auto py-10"
        style={{ backgroundColor: "#f5f5f7" }}
      >
        <div className="relative w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl border border-[#D4AF37]/20 mx-4 my-10">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#800000] via-[#D4AF37] to-[#800000] rounded-t-lg animate-gradient-x"></div>
          <div className="absolute -z-10 top-20 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -z-10 bottom-20 left-0 w-64 h-64 bg-[#800000]/10 rounded-full opacity-20 blur-3xl"></div>

          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="relative bg-white rounded-full p-1">
                <Image
                  src="/logo.png"
                  alt="WildWatch Logo"
                  width={150}
                  height={50}
                  priority
                  className="relative"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#800000] text-center">
              Complete Your Account Setup
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Please provide your contact number and set a password for field
              login.
            </p>
          </div>

          <div className="p-1 bg-[#FFF8E1] border-l-4 border-[#D4AF37] rounded-md">
            <div className="p-3">
              <p className="text-sm text-foreground">
                <span className="font-medium">Note:</span> Your account setup is
                almost complete. This information will be used for
                authentication and important notifications.
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#800000] font-medium">
                      Contact Number
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                        <Input
                          placeholder="e.g. +639XXXXXXXXX"
                          className="pl-10 border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all"
                          {...field}
                          value={field.value}
                          onChange={(e) =>
                            handleContactNumberChange(e, field.onChange)
                          }
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="font-normal text-red-600" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#800000] font-medium">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a secure password"
                          className="pl-10 pr-10 border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                          {...field}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#800000]/70 hover:text-[#800000] transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            field.value.length >= 8
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <span
                          className={
                            field.value.length >= 8
                              ? "text-green-700"
                              : "text-gray-500"
                          }
                        >
                          8+ characters
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            /[A-Z]/.test(field.value)
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <span
                          className={
                            /[A-Z]/.test(field.value)
                              ? "text-green-700"
                              : "text-gray-500"
                          }
                        >
                          Uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            /[a-z]/.test(field.value)
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <span
                          className={
                            /[a-z]/.test(field.value)
                              ? "text-green-700"
                              : "text-gray-500"
                          }
                        >
                          Lowercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            /[0-9]/.test(field.value)
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <span
                          className={
                            /[0-9]/.test(field.value)
                              ? "text-green-700"
                              : "text-gray-500"
                          }
                        >
                          Number
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            /[^A-Za-z0-9]/.test(field.value)
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <span
                          className={
                            /[^A-Za-z0-9]/.test(field.value)
                              ? "text-green-700"
                              : "text-gray-500"
                          }
                        >
                          Special character
                        </span>
                      </div>
                    </div>
                    <FormMessage className="font-normal text-red-600" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#800000] font-medium">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          className="pl-10 pr-10 border-[#D4AF37]/40 focus-visible:ring-[#D4AF37]/60 transition-all [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                          {...field}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#800000]/70 hover:text-[#800000] transition-colors"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="font-normal text-red-600" />
                  </FormItem>
                )}
              />

              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-[#800000] rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 text-[#800000] mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-normal text-red-600">{error}</p>
                </div>
              )}

              {showSuccessMessage && (
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-md flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-normal text-green-700">
                    Account setup completed successfully!
                  </p>
                </div>
              )}

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
                    Setting up...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Complete Setup
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center text-xs text-muted-foreground pt-4">
            By completing this setup, you agree to our{" "}
            <a
              href="/mobile/terms"
              className="text-[#800000] hover:text-[#800000]/80 font-medium transition-colors"
            >
              Terms and Conditions
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="text-[#800000] hover:text-[#800000]/80 font-medium transition-colors"
            >
              Privacy Policy
            </a>
            .
          </div>
        </div>
      </div>
    </>
  );
}
