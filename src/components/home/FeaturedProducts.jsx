"use client"

import { useEffect, useRef, useState, useLayoutEffect } from "react"
import { ProductService } from "@/lib/service/productService"
import FeaturedProductCard from "@/components/ui/FeaturedProductCard"
import cartService from "@/lib/service/cartService"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ScrollSmoother } from "gsap/ScrollSmoother"

gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

export default function FeaturedProducts() {
  const containerRef = useRef(null)
  const sectionRefs = useRef([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all products with a limit for featured products
        const response = await ProductService.getProducts({
          limit: 10, // Adjust limit as needed
          sort: "created_at:desc", // Get latest products first
        })

        if (response.success && response.products) {
          setProducts(response.products)
        } else {
          throw new Error("Failed to fetch products")
        }
      } catch (err) {
        console.error("Error fetching featured products:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Cart and purchase handlers
  const handleAddToCart = async (cartItem) => {
    try {
      // First try to add to database using cartService
      try {
        await cartService.addToCart(
          cartItem.productId,
          cartItem.variant,
          cartItem.quantity
        )
        console.log('Item added to cart in database successfully!')
      } catch (dbError) {
        console.error('Database cart error:', dbError)
        // Fallback to localStorage if database operation fails
        let existingCart = []
        try {
          const storedCart = localStorage.getItem('cart')
          existingCart = storedCart ? JSON.parse(storedCart) : []
          if (!Array.isArray(existingCart)) {
            existingCart = []
          }
        } catch (e) {
          existingCart = []
        }

        existingCart.push(cartItem)
        localStorage.setItem('cart', JSON.stringify(existingCart))
        console.log('Item added to cart in localStorage (fallback)')
      }

      return true
    } catch (error) {
      console.error('Error adding to cart:', error)
      return false
    }
  }

  const handleBuyNow = async (cartItem) => {
    try {
      console.log("Buy now:", cartItem)

      // Add to cart first
      const success = await handleAddToCart(cartItem)

      if (success) {
        // Redirect to checkout
        window.location.href = "/checkout"
      }
    } catch (error) {
      console.error("Error in buy now:", error)
    }
  }

  const handleAddToWishlist = async (product) => {
    try {
      console.log("Adding to wishlist:", product)

      const response = await fetch("/api/wishlist/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id || product.product_code,
          productName: product.name,
          productImage: product.main_image_url || product.images?.[0],
          price: product.price || product.mrp,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add to wishlist")
      }

      console.log("Successfully added to wishlist:", data)
      return true
    } catch (error) {
      console.error("Error adding to wishlist:", error)
      return false
    }
  }

  // GSAP Animation setup (keeping your existing animation code)
  useLayoutEffect(() => {
    if (!products.length) return

    const sections = sectionRefs.current.filter(Boolean)
    const wrapper = document.querySelector("#smooth-wrapper")
    const content = document.querySelector("#smooth-content")
    const is480px = window.innerWidth <= 480
    const isMobile = window.innerWidth <= 768

    const initScrollAnimations = () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      if (ScrollSmoother.get()) ScrollSmoother.get().kill()

      ScrollSmoother.create({
        wrapper,
        content,
        smooth: is480px ? 0.01 : isMobile ? 0.03 : 0.8,
        smoothTouch: is480px ? 0.01 : 0.02,
        normalizeScroll: true,
        ignoreMobileResize: true,
        effects: true,
      })

      sections.forEach((section, index) => {
        if (index === sections.length - 1) return

        ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => {
            const nextSection = sections[index + 1]
            return nextSection && index === sections.length - 2 ? "bottom top+=100" : "bottom top+=140"
          },
          pin: true,
          pinSpacing: false,
        })

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

      const lastSection = sections[sections.length - 1]
      if (lastSection) {
        gsap.set(lastSection, { zIndex: 100, position: "relative" })
      }

      sections.forEach((section) => {
        const img = section.querySelector(".featured-product-image")
        if (img) {
          gsap.to(img, {
            y: "-0%",
            scrollTrigger: {
              trigger: section,
              start: "top center",
              end: "bottom top",
              scrub: is480px ? 0.5 : isMobile ? 0.8 : 2,
            },
          })
        }
      })
    }

    setTimeout(() => {
      requestAnimationFrame(() => {
        initScrollAnimations()
      })
    }, 50)

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      if (ScrollSmoother.get()) ScrollSmoother.get().kill()
      sections.forEach((section) => {
        const heading = section.querySelector(".product-heading")
        if (heading) resetHeading(heading)
      })
    }
  }, [products])

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

  // Loading state
  if (loading) {
    return (
      <div className="relative w-full my-20">
        <div className="flex items-center justify-center min-h-[700px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-medium">Loading Featured Products...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="relative w-full my-20">
        <div className="flex items-center justify-center min-h-[700px]">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold mb-2">Failed to Load Products</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // No products state
  if (!products.length) {
    return (
      <div className="relative w-full my-20">
        <div className="flex items-center justify-center min-h-[700px]">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
            <p className="text-gray-600">Check back later for featured products.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full my-20">
      {products.map((product, idx) => (
        <div key={product.id || product.product_code || idx} ref={(el) => (sectionRefs.current[idx] = el)}>
          <FeaturedProductCard
            product={product}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onAddToWishlist={handleAddToWishlist}
          />
        </div>
      ))}
    </div>
  )
}
