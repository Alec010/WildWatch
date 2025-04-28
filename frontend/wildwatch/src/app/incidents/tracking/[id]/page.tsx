"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Sidebar } from "@/components/Sidebar";
import { AlertTriangle } from "lucide-react";

interface IncidentDetails {
  id: string;
  incidentType: string;
  location: string;
  dateOfIncident: string;
  timeOfIncident: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string;
  contactEmail: string;
  contactNumber: string;
  submittedEvidence: string[];
  witnesses: { name: string; statement: string }[];
  caseUpdates: {
    type: string;
    message: string;
    time: string;
    author: string;
  }[];
}

export default function CaseDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [incident, setIncident] = useState<IncidentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidentDetails = async () => {
      const token = Cookies.get("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8080/api/incidents/case/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setIncident(data);
      } catch (error: any) {
        setError(error.message || "Failed to load case details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchIncidentDetails();
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading case details...</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen flex bg-[#f5f5f5]">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <p className="text-red-700 font-medium">
                Error: {error || "Case not found"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f5f5f5]">
      <Sidebar />
      <div className="flex-1 p-8 max-w-5xl mx-auto">
        <div className="mb-4">
          <button
            onClick={() => router.push("/incidents/tracking")}
            className="text-[#800000] hover:underline mb-4"
          >
            ← Back to Cases
          </button>
          <h1 className="text-2xl font-bold text-[#800000]">
            Case: {incident.id}
          </h1>
          <div className="flex gap-4 mt-2">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {incident.status}
            </span>
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
              {incident.priority}
            </span>
          </div>
        </div>

        {/* Incident Details */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4 text-[#800000]">
            Incident Details
          </h2>
          <p>
            <strong>Incident Type:</strong> {incident.incidentType}
          </p>
          <p>
            <strong>Location:</strong> {incident.location}
          </p>
          <p>
            <strong>Date & Time of Incident:</strong> {incident.dateOfIncident}{" "}
            at {incident.timeOfIncident}
          </p>
          <p className="mt-4">
            <strong>Description:</strong> {incident.description}
          </p>
        </div>

        {/* Assigned Info */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4 text-[#800000]">
            Case Information
          </h2>
          <p>
            <strong>Assigned To:</strong> {incident.assignedTo}
          </p>
          <p>
            <strong>Contact Email:</strong> {incident.contactEmail}
          </p>
          <p>
            <strong>Contact Number:</strong> {incident.contactNumber}
          </p>
        </div>

        {/* Evidence */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4 text-[#800000]">
            Submitted Evidence
          </h2>
          {incident.submittedEvidence.length > 0 ? (
            incident.submittedEvidence.map((file, index) => (
              <div key={index} className="mb-2">
                📎 {file}
              </div>
            ))
          ) : (
            <p>No evidence uploaded.</p>
          )}
        </div>

        {/* Witnesses */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4 text-[#800000]">
            Witnesses
          </h2>
          {incident.witnesses.length > 0 ? (
            incident.witnesses.map((witness, index) => (
              <div key={index} className="mb-4">
                <p className="font-medium">{witness.name}</p>
                <blockquote className="text-gray-700 italic border-l-4 pl-4 mt-2">
                  "{witness.statement}"
                </blockquote>
              </div>
            ))
          ) : (
            <p>No witnesses recorded.</p>
          )}
        </div>

        {/* Case Updates */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-[#800000]">
            Case Updates
          </h2>
          {incident.caseUpdates.map((update, index) => (
            <div key={index} className="mb-4 border-b pb-3">
              <p className="font-medium">{update.type}</p>
              <p className="text-gray-600 text-sm">{update.message}</p>
              <p className="text-xs text-gray-400">
                {update.time} by {update.author}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
