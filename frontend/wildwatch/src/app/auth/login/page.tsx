"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";
import { handleAuthRedirect } from "@/utils/auth";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid email or password");
      }

      const data = await response.json();
      console.log("Login response:", data); // Debug log
      Cookies.set("token", data.token);

      // Use handleAuthRedirect to determine the correct redirect path based on user role
      const user = data.user || data;
      const redirectPath = handleAuthRedirect({
        role: user.role || user.userRole,
        termsAccepted: user.termsAccepted !== false,
      });

      console.log("Redirecting to:", redirectPath); // Debug log
      router.push(redirectPath);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return <div>{/* Render your form here */}</div>;
};

export default LoginPage;
