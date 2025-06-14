import { supabase } from '@/lib/supabaseClient';
import { StockService } from './stockService';

export class KitService {
  static async getKits(id = null) {
    try {
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
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching kits:', error);
      throw error;
    }
  }

  static async createKit(kitData) {
    try {
      // Ensure inventory defaults to 1 if not provided by the form
      const inventory = kitData.inventory || 1;

      // Transform products for database insertion
      const transformedProducts = kitData.products.map(p => ({
        product_id: p.id,
        variant_id: p.selected_variant?.id || null, // Handle cases where variant might not be selected
        quantity: p.quantity || 1
      }));

      // Insert the new kit into the 'kits' table
      const { data: newKit, error: kitError } = await supabase
        .from('kits')
        .insert({
          name: kitData.name,
          description: kitData.description,
          image_url: kitData.image_url,
          original_price: kitData.original_price,
          price: kitData.price,
          discount_percent: kitData.discount_percentage,
          inventory: inventory
        })
        .select()
        .single();

      if (kitError) throw kitError;

      // Insert each product into the 'kit_products' table
      const kitProductsData = transformedProducts.map(p => ({
        kit_id: newKit.id,
        product_id: p.product_id,
        variant_id: p.variant_id,
        quantity: p.quantity
      }));

      const { error: kitProductsError } = await supabase
        .from('kit_products')
        .insert(kitProductsData);

      if (kitProductsError) throw kitProductsError;

      return newKit;
    } catch (error) {
      console.error('Error creating kit:', error);
      throw error;
    }
  }

  static async updateKit(id, kitData) {
    try {
      // Ensure inventory defaults to 1 if not provided by the form
      const inventory = kitData.inventory || 1;

      // Transform products for database update (used for kit_products manipulation)
      const transformedProducts = kitData.products.map(p => ({
        product_id: p.id,
        variant_id: p.selected_variant?.id || null,
        quantity: p.quantity || 1
      }));

      // First get the existing kit's products to compare (no stock return/reserve needed)
      const { data: existingKitProducts, error: fetchError } = await supabase
        .from('kit_products')
        .select('*')
        .eq('kit_id', id);

      if (fetchError) throw fetchError;

      const existingProductMap = new Map(existingKitProducts.map(p => [`${p.product_id}-${p.variant_id}`, p]));
      const newProductMap = new Map(transformedProducts.map(p => [`${p.product_id}-${p.variant_id}`, p]));

      const productsToAdd = [];
      const productsToUpdate = [];
      const productIdsToDelete = [];

      // Determine products to add/update/delete
      for (const [key, newProduct] of newProductMap.entries()) {
        if (existingProductMap.has(key)) {
          // Product exists, check if quantity changed (no stock update, just quantity change)
          const existingProduct = existingProductMap.get(key);
          if (existingProduct.quantity !== newProduct.quantity) {
            productsToUpdate.push({
              id: existingProduct.id,
              quantity: newProduct.quantity
            });
          }
          existingProductMap.delete(key); // Mark as processed
        } else {
          // New product to add
          productsToAdd.push({
            kit_id: id,
            product_id: newProduct.product_id,
            variant_id: newProduct.variant_id,
            quantity: newProduct.quantity
          });
        }
      }

      // Remaining in existingProductMap are products to delete
      for (const [key, existingProduct] of existingProductMap.entries()) {
        productIdsToDelete.push(existingProduct.id);
      }

      // Perform database operations
      if (productsToAdd.length > 0) {
        const { error } = await supabase.from('kit_products').insert(productsToAdd);
        if (error) throw error;
      }
      if (productsToUpdate.length > 0) {
        for (const update of productsToUpdate) {
          const { error } = await supabase.from('kit_products').update({ quantity: update.quantity }).eq('id', update.id);
          if (error) throw error;
        }
      }
      if (productIdsToDelete.length > 0) {
        const { error } = await supabase.from('kit_products').delete().in('id', productIdsToDelete);
        if (error) throw error;
      }

      // Update kit details (excluding stock-related fields)
      const { data, error } = await supabase
        .from('kits')
        .update({
          name: kitData.name,
          description: kitData.description,
          image_url: kitData.image_url,
          original_price: kitData.original_price,
          price: kitData.price,
          discount_percent: kitData.discount_percentage,
          inventory: inventory
        })
        .eq('id', id);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating kit:', error);
      throw error;
    }
  }

  static async deleteKit(id) {
    try {
      // Delete the kit (no stock return needed)
      const { error } = await supabase
        .from('kits')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting kit:', error);
      throw error;
    }
  }
}
