'use client';

import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { featuredProducts } from '../../Data/featuredProductsData';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export default function FeaturedProducts() {
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const [activeImage, setActiveImage] = useState({});

  useLayoutEffect(() => {
    const wrapper = document.querySelector('#smooth-wrapper');
    const content = document.querySelector('#smooth-content');
    const sections = sectionRefs.current.filter(Boolean);

    // ✅ Create ScrollSmoother on full page layout
    ScrollSmoother.create({
      wrapper,
      content,
      smooth: 1.0,
      normalizeScroll: true,
      effects: true,
    });

    // ✅ Section stack pinning and sticky heading
    sections.forEach((section, index) => {
      if (index === sections.length - 1) return;

      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => {
          const nextSection = sections[index + 1];
          if (nextSection && index === sections.length - 2) {
            return "bottom top+=100";
          }
          return "bottom top+=140";
        },
        pin: true,
        pinSpacing: false,
        // anticipatePin: 1,
        markers: false,
      });

      const heading = section.querySelector(".product-heading");
      if (heading && index < sections.length - 1) {
        const nextSection = sections[index + 1];
        if (nextSection) {
          ScrollTrigger.create({
            trigger: nextSection,
            start: "top top",
            end: () => {
              const sectionAfterNext = sections[index + 2];
              return sectionAfterNext ? "bottom top+=50" : "bottom bottom";
            },
            onEnter: () => applyStickyHeading(heading),
            onLeave: () => resetHeading(heading),
            onEnterBack: () => applyStickyHeading(heading),
            onLeaveBack: () => resetHeading(heading),
          });
        }
      }
    });

    const lastSection = sections[sections.length - 1];
    if (lastSection) {
      gsap.set(lastSection, {
        zIndex: 100,
        position: "relative"
      });
    }

    // ✅ Parallax effect
    sections.forEach((section) => {
      const img = section.querySelector(".featured-product-image");
      if (img) {
        gsap.to(img, {
          y: "-0%",
          scrollTrigger: {
            trigger: section,
            start: "top center",
            end: "bottom top",
            scrub: 2,
          },
        });
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      sections.forEach((section) => {
        const heading = section.querySelector(".product-heading");
        if (heading) resetHeading(heading);
      });
    };
  }, []);

  const applyStickyHeading = (heading) => {
    gsap.set(heading, {
      position: "fixed",
      top: "20px",
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
      textAlign: "center"
    });
  };

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
      textAlign: "left"
    });
  };

  return (
    <div ref={containerRef} className="relative w-full my-20">
      {featuredProducts.map((product, idx) => (
        <div
          key={product.id}
          ref={(el) => (sectionRefs.current[idx] = el)}
          className={`w-full pt-0 overflow-hidden bg-white border-y border-black featured-product-section ${
            idx === featuredProducts.length - 1 ? 'relative z-[100]' : ''
          }`}
        >
          <div className="flex flex-col xl:flex-row gap-6 xl:gap-10  px-4 md:px-[30px] lg:px-[50px] py-6 md:py-16 lg:py-[50px] items-center justify-between">
            <div className="flex w-full xl:w-1/2 h-full items-center justify-center gap-4">
              <div className="flex-col space-y-2 items-center hidden md:block">
                {product.thumbnails.map((thumb, i) => (
                  <img
                    key={i}
                    src={thumb}
                    alt="thumb"
                    className="w-[48px] h-[48px] sm:w-[60px] sm:h-[60px] md:w-[68px] md:h-[68px] pb-2 cursor-pointer border-b"
                    onClick={() =>
                      setActiveImage((prev) => ({ ...prev, [product.id]: thumb }))
                    }
                  />
                ))}
              </div>

              <div className="w-full xl:w-auto flex items-center justify-center">
                <img
                  src={activeImage[product.id] || product.image}
                  alt="main"
                  className="featured-product-image max-h-[400px] md:max-h-[600px] xl:max-h-[700px] w-full max-w-[400px] md:max-w-[500px] object-contain transition-all duration-300"
                />
              </div>
            </div>

            <div className="flex flex-row space-x-3 items-start md:hidden block">
              {product.thumbnails.map((thumb, i) => (
                <img
                  key={i}
                  src={thumb}
                  alt="thumb"
                  className="w-[60px] h-[60px] pb-2 cursor-pointer border-b"
                  onClick={() =>
                    setActiveImage((prev) => ({ ...prev, [product.id]: thumb }))
                  }
                />
              ))}
            </div>

            <div className="w-full lg:w-[885px] xl:w-1/2 space-y-4 md:space-y-5">
              <h2 className="product-heading text-[28px] sm:text-[36px] lg:text-[40px] xl:text-[48px] font-semibold">{product.heading}</h2>
              <div className="text-yellow-400 text-sm sm:text-base">⭐⭐⭐⭐☆ | 12 Ratings</div>
              <p className="text-[24px] sm:text-[28px] md:text-[32px] font-semibold">MRP: ₹{product.mrp}</p>
              <p className="text-[14px] sm:text-[15px] md:text-[16px] text-gray-700 whitespace-pre-line">
                {product.description}
              </p>

              <div className="space-y-4">
                <div className="flex items-center w-full">
                  <div className="border-1 border-black px-4 py-2 mr-1 rounded-[4px]">
                    <img src="/assets/featured/cartstar.svg" alt="cart-star" className="w-5 h-5" />
                  </div>
                  <button className="text-sm font-semibold border-1 px-4 py-2 w-full rounded-[4px] border-black cursor-pointer">
                    Add to Cart
                  </button>
                </div>
                <button className="bg-black cursor-pointer rounded-[4px] text-white w-full px-4 py-3 flex items-center justify-center gap-2">
                  Buy Now
                  <img src="/assets/featured/buynowsvg.svg" alt="buy-now" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
