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
import { Upload, X, Plus, CheckCircle } from "lucide-react";

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
  const [dragActive, setDragActive] = useState(false);

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

  const handleRemoveWitness = (index: number) => {
    setFormData(prev => ({
      ...prev,
      witnesses: prev.witnesses.filter((_, i) => i !== index),
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      const fileInfoPromises = files.map(async (file) => {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
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
    sessionStorage.setItem("evidenceSubmissionData", JSON.stringify(formData));
    router.push("/incidents/submit/review");
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fileInfos: prev.fileInfos.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[#8B0000]">Evidence & Witnesses</h1>
            <p className="text-gray-500">Add supporting evidence and witness information</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mb-8">
            <div className="flex items-center">
              <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                <CheckCircle size={16} />
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

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* File Upload Section */}
              <div className="space-y-4">
                <Label className="text-lg font-medium">Evidence Files</Label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                    dragActive ? 'border-[#8B0000] bg-red-50' : 'border-gray-300'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center">
                    <Upload className="h-12 w-12 text-gray-400 mb-4" />
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
                      className="cursor-pointer text-[#8B0000] hover:text-[#6B0000] font-medium"
                    >
                      Click to upload
                    </Label>
                    <p className="text-sm text-gray-500 mt-2">or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Supported formats: Images and Videos
                    </p>
                  </div>
                </div>

                {/* File List */}
                {formData.fileInfos.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-4">Uploaded Files</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.fileInfos.map((file, index) => (
                        <div key={index} className="group relative">
                          <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                            {file.type.startsWith('image/') ? (
                              <Image
                                src={file.data}
                                alt={file.name}
                                fill
                                style={{ objectFit: 'cover' }}
                              />
                            ) : file.type.startsWith('video/') ? (
                              <video
                                src={file.data}
                                controls
                                className="w-full h-full"
                              />
                            ) : null}
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
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
                  <Label className="text-lg font-medium">Witnesses</Label>
                  <Button
                    type="button"
                    onClick={handleAddWitness}
                    variant="outline"
                    className="text-[#8B0000] border-[#8B0000] hover:bg-red-50"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Witness
                  </Button>
                </div>

                {formData.witnesses.map((witness, index) => (
                  <Card key={index} className="p-6 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveWitness(index)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <Label className="block text-sm font-medium text-gray-700">Name</Label>
                        <Input
                          value={witness.name}
                          onChange={(e) => handleWitnessChange(index, "name", e.target.value)}
                          placeholder="Witness name"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="block text-sm font-medium text-gray-700">Contact Information</Label>
                        <Input
                          value={witness.contactInformation}
                          onChange={(e) => handleWitnessChange(index, "contactInformation", e.target.value)}
                          placeholder="Phone number or email"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="block text-sm font-medium text-gray-700">Statement</Label>
                        <Textarea
                          value={witness.statement}
                          onChange={(e) => handleWitnessChange(index, "statement", e.target.value)}
                          placeholder="Witness statement"
                          rows={3}
                          className="w-full min-h-[100px] resize-y"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="bg-[#8B0000] hover:bg-[#6B0000]"
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