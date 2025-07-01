import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
const supabase = createSupabaseBrowserClient();

export class StockService {
  static async checkStockAvailability(variantId, quantity) {
    try {
      const { data, error } = await supabase.rpc('check_variant_stock_availability', {
        p_variant_id: variantId,
        p_quantity: quantity
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking stock:', error);
      throw error;
    }
  }

  static async updateStock(variantId, quantity, operation) {
    try {
      const { data, error } = await supabase.rpc('update_variant_stock', {
        p_variant_id: variantId,
        p_quantity: quantity,
        p_operation: operation // 'add' or 'subtract'
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  static async decrementStock(variantId, quantity) {
    try {
      const { data, error } = await supabase.rpc('decrement_stock', {
        variant_id: variantId,
        quantity: quantity
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error decrementing stock:', error);
      throw error;
    }
  }

  static async incrementStock(variantId, quantity) {
    try {
      const { data, error } = await supabase.rpc('increment_stock', {
        variant_id: variantId,
        quantity: quantity
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error incrementing stock:', error);
      throw error;
    }
  }

  static async checkMultipleVariantsStock(stockChecks) {
    try {
      const { data, error } = await supabase.rpc('check_multiple_variants_stock', {
        variant_checks: stockChecks
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking multiple variants stock:', error);
      throw error;
    }
  }

  static async updateMultipleVariantsStock(stockUpdates) {
    try {
      const { data, error } = await supabase.rpc('update_multiple_variants_stock', {
        stock_updates: stockUpdates
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating multiple variants stock:', error);
      throw error;
    }
  }

  static async checkKitStock(kitId, quantity = 1) {
    try {
      // Get kit products with their variants
      const { data: kitProducts, error } = await supabase
        .from('kit_products')
        .select(`
          product_id,
          variant_id,
          quantity,
          variant:product_variants (
            stock
          )
        `)
        .eq('kit_id', kitId);

      if (error) throw error;

      // Check if all variants have enough stock
      const stockChecks = kitProducts.map(kp => ({
        variantId: kp.variant_id,
        quantity: kp.quantity * quantity // Multiply by requested quantity
      }));

      return await this.checkMultipleVariantsStock(stockChecks);
    } catch (error) {
      console.error('Error checking kit stock:', error);
      throw error;
    }
  }

  static async checkComboStock(comboId, quantity = 1) {
    try {
      // Get combo products with their variants
      const { data: comboProducts, error } = await supabase
        .from('combo_products')
        .select(`
          product_id,
          variant_id,
          quantity,
          variant:product_variants (
            stock
          )
        `)
        .eq('combo_id', comboId);

      if (error) throw error;

      // Check if all variants have enough stock
      const stockChecks = comboProducts.map(cp => ({
        variantId: cp.variant_id,
        quantity: cp.quantity * quantity // Multiply by requested quantity
      }));

      return await this.checkMultipleVariantsStock(stockChecks);
    } catch (error) {
      console.error('Error checking combo stock:', error);
      throw error;
    }
  }

  static async updateStockOnCheckout(orderItems) {
    try {
      const stockUpdates = [];

      for (const item of orderItems) {
        if (item.type === 'product') {
          // Direct product purchase
          stockUpdates.push({
            variantId: item.variant_id,
            quantity: item.quantity,
            operation: 'subtract'
          });
        } else if (item.type === 'kit') {
          // Get kit products
          const { data: kitProducts, error } = await supabase
            .from('kit_products')
            .select('variant_id, quantity')
            .eq('kit_id', item.id);

          if (error) throw error;

          // Add stock updates for each product in the kit
          kitProducts.forEach(kp => {
            stockUpdates.push({
              variantId: kp.variant_id,
              quantity: kp.quantity * item.quantity,
              operation: 'subtract'
            });
          });
        } else if (item.type === 'combo') {
          // Get combo products
          const { data: comboProducts, error } = await supabase
            .from('combo_products')
            .select('variant_id, quantity')
            .eq('combo_id', item.id);

          if (error) throw error;

          // Add stock updates for each product in the combo
          comboProducts.forEach(cp => {
            stockUpdates.push({
              variantId: cp.variant_id,
              quantity: cp.quantity * item.quantity,
              operation: 'subtract'
            });
          });
        }
      }

      // Update all stock changes
      await this.updateMultipleVariantsStock(stockUpdates);
    } catch (error) {
      console.error('Error updating stock on checkout:', error);
      throw error;
    }
  }

  static async getVariantStock(variantId) {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('id', variantId)
        .single();

      if (error) throw error;
      return data.stock;
    } catch (error) {
      console.error('Error getting variant stock:', error);
      throw error;
    }
  }

  static async getMultipleVariantsStock(variantIds) {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('id, stock')
        .in('id', variantIds);

      if (error) throw error;

      // Convert array to object for easier lookup
      return data.reduce((acc, variant) => {
        acc[variant.id] = variant.stock;
        return acc;
      }, {});
    } catch (error) {
      console.error('Error getting multiple variants stock:', error);
      throw error;
    }
  }

  static async getLowStockAlerts(threshold = 10) {
    try {
      const { data, error } = await supabase.rpc('get_low_stock_alerts', {
        threshold: threshold
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting low stock alerts:', error);
      throw error;
    }
  }

  static async getStockSummary() {
    try {
      const { data, error } = await supabase.rpc('get_stock_summary');

      if (error) throw error;
      return data[0]; // Return first row since it's a single summary
    } catch (error) {
      console.error('Error getting stock summary:', error);
      throw error;
    }
  }

  static async validateOrderStock(orderItems) {
    try {
      const stockChecks = [];

      for (const item of orderItems) {
        if (item.type === 'product' && item.variant_id) {
          stockChecks.push({
            variantId: item.variant_id,
            quantity: item.quantity
          });
        } else if (item.type === 'kit' || item.type === 'combo') {
          const relationTable = item.type === 'combo' ? 'combo_products' : 'kit_products';
          const relationId = item.type === 'combo' ? 'combo_id' : 'kit_id';
          const itemId = item.type === 'combo' ? item.combo_id : item.kit_id;

          const { data: relationItems, error } = await supabase
            .from(relationTable)
            .select('variant_id, quantity')
            .eq(relationId, itemId);

          if (error) throw error;

          relationItems.forEach(relationItem => {
            stockChecks.push({
              variantId: relationItem.variant_id,
              quantity: relationItem.quantity * item.quantity
            });
          });
        }
      }

      const stockValidation = await this.checkMultipleVariantsStock(stockChecks);

      // Check if all items are available
      const unavailableItems = stockValidation.filter(item => !item.isAvailable);

      if (unavailableItems.length > 0) {
        throw new Error(`Insufficient stock for some items: ${unavailableItems.map(item =>
          `Variant ${item.variantId} (Available: ${item.availableStock}, Required: ${item.requiredQuantity})`
        ).join(', ')}`);
      }

      return true;
    } catch (error) {
      console.error('Error validating order stock:', error);
      throw error;
    }
  }
}
