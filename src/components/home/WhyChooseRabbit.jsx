'use client';

import Image from 'next/image';

export default function WhyChooseRabbit() {
  const whyChooseData = [
    {
      title: "Fast Delivery",
      description:
        "Lorem ipsum dolor sit amet consectetur. Tellus massa non varius felis cras. Ullamcorper et ut vitae eget proin donec sed interdum elementum.",
      icon: "/assets/chooserabbit.svg",
    },
    {
      title: "Quality Products",
      description:
        "Lorem ipsum dolor sit amet consectetur. Tellus massa non varius felis cras. Ullamcorper et ut vitae eget proin donec sed interdum elementum.",
      icon: "/assets/chooserabbit.svg",
    },
    {
      title: "Reliable Service",
      description:
        "Lorem ipsum dolor sit amet consectetur. Tellus massa non varius felis cras. Ullamcorper et ut vitae eget proin donec sed interdum elementum.",
      icon: "/assets/chooserabbit.svg",
    },
  ];

  return (
    <section className="pt-12 pb-10 bg-white">
      <div className="max-w-[1240px] mx-auto px-4 md:px-16 lg:px-4 text-center">
        <h2 className="text-3xl md:text-4xl tracking-wide text-black font-bold mb-10">
          Why Choose Rabbit Autocare?
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {whyChooseData.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center px-4">
              <Image
                src={item.icon}
                alt={item.title}
                width={55}
                height={55}
                className="mb-4"
              />
              <h3 className="text-[24px] text-black tracking-wdie font-semibold mb-2">{item.title}</h3>
              <p className="text-[16px] font-light text-black tracking-wide leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
