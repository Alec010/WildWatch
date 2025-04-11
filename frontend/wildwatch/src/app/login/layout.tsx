import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In - WildWatch",
  description: "Sign in to your WildWatch account",
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 