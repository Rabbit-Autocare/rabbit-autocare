"use client";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import EnhancedProductForm from "@/components/admin/ProductForm";
import MicrodataManagementForm from "@/components/admin/MicrodataManagementForm";
import "@/app/globals.css";
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
	ChevronDown,
	ChevronUp,
	Pencil,
	ChevronRight,
} from "lucide-react";
import React from "react";

function getVariantFields(variants) {
	// Returns an array of field names that are present (not null/empty) in at least one variant
	const fields = ["gsm", "size", "color", "color_hex", "quantity", "unit", "price", "stock", "compare_at_price"];
	return fields.filter(field => variants.some(v => v[field] !== undefined && v[field] !== null && v[field] !== ""));
}

function formatRupee(amount) {
	if (amount === undefined || amount === null) return "";
	return `₹${Number(amount).toFixed(2)}`;
}

export default function AdminProductsPage() {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [expandedRows, setExpandedRows] = useState({});
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [showForm, setShowForm] = useState(false);
	const [editingProduct, setEditingProduct] = useState(null);
	const [categories, setCategories] = useState([]);
	const [imageIndexes, setImageIndexes] = useState({}); // { [productId]: currentIndex }
	const [currentView, setCurrentView] = useState("list"); // 'list', 'create', 'edit', 'microdata'

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

	const handleDelete = async (id) => {
		if (!confirm("Are you sure you want to delete this product?")) return;

		try {
			await ProductService.deleteProduct(id);
			await fetchProducts();
		} catch (error) {
			console.error("Error deleting product:", error);
			alert("Error deleting product: " + error.message);
		}
	};

	const handleEdit = (product) => {
		setEditingProduct(product);
		setShowForm(true);
		setCurrentView("edit");
	};

	const handleCreate = () => {
		setEditingProduct(null);
		setShowForm(true);
		setCurrentView("create");
	};

	const handleBack = () => {
		setShowForm(false);
		setEditingProduct(null);
		setCurrentView("list");
	};

	const handleSuccess = async () => {
		await fetchProducts();
		setShowForm(false);
		setEditingProduct(null);
		setCurrentView("list");
	};

	const toggleRow = (productId) => {
		setExpandedRows(prev => ({
			...prev,
			[productId]: !prev[productId]
		}));
	};

	const handlePrevImage = (product) => {
		setImageIndexes(prev => ({
			...prev,
			[product.id]: Math.max(0, (prev[product.id] || 0) - 1)
		}));
	};

	const handleNextImage = (product) => {
		setImageIndexes(prev => ({
			...prev,
			[product.id]: Math.min((product.images?.length || 1) - 1, (prev[product.id] || 0) + 1)
		}));
	};

	const filteredProducts = products.filter((product) => {
		const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.product_code?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory = selectedCategory === "all" || product.category_name === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	if (currentView === "microdata") {
		return (
			<AdminLayout>
				<MicrodataManagementForm onBack={handleBack} />
			</AdminLayout>
		);
	}

	if (showForm) {
		return (
			<AdminLayout>
				<EnhancedProductForm
					product={editingProduct}
					onSuccess={handleSuccess}
					onCancel={handleBack}
				/>
			</AdminLayout>
		);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<AdminLayout>
			<div className="p-6 max-w-full">
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">Products</h1>
					<div className="flex gap-2">
						<button
							onClick={() => setCurrentView("microdata")}
							className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors"
						>
							<Settings size={16} />
							Microdata Management
						</button>
						<button
							onClick={handleCreate}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
						>
							<Plus size={16} />
							Add Product
						</button>
					</div>
				</div>

				{/* Filters */}
				<div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
					<div className="flex-1 w-full sm:w-auto">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
							<input
								type="text"
								placeholder="Search products..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
					</div>
					<select
						value={selectedCategory}
						onChange={(e) => setSelectedCategory(e.target.value)}
						className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
					>
						<option value="all">All Categories</option>
						{categories.map((category) => (
							<option key={category.id} value={category.name}>
								{category.name}
							</option>
						))}
					</select>
				</div>

				{/* Products Table */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-80">
										Product
									</th>
									<th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
										Category
									</th>
									<th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
										Variants
									</th>
									<th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
										Total Stock
									</th>
									<th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
										Price Range
									</th>
									<th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
										Status
									</th>
									<th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{filteredProducts.length === 0 ? (
									<tr>
										<td colSpan="7" className="px-6 py-12 text-center text-gray-500">
											<Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
											<p className="text-lg font-medium">No products found</p>
											<p className="text-sm">Try adjusting your search criteria</p>
										</td>
									</tr>
								) : (
									filteredProducts.map((product) => (
										<React.Fragment key={product.id}>
											<tr className="hover:bg-gray-50 transition-colors">
												<td className="px-6 py-4">
													<div className="flex items-center gap-4">
														<button
															onClick={() => toggleRow(product.id)}
															className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
														>
															{expandedRows[product.id] ? (
																<ChevronDown className="w-4 h-4 text-gray-600" />
															) : (
																<ChevronRight className="w-4 h-4 text-gray-600" />
															)}
														</button>

														{/* Product Image */}
														<div className="relative flex-shrink-0">
															<div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
																{product.images && product.images.length > 0 ? (
																	<>
																		<img
																			src={product.images[imageIndexes[product.id] || 0]}
																			alt={product.name}
																			className="w-full h-full object-cover"
																		/>
																		{product.images.length > 1 && (
																			<div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-br">
																				{(imageIndexes[product.id] || 0) + 1}/{product.images.length}
																			</div>
																		)}
																	</>
																) : product.main_image_url ? (
																	<img
																		src={product.main_image_url}
																		alt={product.name}
																		className="w-full h-full object-cover"
																	/>
																) : (
																	<div className="w-full h-full bg-gray-100 flex items-center justify-center">
																		<Package className="w-6 h-6 text-gray-400" />
																	</div>
																)}
															</div>
															{product.images && product.images.length > 1 && (
																<div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
																	<button
																		onClick={() => handlePrevImage(product)}
																		className="bg-white shadow-sm border rounded p-0.5 hover:bg-gray-50 text-xs"
																		disabled={(imageIndexes[product.id] || 0) === 0}
																	>
																		←
																	</button>
																	<button
																		onClick={() => handleNextImage(product)}
																		className="bg-white shadow-sm border rounded p-0.5 hover:bg-gray-50 text-xs"
																		disabled={(imageIndexes[product.id] || 0) === (product.images.length - 1)}
																	>
																		→
																	</button>
																</div>
															)}
														</div>

														{/* Product Info */}
														<div className="min-w-0 flex-1">
															<div className="font-medium text-gray-900 truncate">{product.name}</div>
															<div className="text-sm text-gray-500">{product.product_code}</div>
														</div>
													</div>
												</td>
												<td className="px-4 py-4 text-sm text-gray-900">
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
														{product.category_name}
													</span>
												</td>
												<td className="px-4 py-4 text-sm text-gray-900">
													<span className="font-medium">{product.variants?.length || 0}</span>
													<span className="text-gray-500 ml-1">variants</span>
												</td>
												<td className="px-4 py-4 text-sm text-gray-900">
													<span className="font-medium">
														{product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0}
													</span>
												</td>
												<td className="px-4 py-4 text-sm text-gray-900">
													{product.variants?.length > 0 ? (
														<div>
															<div className="font-medium">
																{formatRupee(Math.min(...product.variants.map((v) => v.price || 0)))}
															</div>
															{Math.min(...product.variants.map((v) => v.price || 0)) !== Math.max(...product.variants.map((v) => v.price || 0)) && (
																<div className="text-xs text-gray-500">
																	to {formatRupee(Math.max(...product.variants.map((v) => v.price || 0)))}
																</div>
															)}
														</div>
													) : (
														<span className="text-gray-400">—</span>
													)}
												</td>
												<td className="px-4 py-4 text-sm">
													<span
														className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
															product.variants?.some((v) => v.stock > 0)
																? "bg-green-100 text-green-800"
																: "bg-red-100 text-red-800"
														}`}
													>
														{product.variants?.some((v) => v.stock > 0) ? "In Stock" : "Out of Stock"}
													</span>
												</td>
												<td className="px-4 py-4 text-sm text-gray-900">
													<div className="flex items-center gap-1">
														<button
															onClick={() => handleEdit(product)}
															className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
															title="Edit product"
														>
															<Pencil className="w-4 h-4" />
														</button>
														<button
															onClick={() => handleDelete(product.id)}
															className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
															title="Delete product"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													</div>
												</td>
											</tr>

											{/* Expanded Row for Variants */}
											{expandedRows[product.id] && (
												<tr>
													<td colSpan={7} className="px-0 py-0 bg-gray-50">
														<div className="px-6 py-4">
															<h4 className="text-sm font-semibold text-gray-700 mb-3">Product Variants</h4>
															<div className="overflow-x-auto">
																{(() => {
																	const fields = getVariantFields(product.variants || []);
																	if (fields.length === 0) {
																		return (
																			<div className="text-center py-8 text-gray-500">
																				<Package className="mx-auto h-8 w-8 text-gray-300 mb-2" />
																				<p>No variants found</p>
																			</div>
																		);
																	}
																	return (
																		<table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
																			<thead className="bg-white">
																				<tr>
																					{fields.includes("gsm") && <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">GSM</th>}
																					{fields.includes("size") && <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Size</th>}
																					{fields.includes("color") && <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Color</th>}
																					{fields.includes("quantity") && <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Quantity</th>}
																					{fields.includes("unit") && <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Unit</th>}
																					{fields.includes("price") && <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Price</th>}
																					{fields.includes("stock") && <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Stock</th>}
																					{fields.includes("compare_at_price") && <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Compare At</th>}
																				</tr>
																			</thead>
																			<tbody className="bg-white">
																				{product.variants.map((variant, index) => (
																					<tr key={variant.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
																						{fields.includes("gsm") && (
																							<td className="px-4 py-3 border-b border-gray-100">
																								{variant.gsm || "—"}
																							</td>
																						)}
																						{fields.includes("size") && (
																							<td className="px-4 py-3 border-b border-gray-100">
																								{variant.size || "—"}
																							</td>
																						)}
																						{fields.includes("color") && (
																							<td className="px-4 py-3 border-b border-gray-100">
																								{(variant.color || variant.color_hex) ? (
																									<div className="flex items-center gap-2">
																										{variant.color_hex && (
																											<div
																												className="w-4 h-4 rounded-full border border-gray-300 shadow-sm flex-shrink-0"
																												style={{ backgroundColor: variant.color_hex }}
																												title={`Hex: ${variant.color_hex}`}
																											/>
																										)}
																										<div className="flex flex-col">
																											{variant.color && (
																												<span className="font-medium text-gray-900 text-sm">
																													{variant.color}
																												</span>
																											)}
																											{variant.color_hex && (
																												<span className="text-xs text-gray-500 font-mono">
																													{variant.color_hex}
																												</span>
																											)}
																										</div>
																									</div>
																								) : (
																									"—"
																								)}
																							</td>
																						)}
																						{fields.includes("quantity") && (
																							<td className="px-4 py-3 border-b border-gray-100">
																								{variant.quantity || "—"}
																							</td>
																						)}
																						{fields.includes("unit") && (
																							<td className="px-4 py-3 border-b border-gray-100">
																								{variant.unit || "—"}
																							</td>
																						)}
																						{fields.includes("price") && (
																							<td className="px-4 py-3 border-b border-gray-100">
																								<span className="font-semibold text-green-600">
																									{formatRupee(variant.price)}
																								</span>
																							</td>
																						)}
																						{fields.includes("stock") && (
																							<td className="px-4 py-3 border-b border-gray-100">
																								<span className={`font-medium ${variant.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
																									{variant.stock || 0}
																								</span>
																							</td>
																						)}
																						{fields.includes("compare_at_price") && (
																							<td className="px-4 py-3 border-b border-gray-100">
																								{variant.compare_at_price !== null && variant.compare_at_price !== undefined ? (
																									<span className="text-gray-500 line-through">
																										{formatRupee(variant.compare_at_price)}
																									</span>
																								) : (
																									"—"
																								)}
																							</td>
																						)}
																					</tr>
																				))}
																			</tbody>
																		</table>
																	);
																})()}
															</div>
														</div>
													</td>
												</tr>
											)}
										</React.Fragment>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</AdminLayout>
	);
}
