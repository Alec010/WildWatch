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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleInitial: z.string().max(1, "Middle initial should be a single character"),
  email: z.string()
    .email("Invalid email")
    .endsWith("@cit.edu", "Must be a CIT email address"),
  schoolIdNumber: z.string().min(1, "School ID number is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must include uppercase, lowercase, number and special character"),
  confirmPassword: z.string(),
  contactNumber: z.string().regex(/^\+?[0-9]{10,15}$/, "Please enter a valid contact number"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

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
    },
  });

  const formatSchoolId = (value: string) => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, "");
    
    // Format as XX-XXXX-XXX
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 9)}`;
  };

  const formatContactNumber = (value: string) => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, "");
    
    // If the number doesn't start with +63, add it
    if (!value.startsWith("+63")) {
      return `+63${numbers}`;
    }
    return value;
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create account");
      }

      const data = await response.json();
      
      // Store the token in a cookie with secure and httpOnly flags
      Cookies.set("token", data.token, {
        expires: 7, // Expires in 7 days
        secure: true,
        sameSite: "strict",
        path: "/"
      });
      
      // Redirect to the index page
      router.push("/");
    } catch (error) {
      console.error("Registration error:", error);
      alert(error instanceof Error ? error.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg p-8 space-y-6">
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
        <h1 className="text-2xl font-semibold">Create Account</h1>
        <p className="text-sm text-gray-500">Fill in your details to join WILD WATCH</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-12 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="col-span-5">
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter first name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="middleInitial"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>M.I.</FormLabel>
                  <FormControl>
                    <Input placeholder="M.I." maxLength={1} className="text-center" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="col-span-5">
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter last name" {...field} />
                  </FormControl>
                  <FormMessage />
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

          {/* School ID Field */}
          <FormField
            control={form.control}
            name="schoolIdNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>School ID Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="22-0603-284"
                    {...field}
                    onChange={(e) => {
                      const formattedValue = formatSchoolId(e.target.value);
                      field.onChange(formattedValue);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Fields */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a secure password"
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

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contact Number Field */}
          <FormField
            control={form.control}
            name="contactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+63XXXXXXXXXX"
                    type="tel"
                    {...field}
                    onChange={(e) => {
                      const formattedValue = formatContactNumber(e.target.value);
                      field.onChange(formattedValue);
                    }}
                  />
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
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-[#8B0000] hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
} 