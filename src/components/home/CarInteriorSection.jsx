"use client"
import { useEffect, useRef, useState } from "react"
import { useCategories } from "@/hooks/useCategories"
import {ChevronLeft, ChevronRight} from "lucide-react"
import { useRouter } from "next/navigation"
import LoadingErrorBoundary from "@/components/ui/LoadingErrorBoundary"

const images = [
  "/assets/images/carinterior.png",
  "/assets/about/img/mission.png",
  "/assets/images/carinterior.png",
  "/assets/about/img/mission.png",
]

// Mapping for user-friendly display names
const categoryDisplayNames = {
  "microfiber-cloth": "Microfibers",
  "car-interior": "Car Interior",
  "car-exterior": "Car Exterior",
  "kits&combos": "Kits & Combos",
  // Add more as needed
};

// Default titles that match the display names
const defaultTitles = ["Car Interior", "Car Exterior", "Microfibers", "Kits & Combos"];

export default function CarInteriorSection({ initialCategories = [], initialError = null }) {
  const { categories: fetchedCategories, loading: isLoading, error } = useCategories(initialCategories, initialError);

  const [current, setCurrent] = useState(0)
  const cardRefs = useRef([])
  const containerRef = useRef(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  // Fixed: Use consistent default titles with proper spacing
  const [titles, setTitles] = useState(defaultTitles)
  const [categories, setCategories] = useState([])

  const router = useRouter()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Update categories and titles when fetched categories change
  useEffect(() => {
    if (fetchedCategories && fetchedCategories.length > 0) {
      setCategories(fetchedCategories)
      // Fixed: Ensure proper display names are always used
      const categoryNames = fetchedCategories.map((category) => {
        return categoryDisplayNames[category.name] ||
               category.displayName ||
               category.name
      })
      setTitles(categoryNames)
      console.log('[DEBUG] CarInteriorSection: Categories updated from hook:', fetchedCategories)
    } else {
      // Fixed: Fallback to default titles with proper spacing
      setTitles(defaultTitles)
    }
  }, [fetchedCategories])

  // Get the visible cards with infinite loop support
  const getVisibleCards = () => {
    const cards = []
    const totalCards = images.length

    // Helper function to get wrapped index
    const getWrappedIndex = (index) => {
      if (index < 0) return totalCards + index
      if (index >= totalCards) return index - totalCards
      return index
    }

    // Left card (previous with wrapping)
    const leftIndex = getWrappedIndex(current - 1)
    cards.push({ index: leftIndex, position: 'left' })

    // Center card (current)
    cards.push({ index: current, position: 'center' })

    // Right card (next with wrapping)
    const rightIndex = getWrappedIndex(current + 1)
    cards.push({ index: rightIndex, position: 'right' })

    return cards
  }

  const visibleCards = getVisibleCards()

  // Position cards based on their role
  useEffect(() => {
    if (isAnimating) return

    // Clear all cards first
    cardRefs.current.forEach((card) => {
      if (card) {
        card.style.display = 'none'
        card.style.opacity = '0'
      }
    })

    // Position visible cards
    visibleCards.forEach((cardInfo, i) => {
      const card = cardRefs.current[cardInfo.index]
      if (!card) return

      card.style.display = 'block'
      card.style.transition = "all 0.5s ease-in-out"

      if (isMobile) {
        if (cardInfo.position === 'left') {
          card.style.transform = "translateX(-100%) scale(0.85)"
          card.style.opacity = '0.6'
        } else if (cardInfo.position === 'center') {
          card.style.transform = "translateX(0%) scale(1)"
          card.style.opacity = '1'
        } else if (cardInfo.position === 'right') {
          card.style.transform = "translateX(100%) scale(0.85)"
          card.style.opacity = '0.6'
        }
      } else {
        if (cardInfo.position === 'left') {
          card.style.transform = "translateX(-120%) scale(0.85)"
          card.style.opacity = '0.6'
        } else if (cardInfo.position === 'center') {
          card.style.transform = "translateX(0%) scale(1)"
          card.style.opacity = '1'
        } else if (cardInfo.position === 'right') {
          card.style.transform = "translateX(120%) scale(0.85)"
          card.style.opacity = '0.6'
        }
      }
    })
  }, [current, isAnimating, isMobile, visibleCards])

  const animateSlide = (direction) => {
    if (isAnimating) return

    setIsAnimating(true)

    // Calculate new index with wrapping
    let newIndex
    if (direction === 1) {
      newIndex = current >= images.length - 1 ? 0 : current + 1
    } else {
      newIndex = current <= 0 ? images.length - 1 : current - 1
    }

    // Animate current visible cards
    visibleCards.forEach((cardInfo) => {
      const card = cardRefs.current[cardInfo.index]
      if (!card) return

      card.style.transition = "all 0.5s ease-in-out"

      if (direction === 1) {
        // Moving to next
        if (isMobile) {
          card.style.transform = `translateX(${cardInfo.position === 'left' ? -200 : cardInfo.position === 'center' ? -100 : 0}%) scale(${cardInfo.position === 'right' ? 1 : 0.85})`
          card.style.opacity = `${cardInfo.position === 'center' ? '0.6' : cardInfo.position === 'right' ? '1' : '0'}`
        } else {
          card.style.transform = `translateX(${cardInfo.position === 'left' ? -240 : cardInfo.position === 'center' ? -120 : 0}%) scale(${cardInfo.position === 'right' ? 1 : 0.85})`
          card.style.opacity = `${cardInfo.position === 'center' ? '0.6' : cardInfo.position === 'right' ? '1' : '0'}`
        }
      } else {
        // Moving to previous
        if (isMobile) {
          card.style.transform = `translateX(${cardInfo.position === 'left' ? 0 : cardInfo.position === 'center' ? 100 : 200}%) scale(${cardInfo.position === 'left' ? 1 : 0.85})`
          card.style.opacity = `${cardInfo.position === 'center' ? '0.6' : cardInfo.position === 'left' ? '1' : '0'}`
        } else {
          card.style.transform = `translateX(${cardInfo.position === 'left' ? 0 : cardInfo.position === 'center' ? 120 : 240}%) scale(${cardInfo.position === 'left' ? 1 : 0.85})`
          card.style.opacity = `${cardInfo.position === 'center' ? '0.6' : cardInfo.position === 'left' ? '1' : '0'}`
        }
      }
    })

    // Update state after animation
    setTimeout(() => {
      setCurrent(newIndex)
      setIsAnimating(false)
    }, 500)
  }

  const next = () => animateSlide(1)
  const prev = () => animateSlide(-1)

  const handleNavigateToShop = (categoryIndex = current) => {
    if (isAnimating || isLoading) return

    const selectedCategory = categories[categoryIndex]

    if (selectedCategory) {
      // Use backend slug for routing
      router.push(`/shop/${selectedCategory.name}`)
    } else {
      router.push("/shop")
    }
  }

  const handleCardClick = (categoryIndex, categoryName) => {
    handleNavigateToShop(categoryIndex)
  }

  return (
    <LoadingErrorBoundary
      loading={isLoading}
      error={error}
      onRetry={() => window.location.reload()}
      timeout={10000}
      loadingComponent={
        <div className="relative w-full h-[450px] md:h-[500px] lg:h-[550px] xl:h-[600px] py-16 flex flex-col items-center overflow-hidden bg-white">
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
            <div className="text-lg font-semibold">Loading categories...</div>
          </div>
        </div>
      }
    >
      <div className="relative w-full h-[450px] md:h-[500px] lg:h-[550px] xl:h-[600px] py-16 flex flex-col items-center overflow-hidden bg-white">
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
            {error}
          </div>
        )}

        {/* Dynamic Background Text */}
        <div
          className="absolute bottom-[130px] md:bottom-[125px] lg:bottom-30 xl:bottom-30 font-extrabold text-gray-100 uppercase pointer-events-none select-none z-0 text-center w-full px-4 tracking-wider"
          style={{
            fontSize: "clamp(24px, 10vw, 136px)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={`Click to shop ${titles[current] || "Category"} - Browse all ${titles[current] || "Category"} products`}
        >
          {titles[current] || "Category"}
        </div>

        {/* Cards Container */}
        <div
          ref={containerRef}
          className={`relative flex justify-center items-center w-full h-[350px] z-10 ${
            isMobile ? 'px-4' : 'md:px-0 px-4 xl:px-4'
          }`}
        >
          {images.map((image, imageIndex) => {
            const categoryInfo = categories[imageIndex] || { name: titles[imageIndex] || "Category" }

            return (
              <div
                key={`${imageIndex}`}
                ref={(el) => (cardRefs.current[imageIndex] = el)}
                className="absolute overflow-hidden shadow-xl cursor-pointer"
                style={{
                  width: isMobile ? 'calc(100vw - 32px)' : '400px',
                  height: isMobile ? '200px' : '250px',
                  display: 'none', // Initially hidden
                }}
                onClick={() => handleCardClick(imageIndex, titles[imageIndex])}
                title={`Click to shop ${categoryDisplayNames[categoryInfo.name] || categoryInfo.name} - Direct link to ${categoryDisplayNames[categoryInfo.name] || categoryInfo.name} products`}
              >
                <img
                  src={image || "/placeholder.svg"}
                  alt={`Car ${imageIndex}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )
          })}
        </div>

        {/* Controls */}
        <div className="relative mt-10 z-10 w-full flex justify-center">
          <div className="relative flex items-center justify-center w-[350px]">
            <button
              onClick={prev}
              disabled={isAnimating || isLoading}
              className="absolute left-0 text-4xl w-10 h-10 flex items-center justify-center md:mt-10 xl:mt-10 cursor-pointer"
            >
              <ChevronLeft strokeWidth={2} />
            </button>

            <p
              className="text-2xl tracking-wider md:mt-10 xl:mt-10 font-bold text-black text-center mx-12 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:text-[#601e8d]"
              style={{
                maxWidth: isMobile ? "292px" : "558px",
              }}
              onClick={() => handleCardClick(current, titles[current])}
            >
              {titles[current] || "Category"}
            </p>

            <button
              onClick={next}
              disabled={isAnimating || isLoading}
              className="absolute right-0 text-4xl w-10 h-10 flex items-center  justify-center md:mt-10 xl:mt-10 cursor-pointer"
            >
              <ChevronRight strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Position Indicator */}
        {/* <div className="flex justify-center mt-4 space-x-2">
          {images.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index === current ? 'bg-[#601e8d]' : 'bg-gray-300'
              }`}
            />
          ))}
        </div> */}
      </div>
    </LoadingErrorBoundary>
  )
}
