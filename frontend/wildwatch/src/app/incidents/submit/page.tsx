"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Info, AlertTriangle, LayoutDashboard, AlertOctagon, History, Settings, LogOut } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Cookies from "js-cookie";
import { Sidebar } from "@/components/Sidebar";

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
    const fetchOffices = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching offices from backend...");
        
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch("http://localhost:8080/api/offices", {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setOffices(data);
      } catch (error) {
        console.error("Error fetching offices:", error);
        setError(error instanceof Error ? error.message : "Failed to load offices");
        if (error instanceof Error && (error.message.includes('No authentication token found') || error.message.includes('403'))) {
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOffices();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOfficeSelect = (office: string) => {
    setFormData(prev => ({
      ...prev,
      assignedOffice: office
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.incidentType || !formData.dateOfIncident || !formData.timeOfIncident || 
        !formData.location || !formData.assignedOffice || !formData.description) {
      alert("Please fill in all required fields");
      return;
    }

    sessionStorage.setItem("incidentSubmissionData", JSON.stringify(formData));
    router.push("/incidents/submit/evidence");
  };

  const handleSignOut = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-[1200px] mx-auto p-6">
          <Card className="bg-white shadow-lg">
            <div className="p-6">
              <h1 className="text-2xl font-semibold text-[#8B0000] mb-1">Report an Incident</h1>
              <p className="text-gray-600 mb-6">Submit details about a security incident or concern</p>

              {/* Progress Steps */}
              <div className="flex items-center mb-8 border-b pb-4">
                <div className="flex items-center">
                  <div className="bg-[#8B0000] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                    1
                  </div>
                  <span className="ml-2 font-medium text-[#8B0000]">Incident Details</span>
                </div>
                <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                <div className="flex items-center opacity-50">
                  <div className="bg-gray-300 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center text-sm">
                    2
                  </div>
                  <span className="ml-2 text-gray-600">Evidence & Witnesses</span>
                </div>
                <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                <div className="flex items-center opacity-50">
                  <div className="bg-gray-300 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center text-sm">
                    3
                  </div>
                  <span className="ml-2 text-gray-600">Review & Submit</span>
                </div>
              </div>

              <div className="grid grid-cols-[1fr,300px] gap-6">
                {/* Form Section */}
                <div>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="text-[#8B0000]" />
                      <h2 className="text-lg font-semibold text-gray-700">Incident Details</h2>
                    </div>
                    <p className="text-gray-600 text-sm mb-6">Provide essential information about the incident</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Incident Type */}
                      <div className="space-y-2">
                        <Label htmlFor="incidentType" className="text-gray-700">
                          Incident Type <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="incidentType"
                          name="incidentType"
                          placeholder="Enter incident type"
                          value={formData.incidentType}
                          onChange={handleInputChange}
                          className="border-gray-300"
                          required
                        />
                      </div>

                      {/* Date and Time */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dateOfIncident" className="text-gray-700">
                            Date of Incident <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="dateOfIncident"
                            name="dateOfIncident"
                            type="date"
                            value={formData.dateOfIncident}
                            onChange={handleInputChange}
                            className="border-gray-300"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="timeOfIncident" className="text-gray-700">
                            Time of Incident <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="timeOfIncident"
                            name="timeOfIncident"
                            type="time"
                            value={formData.timeOfIncident}
                            onChange={handleInputChange}
                            className="border-gray-300"
                            required
                          />
                        </div>
                      </div>

                      {/* Location */}
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-gray-700">
                          Location <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="location"
                          name="location"
                          placeholder="Be as specific as possible"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="border-gray-300"
                          required
                        />
                      </div>

                      {/* Assigned Office */}
                      <div className="space-y-2">
                        <Label className="text-gray-700">
                          Report to what Office <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {loading ? (
                            <p>Loading offices...</p>
                          ) : error ? (
                            <p className="text-red-500">Error: {error}</p>
                          ) : offices.length === 0 ? (
                            <p>No offices available</p>
                          ) : (
                            <TooltipProvider delayDuration={200}>
                              {offices.map((office) => (
                                <Tooltip key={office.code}>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant={formData.assignedOffice === office.code ? "default" : "outline"}
                                      className={`h-8 px-3 flex items-center gap-1 ${
                                        formData.assignedOffice === office.code 
                                          ? "bg-[#8B0000] hover:bg-[#8B0000]/90" 
                                          : "hover:bg-gray-100"
                                      }`}
                                      onClick={() => handleOfficeSelect(office.code)}
                                    >
                                      {office.code}
                                      <Info className="h-4 w-4 ml-1" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[300px] p-3">
                                    <div>
                                      <p className="font-semibold mb-1">{office.fullName}</p>
                                      <p className="text-sm text-gray-500">{office.description}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </TooltipProvider>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-gray-700">
                          Description <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Describe what happened in detail"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="min-h-[150px] border-gray-300"
                          required
                        />
                        <div className="text-right text-sm text-gray-500">
                          {formData.description.length}/1000 characters
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="bg-[#8B0000] hover:bg-[#8B0000]/90 text-white"
                      >
                        Continue to Evidence
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Need Help Section */}
                <div className="space-y-4">
                  <div className="bg-[#8B0000] text-white p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Info size={20} />
                      <h3 className="font-semibold">Need help?</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <p>Reporting Tips:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Be as specific as possible about the location</li>
                        <li>Include time details even if approximate</li>
                        <li>When in doubt, report anyway</li>
                        <li>Provide any relevant evidence when you proceed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 