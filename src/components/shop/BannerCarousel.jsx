import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Example banner slides (replace with your own)
const banners = [
  {
    image: "https://ubnifppknfszvqkxqbfp.supabase.co/storage/v1/object/public/staticimages/banner/firstbanner.png",
    title: "Premium Car Care",
    subtitle: "Get 30% OFF on all essentials!",
    cta: "Shop Now",
    ctaLink: "/shop"
  },
  {
    image: "https://ubnifppknfszvqkxqbfp.supabase.co/storage/v1/object/public/staticimages/banner/banner2.png",
    title: "Detailing Tools",
    subtitle: "Professional tools for your car.",
    cta: "Explore",
    ctaLink: "/shop"
  },
  {
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=1440&q=80",
    title: "Luxury Accessories",
    subtitle: "Upgrade your driving experience.",
    cta: "Discover",
    ctaLink: "/shop"
  }
];

const BannerCarousel = ({
  autoSlideInterval = 5000,
  showControls = false,
  showDots = false
}) => {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, autoSlideInterval);
    return () => clearInterval(interval);
  }, [isAutoPlaying, autoSlideInterval]);

  const next = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prev = () => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className="relative w-full  max-w-[1440px] mx-auto h-[200px] md:h-[300px] overflow-hidden rounded-lg shadow-lg">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={banners[current].image}
            alt={banners[current].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex flex-col justify-center items-start px-8">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">{banners[current].title}</h2>
            <p className="text-lg md:text-2xl text-white mb-4">{banners[current].subtitle}</p>
            <a
              href={banners[current].ctaLink}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition"
            >
              {banners[current].cta}
            </a>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      {showControls && banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/60 hover:bg-white/80 rounded-full p-2"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/60 hover:bg-white/80 rounded-full p-2"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`w-3 h-3 rounded-full ${idx === current ? "bg-white" : "bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;
