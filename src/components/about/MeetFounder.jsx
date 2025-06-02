'use client';

import Image from 'next/image';

export default function MeetFounder() {
  return (
    <section className="w-full flex justify-center px-4 md:px-16 lg:px-8 xl:px-4 md:pb-16 lg:py-16">
      <div className="max-w-[1240px] w-full bg-[#f5f5f5] rounded-[50px] p-6 md:p-12 lg:p-16">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">

          {/* Left: Heading + Paragraphs */}
          <div className="flex-1 space-y-6 text-left">
            {/* Mobile/Tablet: Gradient heading */}
<h2 className="text-[40px] md:text-[56px] lg:text-[45px] xl:text-[58px] font-bold bg-gradient-to-r from-[#601E8D] to-black bg-clip-text text-transparent w-fit block lg:hidden">
  Meet The <br /> Founder
</h2>

{/* Desktop: Plain black heading */}
<h2 className="hidden lg:block text-[45px] xl:text-[58px] font-bold bg-gradient-to-r from-[#601E8D] to-black bg-clip-text text-transparent">
  Meet The Founder
</h2>



            <p className="text-[16px] text-[#1A1A1A] leading-relaxed max-w-xl">
              Lorem ipsum dolor sit amet consectetur. Pellentesque tristique sapien neque accumsan viverra. Facilisis
              ullae mcorper imperdiet orci sed aliquam vitae. Sed non egestas fringilla nullam. Sed quis leo tincidunt
              sit purus ut penatibus ut. Egestas eleifend diam posuere commodo in aliquam. Lacus justo eget quis duis nulla.
            </p>

            <p className="text-[16px] text-[#1A1A1A] leading-relaxed max-w-xl">
              Lorem ipsum dolor sit amet consectetur. Pellentesque tristique sapien neque accumsan viverra. Facilisis
              ullae mcorper imperdiet orci sed aliquam vitae. Sed non egestas fringilla nullam. Sed quis leo tincidunt
              sit purus ut penatibus ut. Egestas eleifend diam posuere commodo in aliquam. Lacus justo eget quis duis nulla.
            </p>
          </div>

          {/* Right: Founder Image */}
          <div className="flex-1 flex justify-center">
            <Image
              src="/assets/about/img/founder.png" // Replace with your actual path
              alt="Founder"
              width={400}
              height={400}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
