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
      const inventory = comboData.inventory || 1;

      const { data: newCombo, error: comboError } = await supabase
        .from('combos')
        .insert({
          name: comboData.name,
          description: comboData.description,
          image_url: comboData.image_url,
          original_price: comboData.original_price,
          price: comboData.price,
          discount_percent: comboData.discount_percentage,
          inventory: inventory
        })
        .select()
        .single();

      if (comboError) throw comboError;

      const comboProductsData = comboData.products.map(p => ({
        combo_id: newCombo.id,
        product_id: p.id,
        variant_id: p.selected_variant?.id || null,
        quantity: p.quantity || 1
      }));

      const { error: comboProductsError } = await supabase
        .from('combo_products')
        .insert(comboProductsData);

      if (comboProductsError) throw comboProductsError;

      return newCombo;
    } catch (error) {
      console.error('Error creating combo:', error);
      throw error;
    }
  }

  static async updateCombo(id, comboData) {
    try {
      const inventory = comboData.inventory || 1;

      const transformedProducts = comboData.products.map(p => ({
        product_id: p.id,
        variant_id: p.selected_variant?.id || null,
        quantity: p.quantity || 1
      }));

      const { data: existingComboProducts, error: fetchError } = await supabase
        .from('combo_products')
        .select('*')
        .eq('combo_id', id);

      if (fetchError) throw fetchError;

      const existingProductMap = new Map(existingComboProducts.map(p => [`${p.product_id}-${p.variant_id}-${p.quantity}`, p])); // Include quantity for unique key
      const newProductMap = new Map(transformedProducts.map(p => [`${p.product_id}-${p.variant_id}-${p.quantity}`, p])); // Include quantity for unique key

      const productsToAdd = [];
      const productsToDelete = [];

      // Determine products to add
      for (const [key, newProduct] of newProductMap.entries()) {
        if (!existingProductMap.has(key)) {
          productsToAdd.push({
            combo_id: id,
            product_id: newProduct.product_id,
            variant_id: newProduct.variant_id,
            quantity: newProduct.quantity
          });
        }
      }

      // Determine products to delete
      for (const [key, existingProduct] of existingProductMap.entries()) {
        if (!newProductMap.has(key)) {
          productsToDelete.push(existingProduct.id);
        }
      }

      if (productsToAdd.length > 0) {
        const { error } = await supabase.from('combo_products').insert(productsToAdd);
        if (error) throw error;
      }

      if (productsToDelete.length > 0) {
        const { error } = await supabase.from('combo_products').delete().in('id', productsToDelete);
        if (error) throw error;
      }

      const { data, error } = await supabase
        .from('combos')
        .update({
          name: comboData.name,
          description: comboData.description,
          image_url: comboData.image_url,
          original_price: comboData.original_price,
          price: comboData.price,
          discount_percent: comboData.discount_percentage,
          inventory: inventory
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
