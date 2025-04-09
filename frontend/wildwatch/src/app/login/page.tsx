import { LoginForm } from "@/components/auth/LoginForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In - WildWatch",
  description: "Sign in to your WildWatch account",
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f5f5f7" }}>
      <div className="bg-white p-8 shadow-sm rounded-sm max-w-md w-full">
        <LoginForm />
      </div>
    </main>
  )
}
