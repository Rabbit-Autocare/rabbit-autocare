// Enhanced ProductService with direct category/subcategory storage

import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

// No server-side imports at module level

// Check if we're in a server environment
const isServer = typeof window === 'undefined';

// Base URLs - use full URLs for server-side calls
const getBaseUrl = () => {
  if (isServer) {
    return (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VERCEL_URL ||
      'http://localhost:3000'
    );
  }
  return '';
};

const API_BASE_URL = isServer
  ? `${getBaseUrl()}/api/products`
  : '/api/products';
const GETBYCATEGORY = isServer
  ? `${getBaseUrl()}/api/products/by-category`
  : '/api/products/by-category';
const CATEGORIES_API_URL = isServer
  ? `${getBaseUrl()}/api/products/category`
  : '/api/products/category';

export class ProductService {
  // Get Supabase client instance
  static getSupabaseClient() {
    return createSupabaseBrowserClient();
  } // Note: For server-side operations, use ServerProductService instead

  // ============= PRODUCTS =============

  static async getProducts({ code, limit, sort, filters = {} } = {}) {
    // Always use fetch API approach for client components
    // Server components should use the direct methods separately
    const params = new URLSearchParams();
    if (code) params.append('code', code);
    if (limit) params.append('limit', limit);
    if (sort) params.append('sort', sort);

    // Add filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((item) => params.append(key + '[]', item));
        } else {
          params.append(key, value);
        }
      }
    });

    const url = params.toString() ? `${API_BASE_URL}?${params}` : API_BASE_URL;

    try {
      const res = await fetch(url);
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

      const data = await res.json();
      const products = Array.isArray(data.products)
        ? data.products
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      const total = data.total || products.length;

      const transformedProducts = products.map((product) =>
        this.transformProductData(product)
      );

      return {
        success: data.success || true,
        products: transformedProducts,
        total: total,
      };
    } catch (error) {
      console.error('Error in getProducts:', error);
      throw error;
    }
  }

  // Note: For server-side operations, use ServerProductService instead

  static async getProduct(productIdentifier, includeRelations = false) {
    try {
      const params = new URLSearchParams();
      const url = `${API_BASE_URL}/${productIdentifier}${
        params.toString() ? `?${params}` : ''
      }`;

      const res = await fetch(url);
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

      const data = await res.json();
      const product = data.product || data;

      return this.transformProductData(product);
    } catch (error) {
      console.error('Error in getProduct:', error);
      throw error;
    }
  }

  // Note: For server-side operations, use ServerProductService instead

  static async createProduct(data) {
    try {
      const transformedData = {
        ...data,
        variants: Array.isArray(data.variants)
          ? data.variants.map((variant) => ({
              id:
                variant.id ||
                `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              gsm: variant.gsm || '',
              size: variant.size || '',
              color: variant.color || '',
              color_hex: variant.color_hex || null,
              quantity: variant.quantity || '',
              unit: variant.unit || 'ml',
              price: Number.parseFloat(variant.price) || 0,
              stock: Number.parseInt(variant.stock) || 0,
              compare_at_price: variant.compareAtPrice || null,
            }))
          : [],
        subcategory_names: Array.isArray(data.subcategory_names)
          ? data.subcategory_names
          : data.subcategory_names
          ? [data.subcategory_names]
          : [],
        key_features: Array.isArray(data.key_features) ? data.key_features : [],
        taglines: Array.isArray(data.taglines) ? data.taglines : [],
      };

      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformedData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error Response:', {
          status: res.status,
          statusText: res.statusText,
          errorText: errorText,
        });

        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(
            errorJson.error || errorJson.message || `API error: ${res.status}`
          );
        } catch (e) {
          if (errorText) {
            throw new Error(`API error: ${errorText}`);
          } else {
            throw new Error(`API error: ${res.status} ${res.statusText}`);
          }
        }
      }

      const json = await res.json();
      return this.transformProductData(json.product || json);
    } catch (error) {
      console.error('Error in createProduct:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        data: data,
      });
      throw error;
    }
  }

  static async updateProduct(id, updateData) {
    try {
      const transformedData = {
        id,
        ...updateData,
        variants: Array.isArray(updateData.variants)
          ? updateData.variants.map((variant) => ({
              id:
                variant.id ||
                `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              gsm: variant.gsm || '',
              size: variant.size || '',
              color: variant.color || '',
              color_hex: variant.color_hex || null,
              quantity: variant.quantity || '',
              unit: variant.unit || 'ml',
              price: Number.parseFloat(variant.price) || 0,
              stock: Number.parseInt(variant.stock) || 0,
              compare_at_price: variant.compareAtPrice || null,
            }))
          : [],
        subcategory_names: Array.isArray(updateData.subcategory_names)
          ? updateData.subcategory_names
          : updateData.subcategory_names
          ? [updateData.subcategory_names]
          : [],
        key_features: Array.isArray(updateData.key_features)
          ? updateData.key_features
          : [],
        taglines: Array.isArray(updateData.taglines) ? updateData.taglines : [],
      };

      const res = await fetch(API_BASE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformedData),
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

      const json = await res.json();
      return this.transformProductData(json.product || json);
    } catch (error) {
      console.error('Error in updateProduct:', error);
      throw error;
    }
  }

  static async deleteProduct(id) {
    try {
      const res = await fetch(`${API_BASE_URL}?id=${id}`, {
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

      const json = await res.json();
      return json;
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      throw error;
    }
  }

  // ============= CATEGORIES =============

  static async getCategories() {
    // Always use fetch API approach for client components
    // Server components should use the direct methods separately
    try {
      const res = await fetch(CATEGORIES_API_URL);

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

      const data = await res.json();

      // Handle different response formats
      const categories = Array.isArray(data.categories)
        ? data.categories
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      return {
        success: data.success !== false,
        data: categories,
        total: data.total || categories.length,
      };
    } catch (error) {
      console.error('Error in getCategories:', error);
      throw error;
    }
  }

  // Note: For server-side operations, use ServerProductService instead

  // ============= PRODUCTS BY CATEGORY =============

  static async getProductsByCategory(
    categoryName,
    { limit, sort, filters = {} } = {}
  ) {
    try {
      if (!categoryName || categoryName === 'all') {
        return this.getProducts({ limit, sort, filters });
      }

      const combinedFilters = { ...filters, category: categoryName };
      return this.getProducts({ limit, sort, filters: combinedFilters });
    } catch (error) {
      console.error('Error in getProductsByCategory:', error);
      throw error;
    }
  }

  // ============= DATA TRANSFORMATION =============

  static transformProductData(product) {
    if (!product) return null;

    // Use product_variants if available, otherwise use variants
    const variants = product.product_variants || product.variants || [];

    const transformedData = {
      ...product,
      category: product.category_name,
      subcategory: product.subcategory_name,
      variants: variants.map((variant) => {
        if (product.is_microfiber) {
          return {
            id: variant.id,
            gsm: variant.gsm,
            size: variant.size,
            color: variant.color,
            color_hex: variant.color_hex || null,
            stock: variant.stock || 0,
            price: variant.price || 0,
            compareAtPrice: variant.compare_at_price || null,
          };
        } else {
          return {
            id: variant.id,
            quantity: variant.quantity,
            unit: variant.unit || 'ml',
            color: variant.color,
            color_hex: variant.color_hex || null,
            stock: variant.stock || 0,
            price: variant.price || 0,
            compareAtPrice: variant.compare_at_price || null,
          };
        }
      }),
    };

    return transformedData;
  }

  generateVariantId() {
    return `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============= UTILITY METHODS =============

  static formatProductForDisplay(product) {
    if (!product) return null;

    const transformedProduct = this.transformProductData(product);
    if (!transformedProduct || !transformedProduct.id) return null;

    const variants = transformedProduct.variants || [];
    const totalStock = variants.reduce(
      (sum, variant) => sum + (variant.stock || 0),
      0
    );
    const availableVariants = variants.filter((v) => (v.stock || 0) > 0).length;
    const minPrice =
      variants.length > 0 ? Math.min(...variants.map((v) => v.price || 0)) : 0;
    const maxPrice =
      variants.length > 0 ? Math.max(...variants.map((v) => v.price || 0)) : 0;

    // Ensure we have valid price data
    if (minPrice === 0 && maxPrice === 0) {
      console.log('Product has no valid price data:', product.name);
      return null;
    }

    return {
      ...transformedProduct,
      totalStock,
      availableVariants,
      minPrice,
      maxPrice,
    };
  }

  static extractProducts(response) {
    if (!response) return [];
    if (Array.isArray(response.products)) {
      return response.products;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  }

  static extractTotalCount(response) {
    if (response && typeof response.total === 'number') {
      return response.total;
    }
    return this.extractProducts(response).length;
  }

  static hasCategoryData(product) {
    return (
      product &&
      product.category_name !== undefined &&
      product.category_name !== null &&
      product.category_name !== ''
    );
  }

  static getLowestPrice(variants) {
    if (!Array.isArray(variants) || variants.length === 0) return 0;
    return Math.min(...variants.map((v) => Number.parseFloat(v.price) || 0));
  }

  static getHighestPrice(variants) {
    if (!Array.isArray(variants) || variants.length === 0) return 0;
    return Math.max(...variants.map((v) => Number.parseFloat(v.price) || 0));
  }
}
