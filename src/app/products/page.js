// This is the main products listing page with filters and search functionality

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

import Image from "next/image";
import "../../app/globals.css";

export default function ProductsPage() {
	// State variables to manage the component's data and UI
	const [products, setProducts] = useState([]); // Stores all products from database
	const [search, setSearch] = useState(""); // Search term for product names
	const [sort, setSort] = useState("asc"); // Price sorting (ascending/descending)
	const [selectedSize, setSelectedSize] = useState([]); // Array of selected size filters
	const [selectedCategory, setSelectedCategory] = useState(""); // Category filter
	const [minPrice, setMinPrice] = useState(""); // Minimum price filter
	const [maxPrice, setMaxPrice] = useState(""); // Maximum price filter
	const [imageErrors, setImageErrors] = useState({}); // Track failed image loads
	const router = useRouter(); // Next.js router for navigation

	// Effect hook that runs when component mounts and when sort changes
	useEffect(() => {
		fetchProducts(); // Load products from database
	}, [sort]); // Re-run when sort order changes

	// Function to fetch all products from Supabase database
	const fetchProducts = async () => {
		const { data, error } = await supabase.from("products").select("*");
		if (!error) setProducts(data); // Update state if no error
	};

	// Function to reset all filters to their default values
	const clearFilters = () => {
		setSearch("");
		setSort("asc");
		setSelectedSize([]);
		setSelectedCategory("");
		setMinPrice("");
		setMaxPrice("");
	};

	// Function to handle size filter checkbox changes
	const handleSizeChange = (size) => {
		setSelectedSize((prev) =>
			// If size is already selected, remove it; otherwise add it
			prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
		);
	};

	// Function to handle image load errors
	const handleImageError = (productId) => {
		setImageErrors((prev) => ({
			...prev,
			[productId]: true,
		}));
	};

	// Function to get proper image URL or return fallback
	const getImageUrl = (product) => {
		if (!product.image) return null;

		// If it's already a full URL, return as is
		if (product.image.startsWith("http")) {
			return product.image;
		}

		// If it's a relative path, construct the full Supabase URL
		return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${product.image}`;
	};

	// Complex filtering logic that chains multiple filter conditions
	const filteredProducts = products
		// Filter 1: Search by product name (case-insensitive)
		.filter((product) =>
			product.name.toLowerCase().includes(search.toLowerCase()),
		)
		// Filter 2: Filter by category (if category is selected)
		.filter((product) => {
			if (!selectedCategory) return true; // Show all if no category selected
			return product.category === selectedCategory;
		})
		// Filter 3: Filter by price range
		.filter((product) => {
			// Get all variant prices for this product
			const prices = product.variants?.map((v) => v.price) || [];
			const min = Math.min(...prices); // Find lowest price variant
			return (
				// Check if product's min price is within the specified range
				(!minPrice || min >= parseFloat(minPrice)) &&
				(!maxPrice || min <= parseFloat(maxPrice))
			);
		})
		// Filter 4: Filter by size (if any sizes are selected)
		.filter((product) => {
			if (selectedSize.length === 0) return true; // Show all if no size selected
			// Get all sizes for this product's variants
			const sizes = product.variants?.map((v) => v.size.toLowerCase());
			// Check if any selected size matches any product variant size
			return selectedSize.some((size) => sizes?.includes(size.toLowerCase()));
		})
		// Sort the filtered results by price
		.sort((a, b) => {
			// Helper function to get minimum price for a product
			const getMinPrice = (p) =>
				Math.min(...(p.variants?.map((v) => v.price) || [0]));
			// Sort ascending or descending based on sort state
			return sort === "asc"
				? getMinPrice(a) - getMinPrice(b)
				: getMinPrice(b) - getMinPrice(a);
		});

	return (
		<div className="max-w-7xl mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
				Shop Our Products
			</h1>

			<div className="flex gap-8">
				{/* Left Sidebar: All filters and controls */}
				<aside className="w-72 bg-white p-6 shadow-md rounded-lg sticky top-24 h-fit self-start">
					{/* Search Input */}
					<input
						type="text"
						placeholder="Search by name..."
						value={search}
						onChange={(e) => setSearch(e.target.value)} // Update search state on input
						className="border p-2 rounded w-full mb-5"
					/>

					{/* Price Sort Dropdown */}
					<select
						value={sort}
						onChange={(e) => setSort(e.target.value)} // Update sort state
						className="border p-2 rounded w-full mb-5"
					>
						<option value="asc">Sort by Price: Low to High</option>
						<option value="desc">Sort by Price: High to Low</option>
					</select>

					{/* Category Filter */}
					<div className="mb-5">
						<label className="block font-semibold mb-2">
							Filter by Category
						</label>
						<input
							type="text"
							placeholder="Enter category"
							value={selectedCategory}
							onChange={(e) => setSelectedCategory(e.target.value)}
							className="border p-2 rounded w-full"
						/>
					</div>

					{/* Price Range Filter */}
					<div className="mb-5">
						<label className="block font-semibold mb-2">Price Range (₹)</label>
						<div className="flex gap-3">
							<input
								type="number"
								placeholder="Min"
								value={minPrice}
								onChange={(e) => setMinPrice(e.target.value)}
								className="border p-2 rounded w-1/2"
							/>
							<input
								type="number"
								placeholder="Max"
								value={maxPrice}
								onChange={(e) => setMaxPrice(e.target.value)}
								className="border p-2 rounded w-1/2"
							/>
						</div>
					</div>

					{/* Size Filter Checkboxes */}
					<div className="mb-5">
						<label className="block font-semibold mb-2">Sizes</label>
						{["50ml", "100ml", "250ml", "500ml"].map((size) => (
							<label
								key={size}
								className="block text-sm cursor-pointer select-none"
							>
								<input
									type="checkbox"
									checked={selectedSize.includes(size)} // Check if this size is selected
									onChange={() => handleSizeChange(size)} // Toggle size selection
									className="mr-2"
								/>
								{size}
							</label>
						))}
					</div>

					{/* Clear All Filters Button */}
					<button
						onClick={clearFilters}
						className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition"
					>
						Clear Filters
					</button>
				</aside>

				{/* Main Content: Product Grid */}
				<main className="flex-1 max-w-5xl mx-auto">
					<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
						{/* Loop through filtered products and render each as a card */}
						{filteredProducts.map((product) => {
							// Calculate price range for display
							const prices = product.variants?.map((v) => v.price) || [];
							const minPrice = Math.min(...prices);
							const maxPrice = Math.max(...prices);
							const imageUrl = getImageUrl(product);
							const hasImageError = imageErrors[product.id];

							return (
								<div
									key={product.id}
									className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-lg transition duration-300"
								>
									{/* Product Image with Error Handling */}
									<div className="relative w-full h-48 bg-gray-100">
										{imageUrl && !hasImageError ? (
											<Image
												src={imageUrl}
												alt={product.name}
												fill
												sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
												style={{ objectFit: "cover" }}
												priority={false}
												onError={() => handleImageError(product.id)}
												placeholder="blur"
												blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
											/>
										) : (
											// Fallback placeholder when image fails to load or doesn't exist
											<div className="w-full h-full flex items-center justify-center bg-gray-200">
												<div className="text-center text-gray-500">
													<svg
														className="w-12 h-12 mx-auto mb-2"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
														/>
													</svg>
													<p className="text-sm">No Image</p>
												</div>
											</div>
										)}
									</div>

									{/* Product Details */}
									<div className="p-4">
										<h3 className="text-lg font-semibold text-gray-900">
											{product.name}
										</h3>
										{/* Show price range if variants have different prices */}
										<p className="text-green-600 font-bold mt-1">
											₹{minPrice}
											{minPrice !== maxPrice && ` - ₹${maxPrice}`}
										</p>
										<p className="text-gray-600 text-sm mt-2 line-clamp-2">
											{product.description}
										</p>
										{/* Navigation button to product detail page */}
										<button
											className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
											onClick={() => router.push(`/products/${product.id}`)} // Navigate to detail page
										>
											View Details
										</button>
									</div>
								</div>
							);
						})}
					</div>
				</main>
			</div>
		</div>
	);
}
