import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Frown } from "lucide-react";

interface UpvoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  incidentType: string;
  isUpvoted: boolean;
}

export function UpvoteModal({ isOpen, onClose, onConfirm, incidentType, isUpvoted }: UpvoteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold text-[#800000]">
            {isUpvoted ? "Undo Upvote" : "Confirm Upvote"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="bg-[#fff9f9] p-4 rounded-full">
            {isUpvoted ? (
              <Frown className="h-8 w-8 text-[#800000]" />
            ) : (
              <ThumbsUp className="h-8 w-8 text-[#800000]" />
            )}
          </div>
          <p className="text-center text-gray-600">
            {isUpvoted
              ? `Are you sure you want to remove your upvote from this ${incidentType.toLowerCase()} incident?`
              : `Are you sure you want to upvote this ${incidentType.toLowerCase()} incident? This will help bring attention to important issues.`}
          </p>
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#800000] hover:bg-[#600000]"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {isUpvoted ? "Undo Upvote" : "Confirm Upvote"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 