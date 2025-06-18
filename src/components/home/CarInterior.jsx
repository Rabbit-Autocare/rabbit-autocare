"use client"
import { useEffect, useRef, useState } from "react"
import { CategoryService } from "@/lib/service/microdataService"
import { useRouter } from "next/navigation"

const images = [
  "/assets/images/carinterior.png",
  "/assets/about/img/mission.png",
  "/assets/images/carinterior.png",
  "/assets/about/img/mission.png",
]

export default function CarInterior() {
  const [current, setCurrent] = useState(0)
  const [displayedTitle, setDisplayedTitle] = useState("")
  const [titleOpacity, setTitleOpacity] = useState(1)
  const cardRefs = useRef([])
  const containerRef = useRef(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [titles, setTitles] = useState(["Interior", "Exterior", "Fiber Cloth", "Kits & Combos"])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true)
        const result = await CategoryService.getCategories()

        if (result.success && result.data) {
          setCategories(result.data)
          const categoryNames = result.data.map((category) => category.name)
          setTitles(categoryNames)
          setDisplayedTitle(categoryNames[0] || "Interior")
        } else {
          setError("Failed to fetch categories")
          console.error("Error fetching categories:", result.error)
        }
      } catch (err) {
        setError("Failed to fetch categories")
        console.error("Error fetching categories:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    if (titles.length > 0 && !displayedTitle) {
      setDisplayedTitle(titles[0])
    }
  }, [titles, displayedTitle])

  const getVisibleIndexes = () => {
    return [-1, 0, 1].map((offset) => (current + offset + images.length) % images.length)
  }

  const visibleIndexes = getVisibleIndexes()

  // Initialize card positions - Always show exactly 3 cards
  useEffect(() => {
    if (isAnimating) return

    cardRefs.current.forEach((card, i) => {
      if (!card) return

      const isCenter = i === 1
      const isLeft = i === 0
      const isRight = i === 2

      // Set initial positions without animation
      card.style.transition = "none"

      if (isMobile) {
        // Mobile positioning - only center card visible but others positioned for animation
        if (isLeft) {
          card.style.transform = "translateX(-100vw) scale(0.85)"
          card.style.opacity = "0"
          card.style.zIndex = "10"
          card.style.width = "calc(100vw - 32px)"
          card.style.height = "200px"
          card.style.visibility = "visible"
        } else if (isCenter) {
          card.style.transform = "translateX(0px) scale(1)"
          card.style.opacity = "1"
          card.style.zIndex = "20"
          card.style.width = "calc(100vw - 32px)"
          card.style.height = "200px"
          card.style.visibility = "visible"
        } else if (isRight) {
          card.style.transform = "translateX(100vw) scale(0.85)"
          card.style.opacity = "0"
          card.style.zIndex = "10"
          card.style.width = "calc(100vw - 32px)"
          card.style.height = "200px"
          card.style.visibility = "visible"
        }
      } else {
        // Desktop positioning - unchanged
        if (isLeft) {
          card.style.transform = "translateX(-450px) scale(0.85)"
          card.style.opacity = "0.6"
          card.style.zIndex = "10"
          card.style.width = "292px"
          card.style.height = "152px"
          card.style.visibility = "visible"
        } else if (isCenter) {
          card.style.transform = "translateX(0px) scale(1)"
          card.style.opacity = "1"
          card.style.zIndex = "20"
          card.style.width = "558px"
          card.style.height = "290px"
          card.style.visibility = "visible"
        } else if (isRight) {
          card.style.transform = "translateX(450px) scale(0.85)"
          card.style.opacity = "0.6"
          card.style.zIndex = "10"
          card.style.width = "292px"
          card.style.height = "152px"
          card.style.visibility = "visible"
        }
      }

      // Re-enable transitions after positioning
      setTimeout(() => {
        card.style.transition = "all 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)"
      }, 50)
    })
  }, [current, isAnimating, isMobile])

  const animateSlide = (direction) => {
    if (isAnimating) return
    setIsAnimating(true)

    // Fade out title
    setTitleOpacity(0)

    // Calculate new index
    const newIndex = direction === 1 ? (current + 1) % images.length : (current - 1 + images.length) % images.length

    // Create temporary incoming card for animation
    const incomingCardIndex =
      direction === 1 ? (current + 2 + images.length) % images.length : (current - 2 + images.length) % images.length

    // Create a temporary card element for the incoming card
    const tempCard = document.createElement("div")
    tempCard.className = "absolute overflow-hidden shadow-xl cursor-pointer"
    
    if (isMobile) {
      // Mobile temporary card setup
      tempCard.style.width = "calc(100vw - 32px)"
      tempCard.style.height = "200px"
      tempCard.style.opacity = "1"
      tempCard.style.zIndex = "15"
    } else {
      // Desktop temporary card setup
      tempCard.style.width = "292px"
      tempCard.style.height = "152px"
      tempCard.style.opacity = "0.3"
      tempCard.style.zIndex = "5"
    }
    
    tempCard.style.transition = "all 0.7s cubic-bezier(0.25, 0.1, 0.25, 1)"

    // Add image to temp card
    const tempImg = document.createElement("img")
    tempImg.src = images[incomingCardIndex] || "/placeholder.svg"
    tempImg.className = "w-full h-full object-cover"
    tempCard.appendChild(tempImg)

    if (direction === 1) {
      // Position incoming card far right
      if (isMobile) {
        tempCard.style.transform = "translateX(100vw) scale(1)"
        containerRef.current?.appendChild(tempCard)
        
        // Animate it sliding in
        setTimeout(() => {
          tempCard.style.transform = "translateX(100vw) scale(1)"
        }, 50)
      } else {
        tempCard.style.transform = "translateX(900px) scale(0.85)"
        containerRef.current?.appendChild(tempCard)
        
        // Animate it sliding in
        setTimeout(() => {
          tempCard.style.transform = "translateX(450px) scale(0.85)"
        }, 50)
      }
    } else {
      // Position incoming card far left
      if (isMobile) {
        tempCard.style.transform = "translateX(-100vw) scale(1)"
        containerRef.current?.appendChild(tempCard)
        
        // Animate it sliding in
        setTimeout(() => {
          tempCard.style.transform = "translateX(-100vw) scale(1)"
        }, 50)
      } else {
        tempCard.style.transform = "translateX(-900px) scale(0.85)"
        containerRef.current?.appendChild(tempCard)
        
        // Animate it sliding in
        setTimeout(() => {
          tempCard.style.transform = "translateX(-450px) scale(0.85)"
        }, 50)
      }
    }

    // Animate existing cards
    cardRefs.current.forEach((card, i) => {
      if (!card) return

      card.style.transition = "all 0.7s cubic-bezier(0.25, 0.1, 0.25, 1)"

      if (isMobile) {
        // Mobile animation
        if (direction === 1) {
          // Sliding to next (right to left)
          if (i === 0) {
            // Left card slides further left and fades out
            card.style.transform = "translateX(-100vw) scale(1)"
            card.style.opacity = "0"
          } else if (i === 1) {
            // Center card slides to left position
            card.style.transform = "translateX(-100vw) scale(1)"
            card.style.opacity = "0"
            card.style.zIndex = "10"
          } else if (i === 2) {
            // Right card slides to center position
            card.style.transform = "translateX(0px) scale(1)"
            card.style.opacity = "1"
            card.style.zIndex = "20"
          }
        } else {
          // Sliding to previous (left to right)
          if (i === 0) {
            // Left card slides to center position
            card.style.transform = "translateX(0px) scale(1)"
            card.style.opacity = "1"
            card.style.zIndex = "20"
          } else if (i === 1) {
            // Center card slides to right position
            card.style.transform = "translateX(100vw) scale(1)"
            card.style.opacity = "0"
            card.style.zIndex = "10"
          } else if (i === 2) {
            // Right card slides further right and fades out
            card.style.transform = "translateX(100vw) scale(1)"
            card.style.opacity = "0"
          }
        }
      } else {
        // Desktop animation - unchanged
        if (direction === 1) {
          // Sliding to next (right to left)
          if (i === 0) {
            // Left card slides further left and fades out
            card.style.transform = "translateX(-900px) scale(0.7)"
            card.style.opacity = "0"
          } else if (i === 1) {
            // Center card slides to left position
            card.style.transform = "translateX(-450px) scale(0.85)"
            card.style.opacity = "0.6"
            card.style.zIndex = "10"
            card.style.width = "292px"
            card.style.height = "152px"
          } else if (i === 2) {
            // Right card slides to center position
            card.style.transform = "translateX(0px) scale(1)"
            card.style.opacity = "1"
            card.style.zIndex = "20"
            card.style.width = "558px"
            card.style.height = "290px"
          }
        } else {
          // Sliding to previous (left to right)
          if (i === 0) {
            // Left card slides to center position
            card.style.transform = "translateX(0px) scale(1)"
            card.style.opacity = "1"
            card.style.zIndex = "20"
            card.style.width = "558px"
            card.style.height = "290px"
          } else if (i === 1) {
            // Center card slides to right position
            card.style.transform = "translateX(450px) scale(0.85)"
            card.style.opacity = "0.6"
            card.style.zIndex = "10"
            card.style.width = "292px"
            card.style.height = "152px"
          } else if (i === 2) {
            // Right card slides further right and fades out
            card.style.transform = "translateX(900px) scale(0.7)"
            card.style.opacity = "0"
          }
        }
      }
    })

    // Update state and clean up after animation
    setTimeout(() => {
      setCurrent(newIndex)
      setDisplayedTitle(titles[newIndex] || "Category")

      // Remove temporary card
      if (tempCard && tempCard.parentNode) {
        tempCard.parentNode.removeChild(tempCard)
      }

      // Fade title back in
      setTimeout(() => {
        setTitleOpacity(1)
        setIsAnimating(false)
      }, 200)
    }, 700)
  }

  const next = () => animateSlide(1)
  const prev = () => animateSlide(-1)

  const handleNavigateToShop = (categoryIndex = current) => {
    if (isAnimating || isLoading) return

    const selectedCategory = categories[categoryIndex]

    if (selectedCategory) {
      const categorySlug = selectedCategory.name.toLowerCase().replace(/\s+/g, "-")
      router.push(`/shop/${categorySlug}`)
    } else {
      const fallbackCategory = titles[categoryIndex]
      if (fallbackCategory) {
        const categorySlug = fallbackCategory.toLowerCase().replace(/\s+/g, "-")
        router.push(`/shop/${categorySlug}`)
      } else {
        router.push("/shop")
      }
    }
  }

  const handleCardClick = (categoryIndex, categoryName) => {
    handleNavigateToShop(categoryIndex)
  }

  return (
    <div className="relative w-full h-[500px] xl:h-[600px] py-16 flex flex-col items-center overflow-hidden bg-white">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
          <div className="text-lg font-semibold">Loading categories...</div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          {error}
        </div>
      )}

      {/* Dynamic Background Text */}
      <div
        className="absolute bottom-[102px] md:bottom-[70px] lg:bottom-14 xl:bottom-30 font-extrabold text-gray-100 uppercase pointer-events-none select-none z-0 text-center w-full px-4 tracking-wider"
        style={{
          fontSize: "clamp(24px, 10vw, 136px)",
          opacity: titleOpacity,
          transition: "opacity 0.3s ease-in-out",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={`Click to shop ${displayedTitle} - Browse all ${displayedTitle} products`}
      >
        {displayedTitle}
      </div>

      {/* Cards Container */}
      <div
        ref={containerRef}
        className={`relative flex justify-center items-center w-full h-[350px] z-10 ${
          isMobile ? 'px-4' : 'md:px-0 px-4 xl:px-4'
        }`}
        style={{ perspective: "1000px" }}
      >
        {visibleIndexes.map((imageIndex, i) => {
          // Mobile: Show only center card visually, but keep others for animation
          const categoryInfo = categories[visibleIndexes[i]] || { name: titles[visibleIndexes[i]] || "Category" }

          return (
            <div
              key={`${imageIndex}-${current}-${i}`}
              ref={(el) => (cardRefs.current[i] = el)}
              className="absolute overflow-hidden shadow-xl cursor-pointer group"
              style={{
                width: isMobile ? 'calc(100vw - 32px)' : (i === 1 ? 558 : 292),
                height: isMobile ? 200 : (i === 1 ? 290 : 152),
                opacity: isMobile ? (i === 1 ? 1 : 0) : (i === 1 ? 1 : 0.6),
                zIndex: i === 1 ? 20 : 10,
                filter: i === 1 ? "brightness(1)" : "brightness(0.8)",
              }}
              onClick={() => handleCardClick(visibleIndexes[i], titles[visibleIndexes[i]])}
              title={`Click to shop ${categoryInfo.name} - Direct link to ${categoryInfo.name} products`}
            >
              <div className="relative w-full h-full overflow-hidden">
                <img
                  src={images[imageIndex] || "/placeholder.svg"}
                  alt={`Car ${imageIndex}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0  bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                  <div className="text-white font-bold text-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                    Shop {titles[visibleIndexes[i]] || "Category"}
                  </div>
                </div>
              </div>
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
            className="absolute left-0 text-4xl w-10 h-10 flex items-center justify-center md:mt-10 xl:mt-10 cursor-pointer hover:text-gray-400 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ‹
          </button>

          <h2
            className="text-2xl tracking-wider md:mt-10 xl:mt-10 font-bold text-black text-center mx-12 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:text-[#601e8d] hover:scale-105"
            style={{
              maxWidth: isMobile ? "292px" : "558px",
              opacity: titleOpacity,
            }}
            onClick={() => handleCardClick(current, titles[current])}
          >
            {`${titles[current] || "Category"}`}
          </h2>

          <button
            onClick={next}
            disabled={isAnimating || isLoading}
            className="absolute right-0 text-4xl w-10 h-10 flex items-center justify-center md:mt-10 xl:mt-10 cursor-pointer hover:text-gray-400 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}