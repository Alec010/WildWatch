"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"
import NotificationDropdown from "@/components/ui/notificationdropdown"
import { useSidebar } from "@/contexts/SidebarContext"
import { motion, AnimatePresence } from "framer-motion"
import { useUser } from "@/contexts/UserContext"

interface NavbarProps {
  title: string
  subtitle?: string
  showSearch?: boolean
  showNewIncident?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
}

export function Navbar({
  title,
  subtitle,
  showSearch = true,
  showNewIncident = true,
  searchPlaceholder = "Search incidents...",
  onSearch,
}: NavbarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [scrolled, setScrolled] = useState(false)
  const [showSearchMobile, setShowSearchMobile] = useState(false)
  const { collapsed } = useSidebar()
  const { userRole } = useUser()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearch?.(value)
  }

  // Determine sidebar position based on user role
  const getSidebarPosition = () => {
    if (userRole === 'OFFICE_ADMIN') {
      return collapsed ? 'left-20' : 'left-72'
    }
    return collapsed ? 'left-18' : 'left-64'
  }

  return (
    <div className={`fixed top-0 transition-all duration-300 ${getSidebarPosition()} right-0 z-30`}>
      {/* Gradient border at the top */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#800000] via-[#D4AF37] to-[#800000]"></div>

      {/* Main navbar container */}
      <div className={`w-full bg-white transition-all duration-300 ${scrolled ? "shadow-md" : "shadow-sm"}`}>
        <div className="px-6 py-4 relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl"></div>
          <div className="absolute bottom-0 left-1/4 w-24 h-24 bg-[#800000]/5 rounded-full translate-y-1/2 blur-xl"></div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Title section with decorative element */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start">
                <div
                  className="h-full w-1.5 bg-gradient-to-b from-[#800000] to-[#D4AF37] rounded-full mr-3 self-stretch flex-shrink-0"
                  style={{ minHeight: subtitle ? "42px" : "28px" }}
                ></div>
                <div>
                  <h1 className="text-2xl font-bold text-[#800000] truncate">{title}</h1>
                  {subtitle && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-gray-600 truncate"
                    >
                      {subtitle}
                    </motion.p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions section */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Mobile search toggle */}
              {showSearch && (
                <div className="sm:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-[#800000] border border-gray-200 rounded-full"
                    onClick={() => setShowSearchMobile(!showSearchMobile)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Desktop search */}
              {showSearch && (
                <AnimatePresence>
                  {(!showSearchMobile && window.innerWidth >= 640) || showSearchMobile ? (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="relative flex-1 sm:flex-none sm:w-72 order-last sm:order-none w-full"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center">
                        <Search className="h-4 w-4 text-[#800000]/70" />
                      </div>
                      <input
                        type="text"
                        placeholder={searchPlaceholder}
                        className="w-full pl-10 pr-4 py-2 border border-[#D4AF37]/30 rounded-full focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-[#D4AF37] bg-white/80 backdrop-blur-sm transition-all"
                        value={searchQuery}
                        onChange={handleSearch}
                      />
                      {searchQuery && (
                        <button
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#800000] transition-colors"
                          onClick={() => {
                            setSearchQuery("")
                            onSearch?.("")
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              )}

              {/* Report New Incident button */}
              {showNewIncident && (
                <Button
                  variant="default"
                  className="bg-gradient-to-r from-[#800000] to-[#9a0000] hover:from-[#700000] hover:to-[#800000] text-white whitespace-nowrap rounded-full px-4 py-2 h-9"
                  onClick={() => router.push("/incidents/submit")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Report New Incident</span>
                  <span className="sm:hidden">Report</span>
                </Button>
              )}

              {/* Notification dropdown */}
              <div>
                <NotificationDropdown />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom border with gradient on scroll */}
      <div
        className={`w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent transition-opacity duration-300 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
      ></div>
    </div>
  )
}
