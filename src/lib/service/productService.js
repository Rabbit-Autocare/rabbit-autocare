// lib/services/productService.js

const API_BASE_URL = '/api/products';

/**
 * Product Service - Centralized functions for product operations
 */
export class ProductService {

  /**
   * Fetch all products or filter by category
   * @param {Object} options - Query options
   * @param {string} options.category - Filter by category
   * @param {number} options.limit - Limit number of results
   * @returns {Promise<Object>} API response
   */
  static async getProducts(options = {}) {
    try {
      const params = new URLSearchParams();

      if (options.category) params.append('category', options.category);
      if (options.limit) params.append('limit', options.limit.toString());

      const url = params.toString() ? `${API_BASE_URL}?${params}` : API_BASE_URL;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch products');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getProducts:', error);
      throw error;
    }
  }

  /**
   * Fetch a single product by ID
   * @param {string} id - Product ID
   * @returns {Promise<Object>} API response
   */
  static async getProduct(id) {
    try {
      if (!id) {
        throw new Error('Product ID is required');
      }

      const response = await fetch(`${API_BASE_URL}?id=${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch product');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getProduct:', error);
      throw error;
    }
  }

  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} API response
   */
  static async createProduct(productData) {
    try {
      // Validate required fields client-side
      const requiredFields = ['id', 'name', 'category', 'variant_type', 'variants'];
      const missingFields = requiredFields.filter(field => !productData[field]);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create product');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in createProduct:', error);
      throw error;
    }
  }

  /**
   * Update an existing product
   * @param {string} id - Product ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} API response
   */
  static async updateProduct(id, updateData) {
    try {
      if (!id) {
        throw new Error('Product ID is required');
      }

      const response = await fetch(API_BASE_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updateData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in updateProduct:', error);
      throw error;
    }
  }

  /**
   * Delete a product
   * @param {string} id - Product ID
   * @returns {Promise<Object>} API response
   */
  static async deleteProduct(id) {
    try {
      if (!id) {
        throw new Error('Product ID is required');
      }

      const response = await fetch(`${API_BASE_URL}?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete product');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      throw error;
    }
  }

  /**
   * Get products by category
   * @param {string} category - Product category
   * @returns {Promise<Object>} API response
   */
  static async getProductsByCategory(category) {
    return this.getProducts({ category });
  }

  /**
   * Search products by name (client-side filtering for now)
   * @param {string} searchTerm - Search term
   * @returns {Promise<Object>} Filtered products
   */
  static async searchProducts(searchTerm) {
    try {
      const response = await this.getProducts();

      if (!response.success) {
        throw new Error('Failed to fetch products for search');
      }

      const filteredProducts = response.products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return {
        success: true,
        products: filteredProducts,
        count: filteredProducts.length,
      };
    } catch (error) {
      console.error('Error in searchProducts:', error);
      throw error;
    }
  }

  /**
   * Validate product data structure
   * @param {Object} productData - Product data to validate
   * @returns {Object} Validation result
   */
  static validateProductData(productData) {
    const errors = [];

    // Required fields
    const requiredFields = ['id', 'name', 'category', 'variant_type', 'variants'];
    requiredFields.forEach(field => {
      if (!productData[field]) {
        errors.push(`${field} is required`);
      }
    });

    // Category validation
    const validCategories = ['car interior', 'car exterior', 'microfiber cloth'];
    if (productData.category && !validCategories.includes(productData.category)) {
      errors.push(`Category must be one of: ${validCategories.join(', ')}`);
    }

    // Variant type validation
    const validVariantTypes = ['quantity', 'size'];
    if (productData.variant_type && !validVariantTypes.includes(productData.variant_type)) {
      errors.push(`Variant type must be one of: ${validVariantTypes.join(', ')}`);
    }

    // Variants validation
    if (productData.variants) {
      if (!Array.isArray(productData.variants) || productData.variants.length === 0) {
        errors.push('Variants must be a non-empty array');
      } else {
        productData.variants.forEach((variant, index) => {
          if (!variant.value) {
            errors.push(`Variant ${index + 1}: value is required`);
          }
          if (!variant.price) {
            errors.push(`Variant ${index + 1}: price is required`);
          }
          if (productData.category === 'microfiber cloth') {
            if (!variant.color) {
              errors.push(`Variant ${index + 1}: color is required for microfiber products`);
            }
            if (!variant.gsm) {
              errors.push(`Variant ${index + 1}: GSM is required for microfiber products`);
            }
          }
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format product data for display
   * @param {Object} product - Product object
   * @returns {Object} Formatted product data
   */
  static formatProductForDisplay(product) {
    return {
      ...product,
      formattedPrice: product.variants?.length > 0
        ? `₹${Math.min(...product.variants.map(v => v.price))} - ₹${Math.max(...product.variants.map(v => v.price))}`
        : 'Price not available',
      totalStock: product.variants?.reduce((total, variant) => total + (variant.stock || 0), 0) || 0,
      availableVariants: product.variants?.filter(v => (v.stock || 0) > 0).length || 0,
    };
  }
}

/**
 * Custom hook for product operations (if using React)
 */
export function useProductService() {
  return {
    getProducts: ProductService.getProducts,
    getProduct: ProductService.getProduct,
    createProduct: ProductService.createProduct,
    updateProduct: ProductService.updateProduct,
    deleteProduct: ProductService.deleteProduct,
    searchProducts: ProductService.searchProducts,
    validateProductData: ProductService.validateProductData,
    formatProductForDisplay: ProductService.formatProductForDisplay,
  };
}
