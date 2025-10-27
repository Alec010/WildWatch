"use client"

import { ClientOnlyDialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ClientOnlyDialog"
import { Trophy, Star, Award, Users, Building2, Sparkles } from "lucide-react"

interface RecognitionInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RecognitionInfoModal({ isOpen, onClose }: RecognitionInfoModalProps) {
  return (
    <ClientOnlyDialog open={isOpen} onOpenChange={onClose} className="max-w-7xl h-[750px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2 text-[#8B0000]">
            <Trophy className="h-6 w-6" />
            Recognition System
          </DialogTitle>
          <DialogDescription>Learn how our recognition and points system works</DialogDescription>
        </DialogHeader>

        <div className="-mt-12 space-y-6">
          <div className="bg-gradient-to-r from-[#f8f5f5] to-[#fff9f9] p-4 rounded-lg border border-gray-100">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Star className="h-5 w-5 text-[#DAA520]" />
              Points System
            </h3>
            <p className="text-gray-700 mb-3">
              Points are awarded based on the quality and quantity of your contributions to the WildWatch platform.
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-[#8B0000] text-white flex items-center justify-center text-xs mt-0.5">
                  1
                </div>
                <div>
                  <span className="font-medium">Report Submission:</span> 5 points per report
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-[#8B0000] text-white flex items-center justify-center text-xs mt-0.5">
                  2
                </div>
                <div>
                  <span className="font-medium">Two-Way Rating System:</span> Up to 20 points based on 4-dimensional ratings
                  <div className="text-xs text-gray-600 mt-1 ml-6">
                    • Honesty, Credibility, Responsiveness, Helpfulness (1-5 stars each)
                    • Points awarded when both parties complete ratings
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-[#8B0000] text-white flex items-center justify-center text-xs mt-0.5">
                  3
                </div>
                <div>
                  <span className="font-medium">Evidence Provided:</span> 3 points per piece of evidence
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-[#8B0000] text-white flex items-center justify-center text-xs mt-0.5">
                  4
                </div>
                <div>
                  <span className="font-medium">Witness Information:</span> 2 points per witness
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-[#8B0000] text-white flex items-center justify-center text-xs mt-0.5">
                  5
                </div>
                <div>
                  <span className="font-medium">Community Upvotes:</span> 1 point per upvote received
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-[#f8f5f5] to-[#fff9f9] p-4 rounded-lg border border-gray-100">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#8B0000]" />
                Student Recognition
              </h3>
              <p className="text-gray-700">
                Students are recognized for submitting high-quality reports, providing detailed information, and helping
                maintain campus safety.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-[#DAA520]" />
                <span className="font-medium">Top students receive special recognition and rewards!</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#f8f5f5] to-[#fff9f9] p-4 rounded-lg border border-gray-100">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#8B0000]" />
                Office Recognition
              </h3>
              <p className="text-gray-700">
                Offices are recognized for their efficiency in handling reports, response time, and overall satisfaction
                ratings from students.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-[#DAA520]" />
                <span className="font-medium">Top offices receive departmental recognition!</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#8B0000]/5 to-[#DAA520]/5 p-4 rounded-lg -mb-12">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#DAA520]" />
              Benefits of Recognition
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-[#DAA520] text-white flex items-center justify-center text-xs mt-0.5">
                  ✓
                </div>
                <span>Showcase your commitment to campus safety</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-[#DAA520] text-white flex items-center justify-center text-xs mt-0.5">
                  ✓
                </div>
                <span>Potential for special rewards and recognition events</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-[#DAA520] text-white flex items-center justify-center text-xs mt-0.5">
                  ✓
                </div>
                <span>Build a positive reputation within the community</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-[#DAA520] text-white flex items-center justify-center text-xs mt-0.5">
                  ✓
                </div>
                <span>Contribute to a safer and more secure environment for everyone</span>
              </li>
            </ul>
          </div>
        </div>
      </ClientOnlyDialog>
  )
}
