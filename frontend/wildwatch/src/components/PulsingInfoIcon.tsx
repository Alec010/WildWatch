import { Info } from "lucide-react"

export function PulsingInfoIcon() {
  return (
    <div className="relative flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-sm hover:shadow-md transition duration-200">
      <Info 
        className="w-5 h-5 animate-pulse-info"
      />
    </div>
  )
}

// Add the following to your global CSS (e.g., globals.css or tailwind.css):
//
// @keyframes pulse-info {
//   0%, 100% {
//     color: #800000;
//     transform: scale(1);
//   }
//   50% {
//     color: #FFD700;
//     transform: scale(1.18);
//   }
// }
// .animate-pulse-info {
//   animation: pulse-info 1.2s infinite;
// } 