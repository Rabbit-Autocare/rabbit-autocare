import Link from "next/link";
import Image from "next/image";
// import { Instagram, Facebook, Linkedin } from "lucide-react";

export default function Footer() {
	return (
		<footer className="bg-black text-white">
			{/* Main footer content */}
			<div className="container mx-auto px-6 py-12">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
					{/* Rabbit for Business - Description */}
					<div className="lg:col-span-1">
						<h3 className="text-lg font-semibold mb-4">Rabbit for Business</h3>
						<p className="text-gray-300 text-sm leading-relaxed mb-4">
							Rabbit for Business offers bulk car-care solutions for
							dealerships, fleet operators, and hospitality pros—shipped PAN
							India.
						</p>
						<p>
							<a href="mailto:b2bsales@rabbitautocare.com" className="underline hover:text-gray-300">b2bsales@rabbitautocare.com</a>
						</p>
						{/* <Link
							href="#"
							className="text-white underline text-sm hover:text-gray-300"
						>
							Learn More
						</Link> */}
					</div>

					{/* Rabbit for Business - Products */}
					<div className="lg:col-span-1">
						<h3 className="text-lg font-semibold mb-4">Rabbit Catagorys</h3>
						<ul className="space-y-3">
							<li>
								<Link
									href="/shop/car-interior"
									className="text-gray-300 text-sm hover:text-white"
								>
									Car Interior
								</Link>
							</li>
							<li>
								<Link
									href="/shop/car-exterior"
									className="text-gray-300 text-sm hover:text-white"
								>
									Car Exterior
								</Link>
							</li>
							<li>
								<Link
									href="/shop/microfiber-cloth"
									className="text-gray-300 text-sm hover:text-white"
								>
									Microfibers
								</Link>
							</li>
							<li>
								<Link
									href="/shop/all"
									className="text-gray-300 text-sm hover:text-white"
								>
									All Products
								</Link>
							</li>
						</ul>
					</div>

					{/* Help */}
					<div className="lg:col-span-1">
						<h3 className="text-lg font-semibold mb-4">Help</h3>
						<ul className="space-y-3">
							<li>
								<Link
									href="/contact"
									className="text-gray-300 text-sm hover:text-white"
								>
									Contact Us
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="text-gray-300 text-sm hover:text-white"
								>
									Track Your Order
								</Link>
							</li>
							<li>
								<Link
									href="/shipping-and-returns"
									className="text-gray-300 text-sm hover:text-white"
								>
									Shipping & Returns
								</Link>
							</li>
						</ul>
					</div>

					{/* Company */}
					<div className="lg:col-span-1">
						<h3 className="text-lg font-semibold mb-4">Company</h3>
						<ul className="space-y-3">
							<li>
								<Link
									href="/about"
									className="text-gray-300 text-sm hover:text-white"
								>
									About Us
								</Link>
							</li>
							<li>
								<Link
									href="/privacy-policy"
									className="text-gray-300 text-sm hover:text-white"
								>
									Privacy Policy
								</Link>
							</li>
							<li>
								<Link
									href="/terms-and-conditions"
									className="text-gray-300 text-sm hover:text-white"
								>
									Terms & Conditions
								</Link>
							</li>
						</ul>
					</div>

					{/* Get in Touch */}
					<div className="lg:col-span-1">
						<h3 className="text-lg font-semibold mb-4">Get in Touch</h3>
						<div className="space-y-3">
							<p className="text-gray-300 text-sm">
								<a href="mailto:Contact@rabbitautocare.com" className="underline hover:text-white">Contact@rabbitautocare.com</a>
							</p>
							<p className="text-gray-300 text-sm">
								<a href="https://wa.me/919467047525" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Whatsapp: +919467047525</a>
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Separator line */}
			<div className="border-t border-gray-800"></div>

			{/* Bottom section */}
			<div className="container mx-auto px-6 py-8">
				<div className="flex flex-col lg:flex-row items-center justify-between gap-6">
					{/* Left side - Made in India and ISO */}
					<div className="flex items-center gap-6">
						{/* Made in India */}
						<div className="flex items-center gap-3">
							<div className="relative">
								<Image
									src="/assets/icons/MakeInIndia1.png"
									alt="India Flag"
									width={40}
									height={40}
									className="h-10 w-auto"
								/>
							</div>
						</div>

						{/* ISO Certification */}
						<div className="flex items-center">
							<Image
								src="/assets/icons/iso9001logo1.svg"
								alt="ISO Logo"
								width={40}
								height={40}
								className="h-10 w-auto"
							/>
						</div>
					</div>

					{/* Center - Rabbit Logo */}
					<div className="flex-1 flex justify-center">
						<Image
							src="/assets/RabbitLogo.png"
							alt="Rabbit Autocare Logo"
							width={120}
							height={40}
							className="h-10 w-auto"
						/>
					</div>

					{/* Right side - Social Media Icons */}
					<div className="flex items-center gap-4">
						<Link
							href="#"
							className="w-15 h-15 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
						>
							{/* instagram Svg */}
							<svg
								width="26"
								height="25"
								viewBox="0 0 26 25"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M18.209 2.08325H7.79232C4.91583 2.08325 2.58398 4.4151 2.58398 7.29159V17.7083C2.58398 20.5847 4.91583 22.9166 7.79232 22.9166H18.209C21.0855 22.9166 23.4173 20.5847 23.4173 17.7083V7.29159C23.4173 4.4151 21.0855 2.08325 18.209 2.08325Z"
									stroke="#601E8D"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M17.1672 11.8441C17.2957 12.711 17.1477 13.5964 16.744 14.3743C16.3404 15.1522 15.7017 15.783 14.9189 16.1771C14.136 16.5711 13.2489 16.7082 12.3836 16.569C11.5183 16.4298 10.719 16.0212 10.0993 15.4015C9.47959 14.7818 9.07106 13.9825 8.93183 13.1172C8.7926 12.2519 8.92974 11.3648 9.32377 10.582C9.71779 9.79912 10.3486 9.16046 11.1265 8.75682C11.9044 8.35317 12.7898 8.20509 13.6568 8.33365C14.5411 8.46478 15.3597 8.87684 15.9919 9.50897C16.624 10.1411 17.036 10.9598 17.1672 11.8441Z"
									stroke="#601E8D"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M18.7285 6.77075H18.7389"
									stroke="#601E8D"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</Link>
						<Link
							href="#"
							className="w-15 h-15 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
						>
							{/* facebook Svg */}

							<svg
								width="26"
								height="25"
								viewBox="0 0 26 25"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M19.2493 2.08325H16.1243C14.743 2.08325 13.4183 2.63199 12.4415 3.60874C11.4647 4.58549 10.916 5.91025 10.916 7.29159V10.4166H7.79102V14.5833H10.916V22.9166H15.0827V14.5833H18.2077L19.2493 10.4166H15.0827V7.29159C15.0827 7.01532 15.1924 6.75037 15.3878 6.55502C15.5831 6.35967 15.8481 6.24992 16.1243 6.24992H19.2493V2.08325Z"
									stroke="#601E8D"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</Link>
						<Link
							href="#"
							className="w-15 h-15 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
						>
							{/* linkedin Svg */}
							<svg
								width="26"
								height="25"
								viewBox="0 0 26 25"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M17.166 8.33325C18.8236 8.33325 20.4133 8.99173 21.5854 10.1638C22.7575 11.3359 23.416 12.9256 23.416 14.5833V21.8749H19.2493V14.5833C19.2493 14.0307 19.0299 13.5008 18.6392 13.1101C18.2485 12.7194 17.7185 12.4999 17.166 12.4999C16.6135 12.4999 16.0836 12.7194 15.6929 13.1101C15.3022 13.5008 15.0827 14.0307 15.0827 14.5833V21.8749H10.916V14.5833C10.916 12.9256 11.5745 11.3359 12.7466 10.1638C13.9187 8.99173 15.5084 8.33325 17.166 8.33325Z"
									stroke="#601E8D"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M6.75065 9.375H2.58398V21.875H6.75065V9.375Z"
									stroke="#601E8D"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M4.66732 6.24992C5.81791 6.24992 6.75065 5.31718 6.75065 4.16659C6.75065 3.01599 5.81791 2.08325 4.66732 2.08325C3.51672 2.08325 2.58398 3.01599 2.58398 4.16659C2.58398 5.31718 3.51672 6.24992 4.66732 6.24992Z"
									stroke="#601E8D"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</Link>
					</div>
				</div>
			</div>

			{/* Copyright */}
			<div className="bg-gray-900 py-4">
				<div className="container mx-auto px-6">
					<p className="text-center text-gray-400 text-sm">
						© Rabbit Autocare. All Rights Reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
