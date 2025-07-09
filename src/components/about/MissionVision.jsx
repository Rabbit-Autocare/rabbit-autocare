'use client'

import Image from 'next/image'

export default function MissionVision() {
  return (
    <section className="w-full flex justify-center px-2  lg:px-10 xl:px-2 py-10 lg:py-16">
      <div className="max-w-[1240px] w-full space-y-20 md:space-y-32">

        {/* Mission */}
        {/* Mobile/Tablet Version */}
        <div className="block lg:hidden space-y-6  ">
          {/* Heading + Icon */}
          <div className="flex items-center gap-2">
            <h2 className="text-[50px] md:text-[56px] px-4 md:px-16 font-bold">
              <span className="bg-gradient-to-r from-[#601E8D] tracking-wide to-black bg-clip-text text-transparent">Mission</span>
            </h2>
            <Image src="/assets/about/svg/purple_shine.svg" alt="Star Icon" width={28} height={38} className='-mb-16 -ml-2 ' />
          </div>

          {/* Image with layered boxes */}
          <div className="relative w-[304.13px] md:w-[552px] h-[192px] mx-auto mt-14 ">
            <div className="absolute md:-top-5 md:-right-7 -right-5 -top-5 w-full h-full bg-gradient-to-br from-[#601E8D]/22 to-[#601E8D]/20 rounded-[20px] z-0" />
            <div className="absolute md:top-5 md:right-7 right-5 top-5 w-full h-full bg-gradient-to-br from-[#601E8D]/10 to-[#601E8D]/10 rounded-[20px] z-0" />
            <div className="relative z-10 rounded-[20px] w-full h-full overflow-hidden">
              <Image
                src="/assets/about/img/mission.png"
                alt="Car Interior"
                fill
                style={{ objectFit: 'cover' }}
                className="rounded-[20px]"
              />
            </div>
          </div>
          {/* Star below image, aligned to right */}
          <div className="flex justify-end pr-4">
            <Image
              src="/assets/about/svg/purple_shine.svg"
              alt="Star Icon"
              width={28}
              height={38}
              className="-mt-3"
            />
          </div>


          {/* Description */}
          <div className="flex gap-2 md:gap-4 px-4 md:px-16">
            {/* <Image src="/assets/purple_shine.svg" alt="Star Icon" width={20} height={20} className="mt-1" /> */}
            <p className="text-[16px] text-[#1A1A1A] tracking-wide md:w-[600px] leading-relaxed">
            At Rabbit Auto Care, our mission is to elevate car care into a lifestyle. We design every product to deliver standout performance, visual impact, and tactile luxury. From label to liquid, we create with purpose — no filler, no fluff. We’re here to set a new standard: where every detail is curated, and every finish feels personal, powerful, and premium.
            </p>
          </div>
        </div>

        {/* Desktop Version */}
        <div className="hidden lg:flex items-start justify-between gap-12 lg:gap-0 xl:gap-12">
          {/* Left Text */}
          <div className="relative flex-1">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-[64px] font-bold tracking-wide">
                <span className="bg-gradient-to-r from-[#601E8D] to-black bg-clip-text text-transparent">Mission</span>
              </h2>
              <Image src="/assets/about/svg/purple_shine.svg" alt="Star Icon" width={28} height={38} className="-mt-14" />
            </div>
            <div className="flex gap-2">
              <p className="text-[16px] text-[#1A1A1A] leading-relaxed xl:mr-0 lg:mr-5">
              At Rabbit Auto Care, our mission is to elevate car care into a lifestyle. We design every product to deliver standout performance, visual impact, and tactile luxury. From label to liquid, we create with purpose — no filler, no fluff. We’re here to set a new standard: where every detail is curated, and every finish feels personal, powerful, and premium.
              </p>
              <Image src="/assets/about/svg/purple_shine.svg" alt="Star Icon" width={28} height={38} className="mt-24 xl:block hidden" />
            </div>
          </div>

          {/* Right Image */}
          <div className="relative flex-1 max-w-[313px] h-[192px] xl:mr-0 lg:mr-4 lg:mt-16 xl:mt-0">
            {/* Layer 1 */}
<div className="absolute -top-5 -right-6 w-full h-full bg-gradient-to-br from-[#601E8D]/22 to-[#601E8D]/20 rounded-[20px] z-0" />
{/* Layer 2 */}
<div className="absolute top-5 right-6 w-full h-full bg-gradient-to-br from-[#601E8D]/10 to-[#601E8D]/10 rounded-[20px] z-0" />

            <div className="relative z-10 rounded-[20px] overflow-hidden">
              <Image
                src="/assets/about/img/mission.png"
                alt="Car Interior"
                width={500}
                height={300}
                className="rounded-[20px]"
              />
            </div>
          </div>
          <Image src="/assets/about/svg/purple_shine.svg" alt="Star Icon" width={28} height={38} className="mt-[260px]  xl:hidden block" />
        </div>

        {/* Vision */}
        {/* Mobile/Tablet Version */}
        <div className="block lg:hidden space-y-6">
          {/* Heading */}
          <div className="relative w-fit">
                       <h2 className="text-[50px] md:text-[56px] px-4 md:px-16 font-bold">
              <span className="bg-gradient-to-r from-[#601E8D] to-black bg-clip-text text-transparent">Vision</span>
            </h2>
            <Image src="/assets/about/svg/purple_shine.svg" alt="Star Icon" width={28} height={38} className="absolute left-[100%] top-[65%] mt-2" />
          </div>

          {/* Image */}
<div className="relative w-[304.13px] md:w-[552px] h-[192px] mx-auto mt-14">
            <div className="absolute md:-top-5 md:-right-7 -right-5 -top-5 w-full h-full bg-gradient-to-br from-[#601E8D]/22 to-[#601E8D]/20 rounded-[20px] z-0" />
            <div className="absolute md:top-5 md:right-7 right-5 top-5 w-full h-full bg-gradient-to-br from-[#601E8D]/10 to-[#601E8D]/10 rounded-[20px] z-0" />
            <div className="relative z-10 rounded-[20px] w-full h-full overflow-hidden">
              <Image
                src="/assets/about/img/mission.png"
                alt="Car Interior"
                fill
                style={{ objectFit: 'cover' }}
                className="rounded-[20px]"
              />
            </div>
          </div>
           {/* Star below image, aligned to right */}
          <div className="flex justify-end pr-4">
            <Image
              src="/assets/about/svg/purple_shine.svg"
              alt="Star Icon"
              width={28}
              height={38}
              className="-mt-3"
            />
          </div>

          {/* Description */}
          <div className="flex gap-2 px-4 md:gap-4 md:px-16">

            <p className="text-[16px] tracking-wide md:w-[600px] text-[#1A1A1A] leading-relaxed">
            Rabbit Auto Care envisions a world where car care isn’t an afterthought — it’s part of the culture. We aim to lead a global shift toward design-first, performance-backed detailing products that feel as good as they work. Our vision is simple: make every car, and every driver, look and feel like the main event.

            </p>
          </div>
        </div>

        {/* Desktop Vision */}
        <div className="hidden lg:flex items-start justify-between gap-12 lg:gap-0 xl:gap-12">
          <div className="relative flex-1">
            <div className="mb-6 relative w-fit">
              <h2 className="text-[64px] font-bold tracking-wide">
                <span className="bg-gradient-to-r from-[#601E8D] to-black bg-clip-text text-transparent">Vision</span>
              </h2>
              <Image
                src="/assets/about/svg/purple_shine.svg"
                alt="Star Icon"
                width={28}
                height={38}
                className="absolute top-[100%] -mt-7 left-[97%]"
              />
            </div>
            <div className="flex gap-2">
              <p className="text-[16px] text-[#1A1A1A] leading-relaxed xl:mr-0 lg:mr-5">
              Rabbit Auto Care envisions a world where car care isn’t an afterthought — it’s part of the culture. We aim to lead a global shift toward design-first, performance-backed detailing products that feel as good as they work. Our vision is simple: make every car, and every driver, look and feel like the main event.

              </p>
              <Image src="/assets/about/svg/purple_shine.svg" alt="Star Icon" width={28} height={38} className="mt-24 xl:block hidden" />
            </div>
          </div>

          <div className="relative flex-1 max-w-[313px] h-[192px] xl:mr-0 lg:mr-4 lg:mt-16 xl:mt-0">
           {/* Layer 1 */}
<div className="absolute -top-5 -right-6 w-full h-full bg-gradient-to-br from-[#601E8D]/20 to-[#601E8D]/20 rounded-[20px] z-0" />
{/* Layer 2 */}
<div className="absolute top-5 right-6 w-full h-full bg-gradient-to-br from-[#601E8D]/10 to-[#601E8D]/10 rounded-[20px] z-0" />
            <div className="relative z-10 rounded-[20px] overflow-hidden">
              <Image
                src="/assets/about/img/mission.png"
                alt="Car Interior"
                width={500}
                height={300}
                className="rounded-[20px]"
              />
            </div>
          </div>
                    <Image src="/assets/about/svg/purple_shine.svg" alt="Star Icon" width={28} height={38} className="mt-[260px]  xl:hidden block" />
        </div>
      </div>
    </section>
  )
}
