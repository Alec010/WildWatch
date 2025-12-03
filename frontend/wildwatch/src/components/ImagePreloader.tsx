"use client";

import { useEffect } from "react";

/**
 * Component to preload critical images used throughout the application
 * This ensures images are loaded early for better performance
 */
export default function ImagePreloader() {
  useEffect(() => {
    // Images used in layout and its components
    const imagesToPreload = [
      // Logo images
      "/logo2.png", // Used in metadata icons, MobileAppDownload, Sidebar, and various pages
      "/logo.png", // Used in LoginForm, SignUpForm, auth pages, and reset-password
      "/wildwatchlogo2.png", // Used in homepage
      "/citlogo.png", // Used in history pages for PDF generation

      // App store logos
      "/Google_Logo.png", // Used in MobileAppDownload
      "/IOS_Logo.png", // Used in MobileAppDownload

      // Chatbot
      "/AI%20CAT.png", // Used in Chatbot component

      // Trophy images (leaderboard)
      "/trophies/gold_office.png", // Used in leaderboard for office 1st place
      "/trophies/silver_office.png", // Used in leaderboard for office 2nd place
      "/trophies/bronze_office.png", // Used in leaderboard for office 3rd place
      "/trophies/gold_student.png", // Used in leaderboard for student 1st place
      "/trophies/silver_student.png", // Used in leaderboard for student 2nd place
      "/trophies/bronze_student.png", // Used in leaderboard for student 3rd place

      // Team member photos (homepage)
      "/AlecA.jpg", // Used in homepage
      "/Katrina.jpg", // Used in homepage
      "/Min.jpg", // Used in homepage
      "/Jhean.jpg", // Used in homepage
      "/Joshua.jpg", // Used in homepage

      // UI icons
      "/upvote.svg", // Used in upvote modal
    ];

    // Create preload links for each image
    imagesToPreload.forEach((src) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      link.type = "image/png";
      document.head.appendChild(link);
    });

    // Cleanup function (optional, but good practice)
    return () => {
      imagesToPreload.forEach((src) => {
        const existingLink = document.querySelector(
          `link[rel="preload"][href="${src}"]`
        );
        if (existingLink) {
          document.head.removeChild(existingLink);
        }
      });
    };
  }, []);

  return null; // This component doesn't render anything
}
