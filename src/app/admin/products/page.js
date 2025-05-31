"use client";
import { useEffect, useState } from "react";
import AdminLayout from "../../../components/layouts/AdminLayout";
import EnhancedProductForm from "@/components/admin/ProductForm";
import MicrodataManagementForm from "@/components/admin/MicrodataManagementForm";
import "../../../app/globals.css";
import Image from "next/image";
import { ProductService } from "@/lib/service/productService";
import {
	Plus,
	Settings,
	Edit,
	Trash2,
	Eye,
	Package,
	Search,
	Filter,
} from "lucide-react";

export default function AdminProductsPage() {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [currentView, setCurrentView] = useState("list"); // 'list', 'create', 'edit', 'microdata'
	const [selectedProduct, setSelectedProduct] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("");
	const [categories, setCategories] = useState([]);

	useEffect(() => {
		fetchProducts();
		fetchCategories();
	}, []);

	const fetchProducts = async () => {
		setLoading(true);
		try {
			const response = await ProductService.getProducts();
			console.log("Fetched products:", response); // Debug log
			if (response.success && response.products) {
				setProducts(response.products);
			} else {
				console.error("Invalid response format:", response);
				setProducts([]);
			}
		} catch (error) {
			console.error("Error fetching products:", error);
			alert("Error fetching products: " + error.message);
			setProducts([]);
		} finally {
			setLoading(false);
		}
	};

	const fetchCategories = async () => {
		try {
			const response = await ProductService.getCategories();
			setCategories(response.data || []);
		} catch (error) {
			console.error("Error fetching categories:", error);
		}
	};

	const handleDeleteProduct = async (id) => {
		if (!confirm("Are you sure you want to delete this product?")) return;

		try {
			await ProductService.deleteProduct(id);
			alert("Product deleted successfully!");
			fetchProducts();
		} catch (error) {
			console.error("Error deleting product:", error);
			alert("Error deleting product: " + error.message);
		}
	};

	const handleProductSuccess = () => {
		setCurrentView("list");
		setSelectedProduct(null);
		fetchProducts();
	};

	const handleCancel = () => {
		setCurrentView("list");
		setSelectedProduct(null);
	};

	const handleMicrodataSuccess = () => {
		setCurrentView("list");
		fetchCategories(); // Refresh categories in case they were updated
	};

	// Filter products based on search and category
	const filteredProducts = products.filter((product) => {
		const matchesSearch =
			product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.product_code?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory =
			!categoryFilter ||
			product.main_category_id?.toString() === categoryFilter;
		return matchesSearch && matchesCategory;
	});

	const renderProductsList = () => (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">
						Products Management
					</h1>
					<p className="text-gray-600">
						Manage your product catalog and microdata
					</p>
				</div>

				<div className="flex gap-3">
					<button
						onClick={() => setCurrentView("microdata")}
						className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors"
					>
						<Settings size={18} />
						Manage Microdata
					</button>
					<button
						onClick={() => setCurrentView("create")}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
					>
						<Plus size={18} />
						Add Product
					</button>
				</div>
			</div>

			{/* Search and Filter Section */}
			<div className="bg-white p-4 rounded-lg shadow-sm border">
				<div className="flex flex-col sm:flex-row gap-4">
					<div className="flex-1 relative">
						<Search
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
							size={18}
						/>
						<input
							type="text"
							placeholder="Search products by name or code..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
					<div className="sm:w-48 relative">
						<Filter
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
							size={18}
						/>
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
						>
							<option value="">All Categories</option>
							{categories.map((category) => (
								<option key={category.id} value={category.id}>
									{category.name}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{/* Products Grid */}
			{loading ? (
				<div className="flex items-center justify-center py-12">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<span className="ml-3 text-gray-600">Loading products...</span>
				</div>
			) : filteredProducts.length === 0 ? (
				<div className="text-center py-12 bg-white rounded-lg shadow-sm border">
					<Package className="mx-auto w-12 h-12 text-gray-400 mb-4" />
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						{searchTerm || categoryFilter
							? "No products found"
							: "No products yet"}
					</h3>
					<p className="text-gray-600 mb-6">
						{searchTerm || categoryFilter
							? "Try adjusting your search or filter criteria."
							: "Get started by creating your first product."}
					</p>
					{!searchTerm && !categoryFilter && (
						<button
							onClick={() => setCurrentView("create")}
							className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto transition-colors"
						>
							<Plus size={20} />
							Create First Product
						</button>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredProducts.map((product) => (
						<div
							key={product.id}
							className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
						>
							{/* Product Image */}
							<div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
								{product.main_image_url ? (
									<Image
										src={product.main_image_url}
										alt={product.name}
										width={300}
										height={200}
										className="w-full h-full object-cover rounded-t-lg"
									/>
								) : (
									<Package className="w-12 h-12 text-gray-400" />
								)}
							</div>

							{/* Product Info */}
							<div className="p-4">
								<div className="flex justify-between items-start mb-2">
									<h3 className="font-semibold text-gray-900 truncate flex-1">
										{product.name || "Unnamed Product"}
									</h3>
									<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
										{product.is_microfiber
											? `${product.gsm_variants?.length || 0} GSM variants`
											: `${product.product_sizes?.length || 0} sizes`}
									</span>
								</div>

								{product.product_code && (
									<p className="text-sm text-gray-600 mb-2">
										Code: {product.product_code}
									</p>
								)}

								{product.main_category && (
									<p className="text-sm text-gray-600 mb-3">
										Category: {product.main_category.name}
									</p>
								)}

								{product.description && (
									<p className="text-sm text-gray-700 mb-4 line-clamp-2">
										{product.description}
									</p>
								)}

								{/* Action Buttons */}
								<div className="flex gap-2">
									<button
										onClick={() => {
											setSelectedProduct(product);
											setCurrentView("edit");
										}}
										className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center gap-1 transition-colors"
									>
										<Edit size={14} />
										Edit
									</button>
									<button
										onClick={() => handleDeleteProduct(product.id)}
										className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center justify-center transition-colors"
									>
										<Trash2 size={14} />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Results Summary */}
			{!loading && filteredProducts.length > 0 && (
				<div className="text-center text-sm text-gray-600">
					Showing {filteredProducts.length} of {products.length} products
				</div>
			)}
		</div>
	);

	return (
		<AdminLayout>
			<div className="container mx-auto px-4 py-6">
				{currentView === "list" && renderProductsList()}

				{currentView === "create" && (
					<EnhancedProductForm
						onSuccess={handleProductSuccess}
						onCancel={handleCancel}
					/>
				)}

				{currentView === "edit" && selectedProduct && (
					<EnhancedProductForm
						product={selectedProduct}
						onSuccess={handleProductSuccess}
						onCancel={handleCancel}
					/>
				)}

				{currentView === "microdata" && (
					<MicrodataManagementForm onClose={handleMicrodataSuccess} />
				)}
			</div>
		</AdminLayout>
	);
}
