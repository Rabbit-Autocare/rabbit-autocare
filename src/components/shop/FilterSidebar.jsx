"use client";
import { Star } from "lucide-react";

const FilterSidebar = ({
	search,
	setSearch,
	sort,
	setSort,
	selectedSize,
	setSelectedSize,
	minPrice,
	setMinPrice,
	maxPrice,
	setMaxPrice,
	category,
	categories,
	onCategoryChange,
	onClearFilters,
	selectedRating,
	setSelectedRating,
	inStockOnly,
	setInStockOnly,
	selectedColor,
	setSelectedColor,
}) => {
	// Function to handle size filter checkbox changes
	const handleSizeChange = (size) => {
		setSelectedSize((prev) =>
			prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
		);
	};

	// Function to handle color filter checkbox changes
	const handleColorChange = (color) => {
		setSelectedColor((prev) =>
			prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
		);
	};

	// Function to handle rating filter changes
	const handleRatingChange = (rating) => {
		setSelectedRating(rating);
	};

	const colors = ["White", "Black", "Blue", "Purple", "Green", "Red"];
	const sizes = ["100ml", "150ml", "250ml", "500ml"];
	const ratings = [5, 4, 3, 2, 1];

	// Function to check if category should show certain filters
	const shouldShowQuantityFilter = () => {
		return (
			category === "car-interior" ||
			category === "car-exterior" ||
			category === "kits-combos" ||
			category === "all"
		);
	};

	const shouldShowSizeAndColorFilter = () => {
		return (
			category === "microfiber-cloth" ||
			category === "kits-combos" ||
			category === "all"
		);
	};

	// Function to check if category is selected
	const isCategorySelected = (cat) => {
		if (cat === "All Products" && category === "all") return true;
		if (cat === "Car Interior" && category === "car-interior") return true;
		if (cat === "Car Exterior" && category === "car-exterior") return true;
		if (cat === "Microfiber Cloth" && category === "microfiber-cloth")
			return true;
		if (cat === "Kits & Combos" && category === "kits-combos") return true;
		return false;
	};

	return (
		<aside className="w-full md:w-64 bg-white p-4 rounded-lg h-fit self-start">
			<div className="flex items-center justify-between mb-4">
				<h2 className="font-bold text-sm uppercase">Filter</h2>
				<button
					onClick={onClearFilters}
					className="text-xs text-gray-500 hover:text-gray-700"
				>
					Clear all
				</button>
			</div>

			{/* Category Section */}
			<div className="mb-6">
				<h3 className="font-bold text-sm uppercase mb-3">Category</h3>
				<div className="space-y-2">
					{categories.map((cat) => (
						<label
							key={cat}
							className="flex items-center text-sm cursor-pointer select-none"
						>
							<input
								type="radio"
								name="category"
								checked={isCategorySelected(cat)}
								onChange={() => onCategoryChange(cat)}
								className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
							/>
							<span className="text-gray-700">{cat}</span>
						</label>
					))}
				</div>
			</div>

			{/* Rating Section */}
			<div className="mb-6">
				<h3 className="font-bold text-sm uppercase mb-3">Rating</h3>
				<div className="space-y-2">
					{ratings.map((rating) => (
						<label
							key={rating}
							className="flex items-center text-sm cursor-pointer select-none"
						>
							<input
								type="radio"
								name="rating"
								checked={selectedRating === rating}
								onChange={() => handleRatingChange(rating)}
								className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
							/>
							<div className="flex items-center">
								{[...Array(rating)].map((_, i) => (
									<Star
										key={i}
										size={14}
										className="text-yellow-400 fill-yellow-400"
									/>
								))}
								{[...Array(5 - rating)].map((_, i) => (
									<Star key={i} size={14} className="text-gray-300" />
								))}
								<span className="ml-1 text-xs text-gray-500">{`& Up`}</span>
							</div>
						</label>
					))}
				</div>
			</div>

			{/* Availability Section */}
			<div className="mb-6">
				<h3 className="font-bold text-sm uppercase mb-3">Availability</h3>
				<label className="flex items-center text-sm cursor-pointer select-none">
					<input
						type="checkbox"
						checked={inStockOnly}
						onChange={() => setInStockOnly(!inStockOnly)}
						className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
					/>
					<span className="text-gray-700">In Stock Only</span>
				</label>
			</div>

			{/* Price Section */}
			<div className="mb-6">
				<h3 className="font-bold text-sm uppercase mb-3">Price</h3>
				<div className="flex items-center space-x-2">
					<input
						type="number"
						placeholder="0"
						value={minPrice}
						onChange={(e) => setMinPrice(e.target.value)}
						className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-purple-500 focus:border-purple-500"
					/>
					<span className="text-gray-400">-</span>
					<input
						type="number"
						placeholder="0"
						value={maxPrice}
						onChange={(e) => setMaxPrice(e.target.value)}
						className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-purple-500 focus:border-purple-500"
					/>
				</div>
			</div>

			{/* Quantity/Size Section - Only for Car Interior, Car Exterior, and Kits & Combos */}
			{shouldShowQuantityFilter() && (
				<div className="mb-6">
					<h3 className="font-bold text-sm uppercase mb-3">Quantity</h3>
					<div className="space-y-2">
						{sizes.map((size) => (
							<label
								key={size}
								className="flex items-center text-sm cursor-pointer select-none"
							>
								<input
									type="checkbox"
									checked={selectedSize.includes(size)}
									onChange={() => handleSizeChange(size)}
									className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
								/>
								<span className="text-gray-700">{size}</span>
							</label>
						))}
					</div>
				</div>
			)}

			{/* Size Section - Only for Microfiber and Kits & Combos */}
			{shouldShowSizeAndColorFilter() && (
				<div className="mb-6">
					<h3 className="font-bold text-sm uppercase mb-3">Size</h3>
					<div className="space-y-2">
						<label className="flex items-center text-sm cursor-pointer select-none">
							<input
								type="checkbox"
								className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
							/>
							<span className="text-gray-700">Small (10-30 cm)</span>
						</label>
						<label className="flex items-center text-sm cursor-pointer select-none">
							<input
								type="checkbox"
								className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
							/>
							<span className="text-gray-700">Medium (30-50 cm)</span>
						</label>
						<label className="flex items-center text-sm cursor-pointer select-none">
							<input
								type="checkbox"
								className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
							/>
							<span className="text-gray-700">Large (50-70 cm)</span>
						</label>
						<label className="flex items-center text-sm cursor-pointer select-none">
							<input
								type="checkbox"
								className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
							/>
							<span className="text-gray-700">XL (80-90 cm)</span>
						</label>
					</div>
				</div>
			)}

			{/* Color Section - Only for Microfiber and Kits & Combos */}
			{shouldShowSizeAndColorFilter() && (
				<div className="mb-6">
					<h3 className="font-bold text-sm uppercase mb-3">Color</h3>
					<div className="space-y-2">
						{colors.map((color) => (
							<label
								key={color}
								className="flex items-center text-sm cursor-pointer select-none"
							>
								<input
									type="checkbox"
									checked={selectedColor.includes(color)}
									onChange={() => handleColorChange(color)}
									className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
								/>
								<div className="flex items-center">
									<span
										className={`w-4 h-4 rounded-full mr-2 inline-block border border-gray-200`}
										style={{ backgroundColor: color.toLowerCase() }}
									></span>
									<span className="text-gray-700">{color}</span>
								</div>
							</label>
						))}
					</div>
				</div>
			)}

			<button
				onClick={onClearFilters}
				className="w-full bg-black text-white py-2 px-4 rounded font-medium text-sm"
			>
				Apply
			</button>
		</aside>
	);
};

export default FilterSidebar;
