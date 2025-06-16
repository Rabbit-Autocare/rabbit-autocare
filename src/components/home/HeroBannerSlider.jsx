"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Sample Banner Component 1
const CarCareBanner = () => (
  <div className="relative w-full h-screen overflow-hidden">
    {/* Background with gradient fallback and image overlay */}
    <div className="absolute inset-0 w-full h-full">
      {/* Gradient background as fallback */}
      <div className="absolute inset-0 bg-[#E1DEDA]" />

      {/* Image overlay */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url('https://ubnifppknfszvqkxqbfp.supabase.co/storage/v1/object/public/staticimages/banner/firstbanner.png')`,
          backgroundSize: "fill",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
    </div>

    {/* Content */}
    <div className="relative z-10 flex items-center justify-start h-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-black space-y-6 max-w-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="inline-flex items-center justify-center w-24 h-24 border-2 border-black text-black rounded-full text-lg font-bold shadow-lg"
          >
            <span className="text-2xl text-center font-bold">30% OFF</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-lg"
          >
            Premium car care essentials
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-xl sm:text-2xl  drop-shadow-md"
          >
            Elevate your ride with pro-grade detailing.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#601E8D] text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#9E72BB] transition-colors duration-300 shadow-lg"
          >
            Shop now
          </motion.button>
        </motion.div>
      </div>
    </div>
  </div>
)
// Sample Banner Component 2
const DetailingToolsBanner = () => (
  <div className="relative w-full h-screen overflow-hidden">
    {/* Background with gradient fallback and image overlay */}
    <div className="absolute inset-0 w-full h-full">
      {/* Gradient background as fallback */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600" />

      {/* Image overlay */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url('https://ubnifppknfszvqkxqbfp.supabase.co/storage/v1/object/public/staticimages/banner/banner2.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
    </div>

    {/* Optional overlay for better text readability */}

    {/* Content positioned at top */}
    <div className="relative z-10 flex items-start justify-center h-full pt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-white space-y-6 max-w-2xl text-center mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 text-white rounded-full text-lg font-bold shadow-lg"
          >
            25% OFF
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-lg"
          >
            Professional detailing tools
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-xl sm:text-2xl text-gray-100 drop-shadow-md"
          >
            Transform your car with expert-grade equipment.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-600 transition-colors duration-300 shadow-lg"
          >
            Explore
          </motion.button>
        </motion.div>
      </div>
    </div>
  </div>
)

// Sample Banner Component 3
const LuxuryAccessoriesBanner = () => (
  <div
    className="absolute inset-0 w-full h-full"
    style={{
      backgroundImage: `url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}
  >
    <div className="absolute inset-0 bg-black bg-opacity-30"></div>
    <div className="relative z-10 flex items-center justify-end h-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-white space-y-6 max-w-2xl text-right ml-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 text-white rounded-full text-lg font-bold shadow-lg"
          >
            40% OFF
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight"
          >
            Luxury car accessories
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-xl sm:text-2xl text-gray-100"
          >
            Premium products for the ultimate driving experience.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-emerald-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-emerald-600 transition-colors duration-300 shadow-lg"
          >
            Discover
          </motion.button>
        </motion.div>
      </div>
    </div>
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
      className="relative w-full h-[800px] overflow-hidden bg-gray-100"
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

      {/* Navigation Controls */}
      {showControls && totalSlides > 1 && (
        <>
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 text-white hover:scale-110"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 text-white hover:scale-110"
          >
            <ChevronRight size={24} />
          </button>

          {/* Auto-play toggle */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
                isAutoPlaying ? "bg-green-500 text-white" : "bg-white bg-opacity-20 text-white hover:bg-opacity-30"
              }`}
            >
              {isAutoPlaying ? "Auto" : "Manual"}
            </button>
          </div>
        </>
      )}

      {/* Dot Indicators */}
      {showDots && totalSlides > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? "bg-white scale-125" : "bg-white bg-opacity-50 hover:bg-opacity-75"
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {isAutoPlaying && totalSlides > 1 && (
        <motion.div
          key={currentSlide}
          className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-60 z-20"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: autoSlideInterval / 1000, ease: "linear" }}
        />
      )}
    </div>
  )
}

// Demo Component showing how to use the slider
const HeroBannerSlider = () => {
  return (
    <>
      <BannerSlider autoSlideInterval={5000} showControls={true} showDots={true}>
        <CarCareBanner />
        <DetailingToolsBanner />
        <LuxuryAccessoriesBanner />
      </BannerSlider>
      <div style={{ height: "700px" }}></div>
    </>
  )
}

export default HeroBannerSlider
