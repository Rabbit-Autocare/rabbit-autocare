"use client"

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import KitComboCard from "@/components/ui/KitComboCard";
import ProductTabs from "@/components/shop/ProductTabs";
import RelatedProducts from "@/components/shop/RelatedProducts";
import { KitService } from "@/lib/service/kitService";
import { ComboService } from "@/lib/service/comboService";
import { ProductService } from "@/lib/service/productService";

export default function KitComboDetailPage() {
  const pathname = usePathname();
  const kitComboId = pathname.split("/").pop();
  const [kitCombo, setKitCombo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [includedProducts, setIncludedProducts] = useState([]);

  useEffect(() => {
    const fetchKitCombo = async () => {
      setLoading(true);
      setError(null);
      let data = null;
      try {
        // Try as kit
        const kits = await KitService.getKits(kitComboId);
        if (kits && kits.length > 0) {
          data = kits[0];
        } else {
          // Try as combo
          const combos = await ComboService.getCombos(kitComboId);
          if (combos && combos.length > 0) {
            data = combos[0];
          }
        }
        if (!data) {
          setError("Kit or Combo not found");
          setKitCombo(null);
          setIncludedProducts([]);
        } else {
          setKitCombo(data);

          // Fetch full product details for included products
          let included = [];
          if (data.kit_products && data.kit_products.length > 0) {
            included = data.kit_products;
          } else if (data.combo_products && data.combo_products.length > 0) {
            included = data.combo_products;
          }
          // Fetch all products in parallel
          const productPromises = included.map(item =>
            ProductService.getProduct(item.product_id)
          );
          const fullProducts = await Promise.all(productPromises);
          setIncludedProducts(fullProducts.filter(Boolean));
        }
      } catch (err) {
        setError("Error fetching kit/combo details");
        setKitCombo(null);
        setIncludedProducts([]);
      }
      setLoading(false);
    };
    fetchKitCombo();
  }, [kitComboId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!kitCombo) return null;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="flex flex-col md:flex-row items-start gap-8">
        <div className="w-full">
          <KitComboCard product={kitCombo} />
        </div>
      </div>
      <ProductTabs product={kitCombo} reviews={kitCombo.reviews} />
      <RelatedProducts
        categoryName={kitCombo.category?.name || kitCombo.category_name}
        currentProductId={kitCombo.product_code || kitCombo.id}
        includedProducts={includedProducts}
      />
    </div>
  );
}
