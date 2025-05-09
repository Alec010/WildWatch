"use client"

import { Sidebar } from "@/components/Sidebar"

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen flex bg-[#f5f5f5]">
      <Sidebar />
      <div className="flex-1 p-8 ml-64">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-[#800000] mb-4">Leaderboard</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Leaderboard content coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
} 