'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';

const rawVideos = [
  { id: 1, src: '/assets/reel1.gif' },
  { id: 2, src: '/assets/reel2.gif' },
  { id: 3, src: '/assets/reel1.gif' },
  { id: 4, src: '/assets/reel2.gif' },
  { id: 5, src: '/assets/reel1.gif' },
  { id: 6, src: '/assets/reel2.gif' },
];

export default function Customer() {
  const trackRef = useRef(null);
  const offsetXRef = useRef(0);
  const currentIndexRef = useRef(0);

  const cardWidth = 260;
  const gap = 20;
  const fullCard = cardWidth + gap;
  const duration = 0.6;
  const videoData = rawVideos;

  const [maxOffsetX, setMaxOffsetX] = useState(0);
  const [visibleWidth, setVisibleWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(1240);
  const [currentOffsetX, setCurrentOffsetX] = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);

  // Calculate max scroll
  useEffect(() => {
    const updateSizes = () => {
      const width = window.innerWidth;
      const visibleCards =
        width <= 480 ? 1.2 : width <= 768 ? 2.5 : width <= 1024 ? 3.5 : 4.3;
      const container = 1240;
      const visibleArea = visibleCards * fullCard;

      setContainerWidth(container);
      setVisibleWidth(visibleArea);
      
      // Calculate max offset to ensure last card is fully visible
      const totalWidth = videoData.length * fullCard;
      const maxOffset = Math.max(0, totalWidth - visibleArea);
      setMaxOffsetX(maxOffset);
      
      // Calculate max index based on visible cards
      const maxIdx = Math.max(0, videoData.length - Math.floor(visibleCards));
      setMaxIndex(maxIdx);
    };

    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, []);

  // Scroll handler - now moves exactly one card at a time
  const slide = (dir) => {
    const newIndex = currentIndexRef.current + dir;
    
    // Boundary checks
    if (newIndex < 0) {
      currentIndexRef.current = 0;
    } else if (newIndex > maxIndex) {
      currentIndexRef.current = maxIndex;
    } else {
      currentIndexRef.current = newIndex;
    }

    // Calculate offset based on card index
    const newOffset = currentIndexRef.current * fullCard;
    
    // Ensure we don't exceed max offset
    offsetXRef.current = Math.min(newOffset, maxOffsetX);
    
    setCurrentOffsetX(offsetXRef.current); // trigger re-render

    gsap.to(trackRef.current, {
      x: -offsetXRef.current,
      duration,
      ease: 'power2.inOut',
    });
  };

  // Touch support
  useEffect(() => {
    const track = trackRef.current;
    gsap.set(track, { x: 0 });

    let startX = 0;
    let deltaX = 0;

    const handleTouchStart = (e) => (startX = e.touches[0].clientX);
    const handleTouchMove = (e) => (deltaX = e.touches[0].clientX - startX);
    const handleTouchEnd = () => {
      if (Math.abs(deltaX) > 50) slide(deltaX > 0 ? -1 : 1);
      startX = 0;
      deltaX = 0;
    };

    if (window.innerWidth <= 1024) {
      track.addEventListener('touchstart', handleTouchStart);
      track.addEventListener('touchmove', handleTouchMove);
      track.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      track.removeEventListener('touchstart', handleTouchStart);
      track.removeEventListener('touchmove', handleTouchMove);
      track.removeEventListener('touchend', handleTouchEnd);
    };
  }, [maxOffsetX]);

  return (
    <section className="w-full px-4 md:px-6 py-[70px] bg-white overflow-hidden">
      <div className="relative w-full max-w-[1240px] mx-auto">
        <h2 className="text-[28px] md:text-[42px] tracking-wide text-black font-bold mb-10">
          Watch what our customers say about us
        </h2>

        {/* Viewport */}
        <div className="overflow-hidden">
          <div
            ref={trackRef}
            className="flex gap-[20px]"
            style={{
              width: `${videoData.length * fullCard}px`,
              transform: 'translateZ(0)',
              willChange: 'transform',
            }}
          >
            {videoData.map((video, index) => (
              <div
                key={`${video.id}-${index}`}
                className="min-w-[260px] max-w-[260px] h-[400px] bg-black rounded overflow-hidden flex-shrink-0"
              >
                <Image
                  src={video.src}
                  alt={`reel-${video.id}`}
                  width={260}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="absolute right-0 top-full mt-4 flex items-center gap-2 z-10">
          <button
            onClick={() => slide(-1)}
            disabled={currentIndexRef.current <= 0}
            className={`p-2 cursor-pointer border rounded-full shadow transition ${
              currentIndexRef.current <= 0
                ? 'opacity-40 cursor-not-allowed'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <ChevronLeft />
          </button>

          <button
            onClick={() => slide(1)}
            disabled={currentIndexRef.current >= maxIndex}
            className={`p-2 cursor-pointer border rounded-full shadow transition ${
              currentIndexRef.current >= maxIndex
                ? 'opacity-40 cursor-not-allowed'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}