'use client';

import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useCart } from '@/contexts/CartContext.jsx';
import FeaturedProductCard from '@/components/ui/FeaturedProductCard';
import { useRouter } from 'next/navigation';
import { ProductService } from '@/lib/service/productService';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export default function FeaturedProducts() {
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const { addToCart } = useCart();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('Fetching featured products...');
        const response = await ProductService.getProducts({ limit: 4 });
        console.log('Fetched products:', response);
        setProducts(response.products);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Enhanced scroll animations from original component
  useLayoutEffect(() => {
    const sections = sectionRefs.current.filter(Boolean);
    const wrapper = document.querySelector('#smooth-wrapper');
    const content = document.querySelector('#smooth-content');
    const is480px = window.innerWidth <= 480;
    const isMobile = window.innerWidth <= 768;

    const initScrollAnimations = () => {
      // Clean up existing scroll triggers
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      if (ScrollSmoother.get()) ScrollSmoother.get().kill();

      // Initialize ScrollSmoother if wrapper and content exist
      if (wrapper && content) {
        ScrollSmoother.create({
          wrapper,
          content,
          smooth: is480px ? 0.01 : isMobile ? 0.03 : 0.8,
          smoothTouch: is480px ? 0.01 : 0.02,
          normalizeScroll: true,
          ignoreMobileResize: true,
          effects: true,
        });
      }

      sections.forEach((section, index) => {
        if (index === sections.length - 1) return;

        // Pin each section except the last one
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

        // Handle sticky heading animation
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

      // Set the last section to have higher z-index
      const lastSection = sections[sections.length - 1];
      if (lastSection) {
        gsap.set(lastSection, { zIndex: 100, position: 'relative' });
      }

      // Add parallax effect to product images
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

    // Delay initialization to ensure DOM is ready
    setTimeout(() => {
      requestAnimationFrame(() => {
        initScrollAnimations();
      });
    }, 50);

    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      if (ScrollSmoother.get()) ScrollSmoother.get().kill();
      sections.forEach(section => {
        const heading = section.querySelector('.product-heading');
        if (heading) resetHeading(heading);
      });
    };
  }, [products]); // Re-run when products change

  // Apply sticky heading styles
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

  // Reset heading styles
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

  const handleAddToCart = async (item) => {
    try {
      const success = await addToCart(item.product, item.variant, item.quantity);
      if (!success) {
        throw new Error('Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleBuyNow = async (item) => {
    try {
      const success = await addToCart(item.product, item.variant, item.quantity);
      if (!success) {
        throw new Error('Failed to add item to cart');
      }
      router.push('/checkout');
    } catch (error) {
      console.error('Error in buy now:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[700px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-[700px] flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="w-full min-h-[700px] flex items-center justify-center">
        <div className="text-gray-500">No featured products available</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full my-20">
      {products.map((product, idx) => (
        <div
          key={product.id}
          ref={(el) => (sectionRefs.current[idx] = el)}
          className="w-full pt-0 overflow-hidden bg-white border-y border-black featured-product-section min-h-[700px]"
        >
          <FeaturedProductCard
            product={product}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            className="w-full"
          />
        </div>
      ))}
    </div>
  );
}
