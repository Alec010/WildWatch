"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Sidebar } from "@/components/Sidebar";
import Image from "next/image";
import { CheckCircle2, ArrowLeft, Info, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ReviewSubmissionPage() {
  const router = useRouter();
  const [incidentData, setIncidentData] = useState<any>(null);
  const [evidenceData, setEvidenceData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmations, setConfirmations] = useState({
    accurateInfo: false,
    contactConsent: false,
  });
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");

  useEffect(() => {
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
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
      if (!token) throw new Error("No authentication token found");

      const formData = new FormData();
      formData.append(
        "incidentData",
        JSON.stringify({ ...incidentData, witnesses: evidenceData.witnesses })
      );
      for (const fileInfo of evidenceData.fileInfos) {
        const response = await fetch(fileInfo.data);
        const blob = await response.blob();
        formData.append("files", blob, fileInfo.name);
      }

      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const responseData = await response.json();
      setTrackingNumber(responseData.trackingNumber);
      setShowSuccessDialog(true);
      sessionStorage.removeItem("incidentSubmissionData");
      sessionStorage.removeItem("evidenceSubmissionData");
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
    router.push("/dashboard");
  };

  if (!incidentData || !evidenceData) return null;

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <Sidebar />
      <div className="flex-1 p-6 max-w-[1200px] mx-auto">
        <h1 className="text-2xl font-bold text-[#8B0000] mb-2">
          Report an Incident
        </h1>
        <p className="text-gray-600 mb-6">
          Please review your report before submission.
        </p>

        {/* Steps Indicator */}
        <div className="flex items-center mb-8">
          <StepItem label="Incident Details" completed />
          <StepItem label="Evidence & Witnesses" completed />
          <StepItem label="Review & Submit" active isLast />
        </div>

        {/* Incident Details */}
        <Card className="p-6 bg-white shadow-sm border-0">
          <div className="flex items-center gap-3 border-b pb-5 mb-6">
            <div className="bg-[#8B0000] rounded-full w-10 h-10 flex items-center justify-center">
              <CheckCircle2 className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Review & Submit
              </h2>
              <p className="text-sm text-gray-500">
                Please review your report before submission
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Incident Details */}
            <div>
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-base font-semibold text-gray-800">
                  Incident Details
                </h3>
                <Button
                  variant="outline"
                  onClick={() => router.push("/incidents/submit")}
                  className="h-8 text-xs"
                >
                  <Edit2 size={14} className="mr-1" /> Edit
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <SummaryRow
                  label="Incident Type"
                  value={incidentData.incidentType}
                />
                <SummaryRow
                  label="Date & Time"
                  value={`${new Date(
                    incidentData.dateOfIncident
                  ).toLocaleDateString()} at ${incidentData.timeOfIncident}`}
                />
                <SummaryRow label="Location" value={incidentData.location} />
                <SummaryRow
                  label="Assigned Office"
                  value={incidentData.assignedOffice}
                />
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Description</p>
                <p className="mt-1 text-sm">{incidentData.description}</p>
              </div>
            </div>

            {/* Evidence & Witnesses */}
            <div>
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-base font-semibold text-gray-800">
                  Evidence & Witnesses
                </h3>
                <Button
                  variant="outline"
                  onClick={() => router.push("/incidents/submit/evidence")}
                  className="h-8 text-xs"
                >
                  <Edit2 size={14} className="mr-1" /> Edit
                </Button>
              </div>

              {/* Uploaded Files */}
              {evidenceData.fileInfos.length > 0 ? (
                <div className="mb-6">
                  <h4 className="font-medium mb-3 text-sm text-gray-700">
                    Uploaded Evidence
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {evidenceData.fileInfos.map((file: any, index: number) => (
                      <div key={index} className="space-y-1 text-center">
                        {file.type.startsWith("image/") ? (
                          <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                            <Image
                              src={file.data || "/placeholder.svg"}
                              alt={file.name}
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                        ) : file.type.startsWith("video/") ? (
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                            <video
                              src={file.data}
                              controls
                              className="w-full h-full"
                            />
                          </div>
                        ) : null}
                        <p className="text-xs text-gray-600 truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">
                  No evidence files uploaded
                </p>
              )}

              {/* Witness Information */}
              {evidenceData.witnesses.length > 0 ? (
                <div>
                  <h4 className="font-medium mb-3 text-sm text-gray-700">
                    Witness Information
                  </h4>
                  <div className="space-y-3">
                    {evidenceData.witnesses.map(
                      (witness: any, index: number) => (
                        <Card key={index} className="p-3 border-gray-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <SummaryRow
                              label="Name"
                              value={witness.name || "Not provided"}
                            />
                            <SummaryRow
                              label="Contact"
                              value={
                                witness.contactInformation || "Not provided"
                              }
                            />
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">Statement</p>
                            <p className="mt-1 text-sm">
                              {witness.statement || "No statement provided"}
                            </p>
                          </div>
                        </Card>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No witnesses added</p>
              )}
            </div>

            {/* Confirmations */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="accurateInfo"
                  checked={confirmations.accurateInfo}
                  onCheckedChange={(checked: boolean) =>
                    setConfirmations((prev) => ({
                      ...prev,
                      accurateInfo: checked,
                    }))
                  }
                  className="mt-1"
                />
                <label htmlFor="accurateInfo" className="text-sm text-gray-600">
                  I confirm that all information provided is accurate to the
                  best of my knowledge.
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="contactConsent"
                  checked={confirmations.contactConsent}
                  onCheckedChange={(checked: boolean) =>
                    setConfirmations((prev) => ({
                      ...prev,
                      contactConsent: checked,
                    }))
                  }
                  className="mt-1"
                />
                <label
                  htmlFor="contactConsent"
                  className="text-sm text-gray-600"
                >
                  I understand that campus security may contact me for
                  additional information.
                </label>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Your report will be reviewed by campus security personnel. You
                  will receive a confirmation email with a tracking number once
                  your report is submitted.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/incidents/submit/evidence")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Evidence & Witnesses
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !confirmations.accurateInfo ||
                  !confirmations.contactConsent ||
                  isSubmitting
                }
                className="bg-[#8B0000] hover:bg-[#8B0000]/90 text-white disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-6 w-6" /> Report Submitted
                Successfully
              </DialogTitle>
              <DialogDescription>
                Your incident has been reported and will be reviewed by security
                personnel.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500">Tracking Number</p>
                <p className="text-lg font-semibold text-[#8B0000]">
                  {trackingNumber}
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Please save this tracking number for your records. You can use
                it to check the status of your report.
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleCloseDialog}
                className="bg-[#8B0000] hover:bg-[#8B0000]/90 text-white"
              >
                Go to Dashboard
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Reusable summary row component
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-sm">{value || "Not provided"}</p>
    </div>
  );
}

// Step Progress Indicator
function StepItem({
  label,
  completed = false,
  active = false,
  isLast = false,
}: {
  label: string;
  completed?: boolean;
  active?: boolean;
  isLast?: boolean;
}) {
  return (
    <>
      <div
        className={`flex items-center ${
          completed
            ? "text-green-500"
            : active
            ? "text-[#8B0000]"
            : "opacity-50 text-gray-600"
        }`}
      >
        <div
          className={`${
            completed ? "bg-green-500" : active ? "bg-[#8B0000]" : "bg-gray-300"
          } text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium`}
        >
          {completed ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : active ? (
            "3"
          ) : (
            ""
          )}
        </div>
        <span className="ml-2 font-medium">{label}</span>
      </div>
      {!isLast && (
        <div
          className={`flex-1 h-1 ${
            completed || active ? "bg-green-500" : "bg-gray-300"
          } mx-4`}
        ></div>
      )}
    </>
  );
}
