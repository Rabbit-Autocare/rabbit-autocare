"use client"

import { useEffect, useRef, useState, useLayoutEffect } from "react"
import { useCart } from "@/contexts/CartContext.jsx"
import FeaturedProductCard from "@/components/ui/FeaturedProductCard"
import { useRouter } from "next/navigation"
import { ProductService } from "@/lib/service/productService"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ScrollSmoother } from "gsap/ScrollSmoother"

gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

export default function FeaturedProducts() {
  const containerRef = useRef(null)
  const sectionRefs = useRef([])
  const { addToCart } = useCart()
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mobileCardHeight, setMobileCardHeight] = useState("")

  // Calculate mobile card height based on screen dimensions
  useEffect(() => {
    const calculateMobileHeight = () => {
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight

      // Only apply custom heights for mobile screens (width <= 768px)
      if (screenWidth <= 768) {
        // Different heights based on screen dimensions
        if (screenWidth <= 320) {
          // Very small screens (iPhone SE, small Android)
          setMobileCardHeight("1098px")
        } else if (screenWidth <= 360 && screenHeight <= 640) {
          // Small Android phones with low height
          setMobileCardHeight("1098px")
        } else if (screenWidth <= 360 && screenHeight > 640) {
          // Small Android phones with higher height
          setMobileCardHeight("950px")
        } else if (screenWidth <= 375 && screenHeight <= 667) {
          // iPhone 8, iPhone SE 2nd gen
          setMobileCardHeight("900px")
        } else if (screenWidth <= 375 && screenHeight > 667) {
          // iPhone 12 mini, iPhone 13 mini
          setMobileCardHeight("750px")
        } else if (screenWidth <= 390 && screenHeight <= 844) {
          // iPhone 12, iPhone 13, iPhone 14
          setMobileCardHeight("700px")
        } else if (screenWidth <= 414 && screenHeight <= 736) {
          // iPhone 8 Plus, older large phones
          setMobileCardHeight("850px")
        } else if (screenWidth <= 414 && screenHeight > 736) {
          // iPhone 12 Pro Max, iPhone 13 Pro Max, iPhone 14 Plus
          setMobileCardHeight("650px")
        } else if (screenWidth <= 430) {
          // iPhone 14 Pro Max, newer large phones
          setMobileCardHeight("600px")
        } else if (screenWidth <= 480) {
          // Small tablets in portrait, large phones
          setMobileCardHeight("750px")
        } else {
          // Larger mobile screens and small tablets
          setMobileCardHeight("800px")
        }
      } else {
        // For desktop/tablet screens, use empty string to fall back to Tailwind classes
        setMobileCardHeight("")
      }
    }

    // Calculate on mount
    calculateMobileHeight()

    // Recalculate on resize
    const handleResize = () => {
      calculateMobileHeight()
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log("Fetching featured products...")
        const response = await ProductService.getProducts({ limit: 4 })
        console.log("Fetched products:", response)
        setProducts(response.products)
      } catch (error) {
        console.error("Error fetching products:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Enhanced scroll animations from original component
  useLayoutEffect(() => {
    const sections = sectionRefs.current.filter(Boolean)
    const wrapper = document.querySelector("#smooth-wrapper")
    const content = document.querySelector("#smooth-content")
    const is320px = window.innerWidth <= 320
    const is360px = window.innerWidth <= 360
    const is480px = window.innerWidth <= 480
    const isMobile = window.innerWidth <= 768

    const initScrollAnimations = () => {
      // Clean up existing scroll triggers
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      if (ScrollSmoother.get()) ScrollSmoother.get().kill()

      // Initialize ScrollSmoother if wrapper and content exist
      if (wrapper && content) {
        ScrollSmoother.create({
          wrapper,
          content,
          smooth: is320px || is360px ? 0.005 : is480px ? 0.01 : isMobile ? 0.03 : 0.8,
          smoothTouch: is320px || is360px ? 0.005 : is480px ? 0.01 : 0.02,
          normalizeScroll: true,
          ignoreMobileResize: true,
          effects: true,
        })
      }

      sections.forEach((section, index) => {
        if (index === sections.length - 1) return

        // Pin each section except the last one
        ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => {
            const nextSection = sections[index + 1]
            // Ensure enough space for buttons on very small screens
            let offset = 140
            if (is320px) offset = 280
            else if (is360px) offset = 140
            else if (is480px) offset = 140
            else if (isMobile) offset = 140
            else if (window.innerWidth <= 1024) offset = 140

            return nextSection && index === sections.length - 2 ? `bottom top+=${offset}` : `bottom top+=${offset}`
          },
          pin: true,
          pinSpacing: false,
        })

        // Handle sticky heading animation
        const heading = section.querySelector(".product-heading")
        if (heading && index < sections.length - 1) {
          const nextSection = sections[index + 1]
          if (nextSection) {
            ScrollTrigger.create({
              trigger: nextSection,
              start: "top top",
              end: () => {
                const sectionAfterNext = sections[index + 2]
                return sectionAfterNext ? "bottom top+=50" : "bottom bottom"
              },
              onEnter: () => applyStickyHeading(heading),
              onLeave: () => resetHeading(heading),
              onEnterBack: () => applyStickyHeading(heading),
              onLeaveBack: () => resetHeading(heading),
            })
          }
        }
      })

      // Set the last section to have higher z-index
      const lastSection = sections[sections.length - 1]
      if (lastSection) {
        gsap.set(lastSection, { zIndex: 100, position: "relative" })
      }

      // Add parallax effect to product images
      sections.forEach((section) => {
        const img = section.querySelector(".featured-product-image")
        if (img) {
          gsap.to(img, {
            y: "-0%",
            scrollTrigger: {
              trigger: section,
              start: "top center",
              end: "bottom top",
              scrub: is320px || is360px ? 0.3 : is480px ? 0.5 : isMobile ? 0.8 : 2,
            },
          })
        }
      })
    }

    // Delay initialization to ensure DOM is ready
    setTimeout(() => {
      requestAnimationFrame(() => {
        initScrollAnimations()
      })
    }, 50)

    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      if (ScrollSmoother.get()) ScrollSmoother.get().kill()
      sections.forEach((section) => {
        const heading = section.querySelector(".product-heading")
        if (heading) resetHeading(heading)
      })
    }
  }, [products]) // Re-run when products change

  // Apply sticky heading styles
  const applyStickyHeading = (heading) => {
    const isUltraWide = window.innerWidth >= 1920
    gsap.set(heading, {
      position: "fixed",
      top: isUltraWide ? "40px" : "20px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 200,
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      padding: "8px 20px",
      borderRadius: "8px",
      border: "1px solid rgba(0, 0, 0, 0.1)",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
      width: "auto",
      maxWidth: "80vw",
      textAlign: "center",
    })
  }

  // Reset heading styles
  const resetHeading = (heading) => {
    gsap.set(heading, {
      position: "static",
      top: "auto",
      left: "auto",
      transform: "none",
      zIndex: "auto",
      background: "transparent",
      backdropFilter: "none",
      padding: "0",
      borderRadius: "0",
      border: "none",
      boxShadow: "none",
      width: "auto",
      maxWidth: "none",
      textAlign: "left",
    })
  }

  const handleAddToCart = async (item) => {
    try {
      const success = await addToCart(item.product, item.variant, item.quantity)
      if (!success) {
        throw new Error("Failed to add item to cart")
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
    }
  }

  const handleBuyNow = async (item) => {
    try {
      const success = await addToCart(item.product, item.variant, item.quantity)
      if (!success) {
        throw new Error("Failed to add item to cart")
      }
      router.push("/checkout")
    } catch (error) {
      console.error("Error in buy now:", error)
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-[600px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full min-h-[600px] flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="w-full min-h-[600px] flex items-center justify-center">
        <div className="text-gray-500">No featured products available</div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full my-14 md:my-20">
      {products.map((product, idx) => (
        <div
          key={product.id}
          ref={(el) => (sectionRefs.current[idx] = el)}
          className={`w-full pt-0 overflow-visible bg-white featured-product-section ${
            idx === 0
              ? "border-t border-b border-black" // First card: top and bottom border
              : idx === products.length - 1
                ? "border-y border-black" // Last card: only bottom border
                : "border-t border-black" // Middle cards: only bottom border
          }`}
          style={{
            minHeight:
              idx === products.length - 1
                ? "0px" // Last card gets fixed height
                : mobileCardHeight
                  ? mobileCardHeight // Use dynamic mobile height if available
                  : undefined, // Fall back to Tailwind classes for desktop
          }}
        >
          <FeaturedProductCard
            product={product}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            className="w-full"
            isLastCard={idx === products.length - 1}
          />
        </div>
      ))}

      {/* Fallback Tailwind classes for desktop when JavaScript is disabled */}
      <style jsx>{`
        @media (min-width: 769px) {
          .featured-product-section:not(:last-child) {
            min-height: 700px;
          }
        }
        @media (min-width: 1025px) {
          .featured-product-section:not(:last-child) {
            min-height: 700px;
          }
        }
      `}</style>
    </div>
  )
}
