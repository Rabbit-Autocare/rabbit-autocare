import { redirect } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";

import { CategoryService } from "@/lib/service/microdataService";
import HeroBannerSlider from "@/components/home/HeroBannerSlider";
import VideoHeroSection from "@/components/home/VideoHeroSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Shop from "@/components/home/ShopByConcern";
import WhyChooseRabbit from "@/components/home/WhyChooseRabbit";
// import Customer from "@/components/home/Customer";
import Testimonial from "@/components/home/Testimonial";
import CarInteriorSection from "@/components/home/CarInteriorSection";

// Loading component for sections
function SectionLoading() {
  return (
    <div className="py-8 flex items-center justify-center">
      <div className="text-center">
        <Image
          src='/assets/loader.gif'
          alt='Loading...'
          width={96}
          height={96}
          className='h-24 w-24 mx-auto mb-2'
        />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default async function Home() {
  // Fetch categories on the server
  let initialCategories = [];
  let initialError = null;

  try {
    const result = await CategoryService.getCategories();
    initialCategories = result.success && Array.isArray(result.data) ? result.data : [];
    initialError = result.success ? null : result.error || null;
  } catch (error) {
    console.error('Error fetching categories:', error);
    initialError = error.message;
  }

  return (
    <main>
      {/* <HeroBannerSlider /> */}
      <Suspense fallback={<SectionLoading />}>
      <HeroBannerSlider />
      </Suspense>

      <Suspense fallback={<SectionLoading />}>
        <CarInteriorSection initialCategories={initialCategories} initialError={initialError} />
      </Suspense>

      <Suspense fallback={<SectionLoading />}>
        <FeaturedProducts />
      </Suspense>

      <Suspense fallback={<SectionLoading />}>
        <Shop />
      </Suspense>

      <Suspense fallback={<SectionLoading />}>
        <WhyChooseRabbit />
      </Suspense>

      {/* <Suspense fallback={<SectionLoading />}>
        <Customer />
      </Suspense> */}

      <Suspense fallback={<SectionLoading />}>
        <Testimonial />
      </Suspense>
    </main>
  );
}
