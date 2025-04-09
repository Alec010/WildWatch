import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Shield, Clock, Camera, Users } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f5f5f7" }}>
      {/* Navigation */}
      <nav className="bg-white py-3 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <img src="/wildwatchlogo2.png?height=40&width=40" alt="WILD Logo" className="h-14" />
          <span className="ml-2 text-[#8b1a1a] font-bold text-xl"></span>
        </div>
        <div className="space-x-2">
          <Button variant="outline" className="border-[#8b1a1a] text-[#8b1a1a] hover:bg-[#f8f0f0]" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button className="bg-[#8b1a1a] text-white hover:bg-[#6b1414]" asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-12 text-center">
        <h1 className="text-3xl font-bold text-[#8b1a1a] mb-4">WildWatch Monitoring System</h1>
        <p className="text-gray-600 mb-12 max-w-2xl mx-auto text-sm">
          WildWatch is an incident reporting system for CIT University that streamlines how students and staff report
          and track campus-related concerns. It ensures all reports are properly handled by the right authorities.
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-start text-left">
                <div className="h-10 w-10 rounded-full bg-[#f8f0f0] flex items-center justify-center mb-4">
                  <Shield className="h-5 w-5 text-[#8b1a1a]" />
                </div>
                <h3 className="text-lg font-semibold text-[#8b1a1a] mb-1">Secure Reporting</h3>
                <p className="text-gray-600 text-sm">
                  End-to-end encryption ensures all wildwatch reports remain confidential and secure.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-start text-left">
                <div className="h-10 w-10 rounded-full bg-[#f8f0f0] flex items-center justify-center mb-4">
                  <Clock className="h-5 w-5 text-[#8b1a1a]" />
                </div>
                <h3 className="text-lg font-semibold text-[#8b1a1a] mb-1">Fast Response</h3>
                <p className="text-gray-600 text-sm">
                  Quick submission process and automated notifications ensure rapid response to wildwatch incidents.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-start text-left">
                <div className="h-10 w-10 rounded-full bg-[#f8f0f0] flex items-center justify-center mb-4">
                  <Camera className="h-5 w-5 text-[#8b1a1a]" />
                </div>
                <h3 className="text-lg font-semibold text-[#8b1a1a] mb-1">Photo Documentation</h3>
                <p className="text-gray-600 text-sm">
                  Capture and organize high-quality images of wildwatch sightings with location and time data.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-start text-left">
                <div className="h-10 w-10 rounded-full bg-[#f8f0f0] flex items-center justify-center mb-4">
                  <Users className="h-5 w-5 text-[#8b1a1a]" />
                </div>
                <h3 className="text-lg font-semibold text-[#8b1a1a] mb-1">Team Collaboration</h3>
                <p className="text-gray-600 text-sm">
                  Collaborative tools enable team-based wildwatch monitoring and conservation efforts.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trust Badge */}
        <div className="mt-16 flex justify-center items-center text-gray-600">
          <svg className="h-5 w-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm">Trusted by Cebu Institute of Technology - University</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-4 text-sm text-gray-500 text-center">
        © 2025 WILDWATCH. All rights reserved.
      </footer>
    </div>
  )
}
