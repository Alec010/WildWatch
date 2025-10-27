"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Shield, Clock, Camera, Users, ChevronRight, ArrowRight } from "lucide-react"
import Image from "next/image"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { FileText, Headphones, AlertTriangle, Smartphone, BarChart3 } from "lucide-react"
import { useEffect, useState, useCallback } from "react"

export default function Home() {
  // Add auto-scroll functionality for the carousel
  const [api, setApi] = useState<any>()

  const scrollNext = useCallback(() => {
    if (api) {
      api.scrollNext()
    }
  }, [api])

  useEffect(() => {
    if (!api) return

    // Set up interval for auto-scrolling
    const interval = setInterval(scrollNext, 1500) // 1.5 seconds

    // Clean up interval on component unmount
    return () => clearInterval(interval)
  }, [api, scrollNext])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50 responsive-container">
      {/* Navigation */}
      <nav className="bg-white py-3 px-6 md:px-12 flex justify-between items-center shadow-sm sticky top-0 z-50 border-b border-[#FFD700]/20">
        <div className="flex items-center">
          <img
            src="/wildwatchlogo2.png?height=40&width=40"
            alt="WILD Logo"
            className="h-14 transition-transform duration-300 hover:scale-105"
          />
        </div>
        <div className="space-x-3">
          <Button
            variant="outline"
            className="border-[#800000] text-[#800000] hover:bg-[#800000]/5 transition-all duration-300"
            asChild
          >
            <Link href="/login">Sign In</Link>
          </Button>
          <Button
            className="bg-[#800000] text-white hover:bg-[#800000]/90 transition-all duration-300 shadow-md hover:shadow-lg"
            asChild
          >
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#800000] to-[#8B0000] text-white py-16 md:py-24 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#800000] via-[#FFD700] to-[#800000] animate-gradient-x"></div>
        <div className="absolute -z-10 top-20 right-0 w-96 h-96 bg-[#FFD700]/5 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -z-10 bottom-20 left-0 w-96 h-96 bg-[#FFD700]/5 rounded-full opacity-20 blur-3xl"></div>

        {/* Decorative patterns */}
        <div className="absolute top-10 right-10 w-20 h-20 opacity-10">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" stroke="#FFD700" strokeWidth="2" />
            <circle cx="50" cy="50" r="30" stroke="#FFD700" strokeWidth="2" />
            <circle cx="50" cy="50" r="20" stroke="#FFD700" strokeWidth="2" />
          </svg>
        </div>
        <div className="absolute bottom-10 left-10 w-20 h-20 opacity-10">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="80" height="80" stroke="#FFD700" strokeWidth="2" />
            <rect x="25" y="25" width="50" height="50" stroke="#FFD700" strokeWidth="2" />
            <rect x="40" y="40" width="20" height="20" stroke="#FFD700" strokeWidth="2" />
          </svg>
        </div>

        <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 text-left mb-8 md:mb-0">
            <div className="relative inline-block mb-2">
              <span className="text-[#FFD700] font-bold tracking-wider text-sm uppercase">
                Campus Safety Initiative
              </span>
              <div className="absolute -bottom-1 left-0 w-16 h-0.5 bg-[#FFD700]/60"></div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-[#FFD700]/90">
                WildWatch
              </span>{" "}
              <span className="relative">
                Monitoring System
                <span className="absolute -z-10 left-0 bottom-1 w-full h-3 bg-[#FFD700]/10"></span>
              </span>
            </h1>
            <p className="text-white/80 mb-8 max-w-lg text-base md:text-lg leading-relaxed">
              Streamlining incident reporting for CIT University. Ensuring all campus concerns are properly documented
              and addressed by the right authorities.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                className="bg-white text-[#800000] hover:bg-gray-100 transition-all duration-300 shadow-lg group"
                size="lg"
                asChild
              >
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-white/30 text-black/50 hover:text-white hover:bg-white/10 transition-all duration-300"
                size="lg"
                asChild
              >
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 bg-[#FFD700]/10 backdrop-blur-sm rounded-lg shadow-2xl transform rotate-3 z-0"></div>
              <div className="absolute inset-0 bg-[#800000]/10 backdrop-blur-sm rounded-lg shadow-xl transform -rotate-3 z-0"></div>
              <div className="relative z-10">
                <Carousel className="w-full max-w-md" setApi={setApi} opts={{ loop: true }}>
                  <CarouselContent>
                    {/* Campus Safety Card */}
                    <CarouselItem>
                      <Card className="bg-white/90 border-none shadow-lg overflow-hidden h-64 md:h-80 backdrop-blur-sm">
                        <CardContent className="p-0 h-full">
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center p-6 flex flex-col items-center justify-center">
                              <div className="mb-4 bg-[#800000]/10 p-4 rounded-full">
                                <Shield className="h-16 w-16 text-[#800000]" />
                              </div>
                              <h3 className="text-[#800000] font-bold text-xl">Campus Safety</h3>
                              <p className="text-gray-600 mt-2">Protecting our community together</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>

                    {/* Incident Reporting Card */}
                    <CarouselItem>
                      <Card className="bg-white/90 border-none shadow-lg overflow-hidden h-64 md:h-80 backdrop-blur-sm">
                        <CardContent className="p-0 h-full">
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center p-6 flex flex-col items-center justify-center">
                              <div className="mb-4 bg-[#800000]/10 p-4 rounded-full">
                                <FileText className="h-16 w-16 text-[#800000]" />
                              </div>
                              <h3 className="text-[#800000] font-bold text-xl">Incident Reporting</h3>
                              <p className="text-gray-600 mt-2">Document and track all campus concerns</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>

                    {/* 24/7 Support Card */}
                    <CarouselItem>
                      <Card className="bg-white/90 border-none shadow-lg overflow-hidden h-64 md:h-80 backdrop-blur-sm">
                        <CardContent className="p-0 h-full">
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center p-6 flex flex-col items-center justify-center">
                              <div className="mb-4 bg-[#800000]/10 p-4 rounded-full">
                                <Headphones className="h-16 w-16 text-[#800000]" />
                              </div>
                              <h3 className="text-[#800000] font-bold text-xl">24/7 Support</h3>
                              <p className="text-gray-600 mt-2">Always available when you need help</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>

                    {/* Hazard Alerts Card */}
                    <CarouselItem>
                      <Card className="bg-white/90 border-none shadow-lg overflow-hidden h-64 md:h-80 backdrop-blur-sm">
                        <CardContent className="p-0 h-full">
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center p-6 flex flex-col items-center justify-center">
                              <div className="mb-4 bg-[#800000]/10 p-4 rounded-full">
                                <AlertTriangle className="h-16 w-16 text-[#800000]" />
                              </div>
                              <h3 className="text-[#800000] font-bold text-xl">Hazard Alerts</h3>
                              <p className="text-gray-600 mt-2">Stay informed about potential dangers</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>

                    {/* Mobile Access Card */}
                    <CarouselItem>
                      <Card className="bg-white/90 border-none shadow-lg overflow-hidden h-64 md:h-80 backdrop-blur-sm">
                        <CardContent className="p-0 h-full">
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center p-6 flex flex-col items-center justify-center">
                              <div className="mb-4 bg-[#800000]/10 p-4 rounded-full">
                                <Smartphone className="h-16 w-16 text-[#800000]" />
                              </div>
                              <h3 className="text-[#800000] font-bold text-xl">Mobile Access</h3>
                              <p className="text-gray-600 mt-2">Report incidents from anywhere on campus</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>

                    {/* Data Analytics Card */}
                    <CarouselItem>
                      <Card className="bg-white/90 border-none shadow-lg overflow-hidden h-64 md:h-80 backdrop-blur-sm">
                        <CardContent className="p-0 h-full">
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center p-6 flex flex-col items-center justify-center">
                              <div className="mb-4 bg-[#800000]/10 p-4 rounded-full">
                                <BarChart3 className="h-16 w-16 text-[#800000]" />
                              </div>
                              <h3 className="text-[#800000] font-bold text-xl">Data Analytics</h3>
                              <p className="text-gray-600 mt-2">Insights to improve campus safety</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  </CarouselContent>
                  <div className="absolute -bottom-10 left-0 right-0 flex justify-center gap-2">
                    <CarouselPrevious className="relative static translate-y-0 h-8 w-8 rounded-full bg-white/80 text-[#800000] hover:bg-white hover:text-[#800000] border-[#FFD700]/30" />
                    <CarouselNext className="relative static translate-y-0 h-8 w-8 rounded-full bg-white/80 text-[#800000] hover:bg-white hover:text-[#800000] border-[#FFD700]/30" />
                  </div>
                </Carousel>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 md:px-12 py-16">
        <div id="features" className="text-center mb-16">
          <div className="inline-block relative">
            <span className="text-[#800000] font-bold tracking-wider text-sm uppercase">Platform Features</span>
            <div className="absolute -bottom-1 left-1/4 right-1/4 h-0.5 bg-[#800000]/30"></div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4 mt-2">How WildWatch Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mt-4">
            Our platform provides a comprehensive solution for incident reporting and management, ensuring all concerns
            are properly addressed and resolved.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="bg-white border border-[#FFD700]/20 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
            <CardContent className="p-8">
              <div className="flex flex-col items-start text-left">
                <div className="h-14 w-14 rounded-full bg-[#800000]/10 flex items-center justify-center mb-6 shadow-md group-hover:bg-[#800000]/20 transition-colors duration-300">
                  <Shield className="h-7 w-7 text-[#800000]" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Secure Reporting</h3>
                <p className="text-gray-600">
                  End-to-end encryption ensures all wildwatch reports remain confidential and secure, protecting
                  sensitive information.
                </p>
                <div className="mt-6 w-16 h-1 bg-gradient-to-r from-[#800000] via-[#FFD700] to-[#800000] group-hover:w-full transition-all duration-500"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#FFD700]/20 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
            <CardContent className="p-8">
              <div className="flex flex-col items-start text-left">
                <div className="h-14 w-14 rounded-full bg-[#800000]/10 flex items-center justify-center mb-6 shadow-md group-hover:bg-[#800000]/20 transition-colors duration-300">
                  <Clock className="h-7 w-7 text-[#800000]" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Fast Response</h3>
                <p className="text-gray-600">
                  Quick submission process and automated notifications ensure rapid response to wildwatch incidents when
                  time matters most.
                </p>
                <div className="mt-6 w-16 h-1 bg-gradient-to-r from-[#800000] via-[#FFD700] to-[#800000] group-hover:w-full transition-all duration-500"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#FFD700]/20 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
            <CardContent className="p-8">
              <div className="flex flex-col items-start text-left">
                <div className="h-14 w-14 rounded-full bg-[#800000]/10 flex items-center justify-center mb-6 shadow-md group-hover:bg-[#800000]/20 transition-colors duration-300">
                  <Camera className="h-7 w-7 text-[#800000]" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Photo Documentation</h3>
                <p className="text-gray-600">
                  Capture and organize high-quality images of wildwatch sightings with location and time data for
                  complete records.
                </p>
                <div className="mt-6 w-16 h-1 bg-gradient-to-r from-[#800000] via-[#FFD700] to-[#800000] group-hover:w-full transition-all duration-500"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#FFD700]/20 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
            <CardContent className="p-8">
              <div className="flex flex-col items-start text-left">
                <div className="h-14 w-14 rounded-full bg-[#800000]/10 flex items-center justify-center mb-6 shadow-md group-hover:bg-[#800000]/20 transition-colors duration-300">
                  <Users className="h-7 w-7 text-[#800000]" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Team Collaboration</h3>
                <p className="text-gray-600">
                  Collaborative tools enable team-based wildwatch monitoring and conservation efforts across departments
                  and roles.
                </p>
                <div className="mt-6 w-16 h-1 bg-gradient-to-r from-[#800000] via-[#FFD700] to-[#800000] group-hover:w-full transition-all duration-500"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trust Badge */}
        <div className="mt-20 flex justify-center items-center">
          <div className="bg-white py-6 px-8 rounded-full shadow-md flex items-center border border-[#FFD700]/20 gold-shimmer">
            <div className="h-10 w-10 rounded-full bg-[#800000]/10 flex items-center justify-center mr-4">
              <svg className="h-6 w-6 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">Trusted by</p>
              <p className="text-gray-600">Cebu Institute of Technology - University</p>
            </div>
          </div>
        </div>

        {/* Developer Profiles Section */}
        <div className="mt-24 mb-16">
          <div className="text-center mb-12">
            <div className="inline-block relative">
              <span className="text-[#800000] font-bold tracking-wider text-sm uppercase">The Team</span>
              <div className="absolute -bottom-1 left-1/4 right-1/4 h-0.5 bg-[#800000]/30"></div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4 mt-2">Meet Our Development Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mt-4">
              The talented individuals behind WildWatch who are passionate about campus safety and technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mx-auto">
            {/* Developer 1 */}
            <Card className="bg-white border border-[#FFD700]/20 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-0">
                <div className="flex flex-col items-center">
                  <div className="w-full h-80 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#800000]/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                    <Image
                      src="/AlecA.jpg"
                      alt="Alec Arela"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-800">Alec Arela</h3>
                    <p className="text-[#800000] font-medium mb-3">Lead/Backend Developer</p>
                    <div className="flex justify-center items-center mt-4">
                      <a
                        href="mailto:alec.arela@cit.edu?subject=&body=&view=outlook"
                        className="text-gray-600 hover:text-[#800000] transition-colors duration-300 flex items-center"
                      >
                        alec.arela@cit.edu
                        <ChevronRight className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Developer 2 */}
            <Card className="bg-white border border-[#FFD700]/20 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-0">
                <div className="flex flex-col items-center">
                  <div className="w-full h-80 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#800000]/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                    <Image
                      src="/Katrina.jpg"
                      alt="Katrina Amores"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-800">Katrina Amores</h3>
                    <p className="text-[#800000] font-medium mb-3">UI/UX Web Developer</p>
                    <div className="flex justify-center items-center mt-4">
                      <a
                        href="mailto:katrina.amores@cit.edu?subject=&body=&view=outlook"
                        className="text-gray-600 hover:text-[#800000] transition-colors duration-300 flex items-center"
                      >
                        katrina.amores@cit.edu
                        <ChevronRight className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Developer 3 */}
            <Card className="bg-white border border-[#FFD700]/20 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-0">
                <div className="flex flex-col items-center">
                  <div className="w-full h-80 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#800000]/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                    <Image
                      src="/Min.jpg"
                      alt="Jermaine Gadiano"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-800">Jermaine Gadiano</h3>
                    <p className="text-[#800000] font-medium mb-3">UI/UX Mobile Developer</p>
                    <div className="flex justify-center items-center mt-4">
                      <a
                        href="mailto:jermaine.gadiano@cit.edu?subject=&body=&view=outlook"
                        className="text-gray-600 hover:text-[#800000] transition-colors duration-300 flex items-center"
                      >
                        jermaine.gadiano@cit.edu
                        <ChevronRight className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mx-auto max-w-3xl mt-10">
            {/* Developer 4 */}
            <Card className="bg-white border border-[#FFD700]/20 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-0">
                <div className="flex flex-col items-center">
                  <div className="w-full h-80 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#800000]/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                    <Image
                      src="/Jhean.jpg"
                      alt="Jhean Hecari Caag"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-800">Jhean Hecari Caag</h3>
                    <p className="text-[#800000] font-medium mb-3">UI/UX Web Developer</p>
                    <div className="flex justify-center items-center mt-4">
                      <a
                        href="mailto:jheanhecari.caag@cit.edu?subject=&body=&view=outlook"
                        className="text-gray-600 hover:text-[#800000] transition-colors duration-300 flex items-center"
                      >
                        jheanhecari.caag@cit.edu
                        <ChevronRight className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Developer 5 */}
            <Card className="bg-white border border-[#FFD700]/20 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-0">
                <div className="flex flex-col items-center">
                  <div className="w-full h-80 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#800000]/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                    <Image
                      src="/Joshua.jpg"
                      alt="Joshua Daniel Pusing"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-800">Joshua Daniel Pusing</h3>
                    <p className="text-[#800000] font-medium mb-3">UI/UX Mobile Developer</p>
                    <div className="flex justify-center items-center mt-4">
                      <a
                        href="mailto:joshua.pusing@cit.edu?subject=&body=&view=outlook"
                        className="text-gray-600 hover:text-[#800000] transition-colors duration-300 flex items-center"
                      >
                        joshua.pusing@cit.edu
                        <ChevronRight className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-8 border-t border-[#FFD700]/20">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img src="/wildwatchlogo2.png?height=30&width=30" alt="WILD Logo" className="h-8" />
              <span className="ml-2 text-[#800000] font-medium">WILDWATCH</span>
            </div>
            <div className="text-sm text-gray-500">© 2025 WILDWATCH. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}