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
      // First check if all variants have enough stock
      const variants = kitData.products.map(p => ({
        variantId: p.variant_id,
        quantity: p.quantity * kitData.inventory
      }));

      const hasEnoughStock = await StockService.checkMultipleVariantsStock(variants);
      if (!hasEnoughStock) {
        throw new Error('Insufficient stock for one or more variants');
      }

      // Create kit using the database function
      const { data, error } = await supabase.rpc('create_kit_with_variant_stock', {
        p_name: kitData.name,
        p_description: kitData.description,
        p_image_url: kitData.image_url,
        p_original_price: kitData.original_price,
        p_price: kitData.price,
        p_discount_percent: kitData.discount_percent,
        p_inventory: kitData.inventory,
        p_products: kitData.products
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating kit:', error);
      throw error;
    }
  }

  static async updateKit(id, kitData) {
    try {
      // First get the existing kit to calculate stock differences
      const existingKit = await this.getKits(id);
      if (!existingKit) throw new Error('Kit not found');

      // Calculate stock differences and update accordingly
      const stockUpdates = [];

      // Return stock from old kit
      existingKit.kit_products.forEach(kp => {
        stockUpdates.push({
          variantId: kp.variant_id,
          quantity: kp.quantity * existingKit.inventory,
          operation: 'add'
        });
      });

      // Reserve stock for new kit
      kitData.products.forEach(p => {
        stockUpdates.push({
          variantId: p.variant_id,
          quantity: p.quantity * kitData.inventory,
          operation: 'subtract'
        });
      });

      // Update all stock changes
      await StockService.updateMultipleVariantsStock(stockUpdates);

      // Update kit details
      const { data, error } = await supabase
        .from('kits')
        .update({
          name: kitData.name,
          description: kitData.description,
          image_url: kitData.image_url,
          original_price: kitData.original_price,
          price: kitData.price,
          discount_percent: kitData.discount_percent,
          inventory: kitData.inventory
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
      // First get the kit to return stock
      const kit = await this.getKits(id);
      if (!kit) throw new Error('Kit not found');

      // Return stock to variants
      const stockUpdates = kit.kit_products.map(kp => ({
        variantId: kp.variant_id,
        quantity: kp.quantity * kit.inventory,
        operation: 'add'
      }));

      await StockService.updateMultipleVariantsStock(stockUpdates);

      // Delete the kit
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
