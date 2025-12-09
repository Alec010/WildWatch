"use client";

import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Download,
  ExternalLink,
  Calendar,
  User,
  ThumbsUp,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  X,
} from "lucide-react";
import { api } from "@/utils/apiClient";
import { toast } from "sonner";
import { format } from "date-fns";
import { BulletinWebSocket } from "@/components/BulletinWebSocket";
import { openInNewTab } from "@/utils/clientNavigation";
import Image from "next/image";

interface BulletinMedia {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

interface IncidentSummary {
  id: string;
  trackingNumber: string;
  title: string;
  status: string;
}

interface Bulletin {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  mediaAttachments: BulletinMedia[];
  relatedIncidents: IncidentSummary[];
}

interface BulletinCardProps {
  bulletin: Bulletin;
  isAdmin?: boolean;
}

export function BulletinCard({ bulletin, isAdmin = false }: BulletinCardProps) {
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Fetch upvote status and count on mount
  useEffect(() => {
    const fetchUpvoteData = async () => {
      try {
        const [statusData, countData] = await Promise.all([
          api.getBulletinUpvoteStatus(bulletin.id),
          api.getBulletinUpvoteCount(bulletin.id),
        ]);
        setHasUpvoted(statusData);
        setUpvoteCount(countData);
      } catch (error) {
        console.error("Failed to fetch upvote data:", error);
      }
    };

    fetchUpvoteData();
  }, [bulletin.id]);

  const handleUpvoteClick = async () => {
    if (isUpvoting) return;

    setIsUpvoting(true);
    try {
      const isNowUpvoted = await api.toggleBulletinUpvote(bulletin.id);
      setHasUpvoted(isNowUpvoted);

      // Update count locally (WebSocket will update it officially)
      setUpvoteCount((prev) =>
        isNowUpvoted ? prev + 1 : Math.max(0, prev - 1)
      );

      // Show toast
      if (isNowUpvoted) {
        toast.success("Bulletin upvoted");
      } else {
        toast.info("Upvote removed");
      }
    } catch (error) {
      console.error("Failed to toggle upvote:", error);
      toast.error("Failed to process upvote");
    } finally {
      setIsUpvoting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.startsWith("image/")) return "🖼️";
    if (fileType?.startsWith("video/")) return "🎥";
    if (fileType?.includes("pdf")) return "📄";
    if (fileType?.includes("word") || fileType?.includes("document"))
      return "📝";
    return "📎";
  };

  const handleDownload = (media: BulletinMedia) => {
    openInNewTab(media.fileUrl);
  };

  const handleImageClick = (media: BulletinMedia) => {
    if (media.fileType?.startsWith("image/")) {
      setPreviewImage(media.fileUrl);
      setPreviewImageName(media.fileName);
      setImageScale(1);
      setImageRotation(0);
      setImagePosition({ x: 0, y: 0 });
    } else {
      handleDownload(media);
    }
  };

  const handleIncidentClick = (incident: IncidentSummary) => {
    // Open incident details page in new tab using tracking number
    openInNewTab(`/incidents/tracking/${incident.trackingNumber}`);
  };

  return (
    <>
      <BulletinWebSocket
        bulletinId={bulletin.id}
        onUpvoteUpdate={setUpvoteCount}
      />
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-[#8B0000] mb-2">
              {bulletin.title}
            </h3>
            <div className="flex flex-col gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(bulletin.createdAt), "PPP 'at' p")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Posted by {bulletin.createdBy}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Upvote Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUpvoteClick}
              disabled={isUpvoting}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                hasUpvoted
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <ThumbsUp
                className={`h-4 w-4 ${
                  hasUpvoted ? "fill-red-600 text-red-600" : ""
                }`}
              />
              <span className="text-xs font-medium">{upvoteCount}</span>
            </Button>

            {isAdmin && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                Admin Post
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {bulletin.description}
          </p>
        </div>

        {/* Media Attachments */}
        {bulletin.mediaAttachments && bulletin.mediaAttachments.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Attachments ({bulletin.mediaAttachments.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {bulletin.mediaAttachments.map((media) => (
                <div
                  key={media.id}
                  className={`border border-gray-200 rounded-lg p-3 transition-colors flex flex-col ${
                    media.fileType?.startsWith("image/")
                      ? "hover:bg-gray-50 cursor-pointer"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() =>
                    media.fileType?.startsWith("image/") &&
                    handleImageClick(media)
                  }
                >
                  {media.fileType?.startsWith("image/") ? (
                    <div className="relative w-full aspect-video rounded overflow-hidden mb-3">
                      <Image
                        src={media.fileUrl}
                        alt={media.fileName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="text-4xl text-center mb-3">
                      {getFileIcon(media.fileType)}
                    </div>
                  )}
                  <div className="flex-1 w-full min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p
                        className="text-sm font-medium text-gray-900 break-words flex-1 min-w-0 overflow-wrap-anywhere"
                        title={media.fileName}
                      >
                        {media.fileName}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(media);
                        }}
                        className="h-8 w-8 p-0 hover:bg-blue-50 flex-shrink-0"
                      >
                        <Download className="h-4 w-4 text-blue-600" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(media.fileSize)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(media.uploadedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Incidents */}
        {bulletin.relatedIncidents && bulletin.relatedIncidents.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Related Resolved Incidents ({bulletin.relatedIncidents.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {bulletin.relatedIncidents.map((incident) => (
                <Badge
                  key={incident.id}
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-pointer transition-colors"
                  title={`Click to view incident: ${incident.title}`}
                  onClick={() => handleIncidentClick(incident)}
                >
                  #{incident.trackingNumber}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Image Preview Dialog */}
        <Dialog
          open={!!previewImage}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewImage(null);
              setPreviewImageName(null);
              setImageScale(1);
              setImageRotation(0);
              setImagePosition({ x: 0, y: 0 });
            }
          }}
        >
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 gap-0 overflow-hidden bg-black/95 border-none">
            <DialogHeader className="sr-only">
              <DialogTitle>Image Preview</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-full flex items-center justify-center bg-black/95">
              {/* Control Bar */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                <button
                  onClick={() =>
                    setImageScale((prev) => Math.max(prev - 0.25, 0.5))
                  }
                  className="p-2 rounded-md hover:bg-white/20 text-white transition-colors"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-white text-sm font-medium min-w-[50px] text-center">
                  {Math.round(imageScale * 100)}%
                </span>
                <button
                  onClick={() =>
                    setImageScale((prev) => Math.min(prev + 0.25, 4))
                  }
                  className="p-2 rounded-md hover:bg-white/20 text-white transition-colors"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <div className="w-px h-6 bg-white/30 mx-1" />
                <button
                  onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                  className="p-2 rounded-md hover:bg-white/20 text-white transition-colors"
                  aria-label="Rotate"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setImageScale(1);
                    setImageRotation(0);
                    setImagePosition({ x: 0, y: 0 });
                  }}
                  className="p-2 rounded-md hover:bg-white/20 text-white transition-colors"
                  aria-label="Reset"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setPreviewImage(null);
                  setPreviewImageName(null);
                  setImageScale(1);
                  setImageRotation(0);
                  setImagePosition({ x: 0, y: 0 });
                }}
                className="absolute top-4 right-4 z-50 rounded-full p-2 bg-black/50 hover:bg-black/70 text-white transition-colors"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Image Name */}
              {previewImage && (
                <div className="absolute bottom-4 left-4 z-50 bg-black/50 text-white px-3 py-1.5 rounded-md text-sm max-w-[200px] truncate">
                  {previewImageName}
                </div>
              )}

              {/* Image Container with Zoom and Pan */}
              {previewImage && (
                <div
                  ref={imageContainerRef}
                  className="w-full h-full overflow-auto cursor-move"
                  onWheel={(e) => {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    setImageScale((prev) =>
                      Math.max(0.5, Math.min(4, prev + delta))
                    );
                  }}
                  onMouseDown={(e) => {
                    if (imageScale > 1) {
                      setIsDragging(true);
                      setDragStart({
                        x: e.clientX - imagePosition.x,
                        y: e.clientY - imagePosition.y,
                      });
                    }
                  }}
                  onMouseMove={(e) => {
                    if (isDragging && imageScale > 1) {
                      setImagePosition({
                        x: e.clientX - dragStart.x,
                        y: e.clientY - dragStart.y,
                      });
                    }
                  }}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                  style={{
                    cursor:
                      imageScale > 1
                        ? isDragging
                          ? "grabbing"
                          : "grab"
                        : "default",
                  }}
                >
                  <div
                    className="flex items-center justify-center min-h-full p-4"
                    style={{
                      transform: `translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                    }}
                  >
                    <img
                      src={previewImage || ""}
                      alt={previewImageName || "Image preview"}
                      className="object-contain rounded-lg transition-transform duration-200"
                      style={{
                        transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
                        maxWidth: "90vw",
                        maxHeight: "90vh",
                      }}
                      draggable={false}
                      onClick={(e) => {
                        if (imageScale <= 1) {
                          e.stopPropagation();
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
