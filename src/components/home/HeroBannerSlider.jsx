"use client"

import React from "react"

// Single Banner Component
const Banner1 = () => (
  <div className="relative w-full h-screen overflow-hidden">
    <div
      className="absolute inset-0 w-full h-full"
      style={{
        backgroundImage: "url('/assets/images/16.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "top",
        backgroundRepeat: "no-repeat",
      }}
    />
  </div>
)

// Mobile Video Banner
const MobileVideoBanner = () => (
  <div className="relative w-full h-screen md:hidden overflow-hidden">
    <video
      className="absolute inset-0 w-full h-full object-cover"
      src="https://ubnifppknfszvqkxqbfp.supabase.co/storage/v1/object/public/staticimages//website%20video.mp4"
      autoPlay
      loop
      muted
      playsInline
      poster="/assets/images/banner.png"
    />
  </div>
)

// Main Hero Banner Component
const HeroBannerSlider = () => {
  return (
    <>
      {/* Desktop banner - hidden on mobile (below 768px) */}
      <div
        className="relative w-full h-screen overflow-hidden bg-gray-100 hidden md:block"
        style={{
          position: "fixed",
          top: "0",
          left: "0",
          width: "100%",
          height: "100vh",
          zIndex: "-10",
        }}
      >
        <Banner1 />
      </div>

      {/* Mobile video - shown only below 768px */}
      <MobileVideoBanner />

      {/* Spacer div for desktop to account for fixed positioning */}
      <div className="hidden md:block md:h-screen"></div>
    </>
  )
}

export default HeroBannerSlider
