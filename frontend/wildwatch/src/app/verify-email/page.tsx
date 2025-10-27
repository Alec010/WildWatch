"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/utils/api";
import Image from "next/image";
import Link from "next/link";

function VerifyEmailForm() {
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-email?token=${token}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Verification failed");
        }

        setStatus("success");
        setMessage("Email verified successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (error) {
        setStatus("error");
        setMessage("Failed to verify email. Please try again or contact support.");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {status === "verifying" && "Verifying your email..."}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
          {status === "verifying" && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B0000] mx-auto"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Verifying your email...</h2>
            <p className="mt-2 text-sm text-gray-600">Please wait while we verify your email address.</p>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B0000] mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
} 