"use client";
import { useEffect, useState } from "react";
import { ProductService } from "@/lib/service/productService";

export default function ManageVariantsForm() {
	const [sizes, setSizes] = useState([]);
	const [colors, setColors] = useState([]);
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(false);

	const [newSize, setNewSize] = useState("");
	const [newColor, setNewColor] = useState("");
	const [newCategory, setNewCategory] = useState("");
	const [isMicrofiber, setIsMicrofiber] = useState(false);

	useEffect(() => {
		fetchVariants();
	}, []);

	const fetchVariants = async () => {
		setLoading(true);
		try {
			const [sizeRes, colorRes, categoryRes] = await Promise.all([
				ProductService.getSizes(),
				ProductService.getColors(),
				ProductService.getCategories(),
			]);

			setSizes(sizeRes.data || []);
			setColors(colorRes.data || []);
			setCategories(categoryRes.data || []);
		} catch (error) {
			console.error("Error fetching variants:", error);
			alert("Error fetching data: " + error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleAddSize = async () => {
		if (!newSize.trim()) {
			alert("Please enter a size");
			return;
		}

		try {
			await ProductService.createSize({ size_cm: newSize.trim() });
			setNewSize("");
			fetchVariants();
			alert("Size added successfully!");
		} catch (error) {
			console.error("Error adding size:", error);
			alert("Error adding size: " + error.message);
		}
	};

	const handleAddColor = async () => {
		if (!newColor.trim()) {
			alert("Please enter a color name");
			return;
		}

		try {
			await ProductService.createColor({ name: newColor.trim() });
			setNewColor("");
			fetchVariants();
			alert("Color added successfully!");
		} catch (error) {
			console.error("Error adding color:", error);
			alert("Error adding color: " + error.message);
		}
	};

	const handleAddCategory = async () => {
		if (!newCategory.trim()) {
			alert("Please enter a category name");
			return;
		}

		try {
			await ProductService.createCategory({
				name: newCategory.trim(),
				is_microfiber: isMicrofiber,
			});
			setNewCategory("");
			setIsMicrofiber(false);
			fetchVariants();
			alert("Category added successfully!");
		} catch (error) {
			console.error("Error adding category:", error);
			alert("Error adding category: " + error.message);
		}
	};

	if (loading) {
		return (
			<div className="max-w-3xl mx-auto p-6 bg-white rounded shadow text-black">
				<div className="text-center">Loading variants...</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-6 bg-white rounded shadow text-black">
			<h2 className="text-2xl font-bold text-purple-700 mb-6">
				Manage Product Variants
			</h2>

			{/* Categories */}
			<div className="mb-8 p-4 border border-gray-200 rounded-lg">
				<h3 className="text-lg font-semibold text-indigo-700 mb-3">
					Categories
				</h3>
				<div className="flex flex-wrap gap-2 mb-3">
					<input
						value={newCategory}
						onChange={(e) => setNewCategory(e.target.value)}
						placeholder="Enter category name (e.g., Car Care, Microfiber Cloth)"
						className="border p-2 rounded flex-1 min-w-64"
						onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
					/>
					<label className="inline-flex items-center bg-gray-50 px-3 py-2 rounded border">
						<input
							type="checkbox"
							checked={isMicrofiber}
							onChange={(e) => setIsMicrofiber(e.target.checked)}
							className="mr-2"
						/>
						<span className="text-sm">Is Microfiber Product?</span>
					</label>
					<button
						onClick={handleAddCategory}
						className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 whitespace-nowrap"
					>
						+ Add Category
					</button>
				</div>
				<div className="max-h-32 overflow-y-auto">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						{categories.map((cat) => (
							<div
								key={cat.id}
								className="flex items-center justify-between p-2 bg-gray-50 rounded"
							>
								<span className="font-medium">{cat.name}</span>
								<span
									className={`px-2 py-1 text-xs rounded ${
										cat.is_microfiber
											? "bg-blue-100 text-blue-800"
											: "bg-green-100 text-green-800"
									}`}
								>
									{cat.is_microfiber ? "Microfiber" : "Bottle"}
								</span>
							</div>
						))}
					</div>
				</div>
				{categories.length === 0 && (
					<p className="text-gray-500 text-center py-4">
						No categories added yet
					</p>
				)}
			</div>

			{/* Sizes */}
			<div className="mb-8 p-4 border border-gray-200 rounded-lg">
				<h3 className="text-lg font-semibold text-indigo-700 mb-3">
					Sizes (for Microfiber Products)
				</h3>
				<div className="flex gap-2 mb-3">
					<input
						value={newSize}
						onChange={(e) => setNewSize(e.target.value)}
						placeholder="Enter size (e.g., 40x60, 30x30, 50x80)"
						className="border p-2 rounded flex-1"
						onKeyPress={(e) => e.key === "Enter" && handleAddSize()}
					/>
					<button
						onClick={handleAddSize}
						className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 whitespace-nowrap"
					>
						+ Add Size
					</button>
				</div>
				<div className="max-h-32 overflow-y-auto">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
						{sizes.map((s) => (
							<div key={s.id} className="p-2 bg-gray-50 rounded text-center">
								{s.size_cm} cm
							</div>
						))}
					</div>
				</div>
				{sizes.length === 0 && (
					<p className="text-gray-500 text-center py-4">No sizes added yet</p>
				)}
			</div>

			{/* Colors */}
			<div className="mb-8 p-4 border border-gray-200 rounded-lg">
				<h3 className="text-lg font-semibold text-indigo-700 mb-3">
					Colors (for Microfiber Products)
				</h3>
				<div className="flex gap-2 mb-3">
					<input
						value={newColor}
						onChange={(e) => setNewColor(e.target.value)}
						placeholder="Enter color name (e.g., Blue, Red, Yellow, White)"
						className="border p-2 rounded flex-1"
						onKeyPress={(e) => e.key === "Enter" && handleAddColor()}
					/>
					<button
						onClick={handleAddColor}
						className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 whitespace-nowrap"
					>
						+ Add Color
					</button>
				</div>
				<div className="max-h-32 overflow-y-auto">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
						{colors.map((c) => (
							<div
								key={c.id}
								className="p-2 bg-gray-50 rounded text-center capitalize"
							>
								{c.name}
							</div>
						))}
					</div>
				</div>
				{colors.length === 0 && (
					<p className="text-gray-500 text-center py-4">No colors added yet</p>
				)}
			</div>

			{/* Information Panel */}
			<div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
				<div className="flex">
					<div className="ml-3">
						<h4 className="text-sm font-medium text-blue-800">How to use:</h4>
						<div className="mt-2 text-sm text-blue-700">
							<p className="mb-2">
								<strong>Categories:</strong> Create categories for your
								products. Mark as "Microfiber" for cloth products, leave
								unchecked for bottle/liquid products.
							</p>
							<p className="mb-2">
								<strong>Sizes:</strong> Add dimensions for microfiber products
								(e.g., 40x60, 30x30).
							</p>
							<p>
								<strong>Colors:</strong> Add color options for microfiber
								products.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
