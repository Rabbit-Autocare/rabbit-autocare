'use client';

import Image from 'next/image';

// ✅ Reusable JSON array for point content
const whyPoints = [
  {
    title: " Built Different",
    description:
      " We don’t do generic. Our products are engineered with precision and styled like streetwear — sleek enough to post, strong enough to perform.",
  },
  {
    title: " Premium, Everywhere",
    description:
      " From formula to packaging, every detail screams luxe. GSM-marked cloths, monochrome bottles, and branded boxes — it’s not just clean, it’s curated.",
  },
  {
    title: "Culture-Driven Care",
    description:
      "Rabbit is more than car care. It’s a movement. For the ones who care how their ride feels, looks, and represents.",
  },
];

export default function WhyChooseus() {
  return (
    <section className="w-full flex justify-center px-4 md:px-16 lg:px-4 py-16">
      <div className="max-w-[1150px] w-full">

        {/* Gradient Heading */}
        <h2
          className="text-[36px] md:text-[56px] lg:text-[64px] font-bold bg-clip-text text-transparent mb-0 tracking-wide lg:pl-4 xl:pl-0 heading"
          style={{
            backgroundImage:
              "linear-gradient(to right, #601E8D 0%, #300F47 59%, #000000 97%)",
          }}
        >
          What makes RABBIT / RABBIT AUTOCARE different
        </h2>

        <div className="flex flex-col lg:flex-row items-center md:gap-12 mt-7 md:mt-7 lg:mt-0">

          {/* Left Side: Points */}
          <div className="flex-1 space-y-10 lg:pl-4 xl:pl-0">
            {whyPoints.map((point, index) => (
              <div key={index} className="flex items-start gap-4 md:gap-6">
                <div className="min-w-[48px] min-h-[48px] flex items-center justify-center lg:pt-8 xl:pt-6">
                  <Image src="/assets/about/svg/chooseus.svg" alt="choose-icon" width={70} height={70} />
                </div>
                <div>
                  <h4 className="text-[20px] text-black font-medium mb-2 tracking-wide">
                    {point.title}
                  </h4>
                  <p className="text-[16px] text-black font-regular tracking-wide xl:w-[520px]">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 👉 Mobile: Show SVG */}
          <div className="block md:hidden w-full justify-center mt-10 mobile-svg">
            <Image
              src="/assets/about/svg/mobilechoose.svg"
              alt="Mobile Choose SVG"
              width={310}
              height={318}
              className="rounded-[20px]"
            />
          </div>

          {/* 👉 Tablet & Desktop: Image with Background Box */}
          <div className="relative flex-1 w-full max-w-md mt-8 lg:mt-16 xl:mt-0 md:mr-20 lg:mr-0 lg:ml-0 md:block hidden">

            {/* Background Box */}
            <div className="absolute lg:-top-7 lg:right-3 xl:-top-9 xl:-right-14 md:-top-10 md:-right-18  w-[312.14px] h-[318.08px] bg-[#E9D9F7] rounded-[20px] z-0 md:w-[461.09px] md:h-[469.87px] lg:w-[390px] lg:h-[400px] xl:w-[446px] xl:h-[445px]" />

            {/* Foreground Image */}
            <div className="relative z-10 rounded-[20px] overflow-hidden w-[312.14px] h-[318.08px] md:w-[461.09px] md:h-[469.87px] lg:w-[390px] lg:h-[400px] xl:w-[446px] xl:h-[445px] left-5">
              <Image
                src="/assets/about/img/chooseusimg.png"
                alt="Car Detailing"
                className="object-cover w-full h-full"
                width={446}
                height={445}
              />
            </div>
          </div>
        </div>

        {/* Scoped internal CSS for screen-specific margin-left on mobile SVG */}
        <style jsx>{`
          @media (max-width: 480px) and (min-width: 376px) {
            .mobile-svg {
              padding-left: 45px;
            }
            .heading {
              font-size: 38px;
            }
          }
          @media (max-width: 376px) and (min-width:361px) {
            .mobile-svg {
              padding-left: 20px;
            }
            .heading {
              font-size: 34px;
            }
          }
          @media (max-width: 361px) and (min-width: 319px) {
            .mobile-svg {
              padding-left: 10px;
            }
            .heading {
              font-size: 32px;
            }
          }
          @media (max-width: 319px) {
            .mobile-svg {
              margin-left: 10px;
            }
            .heading {
              font-size: 20px;
            }
          }
        `}</style>

      </div>
    </section>
  );
}
