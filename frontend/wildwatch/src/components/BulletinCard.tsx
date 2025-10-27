"use client"

import React, { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, ExternalLink, Calendar, User, ThumbsUp } from "lucide-react"
import { api } from "@/utils/apiClient"
import { toast } from "sonner"
import { format } from "date-fns"

interface BulletinMedia {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  uploadedAt: string
}

interface IncidentSummary {
  id: string
  trackingNumber: string
  title: string
  status: string
}

interface Bulletin {
  id: string
  title: string
  description: string
  createdBy: string
  createdAt: string
  isActive: boolean
  mediaAttachments: BulletinMedia[]
  relatedIncidents: IncidentSummary[]
}

interface BulletinCardProps {
  bulletin: Bulletin
  isAdmin?: boolean
}

export function BulletinCard({ bulletin, isAdmin = false }: BulletinCardProps) {
  const [upvoteCount, setUpvoteCount] = useState(0)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [isUpvoting, setIsUpvoting] = useState(false)

  // Fetch upvote status and count on mount
  useEffect(() => {
    const fetchUpvoteData = async () => {
      try {
        const [statusData, countData] = await Promise.all([
          api.getBulletinUpvoteStatus(bulletin.id),
          api.getBulletinUpvoteCount(bulletin.id)
        ])
        setHasUpvoted(statusData)
        setUpvoteCount(countData)
      } catch (error) {
        console.error("Failed to fetch upvote data:", error)
      }
    }
    
    fetchUpvoteData()
    
    // Set up WebSocket listener for real-time upvote updates
    // Only create WebSocket on client-side
    if (typeof window === 'undefined') return;
    
    const socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`)
    
    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'SUBSCRIBE',
        destination: `/topic/bulletins/${bulletin.id}/upvotes`
      }))
    }
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.body) {
          const count = parseInt(data.body)
          if (!isNaN(count)) {
            setUpvoteCount(count)
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error)
      }
    }
    
    return () => {
      socket.close()
    }
  }, [bulletin.id])
  
  const handleUpvoteClick = async () => {
    if (isUpvoting) return
    
    setIsUpvoting(true)
    try {
      const isNowUpvoted = await api.toggleBulletinUpvote(bulletin.id)
      setHasUpvoted(isNowUpvoted)
      
      // Update count locally (WebSocket will update it officially)
      setUpvoteCount(prev => isNowUpvoted ? prev + 1 : Math.max(0, prev - 1))
      
      // Show toast
      if (isNowUpvoted) {
        toast.success("Bulletin upvoted")
      } else {
        toast.info("Upvote removed")
      }
    } catch (error) {
      console.error("Failed to toggle upvote:", error)
      toast.error("Failed to process upvote")
    } finally {
      setIsUpvoting(false)
    }
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType?.startsWith('image/')) return '🖼️'
    if (fileType?.startsWith('video/')) return '🎥'
    if (fileType?.includes('pdf')) return '📄'
    if (fileType?.includes('word') || fileType?.includes('document')) return '📝'
    return '📎'
  }

  const handleDownload = (media: BulletinMedia) => {
    if (typeof window !== 'undefined') {
      window.open(media.fileUrl, '_blank')
    }
  }

  const handleIncidentClick = (incident: IncidentSummary) => {
    // Open incident details page in new tab using tracking number
    if (typeof window !== 'undefined') {
      window.open(`/incidents/tracking/${incident.trackingNumber}`, '_blank')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-[#8B0000] mb-2">{bulletin.title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(bulletin.createdAt), "PPP 'at' p")}</span>
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
                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <ThumbsUp className={`h-4 w-4 ${hasUpvoted ? 'fill-red-600 text-red-600' : ''}`} />
            <span className="text-xs font-medium">{upvoteCount}</span>
          </Button>
          
          {isAdmin && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Admin Post
            </Badge>
          )}
        </div>
      </div>
      
      {/* Description */}
      <div className="mb-6">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{bulletin.description}</p>
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
              <div key={media.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getFileIcon(media.fileType)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate" title={media.fileName}>
                      {media.fileName}
                    </p>
                    <p className="text-xs text-gray-500">{formatFileSize(media.fileSize)}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(media.uploadedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(media)}
                    className="h-8 w-8 p-0 hover:bg-blue-50"
                  >
                    <Download className="h-4 w-4 text-blue-600" />
                  </Button>
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
    </div>
  )
}
