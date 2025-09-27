"use client"

import React, { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, Image, Video, File } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  accept?: string
  maxFiles?: number
  maxSize?: number // in MB
  className?: string
}

export function FileUpload({ 
  files, 
  onFilesChange, 
  accept = "*/*", 
  maxFiles = 5, 
  maxSize = 10,
  className 
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File ${file.name} is too large. Maximum size is ${maxSize}MB.`
    }
    return null
  }

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    setError(null)
    const fileArray = Array.from(newFiles)
    
    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed.`)
      return
    }

    // Validate each file
    for (const file of fileArray) {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    onFilesChange([...files, ...fileArray])
  }, [files, maxFiles, maxSize, onFilesChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />
    if (file.type.includes('pdf')) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn("space-y-4 w-full", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors w-full",
          dragActive 
            ? "border-[#8B0000] bg-[#8B0000]/5" 
            : "border-gray-300 hover:border-gray-400",
          error && "border-red-300 bg-red-50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-1 sm:space-y-2">
          <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-gray-400" />
          <div className="text-xs sm:text-sm text-gray-600">
            <span className="font-medium text-[#8B0000]">Click to upload</span> or drag and drop
          </div>
          <div className="text-xs text-gray-500">
            Max {maxFiles} files, {maxSize}MB each
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2 w-full max-w-full">
          <h4 className="text-sm font-medium text-gray-700">Selected Files ({files.length}/{maxFiles})</h4>
          <div className="space-y-2 w-full max-w-full overflow-hidden" style={{maxWidth: '100%'}}>
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg w-full min-w-0 max-w-full">
                <div className="flex-shrink-0">
                  {getFileIcon(file)}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate" title={file.name} style={{maxWidth: 'calc(100% - 2rem)'}}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-red-50 hover:text-red-600 flex-shrink-0 ml-1"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
