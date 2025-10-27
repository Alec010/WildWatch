"use client"

import { useState, useEffect } from "react"
import { ClientPageWrapper } from "@/components/ClientPageWrapper"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Sidebar } from "@/components/Sidebar"
import { Navbar } from "@/components/Navbar"
import { useSidebar } from "@/contexts/SidebarContext"
import { api } from "@/utils/apiClient"
import dynamic from 'next/dynamic'

// Import BulletinCard with client-side only rendering
const BulletinCard = dynamic(
  () => import('@/components/BulletinCard').then(mod => mod.BulletinCard), 
  { ssr: false }
)

interface Bulletin {
  id: string
  title: string
  description: string
  createdBy: string
  createdAt: string
  isActive: boolean
  mediaAttachments: any[]
  relatedIncidents: any[]
}

export default function OfficeBulletinPage() {
  const { collapsed } = useSidebar()
  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchBulletins()
  }, [])

  const fetchBulletins = async () => {
    try {
      const data = await api.getBulletins()
      setBulletins(data)
    } catch (error) {
      console.error('Failed to fetch bulletins:', error)
      toast.error('Failed to load bulletins')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchBulletins()
      toast.success('Bulletins refreshed')
    } catch (error) {
      toast.error('Failed to refresh bulletins')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Navbar title="Office Bulletin" />
        
        <div className={`pt-16 transition-all duration-300 ${
          collapsed ? 'lg:ml-20' : 'lg:ml-64'
        } ml-0`}>
          <div className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-[#8B0000]" />
                <span className="text-gray-600">Loading bulletins...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ClientPageWrapper>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Navbar title="Office Bulletin" />
      
      <div className={`pt-16 transition-all duration-300 ${
        collapsed ? 'lg:ml-20' : 'lg:ml-64'
      } ml-0`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                  <FileText className="h-6 w-6 text-[#8B0000]" />
                </div>
                <h1 className="text-3xl font-bold text-[#8B0000]">Office Bulletin</h1>
              </div>
              <p className="text-gray-600">Stay updated with the latest office announcements and important information.</p>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-[#8B0000]/30 text-[#8B0000] hover:bg-[#8B0000]/5"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Bulletins List */}
          {bulletins.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Bulletins Available</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  There are no office bulletins to display at the moment. Check back later for updates.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Latest Announcements ({bulletins.length})
                </h2>
              </div>
              
              {bulletins.map((bulletin) => (
                <BulletinCard 
                  key={bulletin.id} 
                  bulletin={bulletin} 
                  isAdmin={false} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </ClientPageWrapper>
  )
}
