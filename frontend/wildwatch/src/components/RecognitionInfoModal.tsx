import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trophy, Star, Award, Users, Building2 } from "lucide-react"

interface RecognitionInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RecognitionInfoModal({ isOpen, onClose }: RecognitionInfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-white to-gray-50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#800000] flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Recognition of Excellence
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-gray-700 leading-relaxed">
              As part of our commitment to fostering a proactive and safety-conscious campus community, 
              the WildWatch Incident Report System features a gamification component that awards points 
              to both students and university offices based on their participation and engagement within the platform.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#800000] flex items-center justify-center">
                <Award className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Prestigious Recognition</h3>
                <p className="text-gray-600 text-sm">
                  Top-performing students and offices will be recognized and rewarded by the University President 
                  at the end of each evaluation period.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#800000] flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Student Benefits</h3>
                <p className="text-gray-600 text-sm">
                  Students who achieve top ranks will receive certificates of commendation, exclusive incentives, 
                  and the opportunity to be spotlighted in university publications.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#800000] flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Office Recognition</h3>
                <p className="text-gray-600 text-sm">
                  Outstanding offices will be honored for their swift and effective responses to reported incidents, 
                  showcasing their leadership in ensuring a safe and responsive institution.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#800000] to-[#600000] text-white rounded-lg p-4">
            <p className="text-center font-medium">
              Participation is not only a contribution to campus welfare—it is a chance to be seen, 
              celebrated, and rewarded for making a real difference.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 