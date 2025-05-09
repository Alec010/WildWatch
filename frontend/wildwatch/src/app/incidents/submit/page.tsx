"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Info, AlertTriangle, HelpCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Sidebar } from "@/components/Sidebar";
import { ResetButton } from "@/components/ui/resetbutton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/api";

interface Office {
  code: string;
  fullName: string;
  description: string;
}

export default function IncidentSubmissionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    incidentType: "",
    dateOfIncident: "",
    timeOfIncident: "",
    location: "",
    assignedOffice: "",
    description: "",
  });
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem("incidentSubmissionData");
    if (storedData) {
      setFormData(JSON.parse(storedData));
    }

    const fetchOffices = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("No authentication token found");

        const response = await fetch(`${API_BASE_URL}/api/offices`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        setOffices(data);
      } catch (error: any) {
        setError(error.message || "Failed to load offices");
        if (
          error.message.includes("403") ||
          error.message.includes("authentication")
        ) {
          router.push("/auth/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOffices();
  }, [router]);

  useEffect(() => {
    if (formData.incidentType || formData.location || formData.description) {
      sessionStorage.setItem(
        "incidentSubmissionData",
        JSON.stringify(formData)
      );
    }
  }, [formData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Add validation for date of incident
    if (name === "dateOfIncident") {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of today
      
      if (selectedDate > today) {
        alert("Please select a date that is not in the future");
        return;
      }
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOfficeSelect = (office: string) => {
    setFormData((prev) => ({ ...prev, assignedOffice: office }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.incidentType ||
      !formData.dateOfIncident ||
      !formData.timeOfIncident ||
      !formData.location ||
      !formData.assignedOffice ||
      !formData.description
    ) {
      alert("Please fill in all required fields");
      return;
    }
    sessionStorage.setItem("incidentSubmissionData", JSON.stringify(formData));
    router.push("/incidents/submit/evidence");
  };

  const handleReset = () => {
    setFormData({
      incidentType: "",
      dateOfIncident: "",
      timeOfIncident: "",
      location: "",
      assignedOffice: "",
      description: "",
    });
    sessionStorage.removeItem("incidentSubmissionData");
  };

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <Sidebar />
      <div className="flex-1 p-8 max-w-[1700px] mx-auto ml-64">
        <h1 className="text-2xl font-bold text-[#8B0000] mb-1">
          Report an Incident
        </h1>
        <p className="text-gray-600 mb-6">
          Submit details about a security incident or concern
        </p>

        {/* Progress Indicator */}
        <div className="flex items-center mb-8">
          <div className="flex items-center">
            <div className="bg-[#8B0000] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="ml-2 font-medium text-[#8B0000]">
              Incident Details
            </span>
          </div>
          <div className="flex-1 h-1 bg-[#8B0000] mx-4"></div>
          <div className="flex items-center opacity-50">
            <div className="bg-gray-300 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="ml-2 text-gray-600">Evidence & Witnesses</span>
          </div>
          <div className="flex-1 h-1 bg-gray-300 mx-4"></div>
          <div className="flex items-center opacity-50">
            <div className="bg-gray-300 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
              3
            </div>
            <span className="ml-2 text-gray-600">Review & Submit</span>
          </div>
        </div>

        {/* Form and Help Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,300px] gap-6">
          {/* Incident Form */}
          <Card className="p-6 bg-white shadow-sm border-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Incident Details Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="text-[#8B0000]" size={20} />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Incident Details
                  </h2>
                </div>
                <p className="text-sm text-gray-500">
                  Provide essential information about the incident
                </p>
                <hr className="mt-4" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="incidentType" className="text-sm font-medium">
                  Incident Type <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="incidentType"
                  name="incidentType"
                  placeholder="Incident type"
                  value={formData.incidentType}
                  onChange={handleInputChange}
                  required
                  className="border-gray-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="dateOfIncident"
                    className="text-sm font-medium"
                  >
                    Date of Incident <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dateOfIncident"
                    type="date"
                    name="dateOfIncident"
                    value={formData.dateOfIncident}
                    onChange={handleInputChange}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="timeOfIncident"
                    className="text-sm font-medium"
                  >
                    Time of Incident <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="timeOfIncident"
                    type="time"
                    name="timeOfIncident"
                    value={formData.timeOfIncident}
                    onChange={handleInputChange}
                    required
                    className="border-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Be as specific as possible"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Report to what Office <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {loading ? (
                    <p className="text-sm text-gray-500">Loading offices...</p>
                  ) : error ? (
                    <p className="text-sm text-red-500">{error}</p>
                  ) : (
                    <TooltipProvider>
                      {offices.map((office) => (
                        <Tooltip key={office.code}>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant={
                                formData.assignedOffice === office.code
                                  ? "default"
                                  : "outline"
                              }
                              className={`h-8 px-3 rounded-md ${
                                formData.assignedOffice === office.code
                                  ? "bg-[#8B0000] text-white hover:bg-[#8B0000]/90"
                                  : "border-gray-300 hover:bg-gray-100"
                              }`}
                              onClick={() => handleOfficeSelect(office.code)}
                            >
                              {office.code} <Info className="h-4 w-4 ml-1" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-semibold">{office.fullName}</p>
                            <p className="text-sm text-gray-500">
                              {office.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe what happened in detail"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="min-h-[120px] border-gray-300 resize-none"
                />
                <div className="text-right text-xs text-gray-500">
                  {formData.description.length}/1000 characters
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <ResetButton onReset={handleReset} />
                <Button
                  type="submit"
                  className="bg-[#8B0000] hover:bg-[#8B0000]/90 text-white"
                >
                  Continue to Evidence →
                </Button>
              </div>
            </form>
          </Card>

          {/* Help Section */}
          <div className="bg-[#8B0000] text-white rounded-lg p-4 h-fit">
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
