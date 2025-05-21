"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Sidebar } from "@/components/Sidebar";
import {
  AlertTriangle,
  Upload,
  ArrowLeft,
  Camera,
  X,
  HelpCircle,
} from "lucide-react";

interface WitnessInfo {
  name: string;
  contactInformation: string;
  additionalNotes: string;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
  data: string;
}

export default function EvidenceSubmissionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    witnesses: [] as WitnessInfo[],
    fileInfos: [] as FileInfo[],
  });
  const [incidentData, setIncidentData] = useState<any>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem("incidentSubmissionData");
    if (!storedData) {
      router.push("/incidents/submit");
      return;
    }
    setIncidentData(JSON.parse(storedData));

    const storedEvidenceData = sessionStorage.getItem("evidenceSubmissionData");
    if (storedEvidenceData) {
      setFormData(JSON.parse(storedEvidenceData));
    }
  }, [router]);

  useEffect(() => {
    if (formData.witnesses.length > 0 || formData.fileInfos.length > 0) {
      sessionStorage.setItem(
        "evidenceSubmissionData",
        JSON.stringify(formData)
      );
    }
  }, [formData]);

  const handleAddWitness = () => {
    setFormData((prev) => ({
      ...prev,
      witnesses: [
        ...prev.witnesses,
        { name: "", contactInformation: "", additionalNotes: "" },
      ],
    }));
  };

  const handleWitnessChange = (
    index: number,
    field: keyof WitnessInfo,
    value: string
  ) => {
    const updatedWitnesses = [...formData.witnesses];
    updatedWitnesses[index] = { ...updatedWitnesses[index], [field]: value };
    setFormData((prev) => ({ ...prev, witnesses: updatedWitnesses }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const fileInfoPromises = newFiles.map(async (file) => {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        return {
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64,
        };
      });
      const newFileInfos = await Promise.all(fileInfoPromises);
      setFormData((prev) => ({
        ...prev,
        fileInfos: [...prev.fileInfos, ...newFileInfos],
      }));
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      fileInfos: prev.fileInfos.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if there is any evidence (files or witnesses)
    if (formData.fileInfos.length === 0 && formData.witnesses.length === 0) {
      // Show error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorMessage.innerHTML = `
        <div class="flex items-center">
          <div class="py-1">
            <svg class="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Evidence Required</p>
            <p class="text-sm">Please provide at least one piece of evidence (files or witness information) before proceeding.</p>
          </div>
        </div>
      `;
      document.body.appendChild(errorMessage);
      
      // Remove the error message after 5 seconds
      setTimeout(() => {
        document.body.removeChild(errorMessage);
      }, 5000);
      
      return;
    }
    
    router.push("/incidents/submit/review");
  };

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <Sidebar />
      <div className="flex-1 p-6 max-w-[1700px] mx-auto ml-64">
        <h1 className="text-2xl font-bold text-[#8B0000] mb-1">
          Report an Incident
        </h1>
        <p className="text-gray-600 mb-6">
          Submit details about a security incident or concern
        </p>

        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          <StepItem label="Incident Details" completed />
          <StepItem label="Evidence & Witnesses" active />
          <StepItem label="Review & Submit" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr,300px] gap-6 items-start">
          {/* Main Form */}
          <Card className="p-6 bg-white shadow-sm border-0 h-fit self-start mb-8 md:mb-0">
            <div className="flex items-center gap-3 border-b pb-5 mb-6">
              <div className="bg-[#8B0000] rounded-full w-10 h-10 flex items-center justify-center">
                <Camera className="text-white w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Evidence & Witnesses
                </h2>
                <p className="text-sm text-gray-500">
                  Upload evidence and provide witness information
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Evidence Upload */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Upload className="text-[#8B0000]" size={18} />
                  <h3 className="text-base font-semibold text-gray-700">
                    Evidence Upload
                  </h3>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    accept="image/*,video/*"
                  />
                  <Label
                    htmlFor="file-upload"
                    className="cursor-pointer text-[#8B0000] hover:text-[#6B0000] flex flex-col items-center"
                  >
                    <Upload className="h-8 w-8 mb-2" />
                    <span className="text-sm">
                      Drag & Drop files here or <b>Browse Files</b>
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      Supports JPG, PNG, MP4 (Max 10MB each)
                    </p>
                  </Label>
                </div>

                {/* Uploaded Files */}
                {formData.fileInfos.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2 text-sm">
                      Uploaded Files ({formData.fileInfos.length}):
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.fileInfos.map((file, index) => (
                        <div
                          key={index}
                          className="relative space-y-1 group rounded-lg border border-gray-200 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="absolute top-2 right-2 bg-[#8B0000] text-white rounded-full p-1 opacity-80 hover:opacity-100 z-10"
                            title="Remove File"
                          >
                            <X size={16} />
                          </button>
                          {file.type.startsWith("image/") ? (
                            <div className="relative aspect-square">
                              <Image
                                src={file.data || "/placeholder.svg"}
                                alt={file.name}
                                fill
                                style={{ objectFit: "cover" }}
                              />
                            </div>
                          ) : file.type.startsWith("video/") ? (
                            <div className="relative aspect-video">
                              <video
                                src={file.data}
                                controls
                                className="w-full h-full"
                              />
                            </div>
                          ) : null}
                          <p className="text-xs text-gray-600 text-center px-2 pb-2 truncate">
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                            MB)
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Witness Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-[#8B0000]" size={18} />
                    <h3 className="text-base font-semibold text-gray-700">
                      Witness Information
                    </h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddWitness}
                    className="text-[#8B0000] border-[#8B0000] hover:bg-[#8B0000]/10 text-sm h-8"
                  >
                    + Add Another Witness
                  </Button>
                </div>

                {formData.witnesses.length > 0 ? (
                  formData.witnesses.map((witness, index) => (
                    <Card
                      key={index}
                      className="p-4 space-y-4 mb-4 border-gray-200 relative"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updatedWitnesses = formData.witnesses.filter((_, i) => i !== index);
                          setFormData((prev) => ({ ...prev, witnesses: updatedWitnesses }));
                        }}
                        className="absolute top-3 right-3 text-gray-500 hover:text-[#8B0000]"
                        aria-label="Remove witness"
                      >
                        <X size={16} />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Name</Label>
                          <Input
                            value={witness.name}
                            onChange={(e) =>
                              handleWitnessChange(index, "name", e.target.value)
                            }
                            placeholder="Witness full name"
                            className="border-gray-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Contact Information</Label>
                          <Input
                            value={witness.contactInformation}
                            onChange={(e) =>
                              handleWitnessChange(
                                index,
                                "contactInformation",
                                e.target.value
                              )
                            }
                            placeholder="Email or phone number"
                            className="border-gray-300"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">
                          Additional Notes (What did they see or hear?)
                        </Label>
                        <Textarea
                          value={witness.additionalNotes}
                          onChange={(e) =>
                            handleWitnessChange(
                              index,
                              "additionalNotes",
                              e.target.value
                            )
                          }
                          placeholder="Describe what the witness observed"
                          className="min-h-[100px] border-gray-300 resize-none"
                        />
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-4 border border-dashed border-gray-300 rounded-lg">
                    <p className="text-sm text-gray-500">
                      No witnesses added yet
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      onClick={handleAddWitness}
                      className="text-[#8B0000] mt-1"
                    >
                      + Add a Witness
                    </Button>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/incidents/submit")}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Incident Details
                </Button>
                <Button
                  type="submit"
                  className="bg-[#8B0000] hover:bg-[#8B0000]/90 text-white"
                >
                  Continue to Review →
                </Button>
              </div>
            </form>
          </Card>

          {/* Help Section */}
          <div className="bg-[#8B0000] text-white rounded-lg p-4 h-fit self-start mt-8 md:mt-0">
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <HelpCircle size={20} /> Need Help?
            </h2>
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Reporting Tips</h3>
              <ul className="list-disc pl-5 text-sm space-y-2">
                <li>Be as specific as possible about the location</li>
                <li>Include time details even if approximate</li>
                <li>Photos and videos help security respond effectively</li>
                <li>
                  Mention any witnesses who can provide additional information
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepItem({
  label,
  completed = false,
  active = false,
}: {
  label: string;
  completed?: boolean;
  active?: boolean;
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
            "2"
          ) : (
            "3"
          )}
        </div>
        <span className="ml-2 font-medium">{label}</span>
      </div>
      <div
        className={`flex-1 h-1 ${
          completed ? "bg-green-500" : active ? "bg-[#8B0000]" : "bg-gray-300"
        } mx-4`}
      ></div>
    </>
  );
}
