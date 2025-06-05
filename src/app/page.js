import { redirect } from "next/navigation";

import ThemeColorsDisplay from "@/components/ThemeColorsDisplay";
import HeroBannerSlider from "@/components/home/HeroBannerSlider";
import CarInterior from "@/components/home/CarInterior";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Shop from "@/components/home/Shop";


export default function Home() {
	return (
		<main>
			<HeroBannerSlider />
			<CarInterior/>
			<ThemeColorsDisplay />
      <FeaturedProducts/>
			<Shop/>
		</main>
	);
}
