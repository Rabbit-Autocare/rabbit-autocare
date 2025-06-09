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
    text: '                                       Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra. Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra. Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 2,
    name: 'Rabbit Autocare',
    date: 'May 01, 2025',
    text: '                                       Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra. Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra. Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 3,
    name: 'Rabbit Autocare',
    date: 'May 01, 2025',
    text: '                                       "Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra. Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra. Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra."',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 4,
    name: 'Rabbit Autocare',
    date: 'May 01, 2025',
    text: '                                       "Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra. Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra. Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra."',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 5,
    name: 'Rabbit Autocare',
    date: 'May 01, 2025',
    text: '                                       Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra. Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra. Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 6,
    name: 'Rabbit Autocare',
    date: 'May 01, 2025',
    text: '                                       Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra. Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra. Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 7,
    name: 'Rabbit Autocare',
    date: 'May 01, 2025',
    text: '                                       Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra. Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra. Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
  {
    id: 8,
    name: 'Rabbit Autocare',
    date: 'May 01, 2025',
    text: 'Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra. Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra. Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra.',
    avatar: '/assets/testimonial1.svg',
    quote: '/assets/testimonial2.svg',
  },
];

export default function Testimonial() {
  const containerRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(2);
  const [cardWidth, setCardWidth] = useState(590);

  // Update cards per view and card width based on screen size
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      
      if (width >= 1024) {
        // Desktop: 2 cards
        setCardsPerView(2);
        setCardWidth(width >= 1440 ? 590 : 480); // Larger cards on bigger screens
      } else {
        // Mobile/Tablet: 1 card
        setCardsPerView(1);
        if (width >= 768) {
          setCardWidth(700); // Tablet
        } else {
          setCardWidth(width - 38); // Mobile with padding
        }
      }
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  // Calculate the maximum index based on cards per view
  const maxIndex = testimonials.length - cardsPerView;

  const handleSlide = (direction) => {
    if (
      (direction === 'next' && index < maxIndex) ||
      (direction === 'prev' && index > 0)
    ) {
      const newIndex = direction === 'next' ? index + 1 : index - 1;
      setIndex(newIndex);
      
      // Calculate slide distance based on card width and gap
      const slideDistance = cardWidth + 16; // card width + gap
      
      gsap.to(containerRef.current, {
        x: -newIndex * slideDistance,
        duration: 0.8,
        ease: 'power2.out',
      });
    }
  };

  // Reset index when cards per view changes
  useEffect(() => {
    const newMaxIndex = testimonials.length - cardsPerView;
    if (index > newMaxIndex) {
      setIndex(newMaxIndex);
      const slideDistance = cardWidth + 16;
      gsap.to(containerRef.current, {
        x: -newMaxIndex * slideDistance,
        duration: 0.8,
        ease: 'power2.out',
      });
    }
  }, [cardsPerView, cardWidth, index]);

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <h2 className="text-[28px] md:text-[42px] tracking-wide font-bold">Our Testimonials</h2>
        <p className="max-w-md tracking-wide text-[14px] md:text-[18px] font-normal text-black">
          Lorem ipsum dolor sit amet consectetur. Pharetra arcu phasellus a facilisi libero eu lobortis. Non eros pharetra.
        </p>
      </div>

      <div className="relative overflow-hidden">
        <div className="flex w-max gap-4" ref={containerRef}>
          {testimonials.map((item, i) => (
            <div 
              key={item.id} 
              className="border rounded-xl p-4 md:p-6 flex-shrink-0"
              style={{ 
                width: `${cardWidth}px`,
                height: window.innerWidth >= 768 ? '360px' : '350px'
              }}
            >
              <div className="flex items-center mb-4">
                <Image 
                  src={item.avatar} 
                  alt="avatar" 
                  width={window.innerWidth >= 768 ? 80 : 60} 
                  height={window.innerWidth >= 768 ? 80 : 60} 
                  className="mr-3" 
                />
                <div className="flex-1">
                  <p className="text-[16px] md:text-[18px] tracking-wide text-black font-medium">{item.name}</p>
                  <p className="text-[14px] md:text-[18px] tracking-wide text-[#545454]">{item.date}</p>
                </div>
                <Image
                  src={item.quote}
                  alt="quote"
                  width={window.innerWidth >= 768 ? 110 : 50}
                  height={window.innerWidth >= 768 ? 110 : 50}
                  className="ml-auto"
                />
              </div>
              <p className="text-[14px] md:text-[16px] tracking-wide italic text-right text-gray-600 leading-relaxed">
                "{item.text}"
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          onClick={() => handleSlide('prev')}
          className={`p-2 md:p-3 border rounded-full transition-opacity ${
            index === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
          }`}
          disabled={index === 0}
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button
          onClick={() => handleSlide('next')}
          className={`p-2 md:p-3 border rounded-full transition-opacity ${
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