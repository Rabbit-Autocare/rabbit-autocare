'use client';
import { useEffect, useRef, useState } from 'react';

const images = [
  '/assets/images/carinterior.png',
  '/assets/about/img/mission.png',
  '/assets/images/carinterior.png',
  '/assets/about/img/mission.png',
];

const titles = ['Interior', 'Exterior', 'Fiber Cloth', 'Kits & Combos'];

export default function CarInterior() {
  const [current, setCurrent] = useState(0);
  const [displayedTitle, setDisplayedTitle] = useState(titles[0]);
  const [titleOpacity, setTitleOpacity] = useState(1);
  const cardRefs = useRef([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getVisibleIndexes = () => {
    return [-1, 0, 1].map(
      (offset) => (current + offset + images.length) % images.length
    );
  };

  const visibleIndexes = getVisibleIndexes();

  useEffect(() => {
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const isCenter = i === 1;
      card.style.opacity = isCenter ? '1' : '0.3';
      card.style.width = isCenter ? '558px' : '292px';
      card.style.height = isCenter ? '290px' : '152px';
      card.style.zIndex = isCenter ? '20' : '10';
      card.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      card.style.transform = 'translateX(0px)';
    });
  }, [current]);

  const animateTransition = (direction) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTitleOpacity(0); // fade out title

    cardRefs.current.forEach((card, i) => {
      if (!card) return;

      let moveOffset, targetOpacity, targetWidth, targetHeight, targetZIndex;

      if (direction === 1) {
        if (i === 0) {
          moveOffset = -400;
          targetOpacity = '0';
          targetWidth = '292px';
          targetHeight = '152px';
          targetZIndex = '5';
        } else if (i === 1) {
          moveOffset = -332;
          targetOpacity = '0.3';
          targetWidth = '292px';
          targetHeight = '152px';
          targetZIndex = '10';
        } else {
          moveOffset = -332;
          targetOpacity = '1';
          targetWidth = '558px';
          targetHeight = '290px';
          targetZIndex = '20';
        }
      } else {
        if (i === 0) {
          moveOffset = 332;
          targetOpacity = '1';
          targetWidth = '558px';
          targetHeight = '290px';
          targetZIndex = '20';
        } else if (i === 1) {
          moveOffset = 332;
          targetOpacity = '0.3';
          targetWidth = '292px';
          targetHeight = '152px';
          targetZIndex = '10';
        } else {
          moveOffset = 400;
          targetOpacity = '0';
          targetWidth = '292px';
          targetHeight = '152px';
          targetZIndex = '5';
        }
      }

      card.style.transform = `translateX(${moveOffset}px)`;
      card.style.opacity = targetOpacity;
      card.style.width = targetWidth;
      card.style.height = targetHeight;
      card.style.zIndex = targetZIndex;
    });

    setTimeout(() => {
      const newIndex =
        direction === 1
          ? (current + 1) % images.length
          : (current - 1 + images.length) % images.length;

      setCurrent(newIndex);
      setDisplayedTitle(titles[newIndex]);

      setTimeout(() => {
        cardRefs.current.forEach((card) => {
          if (!card) return;
          card.style.transform = 'translateX(0px)';
        });

        setTimeout(() => {
          setTitleOpacity(1); // fade in title
          setIsAnimating(false);
        }, 100);
      }, 50);
    }, 600);
  };

  const next = () => animateTransition(1);
  const prev = () => animateTransition(-1);

  return (
    <div className="relative w-full h-[500px] xl:h-[600px] py-16 flex flex-col items-center overflow-hidden bg-white">
      {/* ✅ Dynamic Background Text with Fade */}
      <div
        className="absolute bottom-[102px] md:bottom-[70px] lg:bottom-14 xl:bottom-30 font-extrabold text-gray-100 uppercase       pointer-events-none select-none z-0 text-center w-full px-4 tracking-wider"
        style={{
          fontSize: 'clamp(24px, 10vw, 136px)',
          opacity: titleOpacity,
          transition: 'opacity 0.1s ease-out',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {displayedTitle}
      </div>


      {/* Cards Container */}
      <div className="flex justify-center items-center gap-6 w-full h-[350px] z-10 md:px-0 px-4 xl:px-4">
        {visibleIndexes.map((imageIndex, i) => {
          if (isMobile && i !== 1) return null;
          return (
            <div
              key={`${imageIndex}-${current}-${i}`}
              ref={(el) => (cardRefs.current[i] = el)}
              className="overflow-hidden shadow-lg"
              style={{
                width: i === 1 ? 558 : 292,
                height: i === 1 ? 290 : 152,
                opacity: i === 1 ? 1 : 0.3,
                zIndex: i === 1 ? 20 : 10,
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                display: isMobile && i !== 1 ? 'none' : 'block',
              }}
            >
              <img
                src={images[imageIndex]}
                alt={`Car ${imageIndex}`}
                className="w-full h-full object-cover"
              />
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="relative mt-10 z-10 w-full flex justify-center">
        <div className="relative flex items-center justify-center w-[350px]">
          <button
            onClick={prev}
            disabled={isAnimating}
            className="absolute left-0 text-4xl w-10 h-10 flex items-center justify-center md:mt-10 xl:mt-16 cursor-pointer"
          >
            ‹
          </button>

          <h2
            className="text-2xl tracking-wider md:mt-10 xl:mt-16 font-bold text-black text-center mx-12 transition-all duration-500  ease-in-out whitespace-nowrap overflow-hidden text-ellipsis"
            style={{
              maxWidth: isMobile ? '292px' : '558px',
            }}
          >
            {`Car ${titles[current]}`}
          </h2>


          <button
            onClick={next}
            disabled={isAnimating}
            className="absolute right-0 text-4xl w-10 h-10 flex items-center justify-center md:mt-10 xl:mt-16 cursor-pointer"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
