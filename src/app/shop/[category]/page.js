"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ProductGrid from "@/components/shop/ProductGrid";
import FilterSidebar from "@/components/shop/FilterSidebar";

export default function CategoryPage({ params }) {
	const category = params.category;
	const router = useRouter();

	// State variables to manage the component's data and UI
	const [products, setProducts] = useState([]);
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState("asc");
	const [selectedSize, setSelectedSize] = useState([]);
	const [selectedColor, setSelectedColor] = useState([]);
	const [minPrice, setMinPrice] = useState("");
	const [maxPrice, setMaxPrice] = useState("");
	const [selectedRating, setSelectedRating] = useState(0);
	const [inStockOnly, setInStockOnly] = useState(false);
	const [initialLoading, setInitialLoading] = useState(true);
	const [productsLoading, setProductsLoading] = useState(false);
	const [totalCount, setTotalCount] = useState(0);
	const [categories] = useState([
		"Car Interior",
		"Car Exterior",
		"Microfiber Cloths",
		"Kits & Combos",
		"All Products",
	]);

	// Effect hook that runs when component mounts or when category changes
	useEffect(() => {
		if (initialLoading) {
			fetchProducts(false);
		} else {
			fetchProducts(true);
		}
	}, [category]);

	// Function to fetch products filtered by category
	const fetchProducts = async (isProductsOnly = false) => {
		if (isProductsOnly) {
			setProductsLoading(true);
		}

		try {
			let query = supabase.from("products").select("*", { count: "exact" });

			// Map URL category to database category
			if (category !== "all") {
				let dbCategory;
				switch (category) {
					case "car-interior":
						dbCategory = "Car Interior";
						break;
					case "car-exterior":
						dbCategory = "Car Exterior";
						break;
					case "microfiber-cloths":
						dbCategory = "Microfiber Cloths";
						break;
					case "kits-combos":
						dbCategory = "Kits & Combos";
						break;
					default:
						dbCategory = category;
				}
				query = query.eq("category", dbCategory);
			}

			const { data, error, count } = await query;
			if (error) {
				console.error("Error fetching products:", error);
				return;
			}

			setProducts(data || []);
			setTotalCount(count || 0);
		} catch (error) {
			console.error("Error fetching products:", error);
		} finally {
			setInitialLoading(false);
			setProductsLoading(false);
		}
	};

	// Function to reset all filters to their default values
	const clearFilters = () => {
		setSearch("");
		setSort("asc");
		setSelectedSize([]);
		setSelectedColor([]);
		setMinPrice("");
		setMaxPrice("");
		setSelectedRating(0);
		setInStockOnly(false);
	};

	// Function to navigate to a different category
	const handleCategoryChange = (newCategory) => {
		let categorySlug;
		switch (newCategory) {
			case "Car Interior":
				categorySlug = "car-interior";
				break;
			case "Car Exterior":
				categorySlug = "car-exterior";
				break;
			case "Microfiber Cloths":
				categorySlug = "microfiber-cloths";
				break;
			case "Kits & Combos":
				categorySlug = "kits-combos";
				break;
			case "All Products":
				categorySlug = "all";
				break;
			default:
				categorySlug = newCategory.toLowerCase().replace(/\s+/g, "-");
		}

		router.push(`/shop/${categorySlug}`);
	};

	// Filter products by multiple criteria
	const filteredProducts = products
		.filter((product) =>
			product.name.toLowerCase().includes(search.toLowerCase()),
		)
		.filter((product) => {
			const prices = product.variants?.map((v) => v.price) || [];
			const min = prices.length > 0 ? Math.min(...prices) : 0;
			return (
				(!minPrice || min >= Number.parseFloat(minPrice)) &&
				(!maxPrice || min <= Number.parseFloat(maxPrice))
			);
		})
		.filter((product) => {
			if (selectedSize.length === 0) return true;
			const sizes = product.variants?.map((v) => v.size.toLowerCase()) || [];
			return selectedSize.some((size) => sizes.includes(size.toLowerCase()));
		})
		.filter((product) => {
			if (selectedColor.length === 0) return true;
			const color = product.color || "";
			return selectedColor.some((c) =>
				color.toLowerCase().includes(c.toLowerCase()),
			);
		})
		.filter((product) => {
			if (selectedRating === 0) return true;
			const rating = product.rating || 5;
			return rating >= selectedRating;
		})
		.filter((product) => {
			if (!inStockOnly) return true;
			return product.variants?.some((v) => v.stock > 0) || false;
		})
		.sort((a, b) => {
			const getMinPrice = (p) => {
				const prices = p.variants?.map((v) => v.price) || [];
				return prices.length > 0 ? Math.min(...prices) : 0;
			};
			return sort === "asc"
				? getMinPrice(a) - getMinPrice(b)
				: getMinPrice(b) - getMinPrice(a);
		});

	// Get display name for current category
	const getCategoryDisplayName = () => {
		switch (category) {
			case "car-interior":
				return "Car Interior";
			case "car-exterior":
				return "Car Exterior";
			case "microfiber-cloths":
				return "Microfiber Cloths";
			case "kits-combos":
				return "Kits & Combos";
			case "all":
				return "All Products";
			default:
				return category;
		}
	};

	// Show full page loader only on initial load
	if (initialLoading) {
		return (
			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-4 py-8">
			{/* Title - never changes during category switch */}
			<h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
				{getCategoryDisplayName()}
			</h1>

			{/* Fixed layout container */}
			<div className="flex flex-col md:flex-row gap-8">
				{/* Left Sidebar: Filters - completely static */}
				<div className="w-full md:w-64 flex-shrink-0">
					<FilterSidebar
						search={search}
						setSearch={setSearch}
						sort={sort}
						setSort={setSort}
						selectedSize={selectedSize}
						setSelectedSize={setSelectedSize}
						selectedColor={selectedColor}
						setSelectedColor={setSelectedColor}
						minPrice={minPrice}
						setMinPrice={setMinPrice}
						maxPrice={maxPrice}
						setMaxPrice={setMaxPrice}
						selectedRating={selectedRating}
						setSelectedRating={setSelectedRating}
						inStockOnly={inStockOnly}
						setInStockOnly={setInStockOnly}
						category={category}
						categories={categories}
						onCategoryChange={handleCategoryChange}
						onClearFilters={clearFilters}
					/>
				</div>

				{/* Main Content: Product Grid - fixed width container */}
				<main className="flex-1">
					<ProductGrid
						products={filteredProducts}
						loading={productsLoading}
						totalCount={totalCount}
					/>
				</main>
			</div>
		</div>
	);
}
