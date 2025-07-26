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
  const [includedProducts, setIncludedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchKitCombo() {
      setLoading(true);
      try {
        // 1) Try to load as Kit
        const kits = await KitService.getKits(kitComboId);
        let data = kits?.[0];

        // 2) Fallback to Combo
        if (!data) {
          const combos = await ComboService.getCombos(kitComboId);
          data = combos?.[0];
        }

        if (!data) {
          setError("Kit or Combo not found");
          setKitCombo(null);
          setIncludedProducts([]);
        } else {
          setKitCombo(data);

          // 3) Fetch full product objects for each included item
          const list = data.kit_products || data.combo_products || [];
          const proms = list.map((item) =>
            ProductService.getProduct(item.product_id)
          );
          const full = (await Promise.all(proms)).filter(Boolean);
          setIncludedProducts(full);
        }
      } catch (e) {
        console.error(e);
        setError("Error fetching kit/combo details");
      } finally {
        setLoading(false);
      }
    }

    fetchKitCombo();
  }, [kitComboId]);

  if (loading) return <div>Loading…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!kitCombo) return null;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* KIT/COMBO HERO */}
      <div className="flex flex-col md:flex-row items-start gap-8">
        <div className="w-full">
          <KitComboCard product={kitCombo} />
        </div>
      </div>
 
      {/* TABS: Description / Reviews */}
      <ProductTabs product={kitCombo} reviews={kitCombo.reviews} />
{/* RELATED PRODUCTS */}
      <div className="pt-12 border-t">
        <h2 className="text-2xl font-bold mb-6">You might also like</h2>
        <RelatedProducts
          categoryName={kitCombo.category?.name || kitCombo.category_name}
          currentProductId={kitCombo.product_code || kitCombo.id}
          // omit includedProducts if you want genuine related picks
          // includedProducts={includedProducts}
          limit={4}
        />
      </div>
     
    </div>
  );
}
