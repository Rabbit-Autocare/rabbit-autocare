'use client';

import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { featuredProducts } from '../../Data/featuredProductsData';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ChevronLeft, ChevronRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export default function FeaturedProducts() {
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const [imageSlideMap, setImageSlideMap] = useState({});
  const [activeImageIndex, setActiveImageIndex] = useState({});

  const handleImageSwipe = (productId, direction, thumbnails) => {
    const currentIndex = activeImageIndex[productId] || 0;
    const nextIndex =
      direction === 'next'
        ? (currentIndex + 1) % thumbnails.length
        : (currentIndex - 1 + thumbnails.length) % thumbnails.length;

    setImageSlideMap((prev) => ({
      ...prev,
      [productId]: {
        from: currentIndex,
        to: nextIndex,
        direction,
      },
    }));

    setTimeout(() => {
      setActiveImageIndex((prev) => ({ ...prev, [productId]: nextIndex }));
      setImageSlideMap((prev) => ({ ...prev, [productId]: null }));
    }, 600);
  };

  useLayoutEffect(() => {
    const sections = sectionRefs.current.filter(Boolean);
    const wrapper = document.querySelector('#smooth-wrapper');
    const content = document.querySelector('#smooth-content');
    const is480px = window.innerWidth <= 480;
    const isMobile = window.innerWidth <= 768;

    const initScrollAnimations = () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      if (ScrollSmoother.get()) ScrollSmoother.get().kill();

      ScrollSmoother.create({
        wrapper,
        content,
        smooth: is480px ? 0.01 : isMobile ? 0.03 : 0.8,
        smoothTouch: is480px ? 0.01 : 0.02,
        normalizeScroll: true,
        ignoreMobileResize: true,
        effects: true,
      });

      sections.forEach((section, index) => {
        if (index === sections.length - 1) return;

        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: () => {
            const nextSection = sections[index + 1];
            return nextSection && index === sections.length - 2 ? 'bottom top+=100' : 'bottom top+=140';
          },
          pin: true,
          pinSpacing: false,
        });

        const heading = section.querySelector('.product-heading');
        if (heading && index < sections.length - 1) {
          const nextSection = sections[index + 1];
          if (nextSection) {
            ScrollTrigger.create({
              trigger: nextSection,
              start: 'top top',
              end: () => {
                const sectionAfterNext = sections[index + 2];
                return sectionAfterNext ? 'bottom top+=50' : 'bottom bottom';
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
        gsap.set(lastSection, { zIndex: 100, position: 'relative' });
      }

      sections.forEach((section) => {
        const img = section.querySelector('.featured-product-image');
        if (img) {
          gsap.to(img, {
            y: '-0%',
            scrollTrigger: {
              trigger: section,
              start: 'top center',
              end: 'bottom top',
              scrub: is480px ? 0.5 : isMobile ? 0.8 : 2,
            },
          });
        }
      });
    };

    setTimeout(() => {
      requestAnimationFrame(() => {
        initScrollAnimations();
      });
    }, 50);

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      if (ScrollSmoother.get()) ScrollSmoother.get().kill();
      sections.forEach(section => {
        const heading = section.querySelector('.product-heading');
        if (heading) resetHeading(heading);
      });
    };
  }, []);

  const applyStickyHeading = (heading) => {
    const isUltraWide = window.innerWidth >= 1920;
    gsap.set(heading, {
      position: 'fixed',
      top: isUltraWide ? '40px' : '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 200,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      padding: '8px 20px',
      borderRadius: '8px',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      width: 'auto',
      maxWidth: '80vw',
      textAlign: 'center',
    });
  };

  const resetHeading = (heading) => {
    gsap.set(heading, {
      position: 'static',
      top: 'auto',
      left: 'auto',
      transform: 'none',
      zIndex: 'auto',
      background: 'transparent',
      backdropFilter: 'none',
      padding: '0',
      borderRadius: '0',
      border: 'none',
      boxShadow: 'none',
      width: 'auto',
      maxWidth: 'none',
      textAlign: 'left',
    });
  };

  return (
    <div ref={containerRef} className="relative w-full my-20">
      {featuredProducts.map((product, idx) => {
        const thumbnails = product.thumbnails;
        const activeIndex = activeImageIndex[product.id] || 0;
        const activeSrc = thumbnails[activeIndex] || product.image;
        const slideData = imageSlideMap[product.id];
        const prevIndex = slideData?.from;
        const nextIndex = slideData?.to;
        const dir = slideData?.direction;

        return (
          <div
            key={product.id}
            ref={(el) => (sectionRefs.current[idx] = el)}
            className="w-full pt-0 overflow-hidden bg-white border-y border-black featured-product-section min-h-[700px]"
          >
            <div className="flex flex-col xl:flex-row gap-6 px-4 md:px-[30px] lg:px-[50px] py-6 md:py-16 lg:pt-[50px] lg:pb-[0px] items-center justify-between">
              <div className="flex w-full xl:w-1/2 items-center justify-center sm:gap-4">
                <div className="flex-col space-y-2 items-center hidden md:block">
                  {thumbnails.map((thumb, i) => (
                    <img
                      key={i}
                      src={thumb}
                      alt="thumb"
                      onClick={() => setActiveImageIndex((prev) => ({ ...prev, [product.id]: i }))}
                      className={`w-[50px] h-[40px] xl:w-[68px] xl:h-[55px] cursor-pointer transition-all duration-200 ease-in-out ring-2 ${
                        activeIndex === i ? 'ring-black opacity-100' : 'ring-transparent opacity-50'
                      }`}
                    />
                  ))}
                </div>

                <div className="relative w-[460px] h-[200px] sm:w-[500px] sm:h-[350px] md:w-[500px] md:h-[320px] lg:w-[600px] lg:h-[300px] xl:w-[600px] xl:h-[600px] flex items-center justify-center overflow-hidden">

  {/* Left Glass Panel */}
  <div className="absolute left-0 top-0 w-[80px] h-full z-10 pointer-events-none">
    <div className="w-full h-full  rounded-none" />
  </div>

  {/* Right Glass Panel */}
  <div className="absolute right-0 top-0 w-[80px] h-full z-10 pointer-events-none">
    <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-none" />
  </div>

  {/* Left Button */}
  <button
    onClick={() => handleImageSwipe(product.id, 'prev', thumbnails)}
    className="absolute z-20  left-2 rounded-full bg-white/10 backdrop-blur-xs   shadow p-2 transition"
  >
    <ChevronLeft className="w-5 h-5 text-black cursor-pointer" />
  </button>

  {/* Image Slide Content */}
  <div className="w-full h-full relative z-10">
    {slideData ? (
      <>
        <img
          key={`prev-${prevIndex}`}
          src={thumbnails[prevIndex]}
          className={`absolute w-full h-full object-contain transition-transform duration-1000 ease-in-out ${
            dir === 'next' ? '-translate-x-full' : 'translate-x-full'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.45, 0, 0.55, 1)' }}
        />
        <img
          key={`next-${nextIndex}`}
          src={thumbnails[nextIndex]}
          className="absolute w-full h-full object-contain transition-transform duration-1000 ease-in-out translate-x-0"
          style={{ transitionTimingFunction: 'cubic-bezier(0.45, 0, 0.55, 1)' }}
        />
      </>
    ) : (
      <img
        key={`active-${activeIndex}`}
        src={activeSrc}
        className="w-full h-full object-contain transition-all duration-500"
      />
    )}
  </div>

  {/* Right Button */}
  <button
    onClick={() => handleImageSwipe(product.id, 'next', thumbnails)}
    className="absolute  right-2 rounded-full bg-white/10 backdrop-blur-xs z-20 shadow p-2 transition"
  >
    <ChevronRight className="w-5 h-5 text-black cursor-pointer" />
  </button>
</div>


              </div>

              {/* Product Details */}
              <div className="w-full md:w-[585px] lg:w-[685px] xl:w-1/2 space-y-2 xl:space-y-5">
                <h2 className="product-heading text-[28px] sm:text-[36px] lg:text-[40px] xl:text-[48px] font-semibold tracking-wide">
                  {product.heading}
                </h2>
                <div className="flex items-center gap-1 text-[12px] md:text-sm xl:text-[12px] font-extralight text-black">
                  {[...Array(5)].map((_, i) => (
                    <img
                      key={i}
                      src={i < Math.floor(product.rating || 4) ? '/assets/featured/ratingstar1.svg' : '/assets/featured/ratingstar2.svg'}
                      alt="star"
                      className="w-4 h-4"
                    />
                  ))}
                  <span className="ml-1">| {product.totalRatings || 12} Ratings</span>
                </div>
                <p className="text-[20px] sm:text-[28px] md:text-[32px] font-medium tracking-wide">
                  <span className="font-extralight">MRP:</span> ₹{product.mrp}
                </p>
                <p className="text-[14px] sm:text-[15px] xl:text-[16px] text-black font-light tracking-wider whitespace-pre-line line-clamp-4 xl:line-clamp-none">
                  {product.description}
                </p>

                <div className="space-y-2 lg:space-y-4">
                  <div className="flex items-center w-full">
                    <div className="border-1 border-black px-4 py-2 mr-1 rounded-[4px] xl:block hidden">
                      <img src="/assets/featured/cartstar.svg" alt="cart-star" className="w-5 h-5" />
                    </div>
                    <button className="text-sm text-black font-semibold border-1 px-4 py-2 w-full rounded-[4px] border-black cursor-pointer flex items-center justify-center gap-2">
                      Add to Cart
                      <img src="/assets/featured/cartstar.svg" alt="cart-star" className="w-5 h-5 xl:hidden" />
                    </button>
                  </div>
                  <button className="bg-black cursor-pointer rounded-[4px] text-white w-full px-4 py-3 flex items-center justify-center gap-2">
                    Buy Now
                    <img src="/assets/featured/buynowsvg.svg" alt="buy-now" className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
