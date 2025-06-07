"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ScrollSmoother } from "gsap/ScrollSmoother"

gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

// This component handles global smooth scrolling behavior
export default function ScrollHandler() {
  const pathname = usePathname()

  useEffect(() => {
    // Initialize ScrollSmoother for all pages
    const initGlobalScrollSmoother = () => {
      const wrapper = document.querySelector("#smooth-wrapper")
      const content = document.querySelector("#smooth-content")

      if (!wrapper || !content) return

      // Kill existing ScrollSmoother instance
      if (ScrollSmoother.get()) {
        ScrollSmoother.get().kill()
      }

      // Kill existing ScrollTriggers to prevent conflicts
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())

      const isMobile = window.innerWidth <= 768
      const is480px = window.innerWidth <= 480

      try {
        // Create ScrollSmoother for all pages
        ScrollSmoother.create({
          wrapper: wrapper,
          content: content,
          smooth: is480px ? 0.5 : isMobile ? 0.8 : 1.2, // Smooth scrolling values
          smoothTouch: is480px ? 0.1 : 0.3, // Touch device smoothing
          normalizeScroll: true,
          ignoreMobileResize: true,
          effects: false, // Disable effects for non-home pages initially
        })

        console.log("ScrollSmoother initialized for:", pathname)
      } catch (error) {
        console.error("Error initializing ScrollSmoother:", error)
        // Fallback: ensure normal scrolling works
        document.body.style.overflow = "auto"
        document.documentElement.style.overflow = "auto"
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initGlobalScrollSmoother()
    }, 100)

    // Cleanup function
    return () => {
      clearTimeout(timer)
    }
  }, [pathname])

  // Handle page navigation scroll reset
  useEffect(() => {
    // Reset scroll position when navigating to a new page
    const smoother = ScrollSmoother.get()
    if (smoother) {
      smoother.scrollTo(0, false) // Scroll to top without animation
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname])

  return null
}
