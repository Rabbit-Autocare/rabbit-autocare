"use client"

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import KitComboCard from "@/components/ui/KitComboCard";
import { KitService } from "@/lib/service/kitService";
import { ComboService } from "@/lib/service/comboService";

export default function KitComboDetailPage() {
  const pathname = usePathname();
  const kitComboId = pathname.split("/").pop();
  const [kitCombo, setKitCombo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        } else {
          setKitCombo(data);
        }
      } catch (err) {
        setError("Error fetching kit/combo details");
        setKitCombo(null);
      }
      setLoading(false);
    };
    fetchKitCombo();
  }, [kitComboId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!kitCombo) return null;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row items-start gap-8">
        <div className="w-full">
          <KitComboCard product={kitCombo} />
        </div>
      </div>
      {/* You can add tabs, related products, etc. here if needed */}
    </div>
  );
}
