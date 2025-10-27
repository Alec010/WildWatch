import { SignUpForm } from "@/components/auth/SignUpForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Account - WildWatch",
  description: "Create your WildWatch account",
}

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center responsive-container" style={{ backgroundColor: "#f5f5f7" }}>
      <div className="bg-none mt-10 mb-10">
        <SignUpForm />
      </div>
    </main>
  )
}