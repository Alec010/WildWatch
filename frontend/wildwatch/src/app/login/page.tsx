'use client';

import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f5f5f7" }}>
      <div className="bg-white p-8 shadow-sm rounded-sm max-w-md w-full">
        <LoginForm />
      </div>
    </main>
  )
}
