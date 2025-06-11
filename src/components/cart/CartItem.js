"use client";
import { useCart } from "@/hooks/useCart";
import Image from "next/image";
import { X, Plus, Minus } from "lucide-react";

export default function CartItem({ item, formatPrice, getVariantDisplayText }) {
	const { removeFromCart, updateCartItem } = useCart();

	const handleIncrease = () => {
		// Check stock before increasing
		if (item.quantity < (item.product?.stock || item.variant?.stock || 999)) {
			updateCartItem(item.id, item.quantity + 1);
		}
	};

	const handleDecrease = () => {
		if (item.quantity > 1) {
			updateCartItem(item.id, item.quantity - 1);
		} else {
			removeFromCart(item.id);
		}
	};

	if (!item.product) {
		return null; // Handle case where product data might be missing
	}

	const productName = item.product?.name || item.name || "Unknown Product";
	const currentPrice = item.variant?.price || item.product?.price || 0;
	const productImage = item.product?.main_image_url || item.product?.image_url || item.image;
	const productStock = item.product?.stock || item.variant?.stock || 999;

	return (
		<div className="flex items-start gap-3 p-3 bg-white rounded-lg border">
			{/* Product image */}
			<div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
				{productImage ? (
					<Image
						src={productImage}
						alt={productName}
						fill
						sizes="80px"
						className="object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center bg-gray-200">
						<span className="text-gray-400 text-xs">No image</span>
					</div>
				)}
			</div>

			{/* Product info */}
			<div className="flex-1">
				<h4 className="font-medium text-gray-900 leading-tight">
					{productName}
				</h4>
				<p className="text-blue-600 font-medium mt-1">{formatPrice(currentPrice)}</p>

				{/* Variant info if available */}
				{item.variant && (
					<p className="text-gray-500 text-xs mt-1">
						{getVariantDisplayText(item.variant)}
					</p>
				)}

				{/* Stock warning if needed */}
				{item.quantity >= productStock && (
					<p className="text-orange-500 text-xs mt-1">Max stock reached</p>
				)}

				{/* Quantity controls */}
				<div className="flex items-center gap-2 mt-2">
					<button
						onClick={handleDecrease}
						className="p-1 rounded-full border hover:bg-gray-100 transition-colors"
						aria-label="Decrease quantity"
					>
						<Minus size={14} />
					</button>
					<span className="px-2 min-w-8 text-center">{item.quantity}</span>
					<button
						onClick={handleIncrease}
						className="p-1 rounded-full border hover:bg-gray-100 transition-colors"
						aria-label="Increase quantity"
						disabled={item.quantity >= productStock}
					>
						<Plus size={14} />
					</button>
				</div>
			</div>

			{/* Remove button */}
			<button
				onClick={() => removeFromCart(item.id)}
				className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
				aria-label="Remove item"
			>
				<X size={16} />
			</button>
		</div>
	);
}
