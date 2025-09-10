import { Info } from "lucide-react"

export function PulsingInfoIcon() {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-[#8B0000]/20 animate-ping"></div>
      <div className="relative z-10 bg-[#8B0000]/10 hover:bg-[#8B0000]/20 transition-colors p-2 rounded-full">
        <Info className="h-5 w-5 text-[#8B0000]" />
      </div>
    </div>
  )
}
