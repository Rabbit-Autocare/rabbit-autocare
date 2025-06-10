"use client"

import { useState, useEffect } from "react"
import { ProductService } from "@/lib/service/productService"
import ProductDetail from "@/components/shop/ProductDetail"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function ProductPage() {
	const pathname = usePathname()
	const productCode = pathname.split("/").pop()
	const [product, setProduct] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		const fetchProduct = async () => {
			if (!productCode) {
				setError("Product code is missing from URL")
				setLoading(false)
				return
			}

			setLoading(true)
			setError(null)
			try {
				console.log("Fetching product with code:", productCode)
				const productData = await ProductService.getProduct(productCode)

				if (productData) {
					setProduct(productData)
				} else {
					setError("Product not found")
				}
			} catch (err) {
				console.error("Error fetching product:", err)
				setError(err.message || "Failed to fetch product")
			} finally {
				setLoading(false)
			}
		}

		fetchProduct()
	}, [productCode])

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-[500px]">
				<Loader2 className="h-16 w-16 animate-spin text-blue-500" />
				<p className="ml-4 text-gray-600">Loading product details...</p>
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex justify-center items-center min-h-[500px]">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
					<p className="text-gray-700">{error}</p>
				</div>
			</div>
		)
	}

	if (!product) {
		return (
			<div className="flex justify-center items-center min-h-[500px]">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-gray-800 mb-2">Product Not Found</h2>
					<p className="text-gray-600">The product you are looking for does not exist or has been removed.</p>
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<ProductDetail product={product} />
		</div>
	)
}
