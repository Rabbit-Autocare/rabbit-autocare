// Server-only ProductService for direct Supabase access
// This file should ONLY be imported in server components

import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export class ServerProductService {
  // Get server Supabase client
  static async getServerSupabaseClient() {
    return await createSupabaseServerClient();
  }

  // Get products with server-side Supabase client
  static async getProducts({ code, limit, sort, filters = {} } = {}) {
    try {
      const supabase = await this.getServerSupabaseClient();

      let query = supabase.from('products').select(
        `
          *,
          product_variants (
            id,
            product_id,
            variant_code,
            size,
            quantity,
            unit,
            weight_grams,
            gsm,
            dimensions,
            color,
            color_hex,
            base_price,
            base_price_excluding_gst,
            stock,
            is_active,
            created_at,
            updated_at
          )
        `
      );

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      if (filters.price_min) {
        query = query.gte('base_price', filters.price_min);
      }

      if (filters.price_max) {
        query = query.lte('base_price', filters.price_max);
      }

      if (filters.in_stock) {
        query = query.gt('stock_quantity', 0);
      }

      // Apply sorting
      if (sort) {
        switch (sort) {
          case 'price_asc':
            query = query.order('base_price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('base_price', { ascending: false });
            break;
          case 'name_asc':
            query = query.order('name', { ascending: true });
            break;
          case 'name_desc':
            query = query.order('name', { ascending: false });
            break;
          case 'created_desc':
            query = query.order('updated_at', { ascending: false });
            break;
          default:
            query = query.order('updated_at', { ascending: false });
        }
      } else {
        query = query.order('updated_at', { ascending: false });
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      // Transform the data to match the expected format
      const transformedProducts = (data || []).map((product) => ({
        ...product,
        variants: product.product_variants || [],
      }));

      return transformedProducts;
    } catch (error) {
      console.error('Error in ServerProductService.getProducts:', error);
      throw error;
    }
  }

  // Get categories with server-side Supabase client
  static async getCategories() {
    try {
      const supabase = await this.getServerSupabaseClient();

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in ServerProductService.getCategories:', error);
      throw error;
    }
  }

  // Get single product with server-side Supabase client
  static async getProduct(id) {
    try {
      const supabase = await this.getServerSupabaseClient();

      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          product_variants (
            id,
            product_id,
            variant_code,
            size,
            quantity,
            unit,
            weight_grams,
            gsm,
            dimensions,
            color,
            color_hex,
            base_price,
            base_price_excluding_gst,
            stock,
            is_active,
            created_at,
            updated_at
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Product not found
        }
        console.error('Error fetching product:', error);
        throw error;
      }

      // Transform the data to match the expected format
      if (data) {
        return {
          ...data,
          variants: data.product_variants || [],
        };
      }

      return data;
    } catch (error) {
      console.error('Error in ServerProductService.getProduct:', error);
      throw error;
    }
  }

  // Get products by category with server-side Supabase client
  static async getProductsByCategory(categoryName, { limit, sort } = {}) {
    try {
      const supabase = await this.getServerSupabaseClient();

      let query = supabase
        .from('products')
        .select(
          `
          *,
          product_variants (
            id,
            product_id,
            variant_code,
            size,
            quantity,
            unit,
            weight_grams,
            gsm,
            dimensions,
            color,
            color_hex,
            base_price,
            base_price_excluding_gst,
            stock,
            is_active,
            created_at,
            updated_at
          )
        `
        )
        .eq('category', categoryName);

      // Apply sorting
      if (sort) {
        switch (sort) {
          case 'price_asc':
            query = query.order('base_price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('base_price', { ascending: false });
            break;
          case 'name_asc':
            query = query.order('name', { ascending: true });
            break;
          case 'name_desc':
            query = query.order('name', { ascending: false });
            break;
          case 'created_desc':
            query = query.order('updated_at', { ascending: false });
            break;
          default:
            query = query.order('updated_at', { ascending: false });
        }
      } else {
        query = query.order('updated_at', { ascending: false });
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching products by category:', error);
        throw error;
      }

      // Transform the data to match the expected format
      const transformedProducts = (data || []).map((product) => ({
        ...product,
        variants: product.product_variants || [],
      }));

      return transformedProducts;
    } catch (error) {
      console.error(
        'Error in ServerProductService.getProductsByCategory:',
        error
      );
      throw error;
    }
  }

  // Create product (admin only)
  static async createProduct(productData) {
    try {
      const supabase = await this.getServerSupabaseClient();

      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in ServerProductService.createProduct:', error);
      throw error;
    }
  }

  // Update product (admin only)
  static async updateProduct(id, productData) {
    try {
      const supabase = await this.getServerSupabaseClient();

      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in ServerProductService.updateProduct:', error);
      throw error;
    }
  }

  // Delete product (admin only)
  static async deleteProduct(id) {
    try {
      const supabase = await this.getServerSupabaseClient();

      const { error } = await supabase.from('products').delete().eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in ServerProductService.deleteProduct:', error);
      throw error;
    }
  }

  // Get colors with server-side Supabase client
  static async getColors() {
    try {
      const supabase = await this.getServerSupabaseClient();
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .order('color', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in ServerProductService.getColors:', error);
      throw error;
    }
  }

  // Get sizes with server-side Supabase client
  static async getSizes() {
    try {
      const supabase = await this.getServerSupabaseClient();
      const { data, error } = await supabase
        .from('sizes')
        .select('*')
        .order('size_cm', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in ServerProductService.getSizes:', error);
      throw error;
    }
  }

  // Get GSM values with server-side Supabase client
  static async getGSM() {
    try {
      const supabase = await this.getServerSupabaseClient();
      const { data, error } = await supabase
        .from('gsm')
        .select('*')
        .order('gsm', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in ServerProductService.getGSM:', error);
      throw error;
    }
  }
}
