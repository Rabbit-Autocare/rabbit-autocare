import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Linkedin, Twitter } from "lucide-react";

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
                                    src="/assets/icons/MakeInIndia1.svg"
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
                                src="/assets/icons/iso9.svg"
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
                            src="/assets/icons/LOGObLACK.svg"
                            alt="Rabbit Autocare Logo"
                            width={120}
                            height={40}
                            className="h-20 w-auto"
                        />
                    </div>

                    {/* Right side - Social Media Icons */}
                    <div className="flex items-center gap-4">
                        <Link
                            href="https://www.instagram.com/rabbitautocare"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                            <Instagram
                                size={20}
                                color="#601E8D"
                                strokeWidth={1.5}
                            />
                        </Link>
                        <Link
                            href="https://www.facebook.com/rabbitautocare"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                            <Facebook
                                size={20}
                                color="#601E8D"
                                strokeWidth={1.5}
                            />
                        </Link>
                        <Link
                            href="https://www.linkedin.com/company/rabbitautocare"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                            <Linkedin
                                size={20}
                                color="#601E8D"
                                strokeWidth={1.5}
                            />
                        </Link>
                        <Link
                            href="https://x.com/rabbitautocare"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                            <Twitter
                                size={20}
                                color="#601E8D"
                                strokeWidth={1.5}
                            />
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
