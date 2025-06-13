import { supabase } from '@/lib/supabaseClient';
import { StockService } from './stockService';

export class ComboService {
  static async getCombos(id = null) {
    try {
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
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching combos:', error);
      throw error;
    }
  }

  static async createCombo(comboData) {
    try {
      // Create combo using the database function
      const { data, error } = await supabase.rpc('create_combo', {
        p_name: comboData.name,
        p_description: comboData.description,
        p_image_url: comboData.image_url,
        p_original_price: comboData.original_price,
        p_price: comboData.price,
        p_discount_percent: comboData.discount_percent,
        p_products: comboData.products
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating combo:', error);
      throw error;
    }
  }

  static async updateCombo(id, comboData) {
    try {
      // First get the existing combo to calculate stock differences
      const existingCombo = await this.getCombos(id);
      if (!existingCombo) throw new Error('Combo not found');

      // Calculate stock differences and update accordingly
      const stockUpdates = [];

      // Return stock from old combo
      existingCombo.combo_products.forEach(cp => {
        stockUpdates.push({
          variantId: cp.variant_id,
          quantity: cp.quantity * existingCombo.inventory,
          operation: 'add'
        });
      });

      // Reserve stock for new combo
      comboData.products.forEach(p => {
        stockUpdates.push({
          variantId: p.variant_id,
          quantity: p.quantity * comboData.inventory,
          operation: 'subtract'
        });
      });

      // Update all stock changes
      await StockService.updateMultipleVariantsStock(stockUpdates);

      // Update combo details
      const { data, error } = await supabase
        .from('combos')
        .update({
          name: comboData.name,
          description: comboData.description,
          image_url: comboData.image_url,
          original_price: comboData.original_price,
          price: comboData.price,
          discount_percent: comboData.discount_percent,
          inventory: comboData.inventory
        })
        .eq('id', id);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating combo:', error);
      throw error;
    }
  }

  static async deleteCombo(id) {
    try {
      // First get the combo to return stock
      const combo = await this.getCombos(id);
      if (!combo) throw new Error('Combo not found');

      // Return stock to variants
      const stockUpdates = combo.combo_products.map(cp => ({
        variantId: cp.variant_id,
        quantity: cp.quantity * combo.inventory,
        operation: 'add'
      }));

      await StockService.updateMultipleVariantsStock(stockUpdates);

      // Delete the combo
      const { error } = await supabase
        .from('combos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting combo:', error);
      throw error;
    }
  }
}
