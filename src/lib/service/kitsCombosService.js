// kitsCombosService.js - Handles API operations for Kits & Combos

import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
const supabase = createSupabaseBrowserClient();
import { KitService } from './kitService';
import { ComboService } from './comboService';
 
const KITS_API = '/api/kits';
const COMBOS_API = '/api/combos';

export class KitsCombosService {
  // ============= KITS =============
  static async getKits(id = null) {
    try {
      console.log("Fetching kits from Supabase...");
      const query = supabase
        .from('kits')
        .select(`
          *,
          kit_products (
            *,
            product:products (*),
            variant:product_variants (*)
          )
        `);

      if (id) {
        query.eq('id', id);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Supabase error fetching kits:", error);
        throw error;
      }

      // console.log("Raw kits data from Supabase:", data);

      // Transform image URLs to use consistent path
      const transformedData = data.map(kit => ({
        ...kit,
        image_url: kit.image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/kits/${kit.id}.jpg`,
        main_image_url: kit.main_image_url || kit.image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/kits/${kit.id}.jpg`
      }));

      // console.log("Transformed kits data:", transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error in getKits:', error);
      throw error;
    }
  }

  static async createKit(kitData) {
    try {
      const res = await fetch(KITS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kitData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `API error: ${res.status}`);
        } catch (e) {
          throw new Error(
            `API error: ${errorText || res.statusText || res.status}`
          );
        }
      }

      return await res.json();
    } catch (error) {
      console.error('Error in createKit:', error);
      throw error;
    }
  }

  static async deleteKit(id) {
    try {
      const res = await fetch(`${KITS_API}?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `API error: ${res.status}`);
        } catch (e) {
          throw new Error(
            `API error: ${errorText || res.statusText || res.status}`
          );
        }
      }

      return await res.json();
    } catch (error) {
      console.error('Error in deleteKit:', error);
      throw error;
    }
  }

  // ============= COMBOS =============
  static async getCombos(id = null) {
    try {
      console.log("Fetching combos from Supabase...");
      const query = supabase
        .from('combos')
        .select(`
          *,
          combo_products (
            *,
            product:products (*),
            variant:product_variants (*)
          )
        `);

      if (id) {
        query.eq('id', id);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Supabase error fetching combos:", error);
        throw error;
      }

      // console.log("Raw combos data from Supabase:", data);

      // Transform image URLs to use consistent path
      const transformedData = data.map(combo => ({
        ...combo,
        image_url: combo.image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/combos/${combo.id}.jpg`,
        main_image_url: combo.main_image_url || combo.image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/combos/${combo.id}.jpg`
      }));

      // console.log("Transformed combos data:", transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error in getCombos:', error);
      throw error;
    }
  }

  static async createCombo(comboData) {
    try {
      const res = await fetch(COMBOS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comboData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `API error: ${res.status}`);
        } catch (e) {
          throw new Error(
            `API error: ${errorText || res.statusText || res.status}`
          );
        }
      }

      return await res.json();
    } catch (error) {
      console.error('Error in createCombo:', error);
      throw error;
    }
  }

  static async deleteCombo(id) {
    try {
      const res = await fetch(`${COMBOS_API}?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `API error: ${res.status}`);
        } catch (e) {
          throw new Error(
            `API error: ${errorText || res.statusText || res.status}`
          );
        }
      }

      return await res.json();
    } catch (error) {
      console.error('Error in deleteCombo:', error);
      throw error;
    }
  }

  static async getRelatedProducts(productId, variantId = null) {
    try {
      // Get all kits and combos
      const [kits, combos] = await Promise.all([
        KitService.getKits(),
        ComboService.getCombos()
      ]);

      // Filter kits that contain the product with matching variant
      const matchingKits = kits.filter(kit =>
        kit.kit_products.some(kp =>
          kp.product_id === productId &&
          (!variantId || kp.variant_id === variantId)
        )
      );

      // Filter combos that contain the product with matching variant
      const matchingCombos = combos.filter(combo =>
        combo.combo_products.some(cp =>
          cp.product_id === productId &&
          (!variantId || cp.variant_id === variantId)
        )
      );

      return {
        kits: matchingKits,
        combos: matchingCombos
      };
    } catch (error) {
      console.error('Error getting related products:', error);
      throw error;
    }
  }

  static async getFrequentlyBoughtTogether(cartItems) {
    try {
      // Get all kits and combos
      const [kits, combos] = await Promise.all([
        KitService.getKits(),
        ComboService.getCombos()
      ]);

      // Create a map of cart items for quick lookup
      const cartItemMap = new Map(
        cartItems.map(item => [`${item.product_id}-${item.variant?.id || 'default'}`, item])
      );

      // Filter kits that contain any product from the cart with matching variant
      const matchingKits = kits.filter(kit =>
        kit.kit_products.some(kp =>
          cartItemMap.has(`${kp.product_id}-${kp.variant_id || 'default'}`)
        )
      );

      // Filter combos that contain any product from the cart with matching variant
      const matchingCombos = combos.filter(combo =>
        combo.combo_products.some(cp =>
          cartItemMap.has(`${cp.product_id}-${cp.variant_id || 'default'}`)
        )
      );

      // Sort by number of matching products (descending)
      const sortByMatchingProducts = (a, b) => {
        const aMatches = a.kit_products?.length || a.combo_products?.length;
        const bMatches = b.kit_products?.length || b.combo_products?.length;
        return bMatches - aMatches;
      };

      return {
        kits: matchingKits.sort(sortByMatchingProducts),
        combos: matchingCombos.sort(sortByMatchingProducts)
      };
    } catch (error) {
      console.error('Error getting frequently bought together:', error);
      throw error;
    }
  }

  static async getProductRecommendations(productId, variantId = null) {
    try {
      // Get all kits and combos
      const [kits, combos] = await Promise.all([
        KitService.getKits(),
        ComboService.getCombos()
      ]);

      // Get products that are commonly bought together with the given product
      const relatedProducts = new Set();

      // Add products from matching kits
      kits.forEach(kit => {
        if (kit.kit_products.some(kp =>
          kp.product_id === productId &&
          (!variantId || kp.variant_id === variantId)
        )) {
          kit.kit_products.forEach(kp => {
            if (kp.product_id !== productId) {
              relatedProducts.add(kp.product_id);
            }
          });
        }
      });

      // Add products from matching combos
      combos.forEach(combo => {
        if (combo.combo_products.some(cp =>
          cp.product_id === productId &&
          (!variantId || cp.variant_id === variantId)
        )) {
          combo.combo_products.forEach(cp => {
            if (cp.product_id !== productId) {
              relatedProducts.add(cp.product_id);
            }
          });
        }
      });

      // Fetch the related products' details
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .in('id', Array.from(relatedProducts));

      if (error) throw error;

      return products;
    } catch (error) {
      console.error('Error getting product recommendations:', error);
      throw error;
    }
  }

  // ============= COMBINED FETCH =============
  static async getKitsAndCombos() {
    try {
      console.log("Starting combined fetch of kits and combos...");

      // Fetch both kits and combos in parallel
      const [kits, combos] = await Promise.all([
        this.getKits(),
        this.getCombos()
      ]);

      console.log("Raw kits:", kits);
      console.log("Raw combos:", combos);

      // Transform the data to match the product format expected by the shop page
      const transformedKits = kits.map(kit => ({
        id: kit.id,
        name: kit.name,
        description: kit.description,
        price: kit.price || 0,
        type: 'kit',
        image_url: kit.main_image_url || kit.image_url,
        main_image_url: kit.main_image_url || kit.image_url,
        variants: [{
          id: kit.id,
          price: kit.price || 0,
          stock: kit.inventory || 0,
          is_default: true
        }]
      }));

      const transformedCombos = combos.map(combo => ({
        id: combo.id,
        name: combo.name,
        description: combo.description,
        price: combo.price || 0,
        type: 'combo',
        image_url: combo.main_image_url || combo.image_url,
        main_image_url: combo.main_image_url || combo.image_url,
        variants: [{
          id: combo.id,
          price: combo.price || 0,
          stock: combo.inventory || 0,
          is_default: true
        }]
      }));

      const combinedData = [...transformedKits, ...transformedCombos];
      console.log("Combined and transformed data:", combinedData);
      return combinedData;
    } catch (error) {
      console.error('Error in getKitsAndCombos:', error);
      throw error;
    }
  }
}
