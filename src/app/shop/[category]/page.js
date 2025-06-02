"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ProductService } from "@/lib/service/productService";
import ProductGrid from "@/components/shop/ProductGrid";
import FilterSidebar from "@/components/shop/FilterSidebar";

export default function CategoryPage({ params }) {
	// Unwrap the params Promise using React.use()
	const resolvedParams = use(params);
	const category = resolvedParams.category;
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
	const [error, setError] = useState(null);
	const [categories] = useState([
		"All Products",
		"Car Interior",
		"Car Exterior",
		"Microfiber Cloth",
		"Kits & Combos",
	]);

	// Effect hook that runs when component mounts or when category changes
	useEffect(() => {
		if (initialLoading) {
			fetchProducts(false);
		} else {
			fetchProducts(true);
		}
	}, [category]);

	// Function to map URL category to database category
	const mapUrlCategoryToDb = (urlCategory) => {
		const categoryMap = {
			"car-interior": "car interior",
			"car-exterior": "car exterior",
			"microfiber-cloth": "microfiber cloth",
			"kits-combos": "kits & combos",
			all: null, // null means fetch all categories
		};
		return categoryMap[urlCategory] || urlCategory;
	};

	// Function to fetch products using ProductService
	const fetchProducts = async (isProductsOnly = false) => {
		if (isProductsOnly) {
			setProductsLoading(true);
		}

		try {
			setError(null);

			// Map category for API call
			const dbCategory = mapUrlCategoryToDb(category);

			// Prepare options for ProductService
			const options = {};

			// Only add category filter if it's not "all" - this will fetch all products
			if (dbCategory && category !== "all") {
				options.category = dbCategory;
			}

			// Use ProductService to fetch products
			const response = await ProductService.getProducts(options);

			if (response.success) {
				// Format products for display using ProductService utility
				const formattedProducts = response.products.map((product) =>
					ProductService.formatProductForDisplay(product),
				);

				setProducts(formattedProducts);
				setTotalCount(response.count || formattedProducts.length);
			} else {
				throw new Error(response.error || "Failed to fetch products");
			}
		} catch (error) {
			console.error("Error fetching products:", error);
			setError(error.message);
			setProducts([]);
			setTotalCount(0);
		} finally {
			setInitialLoading(false);
			setProductsLoading(false);
		}
	};

	// Function to search products using ProductService
	const handleSearch = async (searchTerm) => {
		if (!searchTerm.trim()) {
			// If search is empty, fetch all products for current category
			await fetchProducts(true);
			return;
		}

		setProductsLoading(true);
		try {
			setError(null);

			// Use ProductService search function
			const response = await ProductService.searchProducts(searchTerm);

			if (response.success) {
				// Filter by current category if not "all"
				let filteredProducts = response.products;
				const dbCategory = mapUrlCategoryToDb(category);

				if (dbCategory && category !== "all") {
					filteredProducts = response.products.filter(
						(product) =>
							product.category.toLowerCase() === dbCategory.toLowerCase(),
					);
				}

				// Format products for display
				const formattedProducts = filteredProducts.map((product) =>
					ProductService.formatProductForDisplay(product),
				);

				setProducts(formattedProducts);
				setTotalCount(formattedProducts.length);
			} else {
				throw new Error("Search failed");
			}
		} catch (error) {
			console.error("Error searching products:", error);
			setError(error.message);
		} finally {
			setProductsLoading(false);
		}
	};

	// Debounced search effect
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (search) {
				handleSearch(search);
			} else {
				fetchProducts(true);
			}
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [search]);

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
		// Refetch products after clearing filters
		fetchProducts(true);
	};

	// Function to navigate to a different category
	const handleCategoryChange = (newCategory) => {
		let categorySlug;
		switch (newCategory) {
			case "All Products":
				categorySlug = "all";
				break;
			case "Car Interior":
				categorySlug = "car-interior";
				break;
			case "Car Exterior":
				categorySlug = "car-exterior";
				break;
			case "Microfiber Cloth":
				categorySlug = "microfiber-cloth";
				break;
			case "Kits & Combos":
				categorySlug = "kits-combos";
				break;
			default:
				categorySlug = newCategory.toLowerCase().replace(/\s+/g, "-");
		}

		// Clear search when changing categories
		setSearch("");
		router.push(`/shop/${categorySlug}`);
	};

	// Client-side filtering for additional filters (price, size, color, etc.)
	const getFilteredProducts = () => {
		return products
			.filter((product) => {
				// Price filtering
				if (minPrice || maxPrice) {
					const prices = product.variants?.map((v) => v.price) || [];
					const min = prices.length > 0 ? Math.min(...prices) : 0;
					if (minPrice && min < Number.parseFloat(minPrice)) return false;
					if (maxPrice && min > Number.parseFloat(maxPrice)) return false;
				}
				return true;
			})
			.filter((product) => {
				// Size filtering (for quantity-based variants)
				if (selectedSize.length === 0) return true;
				const variants = product.variants || [];
				return selectedSize.some((size) =>
					variants.some((variant) => variant.value === size),
				);
			})
			.filter((product) => {
				// Color filtering
				if (selectedColor.length === 0) return true;
				const variants = product.variants || [];
				return selectedColor.some((color) =>
					variants.some(
						(variant) =>
							variant.color &&
							variant.color.toLowerCase().includes(color.toLowerCase()),
					),
				);
			})
			.filter((product) => {
				// Rating filtering
				if (selectedRating === 0) return true;
				const rating = product.rating || 5;
				return rating >= selectedRating;
			})
			.filter((product) => {
				// Stock filtering
				if (!inStockOnly) return true;
				return product.variants?.some((v) => v.stock > 0) || false;
			})
			.sort((a, b) => {
				// Sorting
				const getMinPrice = (p) => {
					const prices = p.variants?.map((v) => v.price) || [];
					return prices.length > 0 ? Math.min(...prices) : 0;
				};

				switch (sort) {
					case "asc":
						return getMinPrice(a) - getMinPrice(b);
					case "desc":
						return getMinPrice(b) - getMinPrice(a);
					case "newest":
						return new Date(b.created_at) - new Date(a.created_at);
					case "rating":
						return (b.rating || 0) - (a.rating || 0);
					case "popularity":
					default:
						return 0; // Keep original order for popularity
				}
			});
	};

	// Get display name for current category
	const getCategoryDisplayName = () => {
		switch (category) {
			case "car-interior":
				return "Car Interior";
			case "car-exterior":
				return "Car Exterior";
			case "microfiber-cloth":
				return "Microfiber Cloth";
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

	// Show error state
	if (error && !productsLoading) {
		return (
			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="text-center">
					<div className="text-red-600 text-lg mb-4">
						Error loading products
					</div>
					<div className="text-gray-600 mb-4">{error}</div>
					<button
						onClick={() => fetchProducts(true)}
						className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	const filteredProducts = getFilteredProducts();

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
						error={error}
						sort={sort}
						onSortChange={setSort}
					/>
				</main>
			</div>
		</div>
	);
}
