'use client';

import Image from 'next/image';

export default function FirstSection() {
  return (
    <section className="w-full flex justify-center px-4 md:px-16 lg:px-10 xl:px-4 py-16">
      <div className="max-w-[1240px] w-full text-left relative">
        
        {/* Desktop Heading */}
        <div className="relative w-fit hidden lg:block">
          <h1 className="text-[64px] w-[800px] font-bold leading-tight">
            <span className="bg-gradient-to-r from-[#601E8D] to-black bg-clip-text text-transparent tracking-wide">
              Lorem
            </span>{' '}
            <span className="text-black tracking-wider">ipsum dolor sit</span>{' '}
            <span className="bg-gradient-to-r from-[#601E8D] to-black bg-clip-text text-transparent tracking-wide">
              amet
            </span>{' '}
            <span className="text-black tracking-wide relative">
              consectetur lacus.
            </span>
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
              <span className="bg-gradient-to-r from-[#601E8D] to-black bg-clip-text text-transparent">Lorem</span>{' '}
              <span className="text-black">ipsum dolor</span>
            </div>
            <div>
              <span className="bg-gradient-to-r from-[#601E8D] to-black bg-clip-text text-transparent">sit amet</span>
            </div>
            <div>
              <span className="bg-gradient-to-r from-[#601E8D] to-black bg-clip-text text-transparent">conse</span>
              <span className="text-black">ctetur lacus.</span>
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
          Lorem ipsum dolor sit amet consectetur. Pellentesque tristique sapien neque accumsan viverra. Facilisis ullamcorper imperdiet orci sed aliquam vitae. Sed non egestas fringilla nullam. Sed quis leo tincidunt sit purus ut penatibus ut. Egestas eleifend diam posuere commodo in aliquam. Lacus justo eget quis duis nulla. Risus non ligula quisque malesuada nulla volutpat neque. Libero lectus vestibulum eget ipsum feugiat velit enim.
          Enim eget id nibh enim turpis maecenas id tortor. In enim arcu tincidunt ultrices tincidunt quam rhoncus. Rhoncus eleifend fusce suspendisse sit morbi sed cursus ac. Sed nullam sit lobortis sit neque ut sit nunc volutpat. Ornare mi quis viverra cursus id tristique a id sit. Nullam scelerisque tortor tincidunt purus faucibus. Ac eu augue maecenas velit scelerisque purus dolor. Urna quis sit convallis ut odio proin ac. Integer purus.
        </p>
      </div>
    </section>
  );
}
