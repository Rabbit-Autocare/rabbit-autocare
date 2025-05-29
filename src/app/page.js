import { redirect } from "next/navigation";

import ThemeColorsDisplay from "@/components/ThemeColorsDisplay";
import HeroBannerSlider from "@/components/home/HeroBannerSlider";
import CardAnimation from "@/components/home/productsDisplay/CardAnimation";

export default function Home() {
	return (
		<main>
			<HeroBannerSlider />
			<CardAnimation />
			<ThemeColorsDisplay />

		</main>
	);
}
