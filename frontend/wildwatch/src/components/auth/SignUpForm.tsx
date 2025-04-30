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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the Terms and Conditions to create an account"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
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
      acceptTerms: false
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

          {/* Terms and Conditions Checkbox */}
          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="mt-1"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    By creating an account, you agree to our{" "}
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-[#8B0000] underline hover:text-[#6B0000] font-medium"
                    >
                      Terms and Conditions
                    </button>
                  </FormLabel>
                  <FormMessage />
                </div>
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

      {/* Terms Modal using shadcn Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-[#8B0000] flex justify-between items-center">
              Terms and Conditions
              <Button
                variant="ghost"
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                onClick={() => setShowTerms(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="prose max-w-none space-y-6">
            <p className="text-gray-600">Effective Date: April 08, 2025</p>

            <p>
              Welcome to WildWatch, the official incident reporting and case management platform of Cebu Institute of Technology – University (CITU). By accessing or using the WildWatch website and application (the "Platform"), you agree to comply with and be bound by the following Terms and Conditions. Please read them carefully.
            </p>

            <div>
              <h3 className="text-xl font-semibold text-gray-800">1. Use of the Platform</h3>
              <p>
                WildWatch is intended to facilitate the structured reporting, tracking, and resolution of campus-related incidents within CITU. Use of this platform must be in accordance with university policies, applicable laws, and ethical conduct.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be a currently enrolled student or an authorized CITU personnel to use the platform.</li>
                <li>You agree to provide accurate, truthful, and complete information when submitting a report or using any part of the Platform.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800">2. User Responsibilities</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Report incidents truthfully and in good faith</li>
                <li>Respect the privacy and rights of others involved in reported incidents</li>
                <li>Use the platform responsibly and not for any malicious purposes</li>
                <li>Keep your contact information updated</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800">3. Privacy and Data Protection</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your personal information will be handled in accordance with our Privacy Policy</li>
                <li>Incident reports and related information will be treated with appropriate confidentiality</li>
                <li>Access to incident details will be restricted to authorized personnel only</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800">4. Platform Rules</h3>
              <p>Users must NOT:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Submit false or malicious reports</li>
                <li>Harass or intimidate other users</li>
                <li>Share confidential information about incidents publicly</li>
                <li>Attempt to compromise the platform's security</li>
                <li>Use the platform for any illegal activities</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800">5. Consequences of Violation</h3>
              <p>
                Violation of these terms may result in:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Temporary or permanent account suspension</li>
                <li>Disciplinary action under university policies</li>
                <li>Legal action in severe cases</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800">6. Changes to Terms</h3>
              <p>
                CITU reserves the right to modify these terms at any time. Users will be notified of significant changes, and continued use of the platform constitutes acceptance of modified terms.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800">7. Contact Information</h3>
              <p>
                For questions about these terms or the platform, contact the CITU Security Office or IT Department.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTerms(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                form.setValue('acceptTerms', true);
                setShowTerms(false);
              }}
              className="bg-[#8B0000] hover:bg-[#6B0000] text-white"
            >
              Accept Terms
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-[#8B0000] hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
} 