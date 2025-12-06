"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ClientPageWrapper } from "@/components/ClientPageWrapper";
import { Button } from "@/components/ui/button";
import { Plus, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar";
import { OfficeAdminNavbar } from "@/components/OfficeAdminNavbar";
import { useSidebar } from "@/contexts/SidebarContext";
import { api } from "@/utils/apiClient";
import { PageLoader } from "@/components/PageLoader";

// Import all components with client-side only rendering
const BulletinCard = dynamic(
  () => import("@/components/BulletinCard").then((mod) => mod.BulletinCard),
  { ssr: false }
);

const CreateBulletinModal = dynamic(
  () =>
    import("@/components/CreateBulletinModal").then(
      (mod) => mod.CreateBulletinModal
    ),
  { ssr: false }
);

interface Bulletin {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  mediaAttachments: any[];
  relatedIncidents: any[];
}

export default function OfficeAdminBulletinPage() {
  const { collapsed } = useSidebar();
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchBulletins();
  }, []);

  const fetchBulletins = async () => {
    try {
      const data = await api.getBulletins();
      setBulletins(data);
    } catch (error) {
      console.error("Failed to fetch bulletins:", error);
      toast.error("Failed to load bulletins");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBulletins();
      toast.success("Bulletins refreshed");
    } catch (error) {
      toast.error("Failed to refresh bulletins");
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateSuccess = () => {
    fetchBulletins(); // Refresh the bulletins list
  };

  if (loading) {
    return (
      <div className="flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <OfficeAdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="sticky top-0 z-30 flex-shrink-0">
            <OfficeAdminNavbar
              title="Office Bulletin Management"
              subtitle="Manage office announcements and important information"
              showSearch={false}
            />
          </div>
          <PageLoader pageTitle="office bulletin" />
        </div>
      </div>
    );
  }

  return (
    <ClientPageWrapper>
      <div className="flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] overflow-x-hidden">
        <OfficeAdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="sticky top-0 z-30 flex-shrink-0">
            <OfficeAdminNavbar
              title="Office Bulletin Management"
              subtitle="Manage office announcements and important information"
              showSearch={false}
            />
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] pt-16">
            <div
              className={`px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10 ${
                collapsed
                  ? "max-w-[calc(100vw-5rem-2rem)]"
                  : "max-w-[calc(100vw-16rem-2rem)]"
              } mx-auto w-full`}
            >
              <div className="w-full max-w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                        <FileText className="h-6 w-6 text-[#8B0000]" />
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-[#8B0000]">
                        Office Bulletin
                      </h1>
                    </div>
                    <p className="text-gray-600">
                      Manage office announcements and important information.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="border-[#8B0000]/30 text-[#8B0000] hover:bg-[#8B0000]/5"
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${
                          refreshing ? "animate-spin" : ""
                        }`}
                      />
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
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No Bulletins Yet
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Start creating bulletins to share important
                        announcements with the community.
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
          </div>
        </div>

        {/* Create Bulletin Modal */}
        <CreateBulletinModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </ClientPageWrapper>
  );
}
