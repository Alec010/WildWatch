"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Smartphone, Download, Sparkles, Shield } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export function MobileAppDownload() {
  const [isMobile, setIsMobile] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
        document.body.style.overflow = mobile ? "hidden" : "";
        document.documentElement.style.overflow = mobile ? "hidden" : "";
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  // Check if we should show the component based on pathname
  useEffect(() => {
    if (typeof window === "undefined") {
      setShouldShow(false);
      return;
    }

    // Get pathname from both Next.js router and window.location as fallback
    const currentPath = pathname || window.location.pathname;

    // Don't show on mobile pages (they are part of the OAuth flow)
    const isMobilePage = currentPath?.startsWith("/mobile/");

    // Don't show on OAuth redirect pages
    const isOAuthPage =
      currentPath?.startsWith("/oauth2/redirect") ||
      currentPath?.startsWith("/auth/oauth2/redirect");

    // Only show if:
    // 1. Device is mobile
    // 2. NOT on a mobile page
    // 3. NOT on an OAuth redirect page
    setShouldShow(isMobile && !isMobilePage && !isOAuthPage);
  }, [isMobile, pathname]);

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#2b0000] via-[#800000] to-[#D4AF37] flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 md:px-8">
      {/* Animated background orbs */}
      <div className="absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-[#D4AF37]/20 rounded-full blur-3xl animate-pulse -translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-80 sm:h-80 md:w-[28rem] md:h-[28rem] bg-[#800000]/30 rounded-full blur-3xl animate-pulse translate-x-1/3 translate-y-1/3"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.05),_transparent_60%)]" />

      {/* Header Section */}
      <div className="text-center mb-4 sm:mb-5 md:mb-6 relative z-10 animate-fadeIn w-full max-w-xs sm:max-w-sm px-4">
        <div className="relative inline-block mb-3 sm:mb-4">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/40 to-transparent rounded-2xl blur-lg opacity-70"></div>
          <div className="relative bg-white/10 backdrop-blur-lg p-2 sm:p-3 rounded-2xl border border-[#D4AF37]/40 shadow-lg">
            <Image
              src="/logo2.png"
              alt="WildWatch Logo"
              width={160}
              height={55}
              className="w-32 h-auto sm:w-40 md:w-40 max-w-[160px]"
            />
          </div>
        </div>
        <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold flex items-center justify-center gap-2 drop-shadow-md px-2">
          <Shield className="text-[#D4AF37] w-6 h-6 sm:w-7 sm:h-7 animate-bounce" />{" "}
          WildWatch
        </h1>
        <p className="text-gray-200 text-xs sm:text-sm md:text-base mt-2 font-light tracking-wide px-2">
          Empowering awareness through motion
        </p>
      </div>

      {/* Card Section */}
      <div className="relative bg-white/90 rounded-2xl sm:rounded-3xl shadow-2xl border border-[#D4AF37]/40 p-5 sm:p-6 md:p-8 w-full max-w-xs sm:max-w-sm text-center backdrop-blur-md animate-fadeUp mx-auto min-h-fit">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/30 via-transparent to-[#D4AF37]/20 rounded-2xl sm:rounded-3xl blur-xl"></div>
        <div className="relative z-10">
          <h2 className="text-[#800000] text-base sm:text-lg md:text-xl font-bold mb-5 sm:mb-6 md:mb-7 flex items-center justify-center gap-2">
            <Smartphone className="text-[#800000] w-4 h-4 sm:w-5 sm:h-5" />{" "}
            Download the App
          </h2>

          {/* Buttons */}
          <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
            {/* Google Play */}
            <button
              onClick={() =>
                toast.info("Coming soon", {
                  description: "The mobile app will be available soon!",
                })
              }
              className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-[#1C1C1E] to-[#3A3A3C] text-white px-3 sm:px-4 py-3.5 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-[#D4AF37]/30 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer w-full"
            >
              <Image
                src="/Google_Logo.png"
                alt="Google Play Logo"
                width={30}
                height={30}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0"
              />
              <div className="text-left flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs leading-none">Get it on</p>
                <p className="font-bold text-sm sm:text-base md:text-lg">
                  Google Play
                </p>
              </div>
              <Download className="ml-auto w-4 h-4 sm:w-5 sm:h-5 opacity-80 flex-shrink-0" />
            </button>

            {/* App Store */}
            <button
              onClick={() =>
                toast.info("Coming soon", {
                  description: "The mobile app will be available soon!",
                })
              }
              className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-[#1C1C1E] to-[#3A3A3C] text-white px-3 sm:px-4 py-3.5 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-[#D4AF37]/30 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer w-full"
            >
              <Image
                src="/IOS_Logo.png"
                alt="App Store Logo"
                width={30}
                height={30}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0"
              />
              <div className="text-left flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs leading-none">
                  Download on the
                </p>
                <p className="font-bold text-sm sm:text-base md:text-lg">
                  App Store
                </p>
              </div>
              <Download className="ml-auto w-4 h-4 sm:w-5 sm:h-5 opacity-80 flex-shrink-0" />
            </button>
          </div>

          {/* Info Section */}
          <div className="mt-6 sm:mt-7 md:mt-8 border-t border-gray-300/60 pt-4 sm:pt-5 md:pt-6">
            <div className="flex justify-center items-center gap-2 text-gray-700 text-xs sm:text-sm">
              <Sparkles className="text-[#D4AF37] w-3 h-3 sm:w-4 sm:h-4 animate-pulse flex-shrink-0" />
              <span>Enhanced mobile experience</span>
            </div>
            <p className="text-gray-500 text-[10px] sm:text-xs mt-2 px-2">
              Get full functionality, notifications, and real-time updates with
              our app
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-white/85 text-[10px] sm:text-xs mt-5 sm:mt-6 md:mt-7 text-center max-w-xs sm:max-w-sm font-light tracking-wide animate-fadeIn px-4">
        This website is best viewed on desktop. For an immersive experience, use
        our mobile app.
      </p>
    </div>
  );
}
