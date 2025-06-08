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
		category_name: "",
		description: "",
		is_microfiber: false,
		subcategory_names: [],
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
	const [allGsm, setAllGsm] = useState([]);
	const [allQuantities, setAllQuantities] = useState([]);
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
			const [sizesRes, colorsRes, categoriesRes, gsmRes, quantitiesRes] = await Promise.all([
				ProductService.getSizes(),
				ProductService.getColors(),
				ProductService.getCategories(),
				ProductService.getGSM(),
				ProductService.getQuantities(),
			]);

			setAllSizes(sizesRes.data || []);
			setAllColors(colorsRes.data || []);
			setAllCategories(categoriesRes.data || []);
			setAllGsm(gsmRes.data || []);
			setAllQuantities(quantitiesRes.data || []);

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

		const mainCategory = allCategories.find(c => c.name === product.category_name);
		if (mainCategory) {
			setSelectedCategory(mainCategory);
		}

		const productVariants = product.variants?.map(variant => {
			if (product.is_microfiber) {
				return {
					id: variant.id || null,
					gsm: variant.gsm || '',
					size: variant.size_cm || variant.size || '',
					color: variant.color || '',
					stock: parseInt(variant.stock) || 0,
					price: parseFloat(variant.price) || 0,
					compareAtPrice: parseFloat(variant.compare_at_price || variant.compareAtPrice) || null
				};
			} else {
				return {
					id: variant.id || null,
					quantity: variant.quantity || '',
					unit: variant.unit || 'ml',
					stock: parseInt(variant.stock) || 0,
					price: parseFloat(variant.price) || 0,
					compareAtPrice: parseFloat(variant.compare_at_price || variant.compareAtPrice) || null
				};
			}
		}) || [];

		setForm({
			product_code: product.product_code || "",
			name: product.name || "",
			category_name: product.category_name || "",
			description: product.description || "",
			is_microfiber: product.is_microfiber || false,
			subcategory_names: product.subcategory_names || [],
			variants: productVariants,
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

		if (name === "category_name") {
			const category = allCategories.find((c) => c.name === value);
			setSelectedCategory(category);
			setForm((prev) => ({
				...prev,
				is_microfiber: category?.is_microfiber || false,
				variants: [] // Clear variants when category changes
			}));
		}
	};

	const handleSubcategoryChange = (categoryName) => {
		setForm(prev => ({
			...prev,
			subcategory_names: prev.subcategory_names.includes(categoryName)
				? prev.subcategory_names.filter(name => name !== categoryName)
				: [...prev.subcategory_names, categoryName]
		}));
	};

	const handleVariantChange = (index, field, value) => {
		const newVariants = [...form.variants];
		// Update the field with the direct value
		newVariants[index] = {
			...newVariants[index],
			[field]: value,
		};
		setForm({ ...form, variants: newVariants });
	};

	const addVariant = () => {
		const newVariants = [...form.variants];
		const generateVariantId = () => {
			// Generate a unique ID using timestamp and random string
			return `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		};

		if (form.is_microfiber) {
			newVariants.push({
				id: generateVariantId(),
				gsm: "",
				size: "",
				color: "",
				stock: 0,
				price: 0,
				compareAtPrice: null
			});
		} else {
			newVariants.push({
				id: generateVariantId(),
				quantity: "",
				unit: "ml",
				stock: 0,
				price: 0,
				compareAtPrice: null
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
		// Generate new ID for the duplicated variant
		variantToDuplicate.id = `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
		if (!form.category_name) {
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
			if (form.is_microfiber) {
				if (!variant.gsm || !variant.size || !variant.color) {
					alert(`Variant ${i + 1}: Please fill all required fields (GSM, size, color)`);
					return;
				}
			} else {
				if (!variant.quantity) {
					alert(`Variant ${i + 1}: Please fill quantity`);
					return;
				}
			}
			if (isNaN(variant.stock) || variant.stock < 0) {
				alert(`Variant ${i + 1}: Stock must be a non-negative number.`);
				return;
			}
			if (isNaN(variant.price) || variant.price < 0) {
				alert(`Variant ${i + 1}: Price must be a non-negative number.`);
				return;
			}
		}

		setSaving(true);
		try {
			// Create a clean payload with only necessary fields
			const payload = {
				product_code: form.product_code,
				name: form.name,
				category_name: form.category_name,
				description: form.description,
				is_microfiber: form.is_microfiber,
				subcategory_names: form.subcategory_names,
				main_image_url: form.main_image_url,
				images: form.images,
				key_features: form.key_features,
				taglines: form.taglines,
				variants: form.variants.map(variant => {
					// For microfiber products
					if (form.is_microfiber) {
						return {
							gsm: variant.gsm,
							size: variant.size,
							color: variant.color,
							stock: parseInt(variant.stock),
							price: parseFloat(variant.price),
							compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : null
						};
					}
					// For non-microfiber products
					return {
						quantity: variant.quantity,
						unit: variant.unit,
						stock: parseInt(variant.stock),
						price: parseFloat(variant.price),
						compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : null
					};
				})
			};

			console.log("Submitting payload:", payload); // Debug log

			if (isEditing) {
				await ProductService.updateProduct(product.id, payload);
			} else {
				await ProductService.createProduct(payload);
			}

			if (onSuccess) {
				onSuccess();
			}
		} catch (error) {
			console.error("Error saving product:", error);
			alert("Error saving product: " + error.message);
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
							name="category_name"
							value={form.category_name}
							onChange={handleInput}
							required
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="">Select a category</option>
							{allCategories.map((category) => (
								<option key={category.name} value={category.name}>
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
								.filter(c => c.name !== form.category_name)
								.map((category) => (
									<label key={category.name} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
										<input
											type="checkbox"
											checked={form.subcategory_names.includes(category.name)}
											onChange={() => handleSubcategoryChange(category.name)}
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
											<select
												value={variant.gsm || ''}
												onChange={(e) => handleVariantChange(index, "gsm", e.target.value)}
												required
												className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
											>
												<option value="">Select GSM</option>
												{allGsm.map((gsm) => (
													<option key={gsm.id} value={gsm.gsm}>
														{gsm.gsm}
													</option>
												))}
											</select>
										</div>

										<div>
											<label className="block text-xs font-medium text-gray-600 mb-1">
												<Ruler className="inline w-3 h-3 mr-1" />
												Size *
											</label>
											<select
												value={variant.size || ''}
												onChange={(e) => handleVariantChange(index, "size", e.target.value)}
												required
												className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
											>
												<option value="">Select size</option>
												{allSizes.map((size) => (
													<option key={size.id} value={size.size_cm}>
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
												value={variant.color || ''}
												onChange={(e) => handleVariantChange(index, "color", e.target.value)}
												required
												className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
											>
												<option value="">Select color</option>
												{allColors.map((color) => (
													<option key={color.id} value={color.color}>
														{color.color}
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
											<select
												value={variant.quantity || ''}
												onChange={(e) => handleVariantChange(index, "quantity", e.target.value)}
												required
												className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
											>
												<option value="">Select Quantity</option>
												{allQuantities.map((qty) => (
													<option key={qty.id} value={qty.quantity}>
														{qty.quantity} {qty.unit}
													</option>
												))}
											</select>
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
