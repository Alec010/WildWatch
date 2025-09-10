import { Shield } from "lucide-react"

interface CustomLoaderProps {
  title?: string
  subtitle?: string
  className?: string
  contentOnly?: boolean
}

export function CustomLoader({ 
  title = "Loading...", 
  subtitle = "Please wait while we fetch your data",
  className = "",
  contentOnly = false
}: CustomLoaderProps) {
  return (
    <div 
      className={`flex items-center justify-center ${
        contentOnly 
          ? "absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" 
          : "min-h-[50vh] w-full"
      } ${className}`}
    >
      <div className="text-center px-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-200 border-t-[#8B0000] mx-auto"></div>
          <div
            className="absolute inset-0 rounded-full h-20 w-20 border-4 border-transparent border-t-[#D4AF37] animate-spin mx-auto"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="h-8 w-8 text-[#800000] animate-pulse" />
          </div>
        </div>
        <p className="mt-8 text-slate-600 font-medium text-lg">{title}</p>
        <p className="mt-2 text-slate-500 text-sm">{subtitle}</p>
      </div>
    </div>
  )
} 