'use client'

import Image from 'next/image'

const concerns = [
  {
    title: 'Crystal-Clear Vision',
    description: 'Keep your windshield spotless, streak-free, and fog-proof.',
    image: '/assets/images/shop1.png',
  },
  {
    title: 'Deep-Down Clean',
    description: 'Blast away dirt, grime & spills—inside and out.',
    image: '/assets/images/shop1.png',
  },
  {
    title: 'Ultimate Protection',
    description: 'Armor up with hydrophobic shields, scratch guards & more.',
    image: '/assets/images/shop1.png',
  },
]

export default function Shop() {
  return (
    <div className="max-w-[1240px] mx-auto px-4 pb-[60px]">
      <h2 className="text-[42px] text-black font-bold mb-6">Shop By Concern</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {concerns.map((item, index) => (
          <div
            key={index}
            className={`relative rounded-xl overflow-hidden shadow-md group 
              ${index === 2 ? 'md:col-span-2 md:mx-auto md:w-1/2 lg:col-span-1 lg:mx-0 lg:w-full' : ''}`}
          >
            <Image
              src={item.image}
              alt={item.title}
              width={400}
              height={300}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent text-white p-4">
              <h3 className="font-semibold text-lg tracking-wide">{item.title}</h3>
              <p className="text-sm tracking-wide">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
