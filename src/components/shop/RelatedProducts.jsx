"use client"

import { useState, useEffect } from "react"
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
      setLoading(true);
      try {
        if (includedProducts && includedProducts.length > 0) {
          const mapped = includedProducts.map((item) => {
            const prod = item.product || item;
            return normalizeProduct(prod);
          });
          setProducts(mapped);
          setLoading(false);
          return;
        }

        const [categoryResp, kitsCombosResp] = await Promise.all([
          ProductService.getProductsByCategory(categoryName || "all", { limit: 20 }),
          KitsCombosService.getRelatedProducts(currentProductId),
        ]);

        // Normalize and filter
        const kits = (kitsCombosResp?.kits || [])
          .map(normalizeProduct)
          .filter(item => item.id !== currentProductId);
        const combos = (kitsCombosResp?.combos || [])
          .map(normalizeProduct)
          .filter(item => item.id !== currentProductId);

        const allProducts = ProductService.extractProducts(categoryResp)
          .map(normalizeProduct)
          .filter(item => item.id !== currentProductId);

        // Microfiber: based on category name or tag
        const microfibers = allProducts.filter(p =>
          (p.category || "").toLowerCase().includes("micro") ||
          (p.name || "").toLowerCase().includes("micro")
        );

        // General products (excluding microfibers)
        const generalProducts = allProducts.filter(p => !microfibers.includes(p));

        // Random helper
        const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

        const selected = [];

        // **GUARANTEED SELECTION: Always include 1 microfiber and 1 kit if available**
        
        // 1. Add one microfiber product (priority)
        if (microfibers.length > 0) {
          selected.push(getRandomItem(microfibers));
        }

        // 2. Add one kit product (priority)
        if (kits.length > 0) {
          selected.push(getRandomItem(kits));
        }

        // 3. Fill remaining slots with other products
        const remainingSlots = limit - selected.length;
        const availableProducts = [];

        // Add remaining products to pool (avoid duplicates)
        const selectedIds = selected.map(p => p.id);
        
        if (combos.length > 0) {
          availableProducts.push(...combos.filter(p => !selectedIds.includes(p.id)));
        }
        if (generalProducts.length > 0) {
          availableProducts.push(...generalProducts.filter(p => !selectedIds.includes(p.id)));
        }
        // Add remaining microfibers (if any)
        const remainingMicrofibers = microfibers.filter(p => !selectedIds.includes(p.id));
        if (remainingMicrofibers.length > 0) {
          availableProducts.push(...remainingMicrofibers);
        }
        // Add remaining kits (if any)
        const remainingKits = kits.filter(p => !selectedIds.includes(p.id));
        if (remainingKits.length > 0) {
          availableProducts.push(...remainingKits);
        }

        // Randomly select from remaining products to fill slots
        for (let i = 0; i < remainingSlots && availableProducts.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * availableProducts.length);
          const selectedProduct = availableProducts.splice(randomIndex, 1)[0];
          selected.push(selectedProduct);
        }

        // **SHUFFLE the final selected products**
        const shuffledProducts = selected
          .filter(Boolean)
          .sort(() => 0.5 - Math.random())
          .slice(0, limit);

        console.log('Selected products breakdown:', {
          microfibers: shuffledProducts.filter(p => 
            (p.category || "").toLowerCase().includes("micro") ||
            (p.name || "").toLowerCase().includes("micro")
          ).length,
          kits: shuffledProducts.filter(p => kits.some(k => k.id === p.id)).length,
          total: shuffledProducts.length
        });

        setProducts(shuffledProducts);
      } catch (error) {
        console.error("Error fetching related products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllRelated();
  }, [categoryName, currentProductId, limit, includedProducts]);

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
      <div className="my-8  md:my-12 lg:my-16">
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
    <div className="my-8 md:my-12 lg:my-16">
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
