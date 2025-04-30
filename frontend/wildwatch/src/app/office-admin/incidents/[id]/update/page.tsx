import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { UpdateIncidentClient } from "./UpdateIncidentClient"

export default function UpdateIncidentPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex h-screen">
      <OfficeAdminSidebar />
      <UpdateIncidentClient incidentId={params.id} />
    </div>
  )
} 