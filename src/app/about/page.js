import React from 'react';
// import RootLayout from '../../components/layouts/RootLayout';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <>
      {/* Hero section */}
      <div className='p-24'>
        <div className='mb-12 relative w-fit'>
          <h1 className='text-6xl font-bold leading-[1.35]'>
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-[#601E8D] to-[#000000]'>
              Lorem
            </span>{' '}
            ipsum dolor sit amet <br />
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-[#601E8D] to-[#000000]'>
              consectetur
            </span>{' '}
            lacus.
          </h1>
          <div className='absolute right-1/4 -translate-x-1/2 -bottom-5'>
            <Image
              src='/assets/purple_shine.svg'
              width={28}
              height={38}
              alt='purple shine'
            />
          </div>
        </div>

        <div className='w-full'>
          <p className='text-gray-700 mb-10'>
            Lorem ipsum dolor sit amet consectetur. Pellentesque tristique
            sapien neque accumsan viverra. Facilisis ullamcorper imperdiet orci
            sed aliquam vitae. Sed non egestas fringilla nullam. Sed quis leo
            tincidunt sit purus ut penatibus ut. Egestas eleifend diam posuere
            commodo in aliquam. Lacus justo eget quis duis nulla. Risus non
            ligula quisque malesuada nulla volutpat neque. Libero lectus
            vestibulum eget ipsum fauciat velit enim. <br /> Enim eget id nibh
            enim turpis maecenas id tortor. In enim arcu tincidunt ultrices
            tincidunt quam rhoncus. Rhoncus eleifend fusce suspendisse sit morbi
            sed cursus ac. Sed nullam sit lobortis sit neque ut sit nunc
            volutpat. Donec mi quis viverra cursus id tristique a id sit. Nullam
            scelerisque tortor tincidunt purus faucibus. Ac eu augue maecenas
            velit scelerisque purus dolor. Urna quis sit convallis ut odio proin
            ac. Integer purus.
          </p>
        </div>
      </div>
    </>
  );
}
