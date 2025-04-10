"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";
import Image from "next/image";

export default function ReviewSubmissionPage() {
  const router = useRouter();
  const [incidentData, setIncidentData] = useState<any>(null);
  const [evidenceData, setEvidenceData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Retrieve data from session storage
    const storedIncidentData = sessionStorage.getItem("incidentSubmissionData");
    const storedEvidenceData = sessionStorage.getItem("evidenceSubmissionData");
    
    if (!storedIncidentData || !storedEvidenceData) {
      router.push("/incidents/submit");
      return;
    }

    setIncidentData(JSON.parse(storedIncidentData));
    setEvidenceData(JSON.parse(storedEvidenceData));
  }, [router]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create FormData object
      const formData = new FormData();

      // Add incident data as JSON string
      const incidentDataWithWitnesses = {
        ...incidentData,
        assignedOffice: incidentData.assignedOffice.trim().toUpperCase(),
        witnesses: evidenceData.witnesses
      };

      // Debug log
      console.log('Submitting incident data:', incidentDataWithWitnesses);

      formData.append('incidentData', JSON.stringify(incidentDataWithWitnesses));

      // Add files
      if (evidenceData.fileInfos && evidenceData.fileInfos.length > 0) {
        for (const fileInfo of evidenceData.fileInfos) {
          // Convert base64 to blob
          const response = await fetch(fileInfo.data);
          const blob = await response.blob();
          
          // Create a File object from the blob
          const file = new File([blob], fileInfo.name, { type: fileInfo.type });
          formData.append('files', file);
        }
      }

      const response = await fetch("http://localhost:8080/api/incidents", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Clear session storage
      sessionStorage.removeItem("incidentSubmissionData");
      sessionStorage.removeItem("evidenceSubmissionData");

      // Redirect to success page or dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error submitting incident:", error);
      alert("Failed to submit incident: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!incidentData || !evidenceData) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-[1200px] mx-auto p-6">
          <Card className="bg-white shadow-lg">
            <div className="p-6">
              <h1 className="text-2xl font-semibold text-[#8B0000] mb-1">Review & Submit</h1>
              <p className="text-gray-600 mb-6">Review your incident report before submission</p>

              {/* Progress Steps */}
              <div className="flex items-center mb-8 border-b pb-4">
                <div className="flex items-center">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                    ✓
                  </div>
                  <span className="ml-2 text-green-500">Incident Details</span>
                </div>
                <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                <div className="flex items-center">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                    ✓
                  </div>
                  <span className="ml-2 text-green-500">Evidence & Witnesses</span>
                </div>
                <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                <div className="flex items-center">
                  <div className="bg-[#8B0000] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                    3
                  </div>
                  <span className="ml-2 font-medium text-[#8B0000]">Review & Submit</span>
                </div>
              </div>

              {/* Review Content */}
              <div className="space-y-8">
                {/* Incident Details Review */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">Incident Details</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Incident Type</p>
                      <p className="font-medium">{incidentData.incidentType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{incidentData.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="font-medium">
                        {new Date(incidentData.dateOfIncident).toLocaleDateString()} at{" "}
                        {incidentData.timeOfIncident}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Assigned Office</p>
                      <p className="font-medium">{incidentData.assignedOffice}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="mt-1">{incidentData.description}</p>
                  </div>
                </div>

                {/* Evidence Review */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">Evidence & Witnesses</h2>
                  
                  {/* Files */}
                  {evidenceData.fileInfos.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-medium mb-2">Uploaded Files</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {evidenceData.fileInfos.map((file: any, index: number) => (
                          <div key={index} className="space-y-2">
                            {file.type.startsWith('image/') ? (
                              <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                                <Image
                                  src={file.data}
                                  alt={file.name}
                                  fill
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                            ) : file.type.startsWith('video/') ? (
                              <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                                <video
                                  src={file.data}
                                  controls
                                  className="w-full h-full"
                                />
                              </div>
                            ) : null}
                            <p className="text-sm text-gray-600">{file.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Witnesses */}
                  {evidenceData.witnesses.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Witnesses</h3>
                      <div className="space-y-4">
                        {evidenceData.witnesses.map((witness: any, index: number) => (
                          <Card key={index} className="p-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="font-medium">{witness.name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Contact</p>
                                <p className="font-medium">{witness.contactInformation}</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm text-gray-500">Statement</p>
                              <p className="mt-1">{witness.statement}</p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/incidents/submit/evidence")}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-[#8B0000] hover:bg-[#8B0000]/90 text-white"
                >
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 