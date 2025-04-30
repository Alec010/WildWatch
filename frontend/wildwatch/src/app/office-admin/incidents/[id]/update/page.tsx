import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { UpdateIncidentClient } from "@/app/office-admin/incidents/[id]/update/UpdateIncidentClient"

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function UpdateIncidentPage(props: Props) {
  return (
    <div className="flex h-screen">
      <OfficeAdminSidebar />
      <UpdateIncidentClient incidentId={props.params.id} />
    </div>
  )
} 