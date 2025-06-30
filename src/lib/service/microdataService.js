import { supabase } from '@/lib/supabaseClient';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
 
// API endpoints
const SIZES_API = "/api/products/size";
const COLORS_API = "/api/products/colors";
const GSM_API = "/api/products/gsm";
const QUANTITY_API = "/api/products/quantity";
const CATEGORIES_API = "/api/products/category";

export class SizeService {
  static async getSizes() {
    try {
      console.log('[DEBUG] Fetching sizes...');
      const { data, error } = await fetchWithRetry(() => supabase
        .from('sizes')
        .select('*')
        .order('size_cm', { ascending: true }));
      console.log('[DEBUG] Sizes fetched:', data, error);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching sizes:', error);
      return { success: false, error: error.message };
    }
  }

  static async createSize(data) {
    try {
      const { data: newSize, error } = await supabase
        .from('sizes')
        .insert([{ size_cm: data.size_cm }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: newSize };
    } catch (error) {
      console.error('Error creating size:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateSize(id, data) {
    try {
      const { data: updatedSize, error } = await supabase
        .from('sizes')
        .update({ size_cm: data.size_cm })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: updatedSize };
    } catch (error) {
      console.error('Error updating size:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteSize(id) {
    try {
      const { error } = await supabase
        .from('sizes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting size:', error);
      return { success: false, error: error.message };
    }
  }
}

export class ColorService {
  static async getColors() {
    try {
      const { data, error } = await fetchWithRetry(() => supabase
        .from('colors')
        .select('*')
        .order('color', { ascending: true }));

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching colors:', error);
      return { success: false, error: error.message };
    }
  }

  static async createColor(data) {
    try {
      const { data: newColor, error } = await supabase
        .from('colors')
        .insert([{ color: data.color, hex_code: data.hex_code || null }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: newColor };
    } catch (error) {
      console.error('Error creating color:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateColor(id, data) {
    try {
      const { data: updatedColor, error } = await supabase
        .from('colors')
        .update({ color: data.color, hex_code: data.hex_code || null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: updatedColor };
    } catch (error) {
      console.error('Error updating color:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteColor(id) {
    try {
      const { error } = await supabase
        .from('colors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting color:', error);
      return { success: false, error: error.message };
    }
  }
}

export class GsmService {
  static async getGSM() {
    try {
      const { data, error } = await fetchWithRetry(() => supabase
        .from('gsm')
        .select('*')
        .order('gsm', { ascending: true }));

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching GSM values:', error);
      return { success: false, error: error.message };
    }
  }

  static async createGsm(data) {
    try {
      const { data: newGsm, error } = await supabase
        .from('gsm')
        .insert([{ gsm: data.gsm }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: newGsm };
    } catch (error) {
      console.error('Error creating GSM:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateGsm(id, data) {
    try {
      const { data: updatedGsm, error } = await supabase
        .from('gsm')
        .update({ gsm: data.gsm })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: updatedGsm };
    } catch (error) {
      console.error('Error updating GSM:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteGsm(id) {
    try {
      const { error } = await supabase
        .from('gsm')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting GSM:', error);
      return { success: false, error: error.message };
    }
  }
}

export class QuantityService {
  static async getQuantities() {
    try {
      console.log('[DEBUG] Fetching quantities...');
      const { data, error } = await fetchWithRetry(() => supabase
        .from('quantity')
        .select('*')
        .order('quantity', { ascending: true }));
      console.log('[DEBUG] Quantities fetched:', data, error);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching quantities:', error);
      return { success: false, error: error.message };
    }
  }

  static async createQuantity(data) {
    try {
      const { data: newQuantity, error } = await supabase
        .from('quantity')
        .insert([{ quantity: data.quantity, unit: data.unit || 'ml' }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: newQuantity };
    } catch (error) {
      console.error('Error creating quantity:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateQuantity(id, data) {
    try {
      const { data: updatedQuantity, error } = await supabase
        .from('quantity')
        .update({ quantity: data.quantity, unit: data.unit || 'ml' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: updatedQuantity };
    } catch (error) {
      console.error('Error updating quantity:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteQuantity(id) {
    try {
      const { error } = await supabase
        .from('quantity')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting quantity:', error);
      return { success: false, error: error.message };
    }
  }
}

export class CategoryService {
  static async getCategories() {
    try {
      console.log('[DEBUG] Fetching categories...');

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const categoriesPromise = fetchWithRetry(() => supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true }));

      const { data, error } = await Promise.race([categoriesPromise, timeoutPromise]);

      console.log('[DEBUG] Categories fetched:', data, error);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { success: false, error: error.message };
    }
  }

  static async createCategory(data) {
    try {
      const { data: newCategory, error } = await supabase
        .from('categories')
        .insert([{
          name: data.name,
          is_microfiber: data.is_microfiber || false
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: newCategory };
    } catch (error) {
      console.error('Error creating category:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateCategory(id, data) {
    try {
      const { data: updatedCategory, error } = await supabase
        .from('categories')
        .update({
          name: data.name,
          is_microfiber: data.is_microfiber || false
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: updatedCategory };
    } catch (error) {
      console.error('Error updating category:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteCategory(id) {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      return { success: false, error: error.message };
    }
  }
}
