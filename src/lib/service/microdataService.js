// lib/service/attributeService.js (or whatever you're calling this file)
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
const supabase = createSupabaseBrowserClient();
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';

// Helper function for authenticated operations
const makeAuthenticatedCall = async (endpoint, options = {}) => {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  const response = await fetch(endpoint, defaultOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return await response.json();
};

export class SizeService {
  // Read operations - keep direct Supabase for public data
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

  // Write operations - use API routes for admin authentication
  static async createSize(data) {
    try {
      const result = await makeAuthenticatedCall('/api/admin/sizes', {
        method: 'POST',
        body: JSON.stringify({ size_cm: data.size_cm })
      });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error creating size:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateSize(id, data) {
    try {
      const result = await makeAuthenticatedCall(`/api/admin/sizes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ size_cm: data.size_cm })
      });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error updating size:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteSize(id) {
    try {
      await makeAuthenticatedCall(`/api/admin/sizes/${id}`, {
        method: 'DELETE'
      });
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
      const result = await makeAuthenticatedCall('/api/admin/colors', {
        method: 'POST',
        body: JSON.stringify({
          color: data.color,
          hex_code: data.hex_code || null
        })
      });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error creating color:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateColor(id, data) {
    try {
      const result = await makeAuthenticatedCall(`/api/admin/colors/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          color: data.color,
          hex_code: data.hex_code || null
        })
      });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error updating color:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteColor(id) {
    try {
      await makeAuthenticatedCall(`/api/admin/colors/${id}`, {
        method: 'DELETE'
      });
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
      const result = await makeAuthenticatedCall('/api/admin/gsm', {
        method: 'POST',
        body: JSON.stringify({ gsm: data.gsm })
      });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error creating GSM:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateGsm(id, data) {
    try {
      const result = await makeAuthenticatedCall(`/api/admin/gsm/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ gsm: data.gsm })
      });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error updating GSM:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteGsm(id) {
    try {
      await makeAuthenticatedCall(`/api/admin/gsm/${id}`, {
        method: 'DELETE'
      });
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
      const result = await makeAuthenticatedCall('/api/admin/quantities', {
        method: 'POST',
        body: JSON.stringify({
          quantity: data.quantity,
          unit: data.unit || 'ml'
        })
      });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error creating quantity:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateQuantity(id, data) {
    try {
      const result = await makeAuthenticatedCall(`/api/admin/quantities/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          quantity: data.quantity,
          unit: data.unit || 'ml'
        })
      });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error updating quantity:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteQuantity(id) {
    try {
      await makeAuthenticatedCall(`/api/admin/quantities/${id}`, {
        method: 'DELETE'
      });
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
      const result = await makeAuthenticatedCall('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          is_microfiber: data.is_microfiber || false
        })
      });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error creating category:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateCategory(id, data) {
    try {
      const result = await makeAuthenticatedCall(`/api/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: data.name,
          is_microfiber: data.is_microfiber || false
        })
      });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error updating category:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteCategory(id) {
    try {
      await makeAuthenticatedCall(`/api/admin/categories/${id}`, {
        method: 'DELETE'
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      return { success: false, error: error.message };
    }
  }
}
