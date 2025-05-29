"use client";
import { useState, useEffect } from "react";
import { ProductService } from "@/lib/service/productService";
import { supabase } from "@/lib/supabaseClient";

/**
 * Enhanced Product Form Component
 * Handles creating and editing products with image upload
 */
export default function ProductForm({ product, onSuccess, onCancel }) {
	const [formData, setFormData] = useState({
		id: "",
		name: "",
		description: "",
		key_features: [""],
		category: "",
		variant_type: "",
		variants: [{ value: "", price: "", stock: 0, color: "", gsm: "" }],
		image: [],
	});

	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState({});
	const [isEditing, setIsEditing] = useState(false);
	const [imageFiles, setImageFiles] = useState([]);
	const [imageUploading, setImageUploading] = useState(false);

	// Categories and variant types
	const categories = [
		{ value: "car interior", label: "Car Interior" },
		{ value: "car exterior", label: "Car Exterior" },
		{ value: "microfiber cloth", label: "Microfiber Cloth" },
	];

	const variantTypes = [
		{ value: "quantity", label: "Quantity (ML/GM)" },
		{ value: "size", label: "Size (Dimensions)" },
	];

	// Initialize form with product data for editing
	useEffect(() => {
		if (product) {
			setIsEditing(true);
			setFormData({
				id: product.id || "",
				name: product.name || "",
				description: product.description || "",
				key_features:
					product.key_features?.length > 0 ? product.key_features : [""],
				category: product.category || "",
				variant_type: product.variant_type || "",
				variants:
					product.variants?.length > 0
						? product.variants
						: [{ value: "", price: "", stock: 0, color: "", gsm: "" }],
				image: Array.isArray(product.image) ? product.image : [],
			});
		}
	}, [product]);

	// Handle input changes
	const handleInputChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));

		// Clear field error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({
				...prev,
				[field]: null,
			}));
		}
	};

	// Handle image file selection
	const handleImageChange = (e) => {
		const files = Array.from(e.target.files);
		setImageFiles(files);
	};

	// Upload images to Supabase storage
	const uploadImages = async (files) => {
		const uploadedPaths = [];

		for (const file of files) {
			const fileExt = file.name.split('.').pop();
			const fileName = `${formData.id}_${Date.now()}.${fileExt}`;
			const filePath = `products/${fileName}`;

			const { data, error } = await supabase.storage
				.from('product-images')
				.upload(filePath, file);

			if (error) {
				throw new Error(`Failed to upload ${file.name}: ${error.message}`);
			}

			uploadedPaths.push(data.path);
		}

		return uploadedPaths;
	};

	// Remove image from form
	const removeImage = async (imageIndex, imagePath) => {
		try {
			// If it's an existing image, delete from storage
			if (imagePath && isEditing) {
				const { error } = await supabase.storage
					.from('product-images')
					.remove([imagePath]);

				if (error) {
					console.error('Error deleting image:', error);
				}
			}

			// Remove from form data
			const newImages = formData.image.filter((_, index) => index !== imageIndex);
			setFormData(prev => ({
				...prev,
				image: newImages
			}));
		} catch (error) {
			console.error('Error removing image:', error);
		}
	};

	// Handle key features changes
	const handleKeyFeatureChange = (index, value) => {
		const newFeatures = [...formData.key_features];
		newFeatures[index] = value;
		setFormData((prev) => ({
			...prev,
			key_features: newFeatures,
		}));
	};

	const addKeyFeature = () => {
		setFormData((prev) => ({
			...prev,
			key_features: [...prev.key_features, ""],
		}));
	};

	const removeKeyFeature = (index) => {
		if (formData.key_features.length > 1) {
			const newFeatures = formData.key_features.filter((_, i) => i !== index);
			setFormData((prev) => ({
				...prev,
				key_features: newFeatures,
			}));
		}
	};

	// Handle variant changes
	const handleVariantChange = (index, field, value) => {
		const newVariants = [...formData.variants];
		newVariants[index] = {
			...newVariants[index],
			[field]: value,
		};
		setFormData((prev) => ({
			...prev,
			variants: newVariants,
		}));
	};

	const addVariant = () => {
		setFormData((prev) => ({
			...prev,
			variants: [
				...prev.variants,
				{ value: "", price: "", stock: 0, color: "", gsm: "" },
			],
		}));
	};

	const removeVariant = (index) => {
		if (formData.variants.length > 1) {
			const newVariants = formData.variants.filter((_, i) => i !== index);
			setFormData((prev) => ({
				...prev,
				variants: newVariants,
			}));
		}
	};

	// Get image URL for display
	const getImageUrl = (imagePath) => {
		if (!imagePath) return null;
		if (typeof imagePath === 'string' && imagePath.startsWith("http")) return imagePath;
		return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${imagePath}`;
	};

	// Handle form submission
	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setErrors({});

		try {
			// Upload new images if any
			let uploadedImagePaths = [...formData.image];
			if (imageFiles.length > 0) {
				setImageUploading(true);
				const newImagePaths = await uploadImages(imageFiles);
				uploadedImagePaths = [...uploadedImagePaths, ...newImagePaths];
				setImageUploading(false);
			}

			// Prepare form data with uploaded images
			const submitData = {
				...formData,
				image: uploadedImagePaths,
				key_features: formData.key_features.filter(
					(feature) => feature.trim() !== "",
				),
				variants: formData.variants.map((variant) => ({
					...variant,
					price: parseFloat(variant.price),
					stock: parseInt(variant.stock) || 0,
					...(formData.category === "microfiber cloth" && {
						color: variant.color,
						gsm: parseInt(variant.gsm) || 0,
					}),
				})),
			};

			// Client-side validation
			const validation = ProductService.validateProductData(submitData);
			if (!validation.isValid) {
				const errorObj = {};
				validation.errors.forEach((error) => {
					const field = error.split(":")[0] || error.split(" ")[0];
					errorObj[field] = error;
				});
				setErrors(errorObj);
				setLoading(false);
				return;
			}

			let result;
			if (isEditing) {
				result = await ProductService.updateProduct(formData.id, submitData);
			} else {
				result = await ProductService.createProduct(submitData);
			}

			if (result.success) {
				onSuccess(result);
			} else {
				throw new Error(result.error || "Operation failed");
			}
		} catch (error) {
			console.error("Form submission error:", error);
			setErrors({ submit: error.message });
		} finally {
			setLoading(false);
			setImageUploading(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
			<div className="px-6 py-4 border-b border-gray-200">
				<h2 className="text-2xl font-bold text-gray-800">
					{isEditing ? "Edit Product" : "Add New Product"}
				</h2>
			</div>

			<form onSubmit={handleSubmit} className="p-6 space-y-6">
				{/* Product ID and Name */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Product ID *
						</label>
						<input
							type="text"
							value={formData.id}
							onChange={(e) => handleInputChange("id", e.target.value)}
							disabled={isEditing}
							className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
								isEditing ? "bg-gray-100 cursor-not-allowed" : "border-gray-300"
							} ${errors.id ? "border-red-500" : ""}`}
							placeholder="e.g., CAR-INT-001"
						/>
						{errors.id && (
							<p className="text-red-500 text-sm mt-1">{errors.id}</p>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Product Name *
						</label>
						<input
							type="text"
							value={formData.name}
							onChange={(e) => handleInputChange("name", e.target.value)}
							className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
								errors.name ? "border-red-500" : ""
							}`}
							placeholder="Enter product name"
						/>
						{errors.name && (
							<p className="text-red-500 text-sm mt-1">{errors.name}</p>
						)}
					</div>
				</div>

				{/* Description */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Description
					</label>
					<textarea
						value={formData.description}
						onChange={(e) => handleInputChange("description", e.target.value)}
						rows={4}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Enter detailed product description"
					/>
				</div>

				{/* Product Images */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Product Images
					</label>

					{/* Existing Images */}
					{formData.image.length > 0 && (
						<div className="mb-4">
							<p className="text-sm text-gray-600 mb-2">Current Images:</p>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{formData.image.map((imagePath, index) => (
									<div key={index} className="relative">
										<img
											src={getImageUrl(imagePath)}
											alt={`Product ${index + 1}`}
											className="w-full h-24 object-cover rounded-md border"
										/>
										<button
											type="button"
											onClick={() => removeImage(index, imagePath)}
											className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
										>
											×
										</button>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Upload New Images */}
					<div>
						<input
							type="file"
							multiple
							accept="image/*"
							onChange={handleImageChange}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<p className="text-sm text-gray-500 mt-1">
							Select multiple images (JPG, PNG, WebP)
						</p>
						{imageUploading && (
							<p className="text-blue-500 text-sm mt-2">Uploading images...</p>
						)}
					</div>
				</div>

				{/* Key Features */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Key Features
					</label>
					{formData.key_features.map((feature, index) => (
						<div key={index} className="flex items-center gap-2 mb-2">
							<input
								type="text"
								value={feature}
								onChange={(e) => handleKeyFeatureChange(index, e.target.value)}
								className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder={`Feature ${index + 1}`}
							/>
							{formData.key_features.length > 1 && (
								<button
									type="button"
									onClick={() => removeKeyFeature(index)}
									className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
								>
									Remove
								</button>
							)}
						</div>
					))}
					<button
						type="button"
						onClick={addKeyFeature}
						className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
					>
						Add Feature
					</button>
				</div>

				{/* Category and Variant Type */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Category *
						</label>
						<select
							value={formData.category}
							onChange={(e) => handleInputChange("category", e.target.value)}
							className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
								errors.category ? "border-red-500" : ""
							}`}
						>
							<option value="">Select Category</option>
							{categories.map((cat) => (
								<option key={cat.value} value={cat.value}>
									{cat.label}
								</option>
							))}
						</select>
						{errors.category && (
							<p className="text-red-500 text-sm mt-1">{errors.category}</p>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Variant Type *
						</label>
						<select
							value={formData.variant_type}
							onChange={(e) =>
								handleInputChange("variant_type", e.target.value)
							}
							className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
								errors.variant_type ? "border-red-500" : ""
							}`}
						>
							<option value="">Select Variant Type</option>
							{variantTypes.map((type) => (
								<option key={type.value} value={type.value}>
									{type.label}
								</option>
							))}
						</select>
						{errors.variant_type && (
							<p className="text-red-500 text-sm mt-1">{errors.variant_type}</p>
						)}
					</div>
				</div>

				{/* Variants */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Product Variants *
					</label>
					{formData.variants.map((variant, index) => (
						<div
							key={index}
							className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50"
						>
							<div className="flex justify-between items-center mb-3">
								<h4 className="text-md font-medium text-gray-700">
									Variant {index + 1}
								</h4>
								{formData.variants.length > 1 && (
									<button
										type="button"
										onClick={() => removeVariant(index)}
										className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition"
									>
										Remove
									</button>
								)}
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
								<div>
									<label className="block text-sm font-medium text-gray-600 mb-1">
										{formData.variant_type === "quantity"
											? "Quantity (e.g., 100ml, 200gm)"
											: "Size (e.g., 10x10 cm)"}
									</label>
									<input
										type="text"
										value={variant.value}
										onChange={(e) =>
											handleVariantChange(index, "value", e.target.value)
										}
										className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
										placeholder={
											formData.variant_type === "quantity"
												? "100ml"
												: "10x10 cm"
										}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-600 mb-1">
										Price (₹)
									</label>
									<input
										type="number"
										value={variant.price}
										onChange={(e) =>
											handleVariantChange(index, "price", e.target.value)
										}
										className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
										placeholder="200"
										min="0"
										step="0.01"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-600 mb-1">
										Stock Quantity
									</label>
									<input
										type="number"
										value={variant.stock}
										onChange={(e) =>
											handleVariantChange(index, "stock", e.target.value)
										}
										className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
										placeholder="50"
										min="0"
									/>
								</div>
							</div>

							{/* Additional fields for microfiber cloth */}
							{formData.category === "microfiber cloth" && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
									<div>
										<label className="block text-sm font-medium text-gray-600 mb-1">
											Color
										</label>
										<input
											type="text"
											value={variant.color}
											onChange={(e) =>
												handleVariantChange(index, "color", e.target.value)
											}
											className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
											placeholder="Red, Blue, Green"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-600 mb-1">
											GSM
										</label>
										<input
											type="number"
											value={variant.gsm}
											onChange={(e) =>
												handleVariantChange(index, "gsm", e.target.value)
											}
											className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
											placeholder="200"
											min="0"
										/>
									</div>
								</div>
							)}
						</div>
					))}

					<button
						type="button"
						onClick={addVariant}
						className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
					>
						Add Variant
					</button>
					{errors.variants && (
						<p className="text-red-500 text-sm mt-1">{errors.variants}</p>
					)}
				</div>

				{/* Submit Error */}
				{errors.submit && (
					<div className="bg-red-50 border border-red-200 rounded-md p-3">
						<p className="text-red-600 text-sm">{errors.submit}</p>
					</div>
				)}

				{/* Form Actions */}
				<div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
					<button
						type="button"
						onClick={onCancel}
						className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
						disabled={loading || imageUploading}
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={loading || imageUploading}
						className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ${
							loading || imageUploading ? "opacity-50 cursor-not-allowed" : ""
						}`}
					>
						{loading || imageUploading ? (
							<span className="flex items-center gap-2">
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
								{imageUploading ? "Uploading..." : isEditing ? "Updating..." : "Creating..."}
							</span>
						) : isEditing ? (
							"Update Product"
						) : (
							"Create Product"
						)}
					</button>
				</div>
			</form>
		</div>
	);
}
