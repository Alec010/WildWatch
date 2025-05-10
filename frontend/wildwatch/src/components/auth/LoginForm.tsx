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
import { Eye, EyeOff } from "lucide-react";
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
import { useUser } from "@/contexts/UserContext";

const formSchema = z.object({
  email: z.string()
    .email("Invalid email")
    .endsWith("@cit.edu", "Must be a CIT email address"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { refetchUser } = useUser();

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
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Invalid credentials");
      }

      const data = await response.json();
      console.log('Login response data:', data);
      
      // Store the token in a cookie
      Cookies.set("token", data.token, {
        expires: 7, // Expires in 7 days
        secure: true,
        sameSite: "strict",
        path: "/"
      });

      // Check if we have user data
      if (!data.user) {
        throw new Error("No user data received");
      }
      
      // Refresh the user profile
      await refetchUser();
      
      // Use the handleAuthRedirect function to determine where to redirect
      const redirectPath = handleAuthRedirect({
        role: data.user.role,
        termsAccepted: data.user.termsAccepted
      });
      router.push(redirectPath);
    } catch (error) {
      console.error("Login error:", error);
      alert(error instanceof Error ? error.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  }

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
                  <Link href="/forgot-password" className="text-sm text-[#8B0000] hover:underline">
                    Forgot Password?
                  </Link>
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
    </div>
  );
} 