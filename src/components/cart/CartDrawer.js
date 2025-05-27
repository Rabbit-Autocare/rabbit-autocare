"use client";
import { useCart } from "@/hooks/useCart";
import { Drawer } from "../ui/drawer";
import CartItem from "./CartItem";
import CouponSection from "./CouponSection";
import PriceSummary from "./PriceSummary";
import FrequentlyBoughtTogether from "./FrequentlyBoughtTogether";
import Link from "next/link";
import { ShoppingCart, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function CartDrawer() {
	const { isCartOpen, closeCart, cartItems, loading, cartCount } = useCart();

	// Animation variants for content
	const contentVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.4,
				staggerChildren: 0.1,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, x: 20 },
		visible: { opacity: 1, x: 0 },
	};

	return (
		<Drawer
			isOpen={isCartOpen}
			onClose={closeCart}
			position="right"
			className="w-full sm:w-96 max-w-full"
		>
			{/* Full height container */}
			<div className="flex flex-col h-full bg-white">
				{/* Fixed header with animation */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
					className="flex-shrink-0 p-4 border-b flex items-center bg-white shadow-sm"
				>
					<button
						onClick={closeCart}
						className="rounded-full p-1 hover:bg-gray-100 mr-2 transition-colors"
						aria-label="Close cart"
					>
						<ChevronLeft size={20} />
					</button>
					<h2 className="text-lg font-semibold">Your Cart</h2>
					{cartCount > 0 && (
						<motion.span
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full ml-auto"
						>
							{cartCount}
						</motion.span>
					)}
				</motion.div>

				{/* Save extra banner with animation */}
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.1 }}
					className="flex-shrink-0 bg-purple-600 text-white text-center py-2 text-sm font-medium"
				>
					Save extra 5% on prepaid orders
				</motion.div>

				{/* Scrollable content area */}
				<div className="flex-1 overflow-y-auto min-h-0">
					{loading ? (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="flex flex-col items-center justify-center h-64 p-4"
						>
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
							<p className="text-gray-600">Loading your cart...</p>
						</motion.div>
					) : cartItems.length === 0 ? (
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.4 }}
							className="flex flex-col items-center justify-center h-full text-center p-4"
						>
							<div className="bg-gray-100 p-4 rounded-full mb-4">
								<ShoppingCart size={32} className="text-gray-500" />
							</div>
							<h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
							<p className="text-gray-600 mb-6">
								Looks like you haven&apos;t added any products to your cart yet.
							</p>
							<button
								onClick={closeCart}
								className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors"
							>
								Continue Shopping
							</button>
						</motion.div>
					) : (
						<motion.div
							variants={contentVariants}
							initial="hidden"
							animate="visible"
							className="p-4 space-y-6"
						>
							{/* Review Your Items Section */}
							<motion.div variants={itemVariants}>
								<h3 className="text-lg font-semibold mb-4">
									Review Your Items
								</h3>
								<div className="space-y-4">
									{cartItems.map((item, index) => (
										<motion.div
											key={item.id}
											initial={{ opacity: 0, x: 20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: index * 0.1 }}
										>
											<CartItem item={item} />
										</motion.div>
									))}
								</div>
							</motion.div>

							{/* Frequently Bought Together Section */}
							<motion.div variants={itemVariants}>
								<FrequentlyBoughtTogether />
							</motion.div>

							{/* Coupon Section */}
							<motion.div variants={itemVariants}>
								<CouponSection />
							</motion.div>

							{/* Price Summary */}
							<motion.div variants={itemVariants}>
								<PriceSummary />
							</motion.div>

							{/* Add some bottom padding for better scrolling */}
							<div className="h-4"></div>
						</motion.div>
					)}
				</div>

				{/* Fixed footer with animation */}
				{cartItems.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.2 }}
						className="flex-shrink-0 border-t p-4 bg-white shadow-lg"
					>
						<Link
							href="/checkout"
							onClick={closeCart}
							className="bg-black hover:bg-gray-800 text-white py-3 px-4 rounded w-full block text-center font-medium transition-colors"
						>
							Proceed To Checkout
						</Link>
					</motion.div>
				)}
			</div>
		</Drawer>
	);
}
