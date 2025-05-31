import ProductCard from "./ProductCard";

const ProductGrid = ({
	products,
	loading,
	totalCount,
	error,
	sort,
	onSortChange,
}) => {
	const handleSortChange = (e) => {
		if (onSortChange) {
			onSortChange(e.target.value);
		}
	};

	return (
		<div className="space-y-4">
			{/* Header - always visible, never changes */}
			<div className="flex justify-between items-center">
				<p className="text-sm text-gray-600">
					{loading ? (
						<span className="opacity-50">Loading...</span>
					) : error ? (
						<span className="text-red-500">Error loading products</span>
					) : (
						`Showing ${products.length} out of ${totalCount || products.length} results`
					)}
				</p>
				<div className="flex items-center">
					<span className="text-sm mr-2">Sort By:</span>
					<select
						className="border border-gray-300 rounded text-sm py-1 px-2 focus:ring-purple-500 focus:border-purple-500"
						disabled={loading}
						value={sort || "popularity"}
						onChange={handleSortChange}
					>
						<option value="popularity">Popularity</option>
						<option value="asc">Price: Low to High</option>
						<option value="desc">Price: High to Low</option>
						<option value="newest">Newest First</option>
						<option value="rating">Highest Rated</option>
					</select>
				</div>
			</div>

			{/* Product grid - fixed height container to prevent layout shift */}
			<div className="min-h-[800px]">
				{loading ? (
					// Loading state - same grid structure as actual products
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{[...Array(6)].map((_, index) => (
							<div
								key={index}
								className="bg-white rounded overflow-hidden animate-pulse shadow-sm"
							>
								<div className="h-64 bg-gray-200"></div>
								<div className="p-3 space-y-2">
									<div className="h-4 bg-gray-200 rounded w-3/4"></div>
									<div className="h-3 bg-gray-200 rounded w-1/2"></div>
									<div className="h-3 bg-gray-200 rounded w-full"></div>
									<div className="h-4 bg-gray-200 rounded w-1/4"></div>
									<div className="h-8 bg-gray-200 rounded w-full"></div>
								</div>
							</div>
						))}
					</div>
				) : error ? (
					// Error state
					<div className="text-center py-12">
						<div className="text-red-500 text-lg mb-2">
							Failed to load products
						</div>
						<div className="text-gray-400 text-sm">{error}</div>
					</div>
				) : products.length === 0 ? (
					// No products state
					<div className="text-center py-12">
						<div className="text-gray-500 text-lg">No products found</div>
						<div className="text-gray-400 text-sm mt-2">
							Try adjusting your filters or search terms
						</div>
					</div>
				) : (
					// Actual products
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{products.map((product) => (
							<ProductCard key={product.id} product={product} />
						))}
					</div>
				)}
			</div>

			{/* Additional product info for debugging (remove in production) */}
			{!loading && !error && products.length > 0 && (
				<div className="text-xs text-gray-400 mt-4">
					Total products loaded: {products.length} | Products with stock:{" "}
					{products.filter((p) => p.totalStock > 0).length} | Available
					variants:{" "}
					{products.reduce((acc, p) => acc + (p.availableVariants || 0), 0)}
				</div>
			)}
		</div>
	);
};

export default ProductGrid;
