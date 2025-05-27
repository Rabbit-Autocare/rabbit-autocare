// Individual combo page with detailed view and purchase options

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import Image from "next/image";
import "../../../app/globals.css";
import RootLayout from "../../../components/layouts/RootLayout";

export default function ComboDetailPage() {
	// Get combo ID from URL parameters
	const { id } = useParams();
	const router = useRouter();

	// State management for combo detail page
	const [combo, setCombo] = useState(null); // Current combo data
	const [products, setProducts] = useState([]); // All products for name lookup
	const [userId, setUserId] = useState(null); // Current user ID

	// Effect to fetch combo data, products, and user info when component mounts
	useEffect(() => {
		const fetchData = async () => {
			// Fetch specific combo by ID
			const { data: comboData, error: comboError } = await supabase
				.from("combos")
				.select("*")
				.eq("id", id)
				.single();

			if (comboError) {
				console.error("Combo fetch error:", comboError);
				return;
			}
			setCombo(comboData);

			// Fetch all products for name resolution
			const { data: productData, error: productError } = await supabase
				.from("products")
				.select("*");

			if (productError) {
				console.error("Product fetch error:", productError);
				return;
			}
			setProducts(productData);

			// Get current user
			const { data: userData } = await supabase.auth.getUser();
			if (userData?.user) setUserId(userData.user.id);
		};

		fetchData();
	}, [id]);

	// Helper function to resolve product ID to product name
	const getProductName = (pid) => {
		const product = products.find((p) => p.id === pid);
		return product ? product.name : "Unknown Product";
	};

	// Function for immediate purchase - redirect to checkout with combo ID
	const buynow = async () => {
		if (!userId) {
			alert("Please log in to proceed.");
			return;
		}
		// Navigate to checkout page with combo ID as query parameter
		router.push(`/checkout?combo_id=${id}`);
	};

	// Function to add combo to cart
	const addToCart = async () => {
		if (!userId) {
			alert("Please log in to add to cart.");
			return;
		}

		// Check if combo already exists in user's cart
		const { data: existing, error: fetchError } = await supabase
			.from("combo_cart")
			.select("*")
			.eq("user_id", userId)
			.eq("combo_id", id)
			.single();

		if (fetchError && fetchError.code !== "PGRST116") {
			alert("Error adding to cart");
			return;
		}

		if (existing) {
			// If combo exists, increment quantity
			await supabase
				.from("combo_cart")
				.update({ quantity: existing.quantity + 1, price: combo.price })
				.eq("id", existing.id);
		} else {
			// If combo doesn't exist, create new cart entry
			await supabase.from("combo_cart").insert([
				{
					user_id: userId,
					combo_id: id,
					quantity: 1,
					price: combo.price,
				},
			]);
		}

		alert("✅ Combo added to cart!");
	};

	// Loading state
	if (!combo) return <p className="p-6">Loading combo details...</p>;

	return (
		<div className="p-6 max-w-4xl mx-auto bg-white min-h-screen">
			{/* Combo Title */}
			<h1 className="text-3xl font-bold mb-6">{combo.name}</h1>

			{/* Combo Image */}
			{combo.image_url && (
				<Image
					src={combo.image_url}
					alt={combo.name}
					width={800}
					height={400}
					className="w-full h-64 object-cover rounded-md mb-6"
				/>
			)}

			{/* Combo Description */}
			<p className="text-gray-700 text-lg mb-4">{combo.description}</p>

			{/* Pricing Information Section */}
			<div className="bg-gray-50 border p-4 rounded-md mb-4">
				<h2 className="text-xl font-semibold mb-2">🧾 Pricing</h2>
				<p>Original Price: ₹{combo.original_price}</p>
				<p>Discount: {combo.discount_percent}%</p>
				<p className="text-green-600 font-bold">Final Price: ₹{combo.price}</p>
			</div>

			{/* Products Included Section */}
			<div className="mb-6">
				<h2 className="text-xl font-semibold mb-2">📦 Products Included</h2>
				<ul className="list-disc list-inside text-gray-800">
					{combo.products?.map((item, index) => (
						<li key={index}>
							{getProductName(item.product_id)} × {item.quantity}
						</li>
					))}
				</ul>
			</div>

			{/* Action Buttons */}
			<div className="flex flex-wrap gap-4">
				{/* Add to Cart Button */}
				<button
					onClick={addToCart}
					className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg text-lg"
				>
					🛒 Add Combo to Cart
				</button>
				{/* Buy Now Button */}
				<button
					onClick={buynow}
					className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg text-lg"
				>
					⚡ Buy Now
				</button>
			</div>
		</div>
	);
}
