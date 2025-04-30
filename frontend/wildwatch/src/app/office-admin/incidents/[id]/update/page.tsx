import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { UpdateIncidentClient } from "@/app/office-admin/incidents/[id]/update/UpdateIncidentClient"

interface PageProps {
  params: {
    id: string
  }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function UpdateIncidentPage({ params }: PageProps) {
  return (
    <div className="flex h-screen">
      <OfficeAdminSidebar />
      <UpdateIncidentClient incidentId={params.id} />
    </div>
  )
} 