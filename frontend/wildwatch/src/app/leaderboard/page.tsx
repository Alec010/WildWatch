"use client";

import { useState, useEffect } from "react";
import {
  Trophy,
  Star,
  Users,
  Building2,
  Loader2,
  Info,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { API_BASE_URL } from "@/utils/api";
import { motion } from "framer-motion";
import { RecognitionInfoModal } from "@/components/RecognitionInfoModal";
import { useUser } from "@/contexts/UserContext";
import { Sidebar } from "@/components/Sidebar";
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar";
import { Navbar } from "@/components/Navbar";
import { OfficeAdminNavbar } from "@/components/OfficeAdminNavbar";
import dynamic from "next/dynamic";
import { RankBadge } from "@/components/RankBadge";
import type { UserRank } from "@/types/rank";
import Image from "next/image";
import { PageLoader } from "@/components/PageLoader";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

interface LeaderboardEntry {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  userRole?: "REGULAR_USER" | "OFFICE_ADMIN";
  totalRatings?: number;
  totalIncidents?: number;
  averageRating: number;
  points: number;
  rank?: UserRank;
  goldRanking?: number;
}

const palette = {
  brand: "#8B0000",
  brandDark: "#650000",
  gold: "#D4AF37",
  canvas: "#F8F9FA",
  card: "#FFFFFF",
  ink: "#1F2937",
  inkMuted: "#4B5563",
  line: "#E5E7EB",
  success: "#16A34A",
  infoSoft: "#FDF2F2",
  chip: "#F3F4F6",
};

function Chip({ label }: { label: string }) {
  return (
    <div className="bg-[#F3F4F6] px-2.5 py-1 rounded-full">
      <span className="text-xs text-[#4B5563]">{label}</span>
    </div>
  );
}

function StarRating({
  rating,
  size = 12,
  showValue = false,
}: {
  rating: number;
  size?: number;
  showValue?: boolean;
}) {
  const clampedRating = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(clampedRating);
  const hasHalfStar = clampedRating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        if (star <= fullStars) {
          return (
            <Star
              key={star}
              className="fill-yellow-400 text-yellow-400"
              size={size}
            />
          );
        } else if (star === fullStars + 1 && hasHalfStar) {
          return (
            <Star
              key={star}
              className="fill-yellow-400/50 text-yellow-400"
              size={size}
            />
          );
        } else {
          return <Star key={star} className="text-gray-300" size={size} />;
        }
      })}
      {showValue && (
        <span className="ml-1 text-xs font-medium text-[#6B7280]">
          {clampedRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

function SegmentedTabs({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex bg-white mx-4 mt-3 rounded-2xl border border-[#E5E7EB] overflow-hidden relative">
      {/* Sliding indicator */}
      <div
        className="absolute top-0 bottom-0 w-1/2 bg-[rgba(212,175,55,0.18)] transition-all duration-300"
        style={{ left: selected === 0 ? "0%" : "50%" }}
      />
      {[
        { label: "Students", icon: GraduationCap },
        { label: "Offices", icon: Building2 },
      ].map((tab, i) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.label}
            onClick={() => onSelect(i)}
            className="flex-1 py-3 flex items-center justify-center gap-2 relative z-10 transition-colors"
          >
            <Icon
              size={16}
              className={selected === i ? "text-[#8B0000]" : "text-[#6B7280]"}
            />
            <span
              className={`font-semibold ${
                selected === i ? "text-[#8B0000]" : "text-[#6B7280]"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AccentStripe() {
  return (
    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#D4AF37] rounded-l-xl" />
  );
}

function LeaderboardItem({
  entry,
  rank,
  isTopThree,
  isOffice = false,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isTopThree: boolean;
  isOffice?: boolean;
}) {
  const color =
    rank === 1
      ? "#FFD700"
      : rank === 2
      ? "#C0C0C0"
      : rank === 3
      ? "#CD7F32"
      : "#4A5568";

  const borderColor = isTopThree ? color : "transparent";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: (rank - 4) * 0.05 }}
      className={`bg-white rounded-2xl mb-2.5 p-4 shadow-md relative overflow-hidden ${
        isTopThree ? "border-2" : ""
      }`}
      style={{
        borderColor: isTopThree ? borderColor : "transparent",
        boxShadow: isTopThree
          ? "0 6px 12px rgba(0,0,0,0.18)"
          : "0 3px 6px rgba(0,0,0,0.12)",
      }}
    >
      <AccentStripe />
      <div className="flex items-center gap-3.5">
        {/* Rank Number */}
        <div className="w-11 h-11 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
          <span className="font-extrabold text-lg" style={{ color }}>
            {rank}
          </span>
        </div>

        {/* Name and Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-bold text-base text-[#1F2937] line-clamp-2">
              {entry.name}
            </h3>
            {entry.rank && entry.rank !== "NONE" ? (
              <RankBadge
                rank={entry.rank}
                goldRanking={entry.goldRanking}
                size="xs"
                showLabel={false}
              />
            ) : null}
          </div>

          {/* Stats Row with Stars */}
          <div className="flex items-center gap-2 flex-wrap">
            {entry.averageRating && entry.averageRating > 0 ? (
              <>
                <StarRating
                  rating={entry.averageRating}
                  size={12}
                  showValue={true}
                />
                <span className="text-[#9CA3AF] text-xs">•</span>
              </>
            ) : null}

            {entry.totalIncidents && entry.totalIncidents > 0 ? (
              <>
                <span className="text-xs text-[#4B5563]">
                  {entry.totalIncidents} reports
                </span>
                <span className="text-[#9CA3AF] text-xs">•</span>
              </>
            ) : null}

            <Chip label={`${entry.points || 0} pts`} />
          </div>
        </div>

        {/* Points Badge */}
        <div className="bg-[#8B0000] px-3 py-2 rounded-2xl flex-shrink-0">
          <span className="text-white font-extrabold text-xs">
            {entry.points || 0}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function LeaderboardPodium({
  entries,
  type,
}: {
  entries: LeaderboardEntry[];
  type: "students" | "offices";
}) {
  // Ensure we have 3 entries (fill with empty if needed)
  const podiumEntries = [
    entries[0] || { name: "", points: 0, averageRating: 0 },
    entries[1] || { name: "", points: 0, averageRating: 0 },
    entries[2] || { name: "", points: 0, averageRating: 0 },
  ];

  const getPodiumData = (index: number) => {
    const isEmpty = !podiumEntries[index]?.name;

    if (type === "offices") {
      switch (index) {
        case 0: // 1st Place
          return {
            height: 100,
            width: 140,
            gradient: "from-[#FFD700] to-[#FFA500]",
            trophyImage: "/trophies/gold_office.png",
            rankColor: "#FFD700",
          };
        case 1: // 2nd Place
          return {
            height: 80,
            width: 125,
            gradient: "from-[#C0C0C0] to-[#A0A0A0]",
            trophyImage: "/trophies/silver_office.png",
            rankColor: "#C0C0C0",
          };
        case 2: // 3rd Place
          return {
            height: 80,
            width: 125,
            gradient: "from-[#CD7F32] to-[#A0522D]",
            trophyImage: "/trophies/bronze_office.png",
            rankColor: "#CD7F32",
          };
        default:
          return {
            height: 80,
            width: 125,
            gradient: "from-gray-400 to-gray-500",
            trophyImage: null,
            rankColor: "#4A5568",
          };
      }
    } else {
      // Students
      switch (index) {
        case 0: // 1st Place
          return {
            height: 100,
            width: 140,
            gradient: "from-[#FFD700] to-[#FFA500]",
            trophyImage: "/trophies/gold_student.png",
            rankColor: "#FFD700",
          };
        case 1: // 2nd Place
          return {
            height: 80,
            width: 125,
            gradient: "from-[#C0C0C0] to-[#A0A0A0]",
            trophyImage: "/trophies/silver_student.png",
            rankColor: "#C0C0C0",
          };
        case 2: // 3rd Place
          return {
            height: 80,
            width: 125,
            gradient: "from-[#CD7F32] to-[#A0522D]",
            trophyImage: "/trophies/bronze_student.png",
            rankColor: "#CD7F32",
          };
        default:
          return {
            height: 80,
            width: 125,
            gradient: "from-gray-400 to-gray-500",
            trophyImage: null,
            rankColor: "#4A5568",
          };
      }
    }
  };

  const PodiumCard = ({
    entry,
    index,
  }: {
    entry: LeaderboardEntry;
    index: number;
  }) => {
    const podiumData = getPodiumData(index);
    const isEmpty = !entry.name;

    // Get full name based on user role
    const getFullName = () => {
      if (entry.userRole === "OFFICE_ADMIN") {
        // For OFFICE_ADMIN, use firstName from API (not the acronym from name field)
        return entry.firstName || entry.name;
      } else {
        // REGULAR_USER - use firstName + lastName
        if (!entry.firstName && !entry.lastName) {
          return entry.name; // Fallback to name if firstName/lastName not available
        }
        const firstName = entry.firstName || "";
        const lastName = entry.lastName || "";
        return `${firstName} ${lastName}`.trim() || entry.name;
      }
    };

    const fullName = getFullName();

    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.2, type: "spring", stiffness: 100 }}
        className="relative flex flex-col items-center"
        style={{ zIndex: index === 0 ? 30 : index === 1 ? 20 : 10 }}
      >
        {/* Trophy Image with Hover Tooltip */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-40 h-40 flex items-center justify-center z-20">
          {isEmpty ? (
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
              <Trophy className="w-16 h-16 text-gray-400" />
            </div>
          ) : (
            <div className="relative group">
              <Image
                src={podiumData.trophyImage!}
                alt={`${index + 1} place trophy`}
                width={160}
                height={160}
                className="object-contain cursor-pointer"
              />
              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-[#8B0000] text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 whitespace-nowrap z-[9999] pointer-events-none overflow-visible group-hover:animate-in group-hover:slide-in-from-bottom-2 group-hover:fade-in-0">
                <div className="font-medium">{fullName}</div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#8B0000]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Podium Stage */}
        <div
          className={`bg-gradient-to-b ${podiumData.gradient} rounded-t-2xl flex flex-col items-center justify-center relative overflow-visible shadow-lg`}
          style={{
            height: `${podiumData.height}px`,
            width: `${podiumData.width}px`,
          }}
        >
          {/* Name and Points */}
          {!isEmpty && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white font-bold text-center px-2 pt-8">
              <div className="text-sm mb-1 line-clamp-1">{entry.name}</div>
              <div className="text-lg">{entry.points} pts</div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="mt-6 mb-6">
      <div className="pt-28 pb-2 overflow-visible">
        <div className="flex justify-center items-end gap-4 px-4 overflow-visible">
          {/* 2nd Place - Left */}
          <PodiumCard entry={podiumEntries[1]} index={1} />

          {/* 1st Place - Center */}
          <PodiumCard entry={podiumEntries[0]} index={0} />

          {/* 3rd Place - Right */}
          <PodiumCard entry={podiumEntries[2]} index={2} />
        </div>
      </div>
    </div>
  );
}

function PlaceholderCard({ rank }: { rank: number }) {
  return (
    <div className="bg-[#F9FAFB] rounded-xl mb-2.5 p-4 flex items-center gap-3 border border-[#E5E7EB] opacity-55">
      <div className="w-[42px] h-[42px] rounded-full bg-[#E5E7EB] flex items-center justify-center flex-shrink-0">
        <span className="font-extrabold text-sm text-[#6B7280]">#{rank}</span>
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm text-[#6B7280] italic">
          Your name could be here!
        </h3>
        <p className="text-xs text-[#9CA3AF] mt-1">
          Compete to claim this spot
        </p>
      </div>
      <div className="bg-[#E5E7EB] px-3 py-1.5 rounded-2xl flex-shrink-0">
        <span className="text-[#6B7280] font-bold text-xs">? pts</span>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { isLoading, userRole } = useUser();
  const [selectedTab, setSelectedTab] = useState(0);
  const [topStudents, setTopStudents] = useState<LeaderboardEntry[]>([]);
  const [topOffices, setTopOffices] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);
      try {
        const token =
          typeof document !== "undefined"
            ? document.cookie
                .split("; ")
                .find((row) => row.startsWith("token="))
                ?.split("=")[1]
            : null;

        if (!token) {
          console.error("No authentication token found");
          return;
        }

        const [studentsRes, officesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/ratings/leaderboard/reporters/top`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${API_BASE_URL}/api/ratings/leaderboard/offices/top`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (studentsRes.ok && officesRes.ok) {
          const [studentsData, officesData] = await Promise.all([
            studentsRes.json(),
            officesRes.json(),
          ]);

          // Process student data
          const processedStudents = studentsData.map(
            (student: LeaderboardEntry) => {
              if (student.rank === "GOLD") {
                const goldPosition =
                  studentsData
                    .filter((s: LeaderboardEntry) => s.rank === "GOLD")
                    .sort(
                      (a: LeaderboardEntry, b: LeaderboardEntry) =>
                        b.points - a.points
                    )
                    .findIndex((s: LeaderboardEntry) => s.id === student.id) +
                  1;

                if (goldPosition <= 10) {
                  student.goldRanking = goldPosition;
                }
              }
              return student;
            }
          );

          // Process office data and fetch firstName from office_admins table
          const processedOffices = await Promise.all(
            officesData.map(async (office: LeaderboardEntry) => {
              // Fetch office admin details to get firstName from office_admins table
              try {
                const officeAdminRes = await fetch(
                  `${API_BASE_URL}/api/setup/by-office/${office.name}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                  }
                );

                if (officeAdminRes.ok) {
                  const officeAdminData = await officeAdminRes.json();
                  // Set firstName from office_admins table
                  office.firstName = officeAdminData.firstName;
                  office.userRole = "OFFICE_ADMIN";

                  // Console log firstName for Offices tab
                  console.log("Office entry with firstName from API:", {
                    id: office.id,
                    name: office.name,
                    firstName: office.firstName,
                    lastName: officeAdminData.lastName,
                    userRole: office.userRole,
                  });
                } else {
                  console.warn(
                    `Failed to fetch office admin for ${office.name}:`,
                    officeAdminRes.status
                  );
                }
              } catch (error) {
                console.error(
                  `Error fetching office admin for ${office.name}:`,
                  error
                );
              }

              if (office.rank === "GOLD") {
                const goldPosition =
                  officesData
                    .filter((o: LeaderboardEntry) => o.rank === "GOLD")
                    .sort(
                      (a: LeaderboardEntry, b: LeaderboardEntry) =>
                        b.points - a.points
                    )
                    .findIndex((o: LeaderboardEntry) => o.id === office.id) + 1;

                if (goldPosition <= 10) {
                  office.goldRanking = goldPosition;
                }
              }
              return office;
            })
          );

          setTopStudents(processedStudents);
          setTopOffices(processedOffices);
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  const ConfettiTrigger = dynamic(
    () => import("@/components/ConfettiTrigger"),
    { ssr: false }
  );

  if (isLoading) {
    return (
      <div
        className={`flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] ${inter.className}`}
      >
        {userRole === "OFFICE_ADMIN" ? <OfficeAdminSidebar /> : <Sidebar />}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Navbar */}
          <div className="sticky top-0 z-30 flex-shrink-0">
            {userRole === "OFFICE_ADMIN" ? (
              <OfficeAdminNavbar
                title="Office Leaderboard"
                subtitle="See who's leading in incident reporting"
                showSearch={false}
              />
            ) : (
              <Navbar
                title="Leaderboard"
                subtitle="See who's leading in incident reporting"
                showSearch={false}
                showNewIncident={false}
              />
            )}
          </div>

          {/* PageLoader - fills the remaining space below Navbar */}
          <PageLoader pageTitle="leaderboard" />
        </div>
      </div>
    );
  }

  const list = selectedTab === 0 ? topStudents : topOffices;

  return (
    <div
      className={`flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] ${inter.className}`}
    >
      {/* Confetti only triggers when leaderboard data is successfully loaded */}
      {!loading && list.length > 0 && <ConfettiTrigger />}
      {userRole === "OFFICE_ADMIN" ? <OfficeAdminSidebar /> : <Sidebar />}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <div className="sticky top-0 z-30 flex-shrink-0">
          {userRole === "OFFICE_ADMIN" ? (
            <OfficeAdminNavbar
              title="Office Leaderboard"
              subtitle="See who's leading in incident reporting"
              showSearch={false}
            />
          ) : (
            <Navbar
              title="Leaderboard"
              subtitle="See who's leading in incident reporting"
              showSearch={false}
              showNewIncident={false}
            />
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
          <div className="px-6 py-10 relative z-10">
            {/* Decorative elements */}
            <div className="pointer-events-none fixed right-[-40px] top-[-20px] opacity-[0.08] z-0"></div>
            <div className="pointer-events-none fixed left-[-30px] bottom-[-10px] opacity-[0.06] z-0">
              <Sparkles size={200} className="text-[#D4AF37]" />
            </div>

            <div className="pb-8">
              {/* Tabs */}
              <SegmentedTabs selected={selectedTab} onSelect={setSelectedTab} />

              <div className="px-4 mt-4">
                {/* Podium */}
                {list.length > 0 && (
                  <LeaderboardPodium
                    entries={list.slice(0, 3)}
                    type={selectedTab === 0 ? "students" : "offices"}
                  />
                )}

                {/* Leaderboard Rankings Section (4-10) */}
                <div className="mt-4.5">
                  <div className="flex items-center mb-3">
                    <div className="w-[26px] h-[26px] rounded-full bg-[#8B0000] flex items-center justify-center mr-2">
                      <Users size={15} className="text-white" />
                    </div>
                    <h2 className="text-base font-extrabold text-[#8B0000]">
                      Leaderboard Rankings
                    </h2>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-[#8B0000] animate-spin" />
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const START_RANK = 4;
                        const MAX_RANK = 10;
                        const totalSlots = MAX_RANK - START_RANK + 1;
                        const actualCount = Math.max(
                          0,
                          Math.min(Math.max(list.length - 3, 0), totalSlots)
                        );
                        const placeholders = totalSlots - actualCount;

                        return (
                          <>
                            {actualCount > 0
                              ? list
                                  .slice(3, 3 + actualCount)
                                  .map((entry, idx) => (
                                    <LeaderboardItem
                                      key={entry.id}
                                      entry={entry}
                                      rank={START_RANK + idx}
                                      isTopThree={false}
                                      isOffice={selectedTab === 1}
                                    />
                                  ))
                              : null}

                            {Array.from({ length: placeholders }).map(
                              (_, i) => (
                                <PlaceholderCard
                                  key={`placeholder-${
                                    START_RANK + actualCount + i
                                  }`}
                                  rank={START_RANK + actualCount + i}
                                />
                              )
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>

                {/* Empty State */}
                {list.length === 0 && !loading && (
                  <div className="bg-white rounded-xl p-6 flex flex-col items-center mt-2">
                    <Trophy size={32} className="text-[#9CA3AF]" />
                    <p className="text-[#6B7280] mt-2 text-center">
                      No leaderboard data available
                    </p>
                  </div>
                )}

                {/* How to Earn Recognition Section - Only show when data is successfully loaded */}
                {!loading && list.length > 0 && (
                  <div className="bg-[#FDF2F2] rounded-xl p-4 mt-6 mb-6 border border-[#FECACA]">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#8B0000] flex items-center justify-center flex-shrink-0">
                        <Sparkles size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-extrabold text-[#8B0000] mb-2">
                          How to Earn Recognition
                        </h3>
                        <p className="text-sm text-[#4B5563] leading-5 mb-3">
                          Points are awarded based on the quality and quantity
                          of your contributions. Submit detailed reports,
                          provide helpful information, and maintain high ratings
                          to climb the leaderboard!
                        </p>
                        <button
                          onClick={() => setShowInfoModal(true)}
                          className="text-sm font-bold text-[#8B0000] flex items-center hover:underline"
                        >
                          Learn more about the recognition system
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <RecognitionInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />

      <style jsx global>{`
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
}
