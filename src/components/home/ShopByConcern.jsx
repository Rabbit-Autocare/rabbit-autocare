'use client'

import Image from 'next/image'
import Link from 'next/link'

const concernLinks = [
  {
    title: 'Lost the Spark?',
    description: 'Bring back the deep, dark curves. Faded trims don’t stand a chance.',
    image: '/assets/images/shop1.png',
    ids: '4,6',
  },
  {
    title: 'Feeling a Little Dirty?',
    description: 'A quick rinse or a deep cleanse — let’s get you spotless again.',
    image: '/assets/images/shop1.png',
    ids: '8,9',
  },
  {
    title: 'Can’t See You Clearly',
    description: 'Wipe away the blur. Let those eyes meet, windshield to windshield.',
    image: '/assets/images/shop1.png',
    ids: '10,11',
  },
  {
    title: 'Craving That Touch-Up?',
    description: 'Gloss up. Glide smooth. Make them look twice.',
    image: '/assets/images/shop1.png',
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
            <div className="relative rounded-xl overflow-hidden shadow-md group cursor-pointer">
              <Image
                src={item.image}
                alt={item.title}
                width={400}
                height={300}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              />
              {/* Always visible heading, left-aligned at bottom, hide on hover */}
              <div className={`absolute bottom-0 left-0 w-full px-4 pb-8 pt-10 z-10 flex flex-col items-start transition-all duration-400 ${'group-hover:opacity-0 group-hover:pointer-events-none'}`}>
                <h3 className="font-semibold text-lg tracking-wide text-white drop-shadow-lg mb-0">
                  {item.title}
                </h3>
              </div>
              {/* Overlay with heading moving up and description appearing below on hover */}
              <div className="absolute inset-0 pointer-events-none flex items-end">
                <div className="w-full px-4 pb-8 pt-10 opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400 bg-gradient-to-t from-black/90 via-black/60 to-black/10 rounded-xl flex flex-col items-start pointer-events-auto">
                  <h3 className="font-semibold text-lg tracking-wide text-white mb-2 text-left group-hover:translate-y-0 translate-y-6 transition-all duration-400">
                    {item.title}
                  </h3>
                  <p className="text-white text-base text-left opacity-100 transition-opacity duration-400">
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
