"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Simple Banner Component 1
const CarCareBanner = () => (
  <div className="relative w-full h-screen overflow-hidden">
    <div
      className="absolute inset-0 w-full h-[900px]"
      style={{
        backgroundImage: "url('/assets/images/EXTERIORcat.webp')",
        backgroundSize: "cover",
        backgroundPosition: "top",
        backgroundRepeat: "no-repeat",
      }}
    />
  </div>
)
// Simple Banner Component 2
const DetailingToolsBanner = () => (
  <div className="relative w-full h-screen overflow-hidden">
    <div
      className="absolute inset-0 w-full h-full"
      style={{
        backgroundImage: "url('/assets/images/kitCat.webp')",
        backgroundSize: "cover",
        backgroundPosition: "top",
        backgroundRepeat: "no-repeat",
      }}
    />
  </div>
)
// Simple Banner Component 3
const LuxuryAccessoriesBanner = () => (
  <div className="relative w-full h-screen overflow-hidden">
    <div
      className="absolute inset-0 w-full h-full"
      style={{
        backgroundImage: "url('/assets/images/banner3.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    />
  </div>
)

// Mobile Video Banner
const MobileVideoBanner = () => (
  <div className="relative top-[-80px]  w-full h-[700px] sm:h-[700px] md:hidden overflow-hidden">
    <video
      className="absolute inset-0 w-full h-full object-cover"
      src="https://ubnifppknfszvqkxqbfp.supabase.co/storage/v1/object/public/staticimages//rabbit%20launch%20video1%20.mp4"
      autoPlay
      loop
      muted
      playsInline
      poster="/assets/images/banner.png"
    />
  </div>
)

// Main Banner Slider Component
const BannerSlider = ({ children, autoSlideInterval = 5000, showControls = true, showDots = true }) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Convert children to array to handle single or multiple children
  const slides = React.Children.toArray(children)
  const totalSlides = slides.length

  // Auto-slide functionality
  useEffect(() => {
    if (!isAutoPlaying || totalSlides <= 1) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides)
    }, autoSlideInterval)

    return () => clearInterval(interval)
  }, [isAutoPlaying, totalSlides, autoSlideInterval])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity
  }

  if (totalSlides === 0) {
    return (
      <div className="w-full h-[800px] bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">No banners to display</p>
      </div>
    )
  }

  return (
    <div
      className="relative w-full h-[800px] overflow-hidden bg-gray-100 hidden md:block"
      style={{
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100vh",
        zIndex: "-10",
      }}
    >
      <AnimatePresence mode="wait" custom={currentSlide}>
        <motion.div
          key={currentSlide}
          custom={currentSlide}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x)

            if (swipe < -swipeConfidenceThreshold) {
              nextSlide()
            } else if (swipe > swipeConfidenceThreshold) {
              prevSlide()
            }
          }}
          className="absolute inset-0 w-full h-full"
        >
          {slides[currentSlide]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Demo Component showing how to use the slider
const HeroBannerSlider = () => {
  return (
    <>
      {/* Desktop banners */}
      <BannerSlider autoSlideInterval={5000} showControls={false} showDots={false}>
        <CarCareBanner />
        <DetailingToolsBanner />
        {/* <LuxuryAccessoriesBanner /> */}
      </BannerSlider>
      {/* Mobile video */}
      <MobileVideoBanner />
      <div className="  md:h-[800px]"></div>
    </>
  )
}

export default HeroBannerSlider
