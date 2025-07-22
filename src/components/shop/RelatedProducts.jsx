"use client"

import { useState, useEffect } from "react"
// import Image from "next/image"
// import Link from "next/link"
import { ProductService } from "@/lib/service/productService"
import { KitsCombosService } from "@/lib/service/kitsCombosService"
import ProductCard from "@/components/shop/ProductCard";

export default function RelatedProducts({ categoryName, currentProductId, limit = 4, includedProducts }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Ensure every product has a valid variants array with base_price
  const normalizeProduct = (prod) => {
    const basePrice = Number(prod.base_price || prod.price || 0);
    let variants = prod.variants;
    if (!Array.isArray(variants) || variants.length === 0) {
      variants = [{ base_price: basePrice }];
    } else {
      variants = variants.map(v => ({
        ...v,
        base_price: Number(v.base_price || v.price || basePrice)
      }));
    }
    return {
      ...prod,
      base_price: basePrice,
      variants,
      product_code: prod.product_code || prod.id,
    };
  };

  useEffect(() => {
    async function fetchAllRelated() {
      setLoading(true)
      try {
        // If includedProducts (for kits/combos) is present, just show those
        if (includedProducts && includedProducts.length > 0) {
          const mapped = includedProducts.map((item) => {
            const prod = item.product || item;
            return normalizeProduct(prod);
          });
          setProducts(mapped);
          setLoading(false);
          return;
        }

        // For normal products: fetch category products and kits/combos that include this product
        const [categoryResp, kitsCombosResp] = await Promise.all([
          ProductService.getProductsByCategory(
            categoryName || "all",
            { limit: limit + 4 }
          ),
          KitsCombosService.getRelatedProducts(currentProductId)
        ]);

        // Extract products from category
        const categoryProducts = ProductService.extractProducts(categoryResp)
          .filter((product) => product.product_code !== currentProductId && product.id !== currentProductId)
          .map(normalizeProduct)
          .slice(0, limit);

        // Extract kits and combos
        const kits = (kitsCombosResp?.kits || []).map(kit => normalizeProduct(kit));
        const combos = (kitsCombosResp?.combos || []).map(combo => normalizeProduct(combo));

        // Merge and deduplicate by id
        const all = [...categoryProducts, ...kits, ...combos];
        const seen = new Set();
        const unique = all.filter(item => {
          if (!item || !item.id) return false;
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        }).slice(0, limit);

        setProducts(unique);
      } catch (error) {
        console.error("Error fetching related products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllRelated();
  }, [categoryName, currentProductId, limit, includedProducts])

  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="mt-8 md:mt-12 lg:mt-16">
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center md:text-left">
          You might also like
        </h2>
        <div className="w-full overflow-hidden">
          {/* Mobile: Single column centered */}
          <div className="flex flex-col items-center space-y-4 sm:hidden">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse w-full max-w-xs">
                <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>

          {/* Tablet and above: Grid layout */}
          <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  // Debug: Log products and their variants before rendering
  console.log('RelatedProducts: products to render', products);
  products.forEach((p, i) => console.log(`Product ${i} variants:`, p.variants));

  return (
    <div className="mt-8 md:mt-12 lg:mt-16">
    <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center md:text-left">
      You might also like
    </h2>

    <div className="w-full overflow-hidden">
      {/* Mobile: Single column centered - 1 card per row */}
      <div className="sm:hidden">
        <div className="flex flex-col items-center space-y-6">
          {products.map((product, idx) => (
            <div key={product.id || idx} className="w-full max-w-xs">
              <ProductCard product={product} index={idx} />
            </div>
          ))}
        </div>
      </div>

      {/* Tablet and above: Responsive grid */}
      <div className="hidden sm:block">
        <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, idx) => (
            <ProductCard key={product.id || idx} product={product} index={idx} />
          ))}
        </div>
      </div>
    </div>
  </div>
  )
}
