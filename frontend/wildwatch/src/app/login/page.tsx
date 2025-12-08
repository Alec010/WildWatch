"use client";

import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center overflow-y-auto overscroll-y-none"
      style={{ backgroundColor: "#f5f5f7" }}
    >
      <div className="bg-none mt-10 mb-10">
        <LoginForm />
      </div>
    </main>
  );
}
