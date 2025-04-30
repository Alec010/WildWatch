import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { UpdateIncidentClient } from "@/app/office-admin/incidents/[id]/update/UpdateIncidentClient"

export default async function UpdateIncidentPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="flex h-screen">
      <OfficeAdminSidebar />
      <UpdateIncidentClient incidentId={params.id} />
    </div>
  )
} 