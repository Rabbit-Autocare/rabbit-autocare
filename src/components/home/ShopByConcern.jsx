'use client'

import Image from 'next/image'
import Link from 'next/link'

const concernLinks = [
  {
    title: 'Lost the Spark?',
    description: 'Bring back the deep, dark curves. Faded trims don’t stand a chance.',
    image: '/assets/about/img/1.jpeg',
    ids: '4,6',
  },
  {
    title: 'Feeling a Little Dirty?',
    description: 'A quick rinse or a deep cleanse — let’s get you spotless again.',
    image: '/assets/about/img/2.jpeg',
    ids: '8,9',
  },
  {
    title: 'Can’t See You Clearly',
    description: 'Wipe away the blur. Let those eyes meet, windshield to windshield.',
    image: '/assets/about/img/3.jpg',
    ids: '10,11',
  },
  {
    title: 'Craving That Touch-Up?',
    description: 'Gloss up. Glide smooth. Make them look twice.',
    image: '/assets/about/img/4.jpg',
    ids: '12,13',
  },
];

const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

    export default function ShopByConcern() {
      return (
        <div className="max-w-[1240px] mx-auto px-4 pb-[60px]">

          <h2 className="text-[30px] md:text-[42px] text-black font-bold mb-6">Shop By Concern</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {concernLinks.map((item, index) => (
              <Link
                key={index}
                href={`/shop/all?ids=${item.ids}`}
                className="block focus:outline-none focus:ring-2 focus:ring-black rounded-xl"
                tabIndex={0}
              >
                <div className="relative rounded-xl overflow-hidden shadow-md group cursor-pointer h-[250px] sm:h-[280px] md:h-[300px] lg:h-[320px]">
                  <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-black/70 transition-opacity duration-300 group-hover:bg-black/20"></div>
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  {/* Black overlay layer */}
                  <div className="absolute inset-0 bg-black/30 transition-opacity duration-300 group-hover:bg-black/20"></div>

                  {/* Always visible heading at bottom left for desktop, hide on hover */}
                  <div className="hidden lg:block absolute bottom-0 left-0 w-full px-4 pb-8 pt-10 z-10 flex flex-col items-start transition-all duration-300 group-hover:opacity-0 group-hover:pointer-events-none">
                    <h3 className="font-semibold text-lg tracking-wide text-white drop-shadow-lg mb-0">
                      {item.title}
                    </h3>
                  </div>

                  {/* Overlay: Always visible on mobile, hover on desktop */}
                  <div className="absolute inset-0 flex items-end pointer-events-none">
                    {/* Mobile: Always visible overlay */}
                    <div className="w-full px-4 pb-4 pt-6 rounded-xl flex flex-col items-start pointer-events-auto
                      bg-gradient-to-t from-black/90 via-black/60 to-black/10
                      opacity-100 translate-y-0 block lg:hidden transition-all duration-400">
                      <h3 className="font-semibold text-base sm:text-lg tracking-wide text-white mb-1 text-left">
                        {item.title}
                      </h3>
                      <p className="text-white text-sm sm:text-base text-left whitespace-normal break-words">
                        {item.description}
                      </p>
                    </div>

                    {/* Desktop: Overlay with heading and description on hover only */}
                    <div className="w-full h-full px-4 pb-8 pt-50  flex-col items-start pointer-events-auto
                      bg-gradient-to-t from-black/90  to-black/10
                      opacity-0 translate-y-8 hidden lg:flex group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400">
                      <h3 className="font-semibold text-lg tracking-wide text-white mb-2 text-left group-hover:translate-y-0 translate-y-6 transition-all duration-400">
                        {item.title}
                      </h3>
                      <p className="text-white text-base text-left whitespace-normal break-words">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )
    }
