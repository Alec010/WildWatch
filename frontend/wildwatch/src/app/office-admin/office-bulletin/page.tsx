"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, FileText, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { OfficeAdminNavbar } from "@/components/OfficeAdminNavbar"
import { BulletinCard } from "@/components/BulletinCard"
import { CreateBulletinModal } from "@/components/CreateBulletinModal"
import { useSidebar } from "@/contexts/SidebarContext"
import { api } from "@/utils/apiClient"

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

export default function OfficeAdminBulletinPage() {
  const { collapsed } = useSidebar()
  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

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

  const handleCreateSuccess = () => {
    fetchBulletins() // Refresh the bulletins list
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OfficeAdminSidebar />
        <OfficeAdminNavbar />
        
        <div className={`pt-16 transition-all duration-300 ${
          collapsed ? 'lg:ml-20' : 'lg:ml-72'
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
    <div className="min-h-screen bg-gray-50">
      <OfficeAdminSidebar />
      <OfficeAdminNavbar />
      
      <div className={`pt-16 transition-all duration-300 ${
        collapsed ? 'lg:ml-20' : 'lg:ml-72'
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
              <p className="text-gray-600">Manage office announcements and important information.</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-[#8B0000]/30 text-[#8B0000] hover:bg-[#8B0000]/5"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#8B0000] hover:bg-[#6B0000]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Bulletin
              </Button>
            </div>
          </div>

          {/* Bulletins List */}
          {bulletins.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Bulletins Yet</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Start creating bulletins to share important announcements with the community.
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#8B0000] hover:bg-[#6B0000]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Bulletin
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Bulletins ({bulletins.length})
                </h2>
              </div>
              
              {bulletins.map((bulletin) => (
                <BulletinCard 
                  key={bulletin.id} 
                  bulletin={bulletin} 
                  isAdmin={true} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Bulletin Modal */}
      <CreateBulletinModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
