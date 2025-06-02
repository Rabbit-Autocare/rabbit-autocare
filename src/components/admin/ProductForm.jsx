"use client";
import { useEffect, useState } from "react";
import { ProductService } from "@/lib/service/productService";
import { Plus, Trash2, Package, Palette, Ruler, Hash, DollarSign, Archive, Tag, X, Image as ImageIcon } from "lucide-react";

export default function EnhancedProductForm({ product = null, onSuccess, onCancel }) {
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const isEditing = !!product;

	// Form state
	const [form, setForm] = useState({
		product_code: "",
		name: "",
		main_category_id: "",
		description: "",
		is_microfiber: false,
		subcategories: [],
		variants: [],
		main_image_url: "",
		images: [],
		key_features: [],
		taglines: [],
	});

	// Microdata
	const [allSizes, setAllSizes] = useState([]);
	const [allColors, setAllColors] = useState([]);
	const [allCategories, setAllCategories] = useState([]);
	const [selectedCategory, setSelectedCategory] = useState(null);

	// UI states
	const [activeVariantIndex, setActiveVariantIndex] = useState(null);
	const [bulkActions, setBulkActions] = useState({
		showBulkPrice: false,
		bulkPrice: "",
		showBulkStock: false,
		bulkStock: "",
	});

	// New state for image upload
	const [uploadingImages, setUploadingImages] = useState(false);
	const [newKeyFeature, setNewKeyFeature] = useState("");
	const [newTagline, setNewTagline] = useState("");

	useEffect(() => {
		fetchMasterData();
	}, [isEditing]);

	const fetchMasterData = async () => {
		setLoading(true);
		try {
			const [sizesRes, colorsRes, categoriesRes] = await Promise.all([
				ProductService.getSizes(),
				ProductService.getColors(),
				ProductService.getCategories(),
			]);

			setAllSizes(sizesRes.data || []);
			setAllColors(colorsRes.data || []);
			setAllCategories(categoriesRes.data || []);

			// Call populateEditForm after categories are loaded in edit mode
			if (isEditing) {
				populateEditForm();
			}

		} catch (err) {
			console.error("Error fetching master data:", err);
			alert("Error fetching form data: " + err.message);
		} finally {
			setLoading(false);
		}
	};

	const populateEditForm = () => {
		if (!product) return;

		// Find and set the selected main category
		const mainCategory = allCategories.find(c => c.id === product.main_category_id);
		if (mainCategory) {
			setSelectedCategory(mainCategory);
		}

		// Get subcategory IDs from the fetched product data
		// The API returns subcategories nested within a 'category' object
		const subcategoryIds = product.product_subcategories?.map(sc => parseInt(sc.category?.id)).filter(Boolean) || [];

		// Map fetched variants to form state structure
		const productVariants = product.variants?.map(variant => {
			// Ensure core fields are present and correctly typed
			const baseVariant = {
				stock: parseInt(variant.stock) || 0,
				price: parseFloat(variant.price) || 0,
			};

			// Map specific fields based on product's microfiber status
			if (product.is_microfiber) {
				return {
					...baseVariant,
					// Microfiber specific fields with defaults, ensuring correct mapping from fetched variant
					gsm_value: variant.gsm_value || '',
					size_id: variant.size_id?.toString() || '', // Ensure size_id is string for select
					color_id: variant.color_id?.toString() || '', // Ensure color_id is string for select
				};
			} else { // Assume liquid if not microfiber
				return {
					...baseVariant,
					// Liquid specific fields with defaults, ensuring correct mapping from fetched variant
					quantity: variant.quantity || '',
					unit: variant.unit || 'ml', // Default to ml if unit is missing
				};
			}
		}) || [];

		setForm({
			product_code: product.product_code || "",
			name: product.name || "",
			main_category_id: product.main_category_id?.toString() || "",
			description: product.description || "",
			is_microfiber: product.is_microfiber || false,
			subcategories: subcategoryIds, // Use integer IDs
			variants: productVariants, // Use mapped variants
			main_image_url: product.main_image_url || "",
			images: product.images || [],
			key_features: product.key_features || [],
			taglines: product.taglines || [],
		});
	};

	const handleInput = (e) => {
		const { name, value, type, checked } = e.target;
		setForm((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value
		}));

		if (name === "main_category_id") {
			const category = allCategories.find((c) => c.id.toString() === value);
			setSelectedCategory(category);
			setForm((prev) => ({
				...prev,
				is_microfiber: category?.is_microfiber || false,
				variants: []
			}));
		}
	};

	const handleSubcategoryChange = (categoryIdString) => {
		const categoryId = parseInt(categoryIdString);
		setForm(prev => ({
			...prev,
			subcategories: prev.subcategories.includes(categoryId)
				? prev.subcategories.filter(id => id !== categoryId)
				: [...prev.subcategories, categoryId]
		}));
	};

	const handleVariantChange = (index, field, value) => {
		const newVariants = [...form.variants];
		if (form.is_microfiber) {
			newVariants[index] = {
				...newVariants[index],
				[field]: value,
			};
		} else {
			// Handle liquid product sizes
			newVariants[index] = {
				...newVariants[index],
				[field]: value,
			};
		}
		setForm({ ...form, variants: newVariants });
	};

	const addVariant = () => {
		const newVariants = [...form.variants];
		if (form.is_microfiber) {
			newVariants.push({
				gsm_value: "",
				color_id: "",
				size_id: "",
				stock: 0,
				price: 0,
			});
		} else {
			// Add new liquid product size
			newVariants.push({
				quantity: "",
				unit: "ml", // Default unit
				price: 0,
				stock: 0,
			});
		}
		setForm({ ...form, variants: newVariants });
	};

	const removeVariant = (index) => {
		const newVariants = [...form.variants];
		newVariants.splice(index, 1);
		setForm({ ...form, variants: newVariants });
	};

	const duplicateVariant = (index) => {
		const variantToDuplicate = { ...form.variants[index] };
		const updated = [...form.variants];
		updated.splice(index + 1, 0, variantToDuplicate);
		setForm({ ...form, variants: updated });
	};

	const applyBulkPrice = () => {
		if (!bulkActions.bulkPrice) return;

		const updated = form.variants.map(variant => ({
			...variant,
			price: parseFloat(bulkActions.bulkPrice)
		}));
		setForm({ ...form, variants: updated });
		setBulkActions({ ...bulkActions, showBulkPrice: false, bulkPrice: "" });
	};

	const applyBulkStock = () => {
		if (!bulkActions.bulkStock) return;

		const updated = form.variants.map(variant => ({
			...variant,
			stock: parseInt(bulkActions.bulkStock)
		}));
		setForm({ ...form, variants: updated });
		setBulkActions({ ...bulkActions, showBulkStock: false, bulkStock: "" });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (saving) return;

		// Validation
		if (!form.name.trim()) {
			alert("Product name is required");
			return;
		}
		if (!form.main_category_id) {
			alert("Please select a category");
			return;
		}
		if (form.variants.length === 0) {
			alert("Please add at least one variant");
			return;
		}

		// Validate variants
		for (let i = 0; i < form.variants.length; i++) {
			const variant = form.variants[i];
			// Validate based on whether the product is microfiber
			if (form.is_microfiber) {
				// Microfiber validation
				if (!variant.gsm_value || !variant.size_id || !variant.color_id) {
					alert(`Variant ${i + 1}: Please fill all required fields (GSM, size, color)`);
					return;
				}
				// Check if stock and price are valid numbers
				if (variant.stock === null || variant.stock === undefined || isNaN(variant.stock) || variant.stock < 0) {
					alert(`Variant ${i + 1}: Stock must be a non-negative number.`);
					return;
				}
				if (variant.price === null || variant.price === undefined || isNaN(variant.price) || variant.price < 0) {
					alert(`Variant ${i + 1}: Price must be a non-negative number.`);
					return;
				}
			} else { // Assume liquid validation
				// Liquid validation
				if (!variant.quantity || !variant.unit) {
					alert(`Variant ${i + 1}: Please fill quantity and unit`);
					return;
				}
				// Check if quantity, stock, and price are valid numbers
				if (variant.quantity === null || variant.quantity === undefined || isNaN(variant.quantity) || variant.quantity < 0) {
					alert(`Variant ${i + 1}: Quantity must be a non-negative number.`);
					return;
				}
				if (variant.stock === null || variant.stock === undefined || isNaN(variant.stock) || variant.stock < 0) {
					alert(`Variant ${i + 1}: Stock must be a non-negative number.`);
					return;
				}
				if (variant.price === null || variant.price === undefined || isNaN(variant.price) || variant.price < 0) {
					alert(`Variant ${i + 1}: Price must be a non-negative number.`);
					return;
				}
			}
		}

		setSaving(true);
		try {
			const payload = {
				...form,
				main_category_id: parseInt(form.main_category_id),
				subcategories: form.subcategories.map(id => parseInt(id)),
				variants: form.variants.map(variant => {
					const baseVariant = {
						stock: parseInt(variant.stock) || 0,
						price: parseFloat(variant.price) || 0,
					};
					if (form.is_microfiber) {
						return {
							...baseVariant,
							gsm_value: parseFloat(variant.gsm_value) || 0,
							color_id: parseInt(variant.color_id) || null,
							size_id: parseInt(variant.size_id) || null,
						};
					} else {
						return {
							...baseVariant,
							quantity: parseFloat(variant.quantity) || 0,
							unit: variant.unit || '',
						};
					}
				})
			};

			if (isEditing) {
				await ProductService.updateProduct(product.id, payload);
				alert("Product updated successfully!");
			} else {
				await ProductService.createProduct(payload);
				alert("Product created successfully!");
			}

			onSuccess?.();
		} catch (err) {
			console.error("Error saving product:", err);
			alert("Error saving product: " + err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleImageUpload = async (e) => {
		const files = Array.from(e.target.files);
		if (files.length === 0) return;

		setUploadingImages(true);
		const uploadedUrls = [];

		try {
			for (const file of files) {
				// Validate file type
				if (!file.type.startsWith('image/')) {
					alert('Please upload only image files');
					continue;
				}

				// Validate file size (max 5MB)
				if (file.size > 5 * 1024 * 1024) {
					alert('File size should be less than 5MB');
					continue;
				}

				const formData = new FormData();
				formData.append('file', file);

				const response = await fetch('/api/upload', {
					method: 'POST',
					body: formData,
				});

				if (!response.ok) {
					const error = await response.json();
					throw new Error(error.error || 'Upload failed');
				}

				const data = await response.json();
				uploadedUrls.push(data.url);
			}

			// Update images state with new URLs
			setForm(prev => ({
				...prev,
				images: [...prev.images, ...uploadedUrls]
			}));

			// Set the first uploaded image as main image if none exists
			if (!form.main_image_url && uploadedUrls.length > 0) {
				setForm(prev => ({ ...prev, main_image_url: uploadedUrls[0] }));
			}
		} catch (error) {
			console.error('Error uploading images:', error);
			alert('Failed to upload images: ' + error.message);
		} finally {
			setUploadingImages(false);
		}
	};

	const handleSetMainImage = (url) => {
		setForm(prev => ({ ...prev, main_image_url: url }));
	};

	const handleRemoveImage = (url) => {
		setForm(prev => ({
			...prev,
			images: prev.images.filter(img => img !== url),
			main_image_url: prev.main_image_url === url ? (prev.images[0] || "") : prev.main_image_url
		}));
	};

	const handleAddKeyFeature = () => {
		if (!newKeyFeature.trim()) return;
		setForm(prev => ({
			...prev,
			key_features: [...prev.key_features, newKeyFeature.trim()]
		}));
		setNewKeyFeature("");
	};

	const handleRemoveKeyFeature = (index) => {
		setForm(prev => ({
			...prev,
			key_features: prev.key_features.filter((_, i) => i !== index)
		}));
	};

	const handleAddTagline = () => {
		if (!newTagline.trim()) return;
		setForm(prev => ({
			...prev,
			taglines: [...prev.taglines, newTagline.trim()]
		}));
		setNewTagline("");
	};

	const handleRemoveTagline = (index) => {
		setForm(prev => ({
			...prev,
			taglines: prev.taglines.filter((_, i) => i !== index)
		}));
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<span className="ml-2">Loading form data...</span>
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold text-gray-800">
					{isEditing ? "Edit Product" : "Create New Product"}
				</h2>
				<button
					onClick={onCancel}
					className="text-gray-500 hover:text-gray-700"
				>
					<X size={24} />
				</button>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Basic Product Info */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							<Hash className="inline w-4 h-4 mr-1" />
							Product Code
						</label>
						<input
							type="text"
							name="product_code"
							value={form.product_code}
							onChange={handleInput}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="PRD-001"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							<Package className="inline w-4 h-4 mr-1" />
							Product Name *
						</label>
						<input
							type="text"
							name="name"
							value={form.name}
							onChange={handleInput}
							required
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="Enter product name"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							<Archive className="inline w-4 h-4 mr-1" />
							Main Category *
						</label>
						<select
							name="main_category_id"
							value={form.main_category_id}
							onChange={handleInput}
							required
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="">Select a category</option>
							{allCategories.map((category) => (
								<option key={category.id} value={category.id}>
									{category.name} {category.is_microfiber ? "(Microfiber)" : "(Liquid)"}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							<Tag className="inline w-4 h-4 mr-1" />
							Additional Categories
						</label>
						<div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
							{allCategories
								.filter(c => c.id.toString() !== form.main_category_id)
								.map((category) => (
									<label key={category.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
										<input
											type="checkbox"
											checked={form.subcategories.includes(category.id)}
											onChange={() => handleSubcategoryChange(category.id.toString())}
											className="rounded text-blue-600 focus:ring-blue-500"
										/>
										<span className="text-sm">
											{category.name} {category.is_microfiber ? "(Microfiber)" : "(Liquid)"}
										</span>
									</label>
								))}
						</div>
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Description
					</label>
					<textarea
						name="description"
						value={form.description}
						onChange={handleInput}
						rows={3}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="Product description..."
					/>
				</div>

				{/* Image Upload Section */}
				<div className="border-t pt-6">
					<h3 className="text-lg font-semibold text-gray-800 mb-4">Product Images</h3>
					<div className="space-y-4">
						<div className="flex items-center gap-4">
							<label className="flex-1">
								<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
									<input
										type="file"
										multiple
										accept="image/*"
										onChange={handleImageUpload}
										className="hidden"
									/>
									<ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
									<p className="mt-2 text-sm text-gray-600">
										Click to upload images
									</p>
									<p className="text-xs text-gray-500">
										PNG, JPG, GIF up to 10MB
									</p>
								</div>
							</label>
						</div>

						{form.images.length > 0 && (
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{form.images.map((url, index) => (
									<div key={url} className="relative group">
										<img
											src={url}
											alt={`Product image ${index + 1}`}
											className={`w-full h-32 object-cover rounded-lg ${
												form.main_image_url === url ? 'ring-2 ring-blue-500' : ''
											}`}
										/>
										<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center gap-2">
											<button
												type="button"
												onClick={() => handleSetMainImage(url)}
												className="p-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
												title="Set as main image"
											>
												<ImageIcon size={16} />
											</button>
											<button
												type="button"
												onClick={() => handleRemoveImage(url)}
												className="p-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
												title="Remove image"
											>
												<Trash2 size={16} />
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Key Features Section */}
				<div className="border-t pt-6">
					<h3 className="text-lg font-semibold text-gray-800 mb-4">Key Features</h3>
					<div className="space-y-4">
						<div className="flex gap-2">
							<input
								type="text"
								value={newKeyFeature}
								onChange={(e) => setNewKeyFeature(e.target.value)}
								placeholder="Add a key feature"
								className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								onKeyPress={(e) => e.key === 'Enter' && handleAddKeyFeature()}
							/>
							<button
								type="button"
								onClick={handleAddKeyFeature}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
							>
								Add
							</button>
						</div>
						<div className="space-y-2">
							{form.key_features.map((feature, index) => (
								<div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
									<span className="flex-1">{feature}</span>
									<button
										type="button"
										onClick={() => handleRemoveKeyFeature(index)}
										className="text-red-600 hover:text-red-800"
									>
										<Trash2 size={16} />
									</button>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Taglines Section */}
				<div className="border-t pt-6">
					<h3 className="text-lg font-semibold text-gray-800 mb-4">Taglines</h3>
					<div className="space-y-4">
						<div className="flex gap-2">
							<input
								type="text"
								value={newTagline}
								onChange={(e) => setNewTagline(e.target.value)}
								placeholder="Add a tagline"
								className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								onKeyPress={(e) => e.key === 'Enter' && handleAddTagline()}
							/>
							<button
								type="button"
								onClick={handleAddTagline}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
							>
								Add
							</button>
						</div>
						<div className="space-y-2">
							{form.taglines.map((tagline, index) => (
								<div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
									<span className="flex-1">{tagline}</span>
									<button
										type="button"
										onClick={() => handleRemoveTagline(index)}
										className="text-red-600 hover:text-red-800"
									>
										<Trash2 size={16} />
									</button>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Variants Section */}
				<div className="border-t pt-6">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold text-gray-800">
							{form.is_microfiber ? "Microfiber Variants" : "Product Sizes"}
						</h3>
						<div className="flex gap-2">
							{form.variants.length > 0 && (
								<>
									<button
										type="button"
										onClick={() => setBulkActions({ ...bulkActions, showBulkPrice: !bulkActions.showBulkPrice })}
										className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
									>
										<DollarSign className="inline w-4 h-4 mr-1" />
										Bulk Price
									</button>
									<button
										type="button"
										onClick={() => setBulkActions({ ...bulkActions, showBulkStock: !bulkActions.showBulkStock })}
										className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
									>
										<Package className="inline w-4 h-4 mr-1" />
										Bulk Stock
									</button>
								</>
							)}
							<button
								type="button"
								onClick={addVariant}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
							>
								<Plus size={16} />
								Add Variant
							</button>
						</div>
					</div>

					{/* Bulk Actions */}
					{bulkActions.showBulkPrice && (
						<div className="mb-4 p-3 bg-orange-50 rounded-lg border">
							<div className="flex items-center gap-2">
								<input
									type="number"
									step="0.01"
									value={bulkActions.bulkPrice}
									onChange={(e) => setBulkActions({ ...bulkActions, bulkPrice: e.target.value })}
									placeholder="Enter price for all variants"
									className="flex-1 px-3 py-2 border rounded"
								/>
								<button
									type="button"
									onClick={applyBulkPrice}
									className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
								>
									Apply to All
								</button>
							</div>
						</div>
					)}

					{bulkActions.showBulkStock && (
						<div className="mb-4 p-3 bg-purple-50 rounded-lg border">
							<div className="flex items-center gap-2">
								<input
									type="number"
									value={bulkActions.bulkStock}
									onChange={(e) => setBulkActions({ ...bulkActions, bulkStock: e.target.value })}
									placeholder="Enter stock for all variants"
									className="flex-1 px-3 py-2 border rounded"
								/>
								<button
									type="button"
									onClick={applyBulkStock}
									className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
								>
									Apply to All
								</button>
							</div>
						</div>
					)}

					{/* Variants List */}
					<div className="space-y-4">
						{form.variants.map((variant, index) => (
							<div
								key={index}
								className={`p-4 border rounded-lg ${
									activeVariantIndex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
								}`}
								onClick={() => setActiveVariantIndex(index)}
							>
								<div className="flex justify-between items-start mb-3">
									<h4 className="font-medium text-gray-800">
										Variant {index + 1}
									</h4>
									<div className="flex gap-1">
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												duplicateVariant(index);
											}}
											className="p-1 text-blue-600 hover:bg-blue-100 rounded"
											title="Duplicate variant"
										>
											<Plus size={16} />
										</button>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												removeVariant(index);
											}}
											className="p-1 text-red-600 hover:bg-red-100 rounded"
											title="Remove variant"
										>
											<Trash2 size={16} />
										</button>
									</div>
								</div>

								{/* Conditionally render fields based on form.is_microfiber */}
								{form.is_microfiber ? (
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
										<div>
											<label className="block text-xs font-medium text-gray-600 mb-1">
												GSM Value *
											</label>
											<input
												type="number"
												step="0.1"
												value={variant.gsm_value || ''}
												onChange={(e) => handleVariantChange(index, "gsm_value", e.target.value)}
												required
												className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
												placeholder="300"
											/>
										</div>

										<div>
											<label className="block text-xs font-medium text-gray-600 mb-1">
												<Ruler className="inline w-3 h-3 mr-1" />
												Size *
											</label>
											<select
												value={variant.size_id || ''}
												onChange={(e) => handleVariantChange(index, "size_id", e.target.value)}
												required
												className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
											>
												<option value="">Select size</option>
												{allSizes.map((size) => (
													<option key={size.id} value={size.id}>
														{size.size_cm}
													</option>
												))}
											</select>
										</div>

										<div>
											<label className="block text-xs font-medium text-gray-600 mb-1">
												<Palette className="inline w-3 h-3 mr-1" />
												Color *
											</label>
											<select
												value={variant.color_id || ''}
												onChange={(e) => handleVariantChange(index, "color_id", e.target.value)}
												required
												className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
											>
												<option value="">Select color</option>
												{allColors.map((color) => (
													<option key={color.id} value={color.id}>
														{color.name}
													</option>
												))}
											</select>
										</div>

										<div>
											<label className="block text-xs font-medium text-gray-600 mb-1">
												<Package className="inline w-3 h-3 mr-1" />
												Stock
											</label>
											<input
												type="number"
												value={variant.stock || 0}
												onChange={(e) => handleVariantChange(index, "stock", parseInt(e.target.value))}
												className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
												placeholder="0"
											/>
										</div>

										<div>
											<label className="block text-xs font-medium text-gray-600 mb-1">
												<DollarSign className="inline w-3 h-3 mr-1" />
												Price
											</label>
											<input
												type="number"
												step="0.01"
												value={variant.price || 0}
												onChange={(e) => handleVariantChange(index, "price", parseFloat(e.target.value))}
												className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
												placeholder="0.00"
											/>
										</div>
									</div>
								) : (
									<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
										<div>
											<label className="block text-xs font-medium text-gray-600 mb-1">
												Quantity *
											</label>
											<input
												type="number"
												step="0.1"
												value={variant.quantity || ''}
												onChange={(e) => handleVariantChange(index, "quantity", e.target.value)}
												required
												className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
												placeholder="500"
											/>
										</div>

										<div>
											<label className="block text-xs font-medium text-gray-600 mb-1">
												Unit *
											</label>
											<select
												value={variant.unit || ''}
												onChange={(e) => handleVariantChange(index, "unit", e.target.value)}
												required
												className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
											>
												<option value="">Select Unit</option>
												<option value="ml">ml</option>
												<option value="L">L</option>
											</select>
										</div>

										<div>
											<label className="block text-xs font-medium text-gray-600 mb-1">
												<Package className="inline w-3 h-3 mr-1" />
												Stock *
											</label>
											<input
												type="number"
												value={variant.stock || 0}
												onChange={(e) => handleVariantChange(index, "stock", parseInt(e.target.value))}
												required
												className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
												placeholder="0"
												min="0"
											/>
										</div>

										<div>
											<label className="block text-xs font-medium text-gray-600 mb-1">
												<DollarSign className="inline w-3 h-3 mr-1" />
												Price *
											</label>
											<input
												type="number"
												step="0.01"
												value={variant.price || 0}
												onChange={(e) => handleVariantChange(index, "price", parseFloat(e.target.value))}
												required
												className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
												placeholder="0.00"
												min="0"
											/>
										</div>
									</div>
								)}
							</div>
						))}

						{form.variants.length === 0 && (
							<div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
								<Package className="mx-auto w-8 h-8 mb-2 opacity-50" />
								<p>No variants added yet.</p>
								<p className="text-sm">Click "Add Variant" to start adding product variants.</p>
							</div>
						)}
					</div>
				</div>

				{/* Form Actions */}
				<div className="flex justify-end gap-3 pt-6 border-t">
					<button
						type="button"
						onClick={onCancel}
						className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={saving}
						className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
						{saving ? "Saving..." : (isEditing ? "Update Product" : "Create Product")}
					</button>
				</div>
			</form>
		</div>
	);
}
