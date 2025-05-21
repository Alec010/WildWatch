"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, X } from "lucide-react";
import Cookies from "js-cookie";
import { MicrosoftLogo } from "@/components/icons/MicrosoftLogo";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { handleAuthRedirect } from "@/utils/auth";
import { API_BASE_URL } from "@/utils/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formSchema = z.object({
  email: z.string()
    .email("Invalid email")
    .endsWith("@cit.edu", "Must be a CIT email address"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [resetMessage, setResetMessage] = useState("");
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to login");
      }

      // Store the token in a cookie
      Cookies.set("token", data.token, {
        expires: 7,
        secure: true,
        sameSite: "strict",
        path: "/"
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "Failed to login");
    } finally {
      setIsLoading(false);
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus("loading");
    setResetMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset link");
      }

      setResetStatus("success");
      setResetMessage("Password reset link has been sent to your email.");
    } catch (error) {
      setResetStatus("error");
      setResetMessage(error instanceof Error ? error.message : "Failed to send reset link");
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6">
      {/* Logo */}
      <div className="flex flex-col items-center space-y-2">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="WildWatch Logo"
            width={150}
            height={50}
            priority
          />
        </Link>
        <h1 className="text-2xl font-semibold">Sign In</h1>
        <p className="text-sm text-gray-500">Access your WILD WATCH account</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CIT Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="your.name@cit.edu" 
                    type="email"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
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
                  <FormLabel>Password</FormLabel>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-sm text-[#8B0000] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full bg-[#8B0000] hover:bg-[#6B0000]"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Form>

      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>

        <Button 
          type="button" 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
          onClick={() => {
            window.location.href = `${API_BASE_URL}/oauth2/authorization/microsoft`;
          }}
        >
          <MicrosoftLogo />
          Sign in with Microsoft
        </Button>

        <p className="text-xs text-center text-gray-500">
          Note: When signing in with Microsoft, additional credentials may be required after authentication.
        </p>
      </div>

      <div className="text-center text-sm">
        Don't have an account?{" "}
        <Link href="/signup" className="text-[#8B0000] hover:underline">
          Create Account
        </Link>
      </div>

      {/* Reset Password Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="sm:max-w-md rounded-xl shadow-2xl p-0">
          <div className="flex justify-end p-2">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-700 transition"
              onClick={() => setShowResetModal(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold mb-2 text-[#8B0000]">
              Reset Password
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-6 px-6 pb-6">
            <div className="space-y-2">
              <label htmlFor="reset-email" className="text-sm font-medium text-gray-700">
                CIT Email
              </label>
              <Input
                id="reset-email"
                type="email"
                placeholder="your.name@cit.edu"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                pattern="[a-zA-Z0-9._%+-]+@cit\.edu$"
                title="Please enter a valid CIT email address"
                className="h-12 text-base rounded-lg border-gray-300 focus:border-[#8B0000] focus:ring-[#8B0000]/30"
              />
            </div>

            {resetMessage && (
              <div className={`p-3 rounded-md text-center text-base font-medium ${
                resetStatus === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {resetMessage}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold bg-[#8B0000] hover:bg-[#6B0000] rounded-lg shadow-md transition"
              disabled={resetStatus === "loading"}
            >
              {resetStatus === "loading" ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 