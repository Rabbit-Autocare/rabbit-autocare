'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import Image from 'next/image';

const testimonials = [
  {
    id: 1,
    name: 'Rabbit Autocare',
    date: 'May 01, 2025',
    text: 'I have been personally using it for my car and the results are very appreciative.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 2,
    name: 'Rabbit Autocare',
    date: 'May 02, 2025',
    text: 'Wow! Loved the branding, the colour of the bottles and the logo grabs all my eyes. Truly loved the branding. And product quality is also premium. I am using it on my car, activa and even in home.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 3,
    name: 'Rabbit Autocare',
    date: 'May 03, 2025',
    text: 'Nice products, premium packaging, though my order delayed by a day but completely worth waiting.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 4,
    name: 'Rabbit Autocare',
    date: 'May 04, 2025',
    text: 'Amazing branding, India is growing crazily. Premium car care products by an Indian. Feel so proud.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 5,
    name: 'Rabbit Autocare',
    date: 'May 05, 2025',
    text: 'I tried their silicone glaze for my bike and car. Amazing results, all the black parts restored and shine is not even greasy.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 6,
    name: 'Rabbit Autocare',
    date: 'May 06, 2025',
    text: 'I am a car lover, so I tried them as I loved their packaging. Products are good and feel premium. I bought the kit so get everything at a best price. Other brands are too expensive but I can say they offer somewhat same quality at a very affordable price according to indian market.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 7,
    name: 'Rabbit Autocare',
    date: 'May 07, 2025',
    text: 'I bought their product as their logo catch my eye. It brings the black shine back. It feels like I get a new activa. I am also using that dresser for my black nike shoes and it’s perfect.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 8,
    name: 'Rabbit Autocare',
    date: 'May 08, 2025',
    text: 'Microfibres are so confusing to buy. They have so many varities. So, I bought 3 diff ones 380, 800, 1200. The quality is really good. Leaves no water marks behind. Much better than the one I was using earlier.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 9,
    name: 'Rabbit Autocare',
    date: 'May 09, 2025',
    text: 'Bought Car shampoo and silicon glaze dresser. Shampoo works really good, cleans effectively and makes thick foam. Dresser is also premium and gives black shiny finish. My black Kia Seltos looks new again now. Loved there products.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 10,
    name: 'Rabbit Autocare',
    date: 'May 10, 2025',
    text: 'I ordered microfibre, glass cleaner. But my home is using it instead to clean the home. Turned it into home care instead😂.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 11,
    name: 'Rabbit Autocare',
    date: 'May 11, 2025',
    text: 'My car looked better than ever after using these products. Love them.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 12,
    name: 'Rabbit Autocare',
    date: 'May 12, 2025',
    text: 'Seeing my car all glossy and shiny after the foam washed off has to be the most satisfying thing ever🫧',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 13,
    name: 'Rabbit Autocare',
    date: 'May 13, 2025',
    text: 'My car smelled so good on the inside after using them, for once I didn\'t feel the need to use an air freshener🙂‍↕',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 14,
    name: 'Rabbit Autocare',
    date: 'May 14, 2025',
    text: 'I’ve tried a bunch of car shampoos over the years, but this one really stands out — not just because of how well it cleans, but because of cleaning satisfaction, thick foam and amazing fragrance.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 15,
    name: 'Rabbit Autocare',
    date: 'May 15, 2025',
    text: 'Super easy to use with no mess, no hassle. Foams well, smells fresh, and rinses off without streaks. Perfect for quick, effortless car washes every day!',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
];

export default function Testimonial() {
  const containerRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(2);
  const [cardWidth, setCardWidth] = useState(590);
  const [isDesktop, setIsDesktop] = useState(true);

  // Touch/Swipe state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Minimum swipe distance
  const minSwipeDistance = 50;

  // Update cards per view and card width based on screen size
  useEffect(() => {
    const updateLayout = () => {
      const width = typeof window !== 'undefined' ? window.innerWidth : 1024;

      if (width >= 1024) {
        // Desktop: 2 cards
        setCardsPerView(2);
        setCardWidth(width >= 1440 ? 590 : 480);
        setIsDesktop(true);
      } else {
        // Mobile/Tablet: 1 card
        setCardsPerView(1);
        setIsDesktop(false);
        if (width >= 768) {
          setCardWidth(700); // Tablet
        } else {
          setCardWidth(width - 38); // Mobile with padding
        }
      }
    };

    updateLayout();
    typeof window !== 'undefined' && window.addEventListener('resize', updateLayout);
    return () => typeof window !== 'undefined' && window.removeEventListener('resize', updateLayout);
  }, []);

  // Calculate the maximum index based on cards per view
  const maxIndex = testimonials.length - cardsPerView;

  const slideToIndex = (newIndex) => {
    if (newIndex >= 0 && newIndex <= maxIndex) {
      setIndex(newIndex);
      const slideDistance = cardWidth + 16; // card width + gap
      gsap.to(containerRef.current, {
        x: -newIndex * slideDistance,
        duration: 0.8,
        ease: 'power2.out',
      });
    }
  };

  const handleSlide = (direction) => {
    if (
      (direction === 'next' && index < maxIndex) ||
      (direction === 'prev' && index > 0)
    ) {
      const newIndex = direction === 'next' ? index + 1 : index - 1;
      slideToIndex(newIndex);
    }
  };

  // Touch event handlers
  const onTouchStart = (e) => {
    if (isDesktop) return; // Only enable touch on mobile/tablet
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e) => {
    if (isDesktop || !isDragging) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (isDesktop || !touchStart || !touchEnd) {
      setIsDragging(false);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && index < maxIndex) {
      // Swipe left - go to next
      slideToIndex(index + 1);
    } else if (isRightSwipe && index > 0) {
      // Swipe right - go to previous
      slideToIndex(index - 1);
    }

    setIsDragging(false);
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Reset index when cards per view changes
  useEffect(() => {
    const newMaxIndex = testimonials.length - cardsPerView;
    if (index > newMaxIndex) {
      slideToIndex(newMaxIndex);
    }
  }, [cardsPerView, cardWidth, index]);

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <h2 className="text-[28px] md:text-[42px] tracking-wide font-bold">Our Testimonials</h2>
        <p className="max-w-md tracking-wide text-[14px] md:text-[16px] font-normal text-black leading-relaxed">
          Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra.
        </p>
      </div>

      <div
        className="relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: isDesktop ? 'auto' : 'pan-y' }} // Allow vertical scroll but control horizontal
      >
        <div className="flex w-max gap-4" ref={containerRef}>
          {testimonials.map((item, i) => {
            // SSR-safe: Only use window on client
            let isClient = typeof window !== 'undefined';
            let width = isClient ? window.innerWidth : 1024;
            let cardHeight = width >= 768 ? '360px' : '350px';
            let avatarSize = width >= 768 ? 80 : 60;
            let quoteSize = width >= 768 ? 110 : 50;
            return (
              <div
                key={item.id}
                className="border border-black rounded-[30px] p-4 md:p-6 flex-shrink-0"
                style={{
                  width: `${cardWidth}px`,
                  height: cardHeight,
                  userSelect: isDragging ? 'none' : 'auto' // Prevent text selection while dragging
                }}
              >
                <div className="flex items-center mb-4">
                  <Image
                    src={item.avatar}
                    alt="avatar"
                    width={avatarSize}
                    height={avatarSize}
                    className="mr-3"
                    draggable={false} // Prevent image dragging
                  />
                  <div className="flex-1">
                    <p className="text-[16px] md:text-[18px] tracking-wide text-black font-medium">{item.name}</p>
                    <p className="text-[14px] md:text-[18px] tracking-wide text-[#545454]">{item.date}</p>
                  </div>
                  <Image
                    src={item.quote}
                    alt="quote"
                    width={quoteSize}
                    height={quoteSize}
                    className="ml-auto"
                    draggable={false} // Prevent image dragging
                  />
                </div>
                <p className="text-[14px] md:text-[16px] tracking-wide italic text-[#646464] leading-normal" style={{ textAlign: 'justify', textAlignLast: 'right', textIndent: '28%' }}>
                  "{item.text}"
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation buttons - always visible */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          onClick={() => handleSlide('prev')}
          className={`p-2 cursor-pointer md:p-3 border rounded-full transition-opacity ${
            index === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
          }`}
          disabled={index === 0}
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button
          onClick={() => handleSlide('next')}
          className={`p-2 cursor-pointer md:p-3 border rounded-full transition-opacity ${
            index >= maxIndex ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
          }`}
          disabled={index >= maxIndex}
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>
    </div>
  );
}
