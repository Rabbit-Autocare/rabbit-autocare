import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

const isServer = typeof window === 'undefined';
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
  static getSupabaseClient() {
    return createSupabaseBrowserClient();
  }

  static async getProducts({ code, limit, sort, filters = {} } = {}) {
    const params = new URLSearchParams();
    if (code) params.append('code', code);
    if (limit) params.append('limit', limit);
    if (sort) params.append('sort', sort);

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

  static transformProductData(product) {
    if (!product) return null;

    const variants = product.product_variants || product.variants || [];

    return {
      ...product,
      category: product.category,
      subcategory: product.subcategory,
      variants: variants.map((variant) => ({
        id: variant.id,
        size: variant.size,
        quantity: variant.quantity,
        unit: variant.unit || 'ml',
        color: variant.color,
        color_hex: variant.color_hex || null,
        stock: variant.stock || 0,
        price: variant.price || variant.base_price || 0,
        mrp: variant.mrp || variant.price || variant.base_price || 0,
        base_price: variant.base_price || 0,
      })),
    };
  }

  static extractProducts(response) {
    if (!response) return [];
    if (Array.isArray(response.products)) return response.products;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response)) return response;
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
      product.category !== undefined &&
      product.category !== null &&
      product.category !== ''
    );
  }

  static getLowestPrice(variants) {
    if (!Array.isArray(variants) || variants.length === 0) return 0;
    return Math.min(...variants.map((v) => Number.parseFloat(v.base_price) || 0));
  }

  static getHighestPrice(variants) {
    if (!Array.isArray(variants) || variants.length === 0) return 0;
    return Math.max(...variants.map((v) => Number.parseFloat(v.base_price) || 0));
  }

  static generateVariantId() {
    return `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

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
      variants.length > 0 ? Math.min(...variants.map((v) => v.base_price || 0)) : 0;
    const maxPrice =
      variants.length > 0 ? Math.max(...variants.map((v) => v.base_price || 0)) : 0;

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

  static async getCategories() {
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

  static async getProductsByCategory(categoryName, { limit, sort, filters = {} } = {}) {
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
}
