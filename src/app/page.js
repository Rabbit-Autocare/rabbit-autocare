import { redirect } from "next/navigation";

import { CategoryService } from "@/lib/service/microdataService";
import HeroBannerSlider from "@/components/home/HeroBannerSlider";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Shop from "@/components/home/Shop";
import WhyChooseRabbit from "@/components/home/WhyChooseRabbit";
import Customer from "@/components/home/Customer";
import Testimonial from "@/components/home/Testimonial";
import CarInteriorSection from "@/components/home/CarInteriorSection";


export default async function Home() {
  // Fetch categories on the server
  const result = await CategoryService.getCategories();
  const initialCategories = result.success && Array.isArray(result.data) ? result.data : [];
  const initialError = result.success ? null : result.error || null;

  return (
    <main>
      <HeroBannerSlider />
      <CarInteriorSection initialCategories={initialCategories} initialError={initialError} />
      <FeaturedProducts />
      <Shop />
      <WhyChooseRabbit />
      <Customer />
      <Testimonial />
    </main>
  );
}
