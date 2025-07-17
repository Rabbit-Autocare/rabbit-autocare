'use client';

import Image from 'next/image';

export default function FirstSection() {
  return (
    <section className="w-full flex justify-center px-4 md:px-16 lg:px-10 xl:px-4 py-16">
      <div className="max-w-[1240px] w-full text-left relative">

        {/* Desktop Heading */}
        <div className="relative w-fit hidden lg:block">
          <h1 className="text-[64px] w-[900px]  leading-tight">
            <span className="bg-gradient-to-r from-[#601E8D] to-black bg-clip-text text-transparent tracking-wide font-extrabold"
            >
            Rabbit Delivers Car Care
            </span>{' '}
            {/* <span className="text-black tracking-wider"></span>{' '} */}
            <span className="bg-gradient-to-r from-[#601E8D] to-black bg-clip-text text-transparent tracking-wide font-bold">
            That Hits Like Luxury.
            </span>{' '}
            {/* <span className="text-black tracking-wide relative">

            </span> */}
          </h1>

          {/* Star icon for desktop */}
          <Image
            src="/assets/about/svg/purple_shine.svg"
            alt="Star Icon"
            width={28}
            height={38}
            className="absolute left-[595px] top-[100%] -mt-3"
          />
        </div>

        {/* Mobile/Tablet Heading */}
        <div className="relative w-fit lg:hidden">
          <h1 className="text-[36px] sm:text-[40px] md:text-[56px] md:w-[628px] font-bold leading-tight space-y-2">
            <div>
              <span className="bg-gradient-to-r from-[#601E8D] to-black bg-clip-text text-transparent">Rabbit</span>{' '}
              <span className="text-black">Delivers Car</span>
            </div>
            <div>
              <span className="bg-gradient-to-r from-[#601E8D] to-black bg-clip-text text-transparent">Care That</span>
            </div>
            <div>
              <span className="bg-gradient-to-r from-[#601E8D] to-black bg-clip-text text-transparent">Hits</span>
              <span className="text-black">Like Luxury.</span>
            </div>
          </h1>

          {/* Star icon for mobile/tablet */}
          <Image
            src="/assets/purple_shine.svg"
            alt="Star Icon"
            width={28}
            height={38}
            className="absolute md:left-[500px] top-[100%] -mt-7 lg:-mt-3 hidden md:block"
          />
        </div>

        {/* Description */}
        <p className="text-[16px] text-[#1A1A1A] leading-relaxed md:max-w-[628px] lg:max-w-[1240px] mt-10 lg:mt-14">
        Rabbit Auto Care isn’t just a product line — it’s a full-blown aesthetic movement in the car care space. Born out of a need for products that perform as sharply as they look, we merge minimalist luxury with no-compromise formulas. Think high-GSM microfiber cloths, precision-labeled bottles, monochrome packaging, and a tactile unboxing experience that rivals top-tier fashion drops.
<br/>
        Everything — from the layout of a label to the thank-you card — is intentionally crafted to feel premium, clean, and culture-ready. We’re here for the detailers, the enthusiasts, and the everyday drivers who believe presentation matters as much as performance. This isn’t just about making your car clean — it’s about making it iconic. Welcome to Rabbit — where function meets flex, and every detail speaks volumes.
        </p>
      </div>
    </section>
  );
}
