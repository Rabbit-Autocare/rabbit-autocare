"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Footer from "@/components/navigation/Footer"
import MainNavbar from "@/components/navigation/MainNavbar"
import { CartProvider } from "@/contexts/CartContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
import ExtraNavbar from "@/components/navigation/extranavbar"
import { createPortal } from "react-dom"
import MobileNavbar from "@/components/navigation/MobileNavbar"

export default function ClientLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showExtraNavbar, setShowExtraNavbar] = useState(true)
  const [showMainNavbar, setShowMainNavbar] = useState(false) // Initially hidden
  const [portalContainer, setPortalContainer] = useState(null)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [scrollDirection, setScrollDirection] = useState("up")

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    checkSession()

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (event === "SIGNED_OUT") {
        router.push("/login")
      } else if (event === "SIGNED_IN" && !pathname.includes("/auth/callback")) {
        router.refresh()
      }
    })

    return () => subscription?.unsubscribe()
  }, [router, pathname])

  useEffect(() => {
    const isHomePage = pathname === "/" || pathname === "/home"

    // ✅ Enhanced scroll logic - only show navbar when ACTUALLY scrolling up
    const handleScroll = () => {
      let scrollY = 0

      // Try smooth scroll first (for home page with GSAP ScrollSmoother)
      const smoothContent = document.getElementById("smooth-content")
      if (smoothContent && isHomePage) {
        const transform = window.getComputedStyle(smoothContent).transform
        if (transform && transform !== "none") {
          try {
            const matrix = new DOMMatrix(transform)
            scrollY = Math.abs(matrix.m42)
          } catch (e) {
            scrollY = window.pageYOffset || document.documentElement.scrollTop
          }
        }
      } else {
        // Regular scroll for all pages
        scrollY = window.pageYOffset || document.documentElement.scrollTop
      }

      // ✅ Check if scroll position actually changed (to detect real scrolling)
      const scrollDifference = Math.abs(scrollY - lastScrollY)
      const isActuallyScrolling = scrollDifference > 1 // Only consider it scrolling if moved more than 1px

      // ✅ Detect scroll direction only when actually scrolling
      let currentScrollDirection = scrollDirection
      if (isActuallyScrolling) {
        currentScrollDirection = scrollY > lastScrollY ? "down" : "up"
        setScrollDirection(currentScrollDirection)
        setLastScrollY(scrollY)
      }

      // ✅ ExtraNavbar logic (unchanged - hides when scrolling down)
      if (scrollY <= 10) {
        setShowExtraNavbar(true)
      } else if (scrollY > 100) {
        setShowExtraNavbar(false)
      }

      // ✅ MainNavbar logic - ONLY show when ACTUALLY scrolling UP, hide when ACTUALLY scrolling DOWN
      if (scrollY > 50 && isActuallyScrolling) {
        if (currentScrollDirection === "up") {
          setShowMainNavbar(true) // Show ONLY when actually scrolling UP
        } else if (currentScrollDirection === "down") {
          setShowMainNavbar(false) // Hide when actually scrolling DOWN
        }
      } else if (scrollY <= 50) {
        // Hide MainNavbar when near top
        setShowMainNavbar(false)
      }
      // ✅ When NOT actually scrolling (scrolling stopped), do NOTHING - navbar stays in current state

      // console.log(
      //   "Scroll:",
      //   scrollY,
      //   "Last:",
      //   lastScrollY,
      //   "Difference:",
      //   scrollDifference,
      //   "Actually Scrolling:",
      //   isActuallyScrolling,
      //   "Direction:",
      //   currentScrollDirection,
      //   "MainNavbar:",
      //   showMainNavbar,
      // )
    }

    const scrollHandler = () => {
      requestAnimationFrame(handleScroll)
    }

    // ✅ Add scroll listeners for ALL pages
    window.addEventListener("scroll", scrollHandler, { passive: true })

    // Only add smooth scroll listeners for home page with GSAP
    const smoothWrapper = document.getElementById("smooth-wrapper")
    if (smoothWrapper && isHomePage) {
      smoothWrapper.addEventListener("scroll", scrollHandler, { passive: true })
    }

    // Watch for transform changes on smooth-content (GSAP ScrollSmoother)
    const smoothContent = document.getElementById("smooth-content")
    let observer = null
    if (smoothContent && isHomePage) {
      observer = new MutationObserver(() => {
        handleScroll()
      })
      observer.observe(smoothContent, {
        attributes: true,
        attributeFilter: ["style"],
      })
    }

    // Initial check
    setTimeout(handleScroll, 100)

    // Cleanup
    return () => {
      window.removeEventListener("scroll", scrollHandler)
      if (smoothWrapper && isHomePage) {
        smoothWrapper.removeEventListener("scroll", scrollHandler)
      }
      if (observer) {
        observer.disconnect()
      }
    }
  }, [pathname, lastScrollY, scrollDirection, showMainNavbar])

  // ✅ Reset navbar states when pathname changes
  useEffect(() => {
    // Reset states for new page
    setShowExtraNavbar(true) // ExtraNavbar always visible on page load
    setShowMainNavbar(false) // MainNavbar always hidden on page load
    setLastScrollY(0)
    setScrollDirection("up")

    // Scroll to top when changing pages
    window.scrollTo(0, 0)
  }, [pathname])

  // ✅ Create portal container for MainNavbar
  useEffect(() => {
    if (typeof window !== "undefined") {
      let navbarContainer = document.getElementById("navbar-portal")
      if (!navbarContainer) {
        navbarContainer = document.createElement("div")
        navbarContainer.id = "navbar-portal"
        navbarContainer.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 99999 !important;
          pointer-events: ${showMainNavbar ? "auto" : "none"};
          opacity: ${showMainNavbar ? "1" : "0"};
          transform: translateY(${showMainNavbar ? "0" : "-100%"});
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `
        document.body.appendChild(navbarContainer)
      }
      setPortalContainer(navbarContainer)
    }

    return () => {
      const navbarContainer = document.getElementById("navbar-portal")
      if (navbarContainer && document.body.contains(navbarContainer)) {
        document.body.removeChild(navbarContainer)
      }
    }
  }, [])

  // ✅ Update portal container styles when showMainNavbar changes
  useEffect(() => {
    if (portalContainer) {
      portalContainer.style.pointerEvents = showMainNavbar ? "auto" : "none"
      portalContainer.style.opacity = showMainNavbar ? "1" : "0"
      portalContainer.style.transform = `translateY(${showMainNavbar ? "0" : "-100%"})`
    }
  }, [showMainNavbar, portalContainer])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // console.log(
  //   "🎯 NAVBAR STATE - Page:",
  //   pathname,
  //   "Extra:",
  //   showExtraNavbar,
  //   "Main:",
  //   showMainNavbar,
  //   "Direction:",
  //   scrollDirection,
  // )

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <CartProvider>
        <div className="md:hidden">
          <MobileNavbar />
        </div>
        <div style={{ position: "relative" }}>
          {/* ✅ ExtraNavbar - Unchanged behavior */}
          <div
            className={`hidden md:block transition-all duration-300 ease-in-out ${
              showExtraNavbar ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
            }`}
            style={{
              position: "relative",
              zIndex: 50,
            }}
          >
            <ExtraNavbar />
          </div>

          {/* ✅ Content - No padding needed since MainNavbar is fixed */}
          <div>{children}</div>

          <Footer />
        </div>

        {/* ✅ MainNavbar Portal - ONLY shows when ACTUALLY scrolling up, never when scrolling stops */}
        {portalContainer &&
          createPortal(
            <div
              className={` ${showMainNavbar ? "animate-in slide-in-from-top duration-300" : ""}`}
              style={{
                opacity: showMainNavbar ? 1 : 0,
                transform: `translateY(${showMainNavbar ? "0" : "-100%"})`,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <MainNavbar />
            </div>,
            portalContainer,
          )}
      </CartProvider>
    </ThemeProvider>
  )
}
