"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Sidebar } from "@/components/Sidebar";

interface WitnessInfo {
  name: string;
  contactInformation: string;
  statement: string;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
  data: string; // base64 string
}

export default function EvidenceSubmissionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    witnesses: [] as WitnessInfo[],
    fileInfos: [] as FileInfo[]
  });
  const [incidentData, setIncidentData] = useState<any>(null);

  useEffect(() => {
    // Retrieve incident data from session storage
    const storedData = sessionStorage.getItem("incidentSubmissionData");
    if (!storedData) {
      router.push("/incidents/submit");
      return;
    }
    setIncidentData(JSON.parse(storedData));
  }, [router]);

  const handleAddWitness = () => {
    setFormData(prev => ({
      ...prev,
      witnesses: [...prev.witnesses, { name: "", contactInformation: "", statement: "" }],
    }));
  };

  const handleWitnessChange = (index: number, field: keyof WitnessInfo, value: string) => {
    const updatedWitnesses = [...formData.witnesses];
    updatedWitnesses[index] = { ...updatedWitnesses[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      witnesses: updatedWitnesses,
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const fileInfoPromises = newFiles.map(async (file) => {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String);
          };
          reader.readAsDataURL(file);
        });

        return {
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64
        };
      });

      const newFileInfos = await Promise.all(fileInfoPromises);
      
      setFormData(prev => ({
        ...prev,
        fileInfos: [...prev.fileInfos, ...newFileInfos]
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Store evidence and witness data in session storage
    sessionStorage.setItem("evidenceSubmissionData", JSON.stringify(formData));
    
    // Navigate to review page
    router.push("/incidents/submit/review");
  };

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-[1200px] mx-auto p-6">
          <Card className="bg-white shadow-lg">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-[#8B0000]">Evidence & Witnesses</h1>
              <p className="text-gray-500">Add supporting evidence and witness information</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center mb-8">
              <div className="flex items-center">
                <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                  ✓
                </div>
                <span className="ml-2 text-green-500">Incident Details</span>
              </div>
              <div className="flex-1 h-px bg-gray-300 mx-4"></div>
              <div className="flex items-center">
                <div className="bg-[#8B0000] text-white rounded-full w-8 h-8 flex items-center justify-center">
                  2
                </div>
                <span className="ml-2 font-medium text-[#8B0000]">Evidence & Witnesses</span>
              </div>
              <div className="flex-1 h-px bg-gray-300 mx-4"></div>
              <div className="flex items-center">
                <div className="bg-gray-200 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center">
                  3
                </div>
                <span className="ml-2 text-gray-600">Review & Submit</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload Section */}
              <div className="space-y-2">
                <Label>Evidence Files</Label>
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
                    className="cursor-pointer text-[#8B0000] hover:text-[#6B0000]"
                  >
                    Click to upload or drag and drop
                  </Label>
                  <p className="text-sm text-gray-500 mt-2">
                    Support for images and videos
                  </p>
                </div>
                {/* File List */}
                {formData.fileInfos.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Uploaded Files:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.fileInfos.map((file, index) => (
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
                          <p className="text-sm text-gray-600">
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Witnesses Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Witnesses</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddWitness}
                    className="text-[#8B0000] border-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                  >
                    + Add Witness
                  </Button>
                </div>

                {formData.witnesses.map((witness, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={witness.name}
                          onChange={(e) => handleWitnessChange(index, "name", e.target.value)}
                          placeholder="Witness name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Information</Label>
                        <Input
                          value={witness.contactInformation}
                          onChange={(e) => handleWitnessChange(index, "contactInformation", e.target.value)}
                          placeholder="Phone number or email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Statement</Label>
                        <Textarea
                          value={witness.statement}
                          onChange={(e) => handleWitnessChange(index, "statement", e.target.value)}
                          placeholder="What did the witness observe?"
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/incidents/submit")}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="bg-[#8B0000] hover:bg-[#6B0000] text-white"
                >
                  Continue to Review
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
} 